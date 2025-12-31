import { useEffect, useState } from 'react';

interface Props {
  message: string;
  currentGoal?: string;
  onDismiss: () => void;
  onRefocus: () => void;
}

export function DriftAlert({ message, currentGoal, onDismiss, onRefocus }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 15000); // Extended to 15s for better reading

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 max-w-lg w-full px-4 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-2xl overflow-hidden">
        {/* Visual "rabbit hole" indicator */}
        <div className="h-1 bg-gradient-to-r from-red-500 via-amber-300 to-green-500">
          <div className="h-full w-1/4 bg-red-600 animate-pulse" />
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 m-0.5 rounded-b-xl rounded-t-lg">
          {/* Header with icon and title */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🐇</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Rabbit Hole Risk
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {message}
              </p>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              ×
            </button>
          </div>

          {/* Goal reminder - progressive disclosure */}
          {currentGoal && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-3 w-full text-left"
            >
              <div className={`p-2 rounded-lg border transition-colors ${
                showDetails
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>🎯</span>
                  <span>Your goal:</span>
                  <span className="ml-auto">{showDetails ? '▲' : '▼'}</span>
                </div>
                {showDetails && (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {currentGoal}
                  </p>
                )}
              </div>
            </button>
          )}

          {/* Actions - F-pattern: primary action on left */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onRefocus}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium flex items-center justify-center gap-2 transition-all hover:shadow-lg"
            >
              <span>🔄</span>
              <span>Recalibrate</span>
            </button>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Continue exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
