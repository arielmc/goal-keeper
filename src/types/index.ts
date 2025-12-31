export type TagType = 'new-idea' | 'augment' | 'counter-argument' | 'important';

export interface SubGoal {
  id: string;
  text: string;
  completed: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;  // MIME type
  size: number;
  data: string;  // base64 encoded
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

export interface PinnedItem {
  id: string;
  messageId: string;
  tag: TagType;
  note?: string;
  excerpt: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  goal: string;
  subGoals: SubGoal[];
  messages: Message[];
  pinnedItems: PinnedItem[];
}

export interface Settings {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  driftCheckFrequency: number;
  // Token optimization settings
  analysisInterval: number;      // Analyze every N user messages (default 5)
  useUnifiedAnalysis: boolean;   // Single API call for all analysis (default true)
  maxContextMessages: number;    // Max messages to include in context (default 10)
  enableBackgroundAnalysis: boolean; // Enable drift/insight detection (default true)
}

export interface AppState {
  currentSession: Session | null;
  sessions: Session[];
  settings: Settings;
  showGoalModal: boolean;
  showSettingsModal: boolean;
  driftAlert: string | null;
}

export const TAG_CONFIG: Record<TagType, { emoji: string; label: string; color: string }> = {
  'new-idea': { emoji: '💡', label: 'New Idea', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  'augment': { emoji: '🔄', label: 'Augments Prior', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  'counter-argument': { emoji: '⚖️', label: 'Counter-argument', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  'important': { emoji: '📌', label: 'Important', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};
