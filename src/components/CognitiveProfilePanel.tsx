import { useState } from 'react';
import type { CognitiveProfile } from '../types/cognition';
import { THINKING_STYLE_LABELS } from '../types/cognition';

interface Props {
  profile: CognitiveProfile;
  isAnalyzing: boolean;
  onUpdateStyle: (style: keyof CognitiveProfile['thinkingStyles'], value: number) => void;
  onClose: () => void;
}

export function CognitiveProfilePanel({ profile, isAnalyzing, onUpdateStyle, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'styles' | 'patterns' | 'models'>('styles');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🧠</span> Your Cognitive Profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              How you think, adapted in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAnalyzing && (
              <span className="text-sm text-blue-500 animate-pulse">Analyzing...</span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'styles', label: 'Thinking Styles', emoji: '🎯' },
            { id: 'patterns', label: 'Patterns', emoji: '📊' },
            { id: 'models', label: 'Mental Models', emoji: '🗺️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'styles' && (
            <ThinkingStylesTab profile={profile} onUpdateStyle={onUpdateStyle} />
          )}
          {activeTab === 'patterns' && (
            <PatternsTab profile={profile} />
          )}
          {activeTab === 'models' && (
            <MentalModelsTab profile={profile} />
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingStylesTab({
  profile,
  onUpdateStyle,
}: {
  profile: CognitiveProfile;
  onUpdateStyle: (style: keyof CognitiveProfile['thinkingStyles'], value: number) => void;
}) {
  // Group into pairs for visual balance
  const pairs = [
    ['visual', 'verbal'],
    ['sequential', 'associative'],
    ['analytical', 'intuitive'],
    ['abstract', 'concrete'],
  ] as const;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Adjust the sliders to reflect how you prefer to think. The AI will adapt its responses accordingly.
      </p>

      {pairs.map(([left, right]) => (
        <div key={`${left}-${right}`} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <span>{THINKING_STYLE_LABELS[left].emoji}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {THINKING_STYLE_LABELS[left].label}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {THINKING_STYLE_LABELS[right].label}
              </span>
              <span>{THINKING_STYLE_LABELS[right].emoji}</span>
            </span>
          </div>

          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={profile.thinkingStyles[left] * 100}
              onChange={e => {
                const val = parseInt(e.target.value) / 100;
                onUpdateStyle(left, val);
                onUpdateStyle(right, 1 - val);
              }}
              className="w-full h-2 bg-gradient-to-r from-blue-400 via-gray-300 to-purple-400 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{THINKING_STYLE_LABELS[left].description}</span>
            <span className="text-right">{THINKING_STYLE_LABELS[right].description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PatternsTab({ profile }: { profile: CognitiveProfile }) {
  const patterns = [
    { key: 'questionFrequency', label: 'Question vs. Statement', low: 'States', high: 'Asks' },
    { key: 'explorationDepth', label: 'Exploration Depth', low: 'Breadth', high: 'Depth' },
    { key: 'tangentTolerance', label: 'Tangent Tolerance', low: 'Focused', high: 'Exploratory' },
    { key: 'decisionSpeed', label: 'Decision Speed', low: 'Deliberate', high: 'Quick' },
    { key: 'evidenceNeed', label: 'Evidence Need', low: 'Trusting', high: 'Skeptical' },
  ] as const;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Observed patterns from your conversations (automatically detected):
      </p>

      {patterns.map(({ key, label, low, high }) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">{label}</span>
            <span className="text-gray-500">
              {Math.round(profile.patterns[key] * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">{low}</span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                style={{ width: `${profile.patterns[key] * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-16 text-right">{high}</span>
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preference Summary
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
            Pace: {profile.preferences.pacePreference}
          </span>
          <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
            {profile.preferences.briefVsDetailed > 0.5 ? 'Prefers Detail' : 'Prefers Brevity'}
          </span>
          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
            {profile.preferences.structuredVsFreeform > 0.5 ? 'Freeform' : 'Structured'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MentalModelsTab({ profile }: { profile: CognitiveProfile }) {
  if (profile.mentalModels.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-gray-500 dark:text-gray-400">
          Mental models will emerge as you have more conversations.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          These represent the conceptual frameworks you're building.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {profile.mentalModels.map(model => (
        <div
          key={model.id}
          className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{model.name}</h4>
            <span className="text-xs text-gray-500">
              {Math.round(model.confidence * 100)}% formed
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {model.description}
          </p>

          {/* Mini concept map */}
          {model.concepts.length > 0 && (
            <div className="relative h-32 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
              <svg className="w-full h-full">
                {/* Connections */}
                {model.connections.map(conn => {
                  const from = model.concepts.find(c => c.id === conn.fromId);
                  const to = model.concepts.find(c => c.id === conn.toId);
                  if (!from || !to) return null;

                  const scaleX = (x: number) => (x / 500) * 100;
                  const scaleY = (y: number) => (y / 400) * 100;

                  return (
                    <line
                      key={conn.id}
                      x1={`${scaleX(from.x)}%`}
                      y1={`${scaleY(from.y)}%`}
                      x2={`${scaleX(to.x)}%`}
                      y2={`${scaleY(to.y)}%`}
                      stroke="rgb(147, 197, 253)"
                      strokeWidth={conn.strength * 2}
                      strokeOpacity={0.5}
                    />
                  );
                })}
              </svg>

              {/* Concept nodes */}
              {model.concepts.map(concept => {
                const x = (concept.x / 500) * 100;
                const y = (concept.y / 400) * 100;

                return (
                  <div
                    key={concept.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded shadow"
                      style={{ opacity: 0.5 + concept.importance * 0.5 }}
                    >
                      {concept.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
