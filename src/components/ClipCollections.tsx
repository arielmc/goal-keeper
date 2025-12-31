import { useState } from 'react';
import type { Clip, ClipCategory } from '../types/clips';

interface Props {
  clips: Clip[];
  categories: ClipCategory[];
  onRemoveClip: (clipId: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onClose: () => void;
}

export function ClipCollections({
  clips,
  categories,
  onRemoveClip,
  onRemoveCategory: _onRemoveCategory,
  onClose,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getCategoryClips = (categoryId: string) =>
    clips.filter(c => c.categoryId === categoryId);

  const handleCopy = async (text: string, clipId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(clipId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📚</span> Collections
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {clips.length} clip{clips.length !== 1 ? 's' : ''} across {categories.length} collection{categories.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-3 overflow-y-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
                selectedCategory === null
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All ({clips.length})
            </button>

            {categories.map(cat => {
              const count = getCategoryClips(cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 flex items-center justify-between group ${
                    selectedCategory === cat.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-xs text-gray-400">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Clips list */}
          <div className="flex-1 p-4 overflow-y-auto">
            {(selectedCategory === null ? clips : getCategoryClips(selectedCategory)).length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p>No clips yet</p>
                <p className="text-sm mt-1">Select text in chat and click Clip to save</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(selectedCategory === null ? clips : getCategoryClips(selectedCategory))
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(clip => {
                    const category = categories.find(c => c.id === clip.categoryId);
                    return (
                      <div
                        key={clip.id}
                        className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${
                          category?.color || 'bg-gray-50 dark:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Category badge */}
                            {selectedCategory === null && category && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>{category.emoji}</span>
                                <span>{category.name}</span>
                              </div>
                            )}

                            {/* Clip text */}
                            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {clip.text}
                            </p>

                            {/* Metadata */}
                            <div className="text-xs text-gray-400 mt-2">
                              {formatDate(clip.createdAt)}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleCopy(clip.text, clip.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded"
                              title="Copy to clipboard"
                            >
                              {copiedId === clip.id ? '✓' : '📋'}
                            </button>
                            <button
                              onClick={() => onRemoveClip(clip.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded"
                              title="Remove clip"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact view for sidebar
export function SidebarClipCollections({
  clips,
  categories,
  onOpenFull,
}: {
  clips: Clip[];
  categories: ClipCategory[];
  onOpenFull: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (clips.length === 0) return null;

  // Get top 3 categories by clip count
  const categoryCounts = categories
    .map(cat => ({
      ...cat,
      count: clips.filter(c => c.categoryId === cat.id).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm"
      >
        <div className="flex items-center gap-2">
          <span>📚</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Collections
          </span>
          <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
            {clips.length}
          </span>
        </div>
        <span className="text-gray-400">{isExpanded ? '▾' : '▸'}</span>
      </button>

      {isExpanded && (
        <div className="space-y-1">
          {categoryCounts.map(cat => (
            <div
              key={cat.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${cat.color}`}
            >
              <span>{cat.emoji}</span>
              <span className="flex-1 text-gray-700 dark:text-gray-300">{cat.name}</span>
              <span className="text-gray-500 dark:text-gray-400">{cat.count}</span>
            </div>
          ))}
          <button
            onClick={onOpenFull}
            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline text-left px-2 py-1"
          >
            View all collections →
          </button>
        </div>
      )}
    </div>
  );
}
