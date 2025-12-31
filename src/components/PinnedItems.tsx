import { useState } from 'react';
import type { PinnedItem, TagType } from '../types';
import { TAG_CONFIG } from '../types';

interface Props {
  items: PinnedItem[];
  onRemove: (id: string) => void;
}

export function PinnedItems({ items, onRemove }: Props) {
  const [filterTag, setFilterTag] = useState<TagType | 'all'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredItems = filterTag === 'all'
    ? items
    : items.filter(item => item.tag === filterTag);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <span>Pinned ({items.length})</span>
        <span className="text-gray-400">{isCollapsed ? '▸' : '▾'}</span>
      </button>

      {!isCollapsed && (
        <>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterTag('all')}
              className={`px-2 py-0.5 text-xs rounded ${
                filterTag === 'all'
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {(Object.keys(TAG_CONFIG) as TagType[]).map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-2 py-0.5 text-xs rounded ${
                  filterTag === tag
                    ? TAG_CONFIG[tag].color
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {TAG_CONFIG[tag].emoji}
              </button>
            ))}
          </div>

          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {filteredItems.map(item => (
              <li
                key={item.id}
                className="group flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
              >
                <span className="flex-shrink-0">{TAG_CONFIG[item.tag].emoji}</span>
                <span className="flex-1 text-gray-700 dark:text-gray-300 line-clamp-2">
                  {item.excerpt}
                </span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
