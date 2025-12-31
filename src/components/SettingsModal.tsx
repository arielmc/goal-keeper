import { useState } from 'react';
import type { Settings } from '../types';

interface Props {
  settings: Settings;
  tokenEstimate?: number;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, tokenEstimate = 0, onSave, onClose }: Props) {
  const [formData, setFormData] = useState<Settings>(settings);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Estimate cost (rough approximation)
  const estimateCost = () => {
    const costPer1kTokens = formData.provider === 'openai' ? 0.01 : 0.003;
    return ((tokenEstimate / 1000) * costPer1kTokens).toFixed(4);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Settings</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token Usage Indicator */}
            {tokenEstimate > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-300">Session tokens used:</span>
                  <span className="font-mono font-medium text-blue-800 dark:text-blue-200">
                    ~{tokenEstimate.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Est. cost: ${estimateCost()}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LLM Provider
              </label>
              <select
                value={formData.provider}
                onChange={e => setFormData({ ...formData, provider: e.target.value as 'openai' | 'anthropic' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <select
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {formData.provider === 'anthropic' ? (
                  <>
                    <option value="claude-opus-4-5-20251101">Claude Opus 4.5 (most capable)</option>
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (balanced)</option>
                    <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (fast & cheap)</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4o">GPT-4o (most capable)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (balanced)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.provider === 'anthropic'
                  ? 'Opus 4.5 recommended for complex tasks with file analysis'
                  : 'GPT-4o Mini recommended for cost efficiency'}
              </p>
            </div>

            {/* Advanced Token Optimization */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <span>{showAdvanced ? '▼' : '▶'}</span>
                Token Optimization
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  {/* Enable Background Analysis */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableBackgroundAnalysis}
                      onChange={e => setFormData({ ...formData, enableBackgroundAnalysis: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">Enable smart analysis</div>
                      <div className="text-xs text-gray-500">Drift detection, insights, action items</div>
                    </div>
                  </label>

                  {/* Unified Analysis */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useUnifiedAnalysis}
                      onChange={e => setFormData({ ...formData, useUnifiedAnalysis: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">Unified analysis (recommended)</div>
                      <div className="text-xs text-gray-500">Single API call vs multiple</div>
                    </div>
                  </label>

                  {/* Analysis Interval */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Analyze every N messages
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="3"
                        max="15"
                        value={formData.analysisInterval}
                        onChange={e => setFormData({ ...formData, analysisInterval: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-8 text-gray-600 dark:text-gray-400">
                        {formData.analysisInterval}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Higher = fewer API calls, lower cost
                    </p>
                  </div>

                  {/* Max Context */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Context window (messages)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="4"
                        max="20"
                        value={formData.maxContextMessages}
                        onChange={e => setFormData({ ...formData, maxContextMessages: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-8 text-gray-600 dark:text-gray-400">
                        {formData.maxContextMessages}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Messages sent to LLM per request
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
