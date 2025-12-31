import { useState } from 'react';
import type { Message as MessageType, TagType, PinnedItem } from '../types';
import { TAG_CONFIG } from '../types';

interface Props {
  message: MessageType;
  pinnedItem?: PinnedItem;
  onPin: (tag: TagType) => void;
  onUnpin: () => void;
}

export function Message({ message, pinnedItem, onPin, onUnpin }: Props) {
  const [showTagMenu, setShowTagMenu] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div
      className={`group relative flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`relative max-w-[80%] px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {pinnedItem && (
          <span
            className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs rounded-full ${TAG_CONFIG[pinnedItem.tag].color}`}
          >
            {TAG_CONFIG[pinnedItem.tag].emoji}
          </span>
        )}

        <div className="whitespace-pre-wrap">{message.content}</div>

        <div
          className={`absolute top-1 ${isUser ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}
        >
          {pinnedItem ? (
            <button
              onClick={onUnpin}
              className="p-1 text-gray-400 hover:text-red-500"
              title="Unpin"
            >
              ✕
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="p-1 text-gray-400 hover:text-blue-500"
                title="Pin message"
              >
                📌
              </button>

              {showTagMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[160px]">
                  {(Object.keys(TAG_CONFIG) as TagType[]).map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        onPin(tag);
                        setShowTagMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <span>{TAG_CONFIG[tag].emoji}</span>
                      <span>{TAG_CONFIG[tag].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
