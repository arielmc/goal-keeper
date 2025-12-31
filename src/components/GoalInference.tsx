import { useState, useEffect, useMemo } from 'react';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  currentGoal: string;
  onAcceptGoal: (goal: string) => void;
  onDismiss: () => void;
}

// Client-side goal inference from conversation
function inferGoalsFromConversation(messages: Message[]): string[] {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
  const allText = userMessages.join(' ');

  const goals: string[] = [];

  // Pattern matching for common goal types
  const patterns = [
    { pattern: /(?:help me|i want to|i need to|how (?:do|can) i)\s+(.+?)(?:\.|$)/gi, prefix: '' },
    { pattern: /(?:build|create|make|design|develop)\s+(?:a|an|the)?\s*(.+?)(?:\.|$)/gi, prefix: 'Build ' },
    { pattern: /(?:learn|understand|figure out)\s+(.+?)(?:\.|$)/gi, prefix: 'Understand ' },
    { pattern: /(?:fix|debug|solve|troubleshoot)\s+(.+?)(?:\.|$)/gi, prefix: 'Fix ' },
    { pattern: /(?:write|implement|code)\s+(?:a|an|the)?\s*(.+?)(?:\.|$)/gi, prefix: 'Implement ' },
    { pattern: /(?:plan|organize|structure)\s+(.+?)(?:\.|$)/gi, prefix: 'Plan ' },
  ];

  for (const { pattern, prefix } of patterns) {
    let match;
    while ((match = pattern.exec(allText)) !== null) {
      const extracted = match[1].trim();
      if (extracted.length > 5 && extracted.length < 100) {
        const goal = prefix + extracted.charAt(0).toUpperCase() + extracted.slice(1);
        if (!goals.includes(goal)) {
          goals.push(goal);
        }
      }
    }
  }

  // Extract key topics/nouns as fallback
  if (goals.length === 0) {
    const topicPatterns = [
      /(?:about|regarding|for)\s+(.+?)(?:\.|$)/gi,
      /(?:my|the)\s+(\w+(?:\s+\w+)?)\s+(?:project|app|application|website|system)/gi,
    ];

    for (const pattern of topicPatterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const topic = match[1].trim();
        if (topic.length > 3 && topic.length < 50) {
          goals.push(`Work on ${topic}`);
        }
      }
    }
  }

  return goals.slice(0, 3); // Return top 3 inferred goals
}

export function GoalInference({
  messages,
  currentGoal,
  onAcceptGoal,
  onDismiss,
}: Props) {
  const [customGoal, setCustomGoal] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Infer goals from conversation
  const inferredGoals = useMemo(() => {
    return inferGoalsFromConversation(messages);
  }, [messages]);

  // Only show after 2+ user messages and if no goal set and not dismissed
  const shouldShow = messages.filter(m => m.role === 'user').length >= 2
    && !currentGoal
    && !dismissed
    && (inferredGoals.length > 0 || isExpanded);

  // Auto-show after conditions met
  useEffect(() => {
    if (shouldShow && !isExpanded) {
      setIsExpanded(true);
    }
  }, [shouldShow]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  const handleAccept = (goal: string) => {
    onAcceptGoal(goal);
    setDismissed(true);
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-700 p-4 max-w-lg">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              What are you working on?
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Setting a goal helps me keep you focused and track progress.
        </p>

        {/* Inferred goals as clickable chips */}
        {inferredGoals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {inferredGoals.map((goal, i) => (
              <button
                key={i}
                onClick={() => handleAccept(goal)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-full text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
              >
                {goal}
              </button>
            ))}
          </div>
        )}

        {/* Custom goal input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customGoal}
            onChange={e => setCustomGoal(e.target.value)}
            placeholder="Or type your own goal..."
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onKeyDown={e => {
              if (e.key === 'Enter' && customGoal.trim()) {
                handleAccept(customGoal.trim());
              }
            }}
          />
          <button
            onClick={() => customGoal.trim() && handleAccept(customGoal.trim())}
            disabled={!customGoal.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set
          </button>
        </div>

        <button
          onClick={handleDismiss}
          className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Continue without a goal
        </button>
      </div>
    </div>
  );
}
