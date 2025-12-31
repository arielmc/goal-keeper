// Behavioral inference types - learning user patterns from conversation behavior

export interface BehavioralMetrics {
  // Exploration patterns
  tangentCount: number;           // Times drifted from main topic
  selfCorrectionCount: number;    // Times returned to topic without prompt
  promptedRefocusCount: number;   // Times needed drift alert to refocus

  // Decision patterns
  questionBeforeActionCount: number;  // Asks clarifying Qs before acting
  quickDecisionCount: number;         // Moves to action quickly
  optionsExploredAvg: number;         // Avg alternatives considered

  // Engagement patterns
  insightsAccepted: number;
  insightsDismissed: number;
  insightsActedOn: number;        // Used synthesis prompt

  // Capture patterns
  clipsTotal: number;
  clipsByCategory: Record<string, number>;  // ideas, actions, questions, etc.
  actionItemsCreated: number;
  actionItemsCompleted: number;

  // Conversation patterns
  avgMessageLength: number;
  followUpRatio: number;          // Follow-up Qs vs new topics
  sessionCount: number;
  avgSessionLength: number;       // In messages
}

export interface InferredTrait {
  id: string;
  name: string;
  description: string;
  confidence: number;             // 0-1, based on sample size
  value: number;                  // -1 to 1 spectrum or 0-1 intensity
  confirmedByUser: boolean | null; // null = not yet asked
  lastUpdated: Date;
}

export interface BehavioralProfile {
  metrics: BehavioralMetrics;
  traits: InferredTrait[];
  observations: PendingObservation[];
  lastAnalyzed: Date;
}

export interface PendingObservation {
  id: string;
  traitId: string;
  message: string;
  question: string;
  suggestedAction?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dismissed: boolean;
}

// Trait definitions - what we're looking for
export const TRAIT_DEFINITIONS = {
  explorationTendency: {
    id: 'explorationTendency',
    name: 'Exploration Style',
    spectrum: ['Focused', 'Exploratory'],
    description: 'How much you explore tangents vs. staying on track',
  },
  decisionStyle: {
    id: 'decisionStyle',
    name: 'Decision Approach',
    spectrum: ['Quick Decider', 'Thorough Analyzer'],
    description: 'Whether you decide quickly or explore all options first',
  },
  insightReceptivity: {
    id: 'insightReceptivity',
    name: 'Insight Engagement',
    spectrum: ['Self-directed', 'Guidance-receptive'],
    description: 'How you respond to AI-generated insights and suggestions',
  },
  captureStyle: {
    id: 'captureStyle',
    name: 'Information Capture',
    spectrum: ['Action-focused', 'Idea-collector'],
    description: 'Whether you capture mainly tasks or ideas/references',
  },
  conversationDepth: {
    id: 'conversationDepth',
    name: 'Conversation Depth',
    spectrum: ['Rapid iteration', 'Deep dives'],
    description: 'Short exchanges vs. long detailed discussions',
  },
} as const;

// Observation templates based on detected patterns
export const OBSERVATION_TEMPLATES = {
  highExploration: {
    message: "You've explored {count} tangents in recent sessions",
    question: "Should I give you a gentle nudge when conversations drift, or do you prefer free exploration?",
    actions: ['Nudge me earlier', 'Let me explore', 'Ask me each time'],
  },
  lowExploration: {
    message: "You tend to stay tightly focused on your goals",
    question: "Want me to occasionally suggest related angles you might be missing?",
    actions: ['Yes, broaden my view', 'No, keep me focused', 'Only when stuck'],
  },
  quickDecider: {
    message: "You often move to action quickly",
    question: "Should I prompt you to consider alternatives before big decisions?",
    actions: ['Yes, slow me down', 'No, trust my instincts', 'Only for major choices'],
  },
  thoroughAnalyzer: {
    message: "You like to explore options thoroughly before deciding",
    question: "Want me to help you know when you have enough info to decide?",
    actions: ['Yes, help me commit', 'No, let me be thorough', 'Suggest but don\'t push'],
  },
  actionCollector: {
    message: "You've created {created} action items but completed {completed}",
    question: "Would a periodic action item review help?",
    actions: ['Yes, remind me', 'No, I track elsewhere', 'Weekly summary'],
  },
  insightIgnorer: {
    message: "You often dismiss insights without acting on them",
    question: "Should I show fewer insights, or make them more actionable?",
    actions: ['Fewer insights', 'More actionable', 'Keep as is'],
  },
} as const;

// Default empty profile
export const DEFAULT_BEHAVIORAL_PROFILE: BehavioralProfile = {
  metrics: {
    tangentCount: 0,
    selfCorrectionCount: 0,
    promptedRefocusCount: 0,
    questionBeforeActionCount: 0,
    quickDecisionCount: 0,
    optionsExploredAvg: 0,
    insightsAccepted: 0,
    insightsDismissed: 0,
    insightsActedOn: 0,
    clipsTotal: 0,
    clipsByCategory: {},
    actionItemsCreated: 0,
    actionItemsCompleted: 0,
    avgMessageLength: 0,
    followUpRatio: 0,
    sessionCount: 0,
    avgSessionLength: 0,
  },
  traits: [],
  observations: [],
  lastAnalyzed: new Date(),
};
