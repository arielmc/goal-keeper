import { useState, useCallback } from 'react';
import type { Message, Settings } from '../types';
import type { ActionItem } from '../components/ActionItems';
import { sendMessage } from '../utils/llm';
import { generateId } from '../utils/storage';

const ACTION_DETECTION_PROMPT = `Extract action items from this conversation.

Conversation:
{messages}

Look for:
- Explicit tasks mentioned ("I need to...", "Let's...", "We should...")
- Implied next steps from decisions made
- Follow-up items from questions asked

Respond with ONLY valid JSON:
{
  "actionItems": [
    {
      "text": "Clear, actionable task description",
      "priority": "high" | "medium" | "low",
      "sourceQuote": "Relevant quote from conversation"
    }
  ]
}

Only include clear, actionable items. If none found, return {"actionItems": []}`;

export function useActionItems(settings: Settings) {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectActionItems = useCallback(async (messages: Message[]) => {
    if (!settings.apiKey || messages.length < 2) return;

    setIsDetecting(true);

    try {
      const recentMessages = messages
        .slice(-10)
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      const prompt = ACTION_DETECTION_PROMPT.replace('{messages}', recentMessages);

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        'You are an action item extractor. Respond only with valid JSON.',
        settings
      );

      const parsed = parseActionItemsResponse(response);

      if (parsed?.actionItems?.length > 0) {
        const newItems: ActionItem[] = parsed.actionItems.map((item: any) => ({
          id: generateId(),
          text: item.text,
          completed: false,
          messageId: findSourceMessageId(messages, item.sourceQuote),
          priority: item.priority || 'medium',
        }));

        // Merge with existing, avoiding duplicates
        setItems(prev => {
          const existingTexts = new Set(prev.map(i => i.text.toLowerCase()));
          const uniqueNew = newItems.filter(
            n => !existingTexts.has(n.text.toLowerCase())
          );
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.error('Action item detection failed:', err);
    } finally {
      setIsDetecting(false);
    }
  }, [settings]);

  const toggleItem = useCallback((id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const dismissItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setItems(prev => prev.filter(item => !item.completed));
  }, []);

  return {
    items,
    isDetecting,
    detectActionItems,
    toggleItem,
    dismissItem,
    clearCompleted,
  };
}

function parseActionItemsResponse(response: string): any {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through
  }
  return null;
}

function findSourceMessageId(messages: Message[], quote: string): string {
  if (!quote) return messages[messages.length - 1]?.id || '';

  const found = messages.find(m =>
    m.content.toLowerCase().includes(quote.toLowerCase().slice(0, 30))
  );
  return found?.id || messages[messages.length - 1]?.id || '';
}
