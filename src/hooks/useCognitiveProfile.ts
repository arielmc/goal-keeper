import { useState, useCallback, useEffect } from 'react';
import type { Message, Settings } from '../types';
import type { CognitiveProfile, MentalModel, MentalModelConcept, MentalModelConnection } from '../types/cognition';
import { DEFAULT_COGNITIVE_PROFILE } from '../types/cognition';
import { sendMessage } from '../utils/llm';
import { generateId } from '../utils/storage';

const PROFILE_KEY = 'goalkeeper_cognitive_profile';

const PROFILE_ANALYSIS_PROMPT = `Analyze this user's conversation patterns to understand their cognitive style.

Recent messages from the user:
{messages}

Analyze and respond with ONLY valid JSON:
{
  "thinkingStyles": {
    "visual": 0.0-1.0,
    "verbal": 0.0-1.0,
    "sequential": 0.0-1.0,
    "associative": 0.0-1.0,
    "analytical": 0.0-1.0,
    "intuitive": 0.0-1.0,
    "abstract": 0.0-1.0,
    "concrete": 0.0-1.0
  },
  "patterns": {
    "questionFrequency": 0.0-1.0,
    "explorationDepth": 0.0-1.0,
    "tangentTolerance": 0.0-1.0,
    "decisionSpeed": 0.0-1.0,
    "evidenceNeed": 0.0-1.0
  },
  "preferences": {
    "briefVsDetailed": 0.0-1.0,
    "structuredVsFreeform": 0.0-1.0,
    "pacePreference": "fast" | "moderate" | "reflective"
  },
  "emergingConcepts": [
    {"label": "concept name", "importance": 0.0-1.0}
  ],
  "conceptConnections": [
    {"from": "concept1", "to": "concept2", "type": "supports|relates|causes", "strength": 0.0-1.0}
  ]
}`;

export function useCognitiveProfile(settings: Settings) {
  const [profile, setProfile] = useState<CognitiveProfile>(() => loadProfile());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Save profile changes
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  const analyzeAndUpdate = useCallback(async (messages: Message[]) => {
    if (!settings.apiKey || messages.length < 5) return;

    setIsAnalyzing(true);

    try {
      const userMessages = messages
        .filter(m => m.role === 'user')
        .slice(-10)
        .map(m => m.content)
        .join('\n\n---\n\n');

      const prompt = PROFILE_ANALYSIS_PROMPT.replace('{messages}', userMessages);

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        'You are a cognitive pattern analyzer. Respond only with valid JSON.',
        settings
      );

      const parsed = parseProfileResponse(response);
      if (parsed) {
        setProfile(prev => mergeProfileUpdate(prev, parsed));
      }
    } catch (err) {
      console.error('Profile analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [settings]);

  const updateThinkingStyle = useCallback((
    style: keyof CognitiveProfile['thinkingStyles'],
    value: number
  ) => {
    setProfile(prev => ({
      ...prev,
      thinkingStyles: {
        ...prev.thinkingStyles,
        [style]: Math.max(0, Math.min(1, value)),
      },
      updatedAt: new Date(),
    }));
  }, []);

  const updatePreference = useCallback((
    pref: keyof CognitiveProfile['preferences'],
    value: number | string
  ) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [pref]: value,
      },
      updatedAt: new Date(),
    }));
  }, []);

  const addMentalModel = useCallback((name: string, description: string) => {
    const model: MentalModel = {
      id: generateId(),
      name,
      description,
      concepts: [],
      connections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      confidence: 0.3,
    };

    setProfile(prev => ({
      ...prev,
      mentalModels: [...prev.mentalModels, model],
      updatedAt: new Date(),
    }));

    return model.id;
  }, []);

  const updateMentalModel = useCallback((modelId: string, updates: Partial<MentalModel>) => {
    setProfile(prev => ({
      ...prev,
      mentalModels: prev.mentalModels.map(m =>
        m.id === modelId ? { ...m, ...updates, updatedAt: new Date() } : m
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const addConceptToModel = useCallback((modelId: string, concept: Omit<MentalModelConcept, 'id'>) => {
    const conceptWithId: MentalModelConcept = {
      ...concept,
      id: generateId(),
    };

    setProfile(prev => ({
      ...prev,
      mentalModels: prev.mentalModels.map(m =>
        m.id === modelId
          ? { ...m, concepts: [...m.concepts, conceptWithId], updatedAt: new Date() }
          : m
      ),
      updatedAt: new Date(),
    }));

    return conceptWithId.id;
  }, []);

  const addConnectionToModel = useCallback((modelId: string, connection: Omit<MentalModelConnection, 'id'>) => {
    const connectionWithId: MentalModelConnection = {
      ...connection,
      id: generateId(),
    };

    setProfile(prev => ({
      ...prev,
      mentalModels: prev.mentalModels.map(m =>
        m.id === modelId
          ? { ...m, connections: [...m.connections, connectionWithId], updatedAt: new Date() }
          : m
      ),
      updatedAt: new Date(),
    }));

    return connectionWithId.id;
  }, []);

  const resetProfile = useCallback(() => {
    const newProfile = createEmptyProfile();
    setProfile(newProfile);
  }, []);

  return {
    profile,
    isAnalyzing,
    analyzeAndUpdate,
    updateThinkingStyle,
    updatePreference,
    addMentalModel,
    updateMentalModel,
    addConceptToModel,
    addConnectionToModel,
    resetProfile,
  };
}

function loadProfile(): CognitiveProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };
    }
  } catch {
    // Fall through
  }
  return createEmptyProfile();
}

function createEmptyProfile(): CognitiveProfile {
  return {
    id: generateId(),
    userId: 'default',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...DEFAULT_COGNITIVE_PROFILE,
  };
}

function parseProfileResponse(response: string): any {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through
  }
  return null;
}

