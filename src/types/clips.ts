// Flexible clip/collection system - user can create custom categories

export interface Clip {
  id: string;
  text: string;
  categoryId: string;
  sourceMessageId?: string;
  createdAt: Date;
  note?: string;
}

export interface ClipCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: Date;
}

// Default categories that come pre-installed
export const DEFAULT_CATEGORIES: ClipCategory[] = [
  { id: 'ideas', name: 'Ideas', emoji: '💡', color: 'bg-yellow-100 dark:bg-yellow-900', createdAt: new Date() },
  { id: 'actions', name: 'Action Items', emoji: '✅', color: 'bg-blue-100 dark:bg-blue-900', createdAt: new Date() },
  { id: 'important', name: 'Important', emoji: '⭐', color: 'bg-purple-100 dark:bg-purple-900', createdAt: new Date() },
  { id: 'questions', name: 'Questions', emoji: '❓', color: 'bg-green-100 dark:bg-green-900', createdAt: new Date() },
];

// Suggested emojis for new categories
export const SUGGESTED_EMOJIS = [
  '📋', '🛒', '📧', '📤', '💬', '📝', '🎯', '🔖',
  '📌', '🗂️', '📁', '💼', '🏠', '👥', '📱', '💻',
  '🎨', '🔧', '📚', '🎵', '🍽️', '✈️', '💰', '❤️',
];

// Color options for categories
export const CATEGORY_COLORS = [
  { name: 'Yellow', value: 'bg-yellow-100 dark:bg-yellow-900' },
  { name: 'Blue', value: 'bg-blue-100 dark:bg-blue-900' },
  { name: 'Green', value: 'bg-green-100 dark:bg-green-900' },
  { name: 'Purple', value: 'bg-purple-100 dark:bg-purple-900' },
  { name: 'Pink', value: 'bg-pink-100 dark:bg-pink-900' },
  { name: 'Orange', value: 'bg-orange-100 dark:bg-orange-900' },
  { name: 'Red', value: 'bg-red-100 dark:bg-red-900' },
  { name: 'Gray', value: 'bg-gray-100 dark:bg-gray-700' },
];
