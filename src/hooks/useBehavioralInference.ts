import { useState, useCallback, useEffect } from 'react';
import type {
  BehavioralProfile,
  BehavioralMetrics,
  InferredTrait,
  PendingObservation,
} from '../types/behavioral';
import {
  DEFAULT_BEHAVIORAL_PROFILE,
  TRAIT_DEFINITIONS,
  OBSERVATION_TEMPLATES,
} from '../types/behavioral';
import { generateId } from '../utils/storage';

const PROFILE_KEY = 'goalkeeper_behavioral_profile';
const MIN_SAMPLES_FOR_TRAIT = 5; // Need this many data points before inferring
const OBSERVATION_COOLDOWN_MS = 1000 * 60 * 30; // 30 min between observations

function loadProfile(): BehavioralProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        lastAnalyzed: new Date(parsed.lastAnalyzed),
        observations: parsed.observations.map((o: PendingObservation) => ({
          ...o,
          createdAt: new Date(o.createdAt),
        })),
        traits: parsed.traits.map((t: InferredTrait) => ({
          ...t,
          lastUpdated: new Date(t.lastUpdated),
        })),
      };
    }
  } catch {
    // Fall through
  }
  return DEFAULT_BEHAVIORAL_PROFILE;
}

function saveProfile(profile: BehavioralProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function useBehavioralInference() {
  const [profile, setProfile] = useState<BehavioralProfile>(() => loadProfile());

  // Persist on change
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Track a metric increment
  const trackMetric = useCallback((
    metric: keyof BehavioralMetrics,
    value: number = 1
  ) => {
    setProfile(prev => {
      const currentValue = prev.metrics[metric];
      let newValue: number | Record<string, number>;

      if (typeof currentValue === 'number') {
        newValue = currentValue + value;
      } else {
        // For record types, this shouldn't happen via this function
        return prev;
      }

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          [metric]: newValue,
        },
      };
    });
  }, []);

  // Track category-specific clips
  const trackClipByCategory = useCallback((categoryId: string) => {
    setProfile(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        clipsTotal: prev.metrics.clipsTotal + 1,
        clipsByCategory: {
          ...prev.metrics.clipsByCategory,
          [categoryId]: (prev.metrics.clipsByCategory[categoryId] || 0) + 1,
        },
      },
    }));
  }, []);

  // Update average metrics
  const updateAverage = useCallback((
    metric: 'avgMessageLength' | 'optionsExploredAvg' | 'avgSessionLength',
    newValue: number,
    sampleCount: number
  ) => {
    setProfile(prev => {
      const oldAvg = prev.metrics[metric];
      // Running average calculation
      const newAvg = oldAvg + (newValue - oldAvg) / sampleCount;
      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          [metric]: newAvg,
        },
      };
    });
  }, []);

  // Analyze patterns and infer traits
  const analyzePatterns = useCallback(() => {
    setProfile(prev => {
      const { metrics } = prev;
      const newTraits: InferredTrait[] = [];
      const now = new Date();

      // Exploration tendency
      const totalDriftEvents = metrics.tangentCount + metrics.selfCorrectionCount;
      if (totalDriftEvents >= MIN_SAMPLES_FOR_TRAIT) {
        const selfCorrectionRatio = metrics.selfCorrectionCount / Math.max(1, totalDriftEvents);
        const explorationValue = 1 - selfCorrectionRatio; // High = exploratory

        const existing = prev.traits.find(t => t.id === 'explorationTendency');
        newTraits.push({
          id: 'explorationTendency',
          name: TRAIT_DEFINITIONS.explorationTendency.name,
          description: TRAIT_DEFINITIONS.explorationTendency.description,
          confidence: Math.min(1, totalDriftEvents / 20),
          value: explorationValue,
          confirmedByUser: existing?.confirmedByUser ?? null,
          lastUpdated: now,
        });
      }

      // Decision style
      const decisionEvents = metrics.questionBeforeActionCount + metrics.quickDecisionCount;
      if (decisionEvents >= MIN_SAMPLES_FOR_TRAIT) {
        const thoroughnessValue = metrics.questionBeforeActionCount / Math.max(1, decisionEvents);

        const existing = prev.traits.find(t => t.id === 'decisionStyle');
        newTraits.push({
          id: 'decisionStyle',
          name: TRAIT_DEFINITIONS.decisionStyle.name,
          description: TRAIT_DEFINITIONS.decisionStyle.description,
          confidence: Math.min(1, decisionEvents / 15),
          value: thoroughnessValue,
          confirmedByUser: existing?.confirmedByUser ?? null,
          lastUpdated: now,
        });
      }

      // Insight receptivity
      const insightEvents = metrics.insightsAccepted + metrics.insightsDismissed;
      if (insightEvents >= MIN_SAMPLES_FOR_TRAIT) {
        const receptivityValue = metrics.insightsAccepted / Math.max(1, insightEvents);

        const existing = prev.traits.find(t => t.id === 'insightReceptivity');
        newTraits.push({
          id: 'insightReceptivity',
          name: TRAIT_DEFINITIONS.insightReceptivity.name,
          description: TRAIT_DEFINITIONS.insightReceptivity.description,
          confidence: Math.min(1, insightEvents / 10),
          value: receptivityValue,
          confirmedByUser: existing?.confirmedByUser ?? null,
          lastUpdated: now,
        });
      }

      // Capture style (action vs idea focused)
      if (metrics.clipsTotal >= MIN_SAMPLES_FOR_TRAIT) {
        const actionClips = metrics.clipsByCategory['actions'] || 0;
        const ideaClips = metrics.clipsByCategory['ideas'] || 0;
        const total = actionClips + ideaClips;
        const actionFocus = total > 0 ? actionClips / total : 0.5;

        const existing = prev.traits.find(t => t.id === 'captureStyle');
        newTraits.push({
          id: 'captureStyle',
          name: TRAIT_DEFINITIONS.captureStyle.name,
          description: TRAIT_DEFINITIONS.captureStyle.description,
          confidence: Math.min(1, metrics.clipsTotal / 15),
          value: 1 - actionFocus, // High = idea collector
          confirmedByUser: existing?.confirmedByUser ?? null,
          lastUpdated: now,
        });
      }

      return {
        ...prev,
        traits: newTraits.length > 0 ? newTraits : prev.traits,
        lastAnalyzed: now,
      };
    });
  }, []);

  // Generate observations based on current traits
  const generateObservations = useCallback(() => {
    setProfile(prev => {
      const { traits, metrics, observations } = prev;
      const now = new Date();
      const newObservations: PendingObservation[] = [...observations];

      // Check cooldown - don't spam user with observations
      const recentObservation = observations.find(
        o => !o.dismissed && now.getTime() - new Date(o.createdAt).getTime() < OBSERVATION_COOLDOWN_MS
      );
      if (recentObservation) {
        return prev;
      }

      // High exploration tendency
      const explorationTrait = traits.find(t => t.id === 'explorationTendency');
      if (
        explorationTrait &&
        explorationTrait.confidence > 0.5 &&
        explorationTrait.value > 0.7 &&
        explorationTrait.confirmedByUser === null &&
        !observations.some(o => o.traitId === 'explorationTendency' && !o.dismissed)
      ) {
        newObservations.push({
          id: generateId(),
          traitId: 'explorationTendency',
          message: OBSERVATION_TEMPLATES.highExploration.message.replace(
            '{count}',
            String(metrics.tangentCount)
          ),
          question: OBSERVATION_TEMPLATES.highExploration.question,
          priority: 'medium',
          createdAt: now,
          dismissed: false,
        });
      }

      // Low exploration (very focused)
      if (
        explorationTrait &&
        explorationTrait.confidence > 0.5 &&
        explorationTrait.value < 0.3 &&
        explorationTrait.confirmedByUser === null &&
        !observations.some(o => o.traitId === 'explorationTendency' && !o.dismissed)
      ) {
        newObservations.push({
          id: generateId(),
          traitId: 'explorationTendency',
          message: OBSERVATION_TEMPLATES.lowExploration.message,
          question: OBSERVATION_TEMPLATES.lowExploration.question,
          priority: 'low',
          createdAt: now,
          dismissed: false,
        });
      }

      // Quick decider
      const decisionTrait = traits.find(t => t.id === 'decisionStyle');
      if (
        decisionTrait &&
        decisionTrait.confidence > 0.5 &&
        decisionTrait.value < 0.3 &&
        decisionTrait.confirmedByUser === null &&
        !observations.some(o => o.traitId === 'decisionStyle' && !o.dismissed)
      ) {
        newObservations.push({
          id: generateId(),
          traitId: 'decisionStyle',
          message: OBSERVATION_TEMPLATES.quickDecider.message,
          question: OBSERVATION_TEMPLATES.quickDecider.question,
          priority: 'medium',
          createdAt: now,
          dismissed: false,
        });
      }

      // Action item pile-up
      if (
        metrics.actionItemsCreated >= 5 &&
        metrics.actionItemsCompleted / Math.max(1, metrics.actionItemsCreated) < 0.3 &&
        !observations.some(o => o.traitId === 'actionPileup' && !o.dismissed)
      ) {
        newObservations.push({
          id: generateId(),
          traitId: 'actionPileup',
          message: OBSERVATION_TEMPLATES.actionCollector.message
            .replace('{created}', String(metrics.actionItemsCreated))
            .replace('{completed}', String(metrics.actionItemsCompleted)),
          question: OBSERVATION_TEMPLATES.actionCollector.question,
          priority: 'medium',
          createdAt: now,
          dismissed: false,
        });
      }

      // Insight ignorer
      const insightTrait = traits.find(t => t.id === 'insightReceptivity');
      if (
        insightTrait &&
        insightTrait.confidence > 0.5 &&
        insightTrait.value < 0.2 &&
        insightTrait.confirmedByUser === null &&
        !observations.some(o => o.traitId === 'insightReceptivity' && !o.dismissed)
      ) {
        newObservations.push({
          id: generateId(),
          traitId: 'insightReceptivity',
          message: OBSERVATION_TEMPLATES.insightIgnorer.message,
          question: OBSERVATION_TEMPLATES.insightIgnorer.question,
          priority: 'low',
          createdAt: now,
          dismissed: false,
        });
      }

      return {
        ...prev,
        observations: newObservations,
      };
    });
  }, []);

  // Get the next pending observation to show
  const getNextObservation = useCallback((): PendingObservation | null => {
    const pending = profile.observations
      .filter(o => !o.dismissed)
      .sort((a, b) => {
        // Priority order
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    return pending[0] || null;
  }, [profile.observations]);

  // Respond to an observation
  const respondToObservation = useCallback((
    observationId: string,
    response: 'confirm' | 'deny' | 'dismiss',
    _actionIndex?: number // Reserved for future action-specific handling
  ) => {
    setProfile(prev => {
      const observation = prev.observations.find(o => o.id === observationId);
      if (!observation) return prev;

      // Update the observation
      const updatedObservations = prev.observations.map(o =>
        o.id === observationId ? { ...o, dismissed: true } : o
      );

      // Update the trait confirmation if applicable
      let updatedTraits = prev.traits;
      if (response !== 'dismiss' && observation.traitId) {
        updatedTraits = prev.traits.map(t =>
          t.id === observation.traitId
            ? { ...t, confirmedByUser: response === 'confirm' }
            : t
        );
      }

      return {
        ...prev,
        observations: updatedObservations,
        traits: updatedTraits,
      };
    });
  }, []);

  // Get trait value (for use by other systems)
  const getTraitValue = useCallback((traitId: string): number | null => {
    const trait = profile.traits.find(t => t.id === traitId);
    if (!trait || trait.confidence < 0.3) return null;

    // If user denied the trait, return opposite or neutral
    if (trait.confirmedByUser === false) {
      return 0.5; // Neutral - don't act on denied traits
    }

    return trait.value;
  }, [profile.traits]);

  // Get personalization hints for other systems
  const getPersonalizationHints = useCallback(() => {
    const hints: Record<string, string> = {};

    const exploration = getTraitValue('explorationTendency');
    if (exploration !== null) {
      hints.driftSensitivity = exploration > 0.6 ? 'low' : exploration < 0.4 ? 'high' : 'medium';
    }

    const decision = getTraitValue('decisionStyle');
    if (decision !== null) {
      hints.promptForAlternatives = decision < 0.4 ? 'yes' : 'no';
    }

    const insight = getTraitValue('insightReceptivity');
    if (insight !== null) {
      hints.insightFrequency = insight > 0.6 ? 'high' : insight < 0.3 ? 'low' : 'medium';
    }

    return hints;
  }, [getTraitValue]);

  return {
    profile,
    trackMetric,
    trackClipByCategory,
    updateAverage,
    analyzePatterns,
    generateObservations,
    getNextObservation,
    respondToObservation,
    getTraitValue,
    getPersonalizationHints,
  };
}