function mergeProfileUpdate(current: CognitiveProfile, update: any): CognitiveProfile {
  const merged = { ...current, updatedAt: new Date() };

  // Blend thinking styles (weighted average with existing)
  if (update.thinkingStyles) {
    for (const key of Object.keys(update.thinkingStyles)) {
      const k = key as keyof typeof current.thinkingStyles;
      if (current.thinkingStyles[k] !== undefined) {
        // 70% current, 30% new observation
        merged.thinkingStyles[k] = current.thinkingStyles[k] * 0.7 + update.thinkingStyles[k] * 0.3;
      }
    }
  }

  // Blend patterns
  if (update.patterns) {
    for (const key of Object.keys(update.patterns)) {
      const k = key as keyof typeof current.patterns;
      if (current.patterns[k] !== undefined && typeof update.patterns[k] === 'number') {
        merged.patterns[k] = current.patterns[k] * 0.7 + update.patterns[k] * 0.3;
      }
    }
  }

  // Update preferences
  if (update.preferences) {
    merged.preferences = { ...current.preferences };
    if (typeof update.preferences.briefVsDetailed === 'number') {
      merged.preferences.briefVsDetailed = update.preferences.briefVsDetailed;
    }
    if (typeof update.preferences.structuredVsFreeform === 'number') {
      merged.preferences.structuredVsFreeform = update.preferences.structuredVsFreeform;
    }
    if (update.preferences.pacePreference) {
      merged.preferences.pacePreference = update.preferences.pacePreference;
    }
  }

  // Add emerging concepts to the first mental model (or create one)
  if (update.emergingConcepts && update.emergingConcepts.length > 0) {
    let targetModel = merged.mentalModels[0];
    if (!targetModel) {
      targetModel = {
        id: generateId(),
        name: 'Emerging Understanding',
        description: 'Concepts being developed in this conversation',
        concepts: [],
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        confidence: 0.3,
      };
      merged.mentalModels = [targetModel];
    }

    for (const concept of update.emergingConcepts) {
      const existing = targetModel.concepts.find(
        c => c.label.toLowerCase() === concept.label.toLowerCase()
      );
      if (!existing) {
        targetModel.concepts.push({
          id: generateId(),
          label: concept.label,
          importance: concept.importance,
          x: Math.random() * 400 + 50,
          y: Math.random() * 300 + 50,
        });
      } else {
        existing.importance = Math.max(existing.importance, concept.importance);
      }
    }

    // Add connections
    if (update.conceptConnections) {
      for (const conn of update.conceptConnections) {
        const fromConcept = targetModel.concepts.find(
          c => c.label.toLowerCase() === conn.from.toLowerCase()
        );
        const toConcept = targetModel.concepts.find(
          c => c.label.toLowerCase() === conn.to.toLowerCase()
        );
        if (fromConcept && toConcept) {
          const existing = targetModel.connections.find(
            c => c.fromId === fromConcept.id && c.toId === toConcept.id
          );
          if (!existing) {
            targetModel.connections.push({
              id: generateId(),
              fromId: fromConcept.id,
              toId: toConcept.id,
              type: conn.type || 'relates',
              strength: conn.strength || 0.5,
            });
          }
        }
      }
    }

    targetModel.updatedAt = new Date();
    targetModel.confidence = Math.min(1, targetModel.confidence + 0.1);
  }

  return merged;
}
