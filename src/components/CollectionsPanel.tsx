import { useState } from 'react';
import type { Clip, ClipCategory } from '../types/clips';
import { SUGGESTED_EMOJIS, CATEGORY_COLORS } from '../types/clips';

interface Props {
  clips: Clip[];
  categories: ClipCategory[];
  onRemoveClip: (clipId: string) => void;
  onAddCategory: (name: string, emoji: string, color: string) => void;
}

export function CollectionsPanel({ clips, categories, onRemoveClip, onAddCategory }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📋');
  const [newColor] = useState(CATEGORY_COLORS[0].value);

  const getCategoryClips = (categoryId: string) =>
    clips.filter(c => c.categoryId === categoryId);

  const handleCopy = async (text: string, clipId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(clipId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCategory = () => {
    if (!newName.trim()) return;
    onAddCategory(newName.trim(), newEmoji, newColor);
    setNewName('');
    setNewEmoji('📋');
    setShowNewCategory(false);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const displayClips = selectedCategory
    ? getCategoryClips(selectedCategory)
    : clips;

  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All ({clips.length})
        </button>
        {categories.map(cat => {
          const count = getCategoryClips(cat.id).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
              <span className="text-xs opacity-60">({count})</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowNewCategory(true)}
          className="px-2 py-1.5 text-gray-400 hover:text-blue-500 transition-colors"
          title="New category"
        >
          +
        </button>
      </div>

      {/* New category form */}
      {showNewCategory && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              {SUGGESTED_EMOJIS.slice(0, 8).map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setNewEmoji(emoji)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-sm hover:bg-white dark:hover:bg-gray-700 ${
                    newEmoji === emoji ? 'bg-white dark:bg-gray-700 ring-2 ring-blue-500' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Category name"
              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
            />
            <button
              onClick={handleCreateCategory}
              disabled={!newName.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowNewCategory(false)}
              className="px-2 py-1.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Clips list */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayClips.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm">No clips yet</p>
            <p className="text-xs mt-1">Select text and clip it to save here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayClips
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
                        {selectedCategory === null && category && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>{category.emoji}</span>
                            <span>{category.name}</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap line-clamp-4">
                          {clip.text}
                        </p>
                        <div className="text-xs text-gray-400 mt-1.5">
                          {formatDate(clip.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleCopy(clip.text, clip.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 rounded transition-colors"
                          title="Copy"
                        >
                          {copiedId === clip.id ? '✓' : '📋'}
                        </button>
                        <button
                          onClick={() => onRemoveClip(clip.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Remove"
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
  );
}
