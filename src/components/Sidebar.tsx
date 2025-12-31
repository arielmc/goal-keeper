import { useState } from 'react';
import type { Session, SubGoal } from '../types';
import type { ActionItem } from './ActionItems';
import type { Insight } from '../types/insights';
import { INSIGHT_CONFIG } from '../types/insights';
import { ProgressTracker } from './ProgressTracker';
import { PinnedItems } from './PinnedItems';
import { SessionList } from './SessionList';

interface Props {
  currentSession: Session | null;
  sessions: Session[];
  actionItems: ActionItem[];
  insightsHistory: Insight[];
  driftDetected?: boolean;
  goalAlignment?: number;
  onToggleSubGoal: (id: string) => void;
  onAddSubGoal: (subGoal: SubGoal) => void;
  onRemoveSubGoal: (id: string) => void;
  onRemovePin: (id: string) => void;
  onSelectSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onExportSession: (session: Session) => void;
  onToggleActionItem: (id: string) => void;
  onDismissActionItem: (id: string) => void;
  onSelectInsight: (insight: Insight) => void;
  onTriggerRecalibrate?: () => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  currentSession,
  sessions,
  actionItems,
  insightsHistory,
  driftDetected,
  goalAlignment = 1,
  onToggleSubGoal,
  onAddSubGoal,
  onRemoveSubGoal,
  onRemovePin,
  onSelectSession,
  onDeleteSession,
  onExportSession,
  onToggleActionItem,
  onDismissActionItem,
  onSelectInsight,
  onTriggerRecalibrate,
  onNewSession,
  onOpenSettings,
}: Props) {
  const otherSessions = sessions.filter(s => s.id !== currentSession?.id);
  const pendingActions = actionItems.filter(i => !i.completed);

  return (
    <div className="w-80 h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Goal Keeper</h1>
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* EVERGREEN SECTION - Always visible focus & capture */}
      {currentSession && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-750 dark:to-gray-800">
          <div className="p-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Focus & Capture
            </h2>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Rabbit Hole Status */}
              <button
                onClick={onTriggerRecalibrate}
                className={`p-2 rounded-lg text-center transition-all ${
                  driftDetected
                    ? 'bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 animate-pulse'
                    : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-green-300'
                }`}
              >
                <span className="text-lg">{driftDetected ? '🐇' : '🎯'}</span>
                <div className={`text-[10px] font-medium mt-0.5 ${
                  driftDetected ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {driftDetected ? 'Drifting' : 'On Track'}
                </div>
              </button>

              {/* Actions count */}
              <div className={`p-2 rounded-lg text-center bg-white dark:bg-gray-700 border ${
                pendingActions.length > 0
                  ? 'border-blue-300 dark:border-blue-700'
                  : 'border-gray-200 dark:border-gray-600'
              }`}>
                <span className="text-lg">📋</span>
                <div className="text-[10px] font-medium mt-0.5 text-gray-600 dark:text-gray-400">
                  {pendingActions.length} Action{pendingActions.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Insights count */}
              <div className={`p-2 rounded-lg text-center bg-white dark:bg-gray-700 border ${
                insightsHistory.length > 0
                  ? 'border-yellow-300 dark:border-yellow-700'
                  : 'border-gray-200 dark:border-gray-600'
              }`}>
                <span className="text-lg">💡</span>
                <div className="text-[10px] font-medium mt-0.5 text-gray-600 dark:text-gray-400">
                  {insightsHistory.length} Insight{insightsHistory.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Alignment bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                <span>Goal Alignment</span>
                <span>{Math.round(goalAlignment * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    goalAlignment > 0.7 ? 'bg-green-500' :
                    goalAlignment > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${goalAlignment * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentSession ? (
          <>
            {/* Current Goal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Current Goal
                </h2>
                <button
                  onClick={onNewSession}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  New
                </button>
              </div>
              <p className="text-gray-900 dark:text-white font-medium text-sm">
                {currentSession.goal}
              </p>
            </div>

            {/* Progress Tracker (Sub-goals) */}
            <ProgressTracker
              subGoals={currentSession.subGoals}
              onToggle={onToggleSubGoal}
              onAdd={onAddSubGoal}
              onRemove={onRemoveSubGoal}
            />

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Captured Items
              </h2>

              {/* Action Items */}
              <SidebarActionItems
                items={actionItems}
                onToggle={onToggleActionItem}
                onDismiss={onDismissActionItem}
              />

              {/* Insights History */}
              <SidebarInsights
                insights={insightsHistory}
                onSelect={onSelectInsight}
              />

              {/* Pinned Items */}
              <PinnedItems
                items={currentSession.pinnedItems}
                onRemove={onRemovePin}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No active session</p>
            <button
              onClick={onNewSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start New Session
            </button>
          </div>
        )}

        {otherSessions.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Past Sessions
            </h2>
            <SessionList
              sessions={otherSessions}
              currentSessionId={currentSession?.id || null}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
              onExport={onExportSession}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarActionItems({
  items,
  onToggle,
  onDismiss,
}: {
  items: ActionItem[];
  onToggle: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pendingItems = items.filter(i => !i.completed);

  if (pendingItems.length === 0) return null;

  const priorityDot = {
    high: 'bg-red-400',
    medium: 'bg-yellow-400',
    low: 'bg-blue-400',
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm"
      >
        <div className="flex items-center gap-2">
          <span>📋</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Action Items
          </span>
          <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
            {pendingItems.length}
          </span>
        </div>
        <span className="text-gray-400">{isExpanded ? '▾' : '▸'}</span>
      </button>

      {isExpanded && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {pendingItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded group"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggle(item.id)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />
              <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[item.priority]} flex-shrink-0`} />
              <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                {item.text}
              </span>
              <button
                onClick={() => onDismiss(item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarInsights({
  insights,
  onSelect,
}: {
  insights: Insight[];
  onSelect: (insight: Insight) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (insights.length === 0) return null;

  const recentInsights = insights.slice(0, 5);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm"
      >
        <div className="flex items-center gap-2">
          <span>💡</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Insights
          </span>
          <span className="px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full">
            {insights.length}
          </span>
        </div>
        <span className="text-gray-400">{isExpanded ? '▾' : '▸'}</span>
      </button>

      {isExpanded && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {recentInsights.map(insight => {
            const config = INSIGHT_CONFIG[insight.type];
            return (
              <button
                key={insight.id}
                onClick={() => onSelect(insight)}
                className="w-full text-left p-2 bg-white dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{config.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">
                      {insight.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(insight.timestamp)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {insights.length > 5 && (
            <div className="text-xs text-center text-gray-500 py-1">
              +{insights.length - 5} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString();
}
