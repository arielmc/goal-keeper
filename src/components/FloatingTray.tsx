import { useState, useEffect } from 'react';
import type { ClipCategory } from '../types/clips';
import type { ActionItem } from './ActionItems';

interface Props {
  categories: ClipCategory[];
  actionItems: ActionItem[];
  driftDetected: boolean;
  momentum: { level: number; trend: 'rising' | 'falling' | 'stable' };
  onQuickClip: (categoryId: string) => void;
  onRecalibrate: () => void;
  onToggleActionItem: (id: string) => void;
}

export function FloatingTray({
  categories,
  actionItems,
  driftDetected,
  momentum,
  onQuickClip,
  onRecalibrate,
  onToggleActionItem,
}: Props) {
  const [expanded, setExpanded] = useState<'none' | 'clips' | 'actions'>('none');
  const [hasSelection, setHasSelection] = useState(false);

  // Check for text selection
  useEffect(() => {
    const checkSelection = () => {
      const selection = window.getSelection();
      setHasSelection(!!selection && !selection.isCollapsed && selection.toString().trim().length > 0);
    };
    document.addEventListener('selectionchange', checkSelection);
    return () => document.removeEventListener('selectionchange', checkSelection);
  }, []);

  const pendingActions = actionItems.filter(a => !a.completed && !a.dismissed);
  const getMomentumEmoji = () => {
    if (momentum.trend === 'rising') return '📈';
    if (momentum.trend === 'falling') return '📉';
    return '➡️';
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
      {/* Drift Warning - Prominent when active */}
      {driftDetected && (
        <button
          onClick={onRecalibrate}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all animate-pulse"
        >
          <span>🐰</span>
          <span className="text-sm font-medium">Rabbit hole!</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Recalibrate</span>
        </button>
      )}

      {/* Expanded Panels */}
      {expanded === 'clips' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[200px] animate-in slide-in-from-right-2 duration-150">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick clip to...</div>
          <div className="space-y-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  onQuickClip(cat.id);
                  setExpanded('none');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span>{cat.emoji}</span>
                <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {expanded === 'actions' && pendingActions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[250px] max-w-[300px] animate-in slide-in-from-right-2 duration-150">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Pending actions ({pendingActions.length})
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {pendingActions.slice(0, 5).map(action => (
              <button
                key={action.id}
                onClick={() => onToggleActionItem(action.id)}
                className="w-full flex items-start gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <span className="text-gray-400 group-hover:text-green-500 mt-0.5">○</span>
                <span className="text-gray-700 dark:text-gray-300 line-clamp-2">{action.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Tray Buttons */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-1.5">
        {/* Momentum indicator */}
        <div
          className="w-8 h-8 flex items-center justify-center text-sm"
          title={`Momentum: ${Math.round(momentum.level * 100)}%`}
        >
          {getMomentumEmoji()}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Quick Clip - shows when text selected */}
        <button
          onClick={() => setExpanded(expanded === 'clips' ? 'none' : 'clips')}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            expanded === 'clips'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
              : hasSelection
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-500 animate-pulse'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Quick clip"
        >
          📎
        </button>

        {/* Actions */}
        <button
          onClick={() => setExpanded(expanded === 'actions' ? 'none' : 'actions')}
          className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            expanded === 'actions'
              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Action items"
        >
          ✅
          {pendingActions.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {pendingActions.length > 9 ? '9+' : pendingActions.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
