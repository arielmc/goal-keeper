import { useState, useRef, useEffect } from 'react';
import type { Message as MessageType, PinnedItem, TagType } from '../types';
import { Message } from './Message';

interface Props {
  messages: MessageType[];
  pinnedItems: PinnedItem[];
  isLoading: boolean;
  error: string | null;
  hasApiKey: boolean;
  onSend: (content: string) => void;
  onPin: (messageId: string, tag: TagType, excerpt: string) => void;
  onUnpin: (pinId: string) => void;
  onClearError: () => void;
  onOpenSettings: () => void;
}

export function ChatInterface({
  messages,
  pinnedItems,
  isLoading,
  error,
  hasApiKey,
  onSend,
  onPin,
  onUnpin,
  onClearError,
  onOpenSettings,
}: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const getPinnedItem = (messageId: string) =>
    pinnedItems.find(p => p.messageId === messageId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasApiKey && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6 max-w-md">
              <div className="text-2xl mb-2">🔑</div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                API Key Required
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                Add your OpenAI or Anthropic API key to start chatting.
              </p>
              <button
                onClick={onOpenSettings}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Configure API Key
              </button>
            </div>
          </div>
        )}

        {hasApiKey && messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Start the conversation to work toward your goal.
          </div>
        )}

        {messages.map(msg => (
          <Message
            key={msg.id}
            message={msg}
            pinnedItem={getPinnedItem(msg.id)}
            onPin={tag => onPin(msg.id, tag, msg.content.slice(0, 100))}
            onUnpin={() => {
              const pin = getPinnedItem(msg.id);
              if (pin) onUnpin(pin.id);
            }}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 px-4 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          <div className="flex justify-between items-start gap-2">
            <span className="flex-1">{error}</span>
            <button onClick={onClearError} className="text-red-500 hover:text-red-700 flex-shrink-0">×</button>
          </div>
          {(error.toLowerCase().includes('api') || error.toLowerCase().includes('key') || error.toLowerCase().includes('401') || error.toLowerCase().includes('unauthorized')) && (
            <button
              onClick={() => { onClearError(); onOpenSettings(); }}
              className="mt-2 text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Check API Key Settings
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
