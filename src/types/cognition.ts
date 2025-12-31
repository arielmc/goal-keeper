export interface CognitiveProfile {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Thinking style preferences (0-1 scale)
  thinkingStyles: {
    visual: number;        // Prefers diagrams, maps, spatial thinking
    verbal: number;        // Prefers written explanations, narratives
    sequential: number;    // Step-by-step, linear progression
    associative: number;   // Jumping between connected ideas
    analytical: number;    // Breaking down, systematic analysis
    intuitive: number;     // Gut feelings, holistic patterns
    abstract: number;      // Concepts, theories, principles
    concrete: number;      // Examples, specifics, applications
  };

  // Observed patterns
  patterns: {
    averageMessageLength: number;
    questionFrequency: number;      // How often they ask vs. state
    explorationDepth: number;       // How deep they go before moving on
    tangentTolerance: number;       // How much they deviate from topic
    decisionSpeed: number;          // Quick decisions vs. deliberation
    evidenceNeed: number;           // How much proof they need
    collaborativeVsSolo: number;    // Prefer to think alone or discuss
  };

  // Mental models being built
  mentalModels: MentalModel[];

  // Preferred interaction modes
  preferences: {
    briefVsDetailed: number;        // 0 = brief, 1 = detailed
    structuredVsFreeform: number;   // 0 = structured, 1 = freeform
    challengeVsSupport: number;     // 0 = supportive, 1 = challenging
    pacePreference: 'fast' | 'moderate' | 'reflective';
  };
}

export interface MentalModel {
  id: string;
  name: string;
  description: string;
  concepts: MentalModelConcept[];
  connections: MentalModelConnection[];
  createdAt: Date;
  updatedAt: Date;
  confidence: number;  // How well-formed this model is
}

export interface MentalModelConcept {
  id: string;
  label: string;
  description?: string;
  importance: number;  // 0-1
  x: number;           // Position for visualization
  y: number;
  color?: string;
}

export interface MentalModelConnection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  strength: number;    // 0-1
  type: 'supports' | 'contradicts' | 'relates' | 'causes' | 'requires';
}

export const DEFAULT_COGNITIVE_PROFILE: Omit<CognitiveProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  thinkingStyles: {
    visual: 0.5,
    verbal: 0.5,
    sequential: 0.5,
    associative: 0.5,
    analytical: 0.5,
    intuitive: 0.5,
    abstract: 0.5,
    concrete: 0.5,
  },
  patterns: {
    averageMessageLength: 100,
    questionFrequency: 0.5,
    explorationDepth: 0.5,
    tangentTolerance: 0.5,
    decisionSpeed: 0.5,
    evidenceNeed: 0.5,
    collaborativeVsSolo: 0.5,
  },
  mentalModels: [],
  preferences: {
    briefVsDetailed: 0.5,
    structuredVsFreeform: 0.5,
    challengeVsSupport: 0.5,
    pacePreference: 'moderate',
  },
};

export const THINKING_STYLE_LABELS: Record<keyof CognitiveProfile['thinkingStyles'], { label: string; description: string; emoji: string }> = {
  visual: { label: 'Visual', description: 'Thinks in images, diagrams, spatial relationships', emoji: '🎨' },
  verbal: { label: 'Verbal', description: 'Thinks in words, narratives, explanations', emoji: '📝' },
  sequential: { label: 'Sequential', description: 'Step-by-step, linear progression', emoji: '➡️' },
  associative: { label: 'Associative', description: 'Connects ideas freely, non-linear', emoji: '🔀' },
  analytical: { label: 'Analytical', description: 'Breaks down, systematic analysis', emoji: '🔬' },
  intuitive: { label: 'Intuitive', description: 'Pattern recognition, gut feelings', emoji: '✨' },
  abstract: { label: 'Abstract', description: 'Concepts, theories, principles', emoji: '💭' },
  concrete: { label: 'Concrete', description: 'Examples, specifics, applications', emoji: '🔨' },
};
