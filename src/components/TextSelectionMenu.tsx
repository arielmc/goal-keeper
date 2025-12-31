import { useState, useEffect, useCallback } from 'react';
import type { ClipCategory } from '../types/clips';
import { SUGGESTED_EMOJIS, CATEGORY_COLORS } from '../types/clips';

interface Position {
  x: number;
  y: number;
}

interface Props {
  containerRef: React.RefObject<HTMLElement | null>;
  categories: ClipCategory[];
  onClip: (text: string, categoryId: string) => void;
  onCreateCategory: (name: string, emoji: string, color: string) => ClipCategory;
  onCreateAction: (text: string) => void;
  onAskAbout: (text: string) => void;
}

export function TextSelectionMenu({
  containerRef,
  categories,
  onClip,
  onCreateCategory,
  onCreateAction,
  onAskAbout,
}: Props) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [menuState, setMenuState] = useState<'main' | 'categories' | 'newCategory'>('main');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📋');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0].value);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTimeout(() => {
        const currentSelection = window.getSelection();
        if (!currentSelection || currentSelection.isCollapsed) {
          setPosition(null);
          setSelectedText('');
          setMenuState('main');
        }
      }, 200);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setSelectedText(text);
    setPosition({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 10,
    });
    setMenuState('main');
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const handleClip = (categoryId: string) => {
    onClip(selectedText, categoryId);
    window.getSelection()?.removeAllRanges();
    setPosition(null);
    setMenuState('main');
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;

    const category = onCreateCategory(
      newCategoryName.trim(),
      newCategoryEmoji,
      newCategoryColor
    );

    // Clip to the new category
    handleClip(category.id);

    // Reset form
    setNewCategoryName('');
    setNewCategoryEmoji('📋');
    setNewCategoryColor(CATEGORY_COLORS[0].value);
  };

  const handleAction = () => {
    onCreateAction(selectedText);
    window.getSelection()?.removeAllRanges();
    setPosition(null);
  };

  const handleAsk = () => {
    onAskAbout(selectedText);
    window.getSelection()?.removeAllRanges();
    setPosition(null);
  };

  if (!position || !selectedText) return null;

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 min-w-[180px]">
        {menuState === 'main' && (
          <div className="flex items-center gap-0.5 p-1.5">
            <button
              onClick={() => setMenuState('categories')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg transition-colors"
              title="Send to collection"
            >
              <span>📎</span>
              <span>Clip</span>
            </button>
            <div className="w-px h-6 bg-gray-700" />
            <button
              onClick={handleAction}
              className="flex items-center gap-1.5 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg transition-colors"
              title="Create action item"
            >
              <span>✅</span>
            </button>
            <button
              onClick={handleAsk}
              className="flex items-center gap-1.5 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg transition-colors"
              title="Ask about this"
            >
              <span>💬</span>
            </button>
          </div>
        )}

        {menuState === 'categories' && (
          <div className="p-2 max-h-64 overflow-y-auto">
            <div className="text-xs text-gray-400 px-2 pb-2 border-b border-gray-700 mb-2">
              Send to...
            </div>

            {/* Existing categories */}
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleClip(cat.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* New category button */}
            <div className="border-t border-gray-700 mt-2 pt-2">
              <button
                onClick={() => setMenuState('newCategory')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-600 rounded-lg transition-colors text-left text-blue-400 hover:text-white"
              >
                <span>➕</span>
                <span>New Collection...</span>
              </button>
            </div>

            {/* Back button */}
            <button
              onClick={() => setMenuState('main')}
              className="mt-2 w-full px-3 py-1 text-xs text-gray-400 hover:text-white text-left"
            >
              ← Back
            </button>
          </div>
        )}

        {menuState === 'newCategory' && (
          <div className="p-3 w-64">
            <div className="text-sm font-medium mb-3">New Collection</div>

            {/* Name input */}
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="e.g., Shopping List"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm mb-3 focus:outline-none focus:border-blue-500"
              autoFocus
            />

            {/* Emoji picker */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Icon</div>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setNewCategoryEmoji(emoji)}
                    className={`w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-gray-700 ${
                      newCategoryEmoji === emoji ? 'bg-blue-600' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Color</div>
              <div className="flex flex-wrap gap-1">
                {CATEGORY_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNewCategoryColor(color.value)}
                    className={`w-6 h-6 rounded ${color.value} ${
                      newCategoryColor === color.value ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-900' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setMenuState('categories')}
                className="flex-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                Create & Clip
              </button>
            </div>
          </div>
        )}

        {/* Arrow pointer */}
        {menuState === 'main' && (
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #111827',
            }}
          />
        )}
      </div>
    </div>
  );
}
