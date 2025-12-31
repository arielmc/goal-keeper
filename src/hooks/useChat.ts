import { useState, useCallback, useRef } from 'react';
import type { Message, Settings, FileAttachment } from '../types';
import { sendMessage } from '../utils/llm';
import { getSystemPrompt } from '../utils/prompts';
import { generateId } from '../utils/storage';

export function useChat(goal: string, settings: Settings) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenEstimateRef = useRef(0);

  // Rough token estimation (4 chars per token, images ~1000 tokens)
  const estimateTokens = (text: string, attachments?: FileAttachment[]) => {
    let tokens = Math.ceil(text.length / 4);
    if (attachments) {
      // Rough estimate: images ~1000 tokens, PDFs ~500 per page (estimate 5 pages avg)
      tokens += attachments.reduce((sum, a) => {
        if (a.type.startsWith('image/')) return sum + 1000;
        if (a.type === 'application/pdf') return sum + 2500;
        return sum + Math.ceil(a.size / 4); // Text files
      }, 0);
    }
    return tokens;
  };

  const send = useCallback(async (content: string, attachments?: FileAttachment[]) => {
    if (!settings.apiKey) {
      setError('Please configure your API key in settings');
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      attachments,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const allMessages = [...messages, userMessage];

      // Limit context to maxContextMessages (default 10)
      const maxContext = settings.maxContextMessages || 10;
      const contextMessages = allMessages.slice(-maxContext);

      const systemPrompt = getSystemPrompt(goal);

      // Track token usage
      const inputTokens = estimateTokens(systemPrompt) +
        contextMessages.reduce((sum, m) => sum + estimateTokens(m.content, m.attachments), 0);

      const response = await sendMessage(contextMessages, systemPrompt, settings);

      // Estimate output tokens
      const outputTokens = estimateTokens(response);
      tokenEstimateRef.current += inputTokens + outputTokens;

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [messages, goal, settings]);

  const setMessagesDirectly = useCallback((msgs: Message[]) => {
    setMessages(msgs);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetTokenEstimate = useCallback(() => {
    tokenEstimateRef.current = 0;
  }, []);

  return {
    messages,
    isLoading,
    error,
    tokenEstimate: tokenEstimateRef.current,
    send,
    setMessages: setMessagesDirectly,
    clearError,
    resetTokenEstimate,
  };
}
