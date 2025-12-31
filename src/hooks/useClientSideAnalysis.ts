import { useState, useCallback, useRef } from 'react';
import type { Message } from '../types';
import type { ActionItem } from '../components/ActionItems';
import { generateId } from '../utils/storage';

// Regex patterns for action item detection - NO API CALLS
const ACTION_PATTERNS = [
  { pattern: /(?:I|we) (?:need|have|want|should|must|will) to (.+?)(?:\.|$)/gi, priority: 'high' as const },
  { pattern: /(?:TODO|TASK|ACTION):?\s*(.+?)(?:\.|$)/gi, priority: 'high' as const },
  { pattern: /(?:remember|don't forget) to (.+?)(?:\.|$)/gi, priority: 'medium' as const },
  { pattern: /(?:let's|let us) (.+?)(?:\.|$)/gi, priority: 'medium' as const },
  { pattern: /(?:make sure|ensure) (?:to )?(.+?)(?:\.|$)/gi, priority: 'medium' as const },
  { pattern: /(?:next step|next,) (.+?)(?:\.|$)/gi, priority: 'medium' as const },
  { pattern: /(?:consider|think about) (.+?)(?:\.|$)/gi, priority: 'low' as const },
  { pattern: /(?:might want to|could) (.+?)(?:\.|$)/gi, priority: 'low' as const },
];

// Keywords that suggest important moments (for highlighting, not auto-insights)
const HIGHLIGHT_KEYWORDS = [
  'breakthrough', 'realized', 'aha', 'insight', 'key point', 'important',
  'crucial', 'essential', 'finally', 'got it', 'makes sense', 'clicking',
  'connected', 'pattern', 'underlying', 'root cause', 'solution',
];

export interface ClientAnalysis {
  actionItems: ActionItem[];
  highlightedMessages: Set<string>;
  topicKeywords: string[];
}

export function useClientSideAnalysis() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [highlightedMessages, setHighlightedMessages] = useState<Set<string>>(new Set());
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Extract action items from a message using regex - NO API CALL
  const extractActionItems = useCallback((message: Message): ActionItem[] => {
    if (message.role !== 'assistant') return [];

    const items: ActionItem[] = [];
    const content = message.content;

    for (const { pattern, priority } of ACTION_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(content)) !== null) {
        const text = match[1]?.trim();
        if (text && text.length > 5 && text.length < 200) {
          items.push({
            id: generateId(),
            text: text.charAt(0).toUpperCase() + text.slice(1),
            completed: false,
            dismissed: false,
            messageId: message.id,
            priority,
          });
        }
      }
    }

    return items;
  }, []);

  // Check if message contains highlight-worthy content
  const checkForHighlight = useCallback((message: Message): boolean => {
    const content = message.content.toLowerCase();
    return HIGHLIGHT_KEYWORDS.some(kw => content.includes(kw));
  }, []);

  // Process new messages - call this after each assistant response
  const analyzeMessage = useCallback((message: Message) => {
    if (processedMessagesRef.current.has(message.id)) return;
    processedMessagesRef.current.add(message.id);

    // Extract action items
    const newItems = extractActionItems(message);
    if (newItems.length > 0) {
      setActionItems(prev => {
        // Deduplicate by text similarity
        const existingTexts = new Set(prev.map(i => i.text.toLowerCase()));
        const unique = newItems.filter(item => !existingTexts.has(item.text.toLowerCase()));
        return [...prev, ...unique];
      });
    }

    // Check for highlights
    if (checkForHighlight(message)) {
      setHighlightedMessages(prev => new Set([...prev, message.id]));
    }
  }, [extractActionItems, checkForHighlight]);

  // Analyze all messages (for initial load)
  const analyzeMessages = useCallback((messages: Message[]) => {
    messages.forEach(analyzeMessage);
  }, [analyzeMessage]);

  // Toggle action item completion
  const toggleActionItem = useCallback((id: string) => {
    setActionItems(prev =>
      prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    );
  }, []);

  // Dismiss action item
  const dismissActionItem = useCallback((id: string) => {
    setActionItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Add manual action item
  const addActionItem = useCallback((text: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    const item: ActionItem = {
      id: generateId(),
      text,
      completed: false,
      dismissed: false,
      messageId: '',
      priority,
    };
    setActionItems(prev => [...prev, item]);
  }, []);

  // Reset all analysis
  const reset = useCallback(() => {
    setActionItems([]);
    setHighlightedMessages(new Set());
    processedMessagesRef.current = new Set();
  }, []);

  return {
    actionItems,
    highlightedMessages,
    analyzeMessage,
    analyzeMessages,
    toggleActionItem,
    dismissActionItem,
    addActionItem,
    reset,
  };
}

// Extract topic keywords from goal for drift detection
export function extractGoalKeywords(goal: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'want', 'help', 'make', 'get', 'understand', 'learn', 'know', 'think',
  ]);

  return goal
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Check drift using keyword matching - NO API CALL
export function checkDriftClientSide(
  messages: Message[],
  goalKeywords: string[],
  minMessages: number = 6
): { isDrifting: boolean; matchRatio: number } {
  if (messages.length < minMessages || goalKeywords.length === 0) {
    return { isDrifting: false, matchRatio: 1 };
  }

  const recentText = messages
    .slice(-4)
    .map(m => m.content.toLowerCase())
    .join(' ');

  const matchCount = goalKeywords.filter(kw => recentText.includes(kw)).length;
  const matchRatio = matchCount / goalKeywords.length;

  return {
    isDrifting: matchRatio < 0.15,
    matchRatio,
  };
}
