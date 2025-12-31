import { useState } from 'react';
import type { Insight } from '../types/insights';
import { INSIGHT_CONFIG } from '../types/insights';

interface Props {
  insights: Insight[];
  onSelect: (insight: Insight) => void;
  onClose: () => void;
}

export function InsightsHistory({ insights, onSelect, onClose }: Props) {
  const [filter, setFilter] = useState<string>('all');

  const filteredInsights = filter === 'all'
    ? insights
    : insights.filter(i => i.type === filter);

  const sortedInsights = [...filteredInsights].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>💡</span> Insights History
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {insights.length} insight{insights.length !== 1 ? 's' : ''} captured
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>

        {/* Filter tabs */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              filter === 'all'
                ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {Object.entries(INSIGHT_CONFIG).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                filter === type
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {config.emoji} {config.label}
            </button>
          ))}
        </div>

        {/* Insights list */}
        <div className="overflow-y-auto max-h-[50vh] p-4">
          {sortedInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-3xl mb-2">🔮</div>
              <p>No insights yet</p>
              <p className="text-sm">Keep chatting - breakthroughs will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedInsights.map(insight => {
                const config = INSIGHT_CONFIG[insight.type];
                return (
                  <button
                    key={insight.id}
                    onClick={() => {
                      onSelect(insight);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{config.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {insight.title}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs rounded bg-gradient-to-r ${config.color} text-white`}>
                            {Math.round(insight.crystallization * 100)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {insight.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTimestamp(insight.timestamp)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}
