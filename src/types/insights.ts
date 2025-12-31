export type InsightType =
  | 'convergence'      // Multiple ideas coming together
  | 'breakthrough'     // Major realization or solution
  | 'connection'       // Link between previously separate concepts
  | 'clarification'    // Murky concept becoming clear
  | 'pivot';           // Productive change in direction

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;        // 0-1, how confident we are this is an insight
  crystallization: number;   // 0-1, how "formed" the insight is
  relatedMessageIds: string[];
  suggestedActions?: string[];
  timestamp: Date;
}

export interface InsightContext {
  fromPinnedItems: Array<{
    id: string;
    excerpt: string;
    relevance: number;
  }>;
  fromPastSessions: Array<{
    sessionId: string;
    sessionGoal: string;
    excerpt: string;
    relevance: number;
  }>;
  synthesisPrompt?: string;
}

export const INSIGHT_CONFIG: Record<InsightType, { emoji: string; label: string; color: string }> = {
  'convergence': { emoji: '🔮', label: 'Ideas Converging', color: 'from-purple-500 to-indigo-500' },
  'breakthrough': { emoji: '💡', label: 'Breakthrough', color: 'from-yellow-400 to-orange-500' },
  'connection': { emoji: '🔗', label: 'Connection Found', color: 'from-blue-400 to-cyan-500' },
  'clarification': { emoji: '✨', label: 'Clarity Emerging', color: 'from-green-400 to-emerald-500' },
  'pivot': { emoji: '🔄', label: 'Productive Pivot', color: 'from-pink-400 to-rose-500' },
};
