import { useState } from 'react';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  dismissed: boolean;
  messageId: string;
  priority: 'high' | 'medium' | 'low';
}

interface Props {
  items: ActionItem[];
  onToggle: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function ActionItems({ items, onToggle, onDismiss }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) return null;

  const pendingItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  // Show max 3 items when collapsed
  const maxCollapsed = 3;
  const hasMore = pendingItems.length > maxCollapsed;
  const visibleItems = isExpanded ? pendingItems : pendingItems.slice(0, maxCollapsed);

  const priorityColors = {
    high: 'border-l-red-400 bg-red-50 dark:bg-red-900/20',
    medium: 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-l-blue-400 bg-blue-50 dark:bg-blue-900/20',
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>📋</span>
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
            Action Items
          </span>
          <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
            {pendingItems.length}
          </span>
        </div>

        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isExpanded ? 'Show less' : `+${pendingItems.length - maxCollapsed} more`}
          </button>
        )}
      </div>

      <div className="px-4 pb-3">
        {/* Pending items */}
        <div className={`space-y-1.5 ${isExpanded ? 'max-h-64 overflow-y-auto' : ''}`}>
          {visibleItems.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded border-l-4 ${priorityColors[item.priority]} group`}
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggle(item.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                {item.text}
              </span>
              <button
                onClick={() => onDismiss(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 text-xs flex-shrink-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Completed count */}
        {completedItems.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {completedItems.length} completed
          </div>
        )}
      </div>
    </div>
  );
}
