import { useState } from 'react';
import type { Settings } from '../types';

interface Props {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

export function QuickSetup({ settings, onSave }: Props) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [provider, setProvider] = useState<'anthropic' | 'openai'>(settings.provider);

  const handleSave = () => {
    if (!apiKey.trim()) return;
    onSave({
      ...settings,
      apiKey: apiKey.trim(),
      provider,
      model: provider === 'anthropic' ? 'claude-opus-4-5-20251101' : 'gpt-4o',
    });
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🔑</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Quick Setup
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add your API key to start chatting
        </p>
      </div>

      <div className="space-y-4">
        {/* Provider toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setProvider('anthropic')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              provider === 'anthropic'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Anthropic
          </button>
          <button
            onClick={() => setProvider('openai')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              provider === 'openai'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            OpenAI
          </button>
        </div>

        {/* API Key input */}
        <div>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Start Chatting
        </button>

        {/* Help text */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          {provider === 'anthropic' ? (
            <>Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">console.anthropic.com</a></>
          ) : (
            <>Get your key at <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">platform.openai.com</a></>
          )}
        </p>
      </div>
    </div>
  );
}

// Minimal inline key input for command bar
export function InlineKeyInput({
  onSave,
}: {
  onSave: (key: string, provider: 'anthropic' | 'openai') => void;
}) {
  const [key, setKey] = useState('');

  const handleSubmit = () => {
    if (!key.trim()) return;
    // Auto-detect provider from key prefix
    const provider = key.startsWith('sk-ant') ? 'anthropic' : 'openai';
    onSave(key.trim(), provider);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="password"
        value={key}
        onChange={e => setKey(e.target.value)}
        placeholder="Paste API key..."
        className="w-48 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <button
        onClick={handleSubmit}
        disabled={!key.trim()}
        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        Go
      </button>
    </div>
  );
}
