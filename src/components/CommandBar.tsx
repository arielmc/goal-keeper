import { useState, useRef, useEffect } from 'react';
import type { Settings } from '../types';

interface Props {
  settings: Settings;
  goal: string;
  tokenEstimate: number;
  clipCount: number;
  insightCount: number;
  goalAlignment: number;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onUpdateGoal: (goal: string) => void;
  onOpenCollections: () => void;
  onCallInsight: () => void;
  onOpenProfile: () => void;
}

const ANTHROPIC_MODELS = [
  { id: 'claude-opus-4-5-20251101', name: 'Opus 4.5', badge: 'Best', color: 'text-purple-500' },
  { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', badge: 'Fast', color: 'text-blue-500' },
  { id: 'claude-3-5-haiku-20241022', name: 'Haiku 3.5', badge: 'Cheap', color: 'text-green-500' },
];

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', badge: 'Best', color: 'text-purple-500' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Fast', color: 'text-blue-500' },
];

export function CommandBar({
  settings,
  goal,
  tokenEstimate,
  clipCount,
  insightCount,
  goalAlignment,
  onUpdateSettings,
  onUpdateGoal,
  onOpenCollections,
  onCallInsight,
  onOpenProfile,
}: Props) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(goal);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const goalInputRef = useRef<HTMLInputElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const models = settings.provider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS;
  const currentModel = models.find(m => m.id === settings.model) || models[0];

  // Focus input when editing
  useEffect(() => {
    if (isEditingGoal && goalInputRef.current) {
      goalInputRef.current.focus();
      goalInputRef.current.select();
    }
  }, [isEditingGoal]);

  // Close model picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleGoalSubmit = () => {
    if (goalDraft.trim()) {
      onUpdateGoal(goalDraft.trim());
    }
    setIsEditingGoal(false);
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return tokens.toString();
  };

  // Estimate cost (rough)
  const estimateCost = () => {
    const rates: Record<string, number> = {
      'claude-opus-4-5-20251101': 0.015,
      'claude-sonnet-4-20250514': 0.003,
      'claude-3-5-haiku-20241022': 0.00025,
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.00015,
    };
    const rate = rates[settings.model] || 0.003;
    return ((tokenEstimate / 1000) * rate).toFixed(3);
  };

  const getAlignmentColor = () => {
    if (goalAlignment > 0.7) return 'bg-green-500';
    if (goalAlignment > 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Model Picker - Always Visible */}
      <div className="relative" ref={modelPickerRef}>
        <button
          onClick={() => setShowModelPicker(!showModelPicker)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
        >
          <span className={`text-sm font-medium ${currentModel.color}`}>
            {currentModel.name}
          </span>
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-gray-500 dark:text-gray-400">
            {currentModel.badge}
          </span>
          <span className="text-gray-400">▾</span>
        </button>

        {showModelPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => {
                  onUpdateSettings({ model: model.id });
                  setShowModelPicker(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  model.id === settings.model ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <span className={`font-medium ${model.color}`}>{model.name}</span>
                <span className="text-xs text-gray-400">{model.badge}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Token Counter - Live */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
        <span className="text-xs text-gray-400">⚡</span>
        <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
          {formatTokens(tokenEstimate)}
        </span>
        <span className="text-xs text-gray-400">≈${estimateCost()}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Goal - Inline Editable */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {goal && (
          <div
            className={`w-2 h-2 rounded-full ${getAlignmentColor()} flex-shrink-0`}
            title={`Goal alignment: ${Math.round(goalAlignment * 100)}%`}
          />
        )}

        {isEditingGoal ? (
          <input
            ref={goalInputRef}
            type="text"
            value={goalDraft}
            onChange={e => setGoalDraft(e.target.value)}
            onBlur={handleGoalSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleGoalSubmit();
              if (e.key === 'Escape') {
                setGoalDraft(goal);
                setIsEditingGoal(false);
              }
            }}
            placeholder="What's your goal?"
            className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={() => {
              setGoalDraft(goal);
              setIsEditingGoal(true);
            }}
            className="flex-1 text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded truncate transition-colors group"
          >
            {goal || (
              <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                + Set a goal...
              </span>
            )}
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        {/* Collections */}
        <button
          onClick={onOpenCollections}
          className="relative flex items-center gap-1 px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Collections"
        >
          <span>📚</span>
          {clipCount > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 rounded-full">
              {clipCount}
            </span>
          )}
        </button>

        {/* Insights */}
        <button
          onClick={onCallInsight}
          className="relative flex items-center gap-1 px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Call Insight"
        >
          <span>💡</span>
          {insightCount > 0 && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 px-1.5 rounded-full">
              {insightCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={onOpenProfile}
          className="px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Behavioral Profile"
        >
          <span>🧠</span>
        </button>
      </div>
    </div>
  );
}
