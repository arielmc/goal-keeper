import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message as MessageType, TagType, PinnedItem } from '../types';
import { TAG_CONFIG } from '../types';

interface Props {
  message: MessageType;
  pinnedItem?: PinnedItem;
  summary?: string;
  evidence?: string[];
  onPin: (tag: TagType) => void;
  onUnpin: () => void;
}

type ViewMode = 'brief' | 'full' | 'detailed';

export function ExpandableMessage({
  message,
  pinnedItem,
  summary,
  evidence,
  onPin,
  onUnpin,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [showTagMenu, setShowTagMenu] = useState(false);
  const isUser = message.role === 'user';

  const contentToShow = () => {
    if (viewMode === 'brief' && summary) {
      return summary;
    }
    return message.content;
  };

  const isLongMessage = message.content.length > 500;

  return (
    <div className={`group relative flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[80%] rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {/* Pin indicator */}
        {pinnedItem && (
          <span
            className={`absolute -top-2 -right-2 px-2 py-0.5 text-xs rounded-full ${TAG_CONFIG[pinnedItem.tag].color}`}
          >
            {TAG_CONFIG[pinnedItem.tag].emoji}
          </span>
        )}

        {/* Main content */}
        <div className="px-4 py-3">
          {/* Attachments display for user messages */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/30 rounded text-xs"
                >
                  <span>
                    {attachment.type.startsWith('image/') ? '🖼️' :
                     attachment.type === 'application/pdf' ? '📄' :
                     attachment.type.startsWith('text/') ? '📝' : '📎'}
                  </span>
                  <span className="max-w-24 truncate">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}

          {isUser ? (
            <div className="whitespace-pre-wrap">{contentToShow()}</div>
          ) : (
            <div className={`prose prose-sm dark:prose-invert max-w-none ${viewMode === 'brief' ? 'text-sm' : ''}`}>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1 first:mt-0">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                      return (
                        <pre className="bg-gray-800 text-gray-100 rounded p-3 overflow-x-auto my-2 text-sm">
                          <code>{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => <>{children}</>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 dark:border-gray-500 pl-3 my-2 italic">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {contentToShow()}
              </ReactMarkdown>
            </div>
          )}

          {/* Expandable layers for long messages */}
          {isLongMessage && !isUser && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('brief')}
                  className={`px-2 py-1 text-xs rounded ${
                    viewMode === 'brief'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Brief
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className={`px-2 py-1 text-xs rounded ${
                    viewMode === 'full'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Full
                </button>
                {evidence && evidence.length > 0 && (
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-2 py-1 text-xs rounded ${
                      viewMode === 'detailed'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    + Evidence
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Evidence panel */}
          {viewMode === 'detailed' && evidence && evidence.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 mb-2">Supporting context:</div>
              {evidence.map((e, i) => (
                <div key={i} className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  • {e}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pin action */}
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
