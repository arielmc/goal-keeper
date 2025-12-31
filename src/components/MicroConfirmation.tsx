import { useState } from 'react';
import type { PendingObservation } from '../types/behavioral';
import { OBSERVATION_TEMPLATES } from '../types/behavioral';

interface Props {
  observation: PendingObservation;
  onRespond: (response: 'confirm' | 'deny' | 'dismiss', actionIndex?: number) => void;
}

export function MicroConfirmation({ observation, onRespond }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get action options for this observation type
  const getActions = () => {
    const templateKey = Object.keys(OBSERVATION_TEMPLATES).find(key => {
      const template = OBSERVATION_TEMPLATES[key as keyof typeof OBSERVATION_TEMPLATES];
      return observation.question === template.question;
    });

    if (templateKey) {
      return OBSERVATION_TEMPLATES[templateKey as keyof typeof OBSERVATION_TEMPLATES].actions;
    }
    return ['Yes', 'No', 'Not now'];
  };

  const actions = getActions();

  const handleAction = (index: number) => {
    // First option typically confirms, last typically dismisses
    if (index === 0) {
      onRespond('confirm', index);
    } else if (index === actions.length - 1) {
      onRespond('dismiss', index);
    } else {
      onRespond('deny', index);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-40 animate-in slide-in-from-right-4 duration-300 max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Collapsed state - just a hint */}
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🔍</span>
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                I noticed something about how you work...
              </p>
            </div>
            <span className="text-gray-400 text-xs">tap</span>
          </button>
        ) : (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-sm">🔍</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Learning about you
                </span>
              </div>
              <button
                onClick={() => onRespond('dismiss')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
              >
                ×
              </button>
            </div>

            {/* Observation */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {observation.message}
            </p>

            {/* Question */}
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
              {observation.question}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(index)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    index === 0
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Subtle footer */}
            <p className="text-xs text-gray-400 mt-3">
              This helps me personalize insights for you
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Mini version for sidebar
export function BehavioralInsightsSummary({
  traits,
  onViewDetails,
}: {
  traits: Array<{ name: string; value: number; confidence: number }>;
  onViewDetails: () => void;
}) {
  const confirmedTraits = traits.filter(t => t.confidence > 0.5);

  if (confirmedTraits.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span>🔍</span>
          <span className="font-medium">Learning your style</span>
        </div>
        <p className="text-xs">
          As you chat, I'll learn how to help you best.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>🔍</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Your Style
          </span>
        </div>
        <button
          onClick={onViewDetails}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Details
        </button>
      </div>

      <div className="space-y-1.5">
        {confirmedTraits.slice(0, 3).map(trait => (
          <div key={trait.name} className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${trait.value * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-24 truncate">
              {trait.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
