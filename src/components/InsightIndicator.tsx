import { useEffect, useState } from 'react';
import type { Insight, InsightContext } from '../types/insights';
import { INSIGHT_CONFIG } from '../types/insights';

interface Props {
  insight: Insight;
  context: InsightContext | null;
  onDismiss: () => void;
  onUseSynthesis: (prompt: string) => void;
}

export function InsightIndicator({ insight, context, onDismiss, onUseSynthesis }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [crystallizationAnim, setCrystallizationAnim] = useState(0);
  const config = INSIGHT_CONFIG[insight.type];

  useEffect(() => {
    // Animate the crystallization progress
    const interval = setInterval(() => {
      setCrystallizationAnim(prev => {
        if (prev >= insight.crystallization) {
          clearInterval(interval);
          return insight.crystallization;
        }
        return prev + 0.02;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [insight.crystallization]);

  return (
    <div className="fixed bottom-24 right-6 z-40 max-w-sm">
      <div
        className={`relative overflow-hidden rounded-xl shadow-2xl bg-gradient-to-br ${config.color} p-[2px]`}
      >
        {/* Animated glow effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
          style={{ animationDuration: '2s' }}
        />

        <div className="relative bg-gray-900/95 rounded-xl p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-pulse">{config.emoji}</span>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">
                  {config.label}
                </div>
                <div className="text-white font-medium">{insight.title}</div>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          {/* Crystallization meter */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Crystallizing...</span>
              <span>{Math.round(crystallizationAnim * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${config.color} transition-all duration-300`}
                style={{ width: `${crystallizationAnim * 100}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-sm mb-3">{insight.description}</p>

          {/* Expandable context */}
          {context && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-400 hover:text-blue-300 mb-2"
            >
              {isExpanded ? '▾ Hide context' : '▸ Show related context'}
            </button>
          )}

          {isExpanded && context && (
            <div className="space-y-2 mb-3 pl-2 border-l-2 border-gray-700">
              {context.fromPinnedItems.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">From pinned items:</div>
                  {context.fromPinnedItems.slice(0, 2).map(item => (
                    <div key={item.id} className="text-xs text-gray-400 truncate">
                      • {item.excerpt}
                    </div>
                  ))}
                </div>
              )}
              {context.fromPastSessions.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">From past sessions:</div>
                  {context.fromPastSessions.slice(0, 2).map(item => (
                    <div key={item.sessionId} className="text-xs text-gray-400 truncate">
                      • {item.sessionGoal}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggested actions */}
          {insight.suggestedActions && insight.suggestedActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {insight.suggestedActions.map((action, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded"
                >
                  {action}
                </span>
              ))}
            </div>
          )}

          {/* Synthesis prompt */}
          {context?.synthesisPrompt && (
            <button
              onClick={() => onUseSynthesis(context.synthesisPrompt!)}
              className={`w-full py-2 px-3 text-sm font-medium text-white rounded-lg bg-gradient-to-r ${config.color} hover:opacity-90 transition-opacity`}
            >
              Deepen this insight →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
