import { useState, useRef, useEffect } from 'react';
import type { Message as MessageType, PinnedItem, TagType, FileAttachment } from '../types';
import type { ClipCategory } from '../types/clips';
import type { ConversationLandmark, MessageSummary } from '../hooks/useConversationAnalysis';
import { ExpandableMessage } from './ExpandableMessage';
import { ConversationLandmark as LandmarkComponent } from './ConversationLandmark';
import { TextSelectionMenu } from './TextSelectionMenu';
import { generateId } from '../utils/storage';

interface Props {
  messages: MessageType[];
  pinnedItems: PinnedItem[];
  landmarks: ConversationLandmark[];
  isLoading: boolean;
  error: string | null;
  hasApiKey: boolean;
  focusMode: boolean;
  currentGoal?: string;
  goalAlignment?: number; // 0-1 score
  clipCategories: ClipCategory[];
  getSummary: (messageId: string) => MessageSummary | undefined;
  onSend: (content: string, attachments?: FileAttachment[]) => void;
  onPin: (messageId: string, tag: TagType, excerpt: string) => void;
  onUnpin: (pinId: string) => void;
  onClipToCategory: (text: string, categoryId: string, sourceMessageId?: string) => void;
  onCreateClipCategory: (name: string, emoji: string, color: string) => ClipCategory;
  onCreateActionItem: (text: string) => void;
  onClearError: () => void;
  onOpenSettings: () => void;
}

export function EnhancedChatInterface({
  messages,
  pinnedItems,
  landmarks,
  isLoading,
  error,
  hasApiKey,
  focusMode,
  currentGoal,
  goalAlignment = 1,
  clipCategories,
  getSummary,
  onSend,
  onPin,
  onUnpin,
  onClipToCategory,
  onCreateClipCategory,
  onCreateActionItem,
  onClearError,
  onOpenSettings,
}: Props) {
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<FileAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];

    for (const file of Array.from(files)) {
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 20MB)`);
        continue;
      }

      // Read file as base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        id: generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
      });
    }

    setPendingAttachments(prev => [...prev, ...newAttachments]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;
    onSend(input.trim(), pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setInput('');
    setPendingAttachments([]);
  };

  const getPinnedItem = (messageId: string) =>
    pinnedItems.find(p => p.messageId === messageId);

  // Find which landmarks appear after which message indices
  const landmarksByIndex = new Map(
    landmarks.map(l => [l.afterMessageIndex, l])
  );

  // Calculate alignment color
  const getAlignmentColor = () => {
    if (goalAlignment > 0.7) return 'bg-green-500';
    if (goalAlignment > 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleAskAbout = (text: string) => {
    onSend(`Tell me more about: "${text}"`);
  };

  return (
    <div className={`flex flex-col h-full transition-opacity ${focusMode ? 'bg-gray-950' : ''}`}>
      {/* Goal alignment rail - visual indicator on left */}
      <div className="flex flex-1 overflow-hidden">
        {currentGoal && messages.length > 0 && (
          <div className="w-1.5 flex flex-col relative group">
            <div
              className={`absolute inset-0 ${getAlignmentColor()} transition-colors duration-500`}
              style={{
                opacity: 0.6 + (goalAlignment * 0.4),
              }}
            />
            {/* Tooltip on hover */}
            <div className="absolute left-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                Goal alignment: {Math.round(goalAlignment * 100)}%
              </div>
            </div>
          </div>
        )}

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        >
          {/* Text selection menu */}
          <TextSelectionMenu
            containerRef={messagesContainerRef}
            categories={clipCategories}
            onClip={onClipToCategory}
            onCreateCategory={onCreateClipCategory}
            onCreateAction={onCreateActionItem}
            onAskAbout={handleAskAbout}
          />
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
            <div className="text-4xl mb-3">💭</div>
            <p>Start the conversation to work toward your goal.</p>
            <p className="text-sm mt-2 text-gray-400">
              I'll help you stay focused and capture insights along the way.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const summary = getSummary(msg.id);
          const landmark = landmarksByIndex.get(index + 1);

          return (
            <div key={msg.id}>
              <ExpandableMessage
                message={msg}
                pinnedItem={getPinnedItem(msg.id)}
                summary={summary?.brief}
                evidence={summary?.evidence}
                onPin={tag => onPin(msg.id, tag, msg.content.slice(0, 100))}
                onUnpin={() => {
                  const pin = getPinnedItem(msg.id);
                  if (pin) onUnpin(pin.id);
                }}
              />

              {/* Render landmark after this message if exists */}
              {landmark && (
                <LandmarkComponent
                  messageIndex={index}
                  summary={landmark.summary}
                  keyTopics={landmark.keyTopics}
                />
              )}
            </div>
          );
        })}

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

      <form onSubmit={handleSubmit} className={`p-4 border-t border-gray-200 dark:border-gray-700 ${focusMode ? 'bg-gray-900' : ''}`}>
        {/* Pending attachments preview */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {pendingAttachments.map(attachment => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-sm"
              >
                <span>
                  {attachment.type.startsWith('image/') ? '🖼️' :
                   attachment.type === 'application/pdf' ? '📄' :
                   attachment.type.startsWith('text/') ? '📝' : '📎'}
                </span>
                <span className="text-blue-700 dark:text-blue-300 max-w-32 truncate">
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-blue-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.json,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
              focusMode
                ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Attach files (images, PDFs, text)"
          >
            📎
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={pendingAttachments.length > 0 ? "Add a message about these files..." : "Type your message..."}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
              focusMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
            }`}
          />
          <button
            type="submit"
            disabled={(!input.trim() && pendingAttachments.length === 0) || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
