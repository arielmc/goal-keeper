import { useEffect, useState } from 'react';

interface Props {
  isActive: boolean;
  onToggle: () => void;
  momentum: number;  // 0-1, how engaged the conversation is
  depth: number;     // 0-1, how deep into a topic
}

export function FocusModeToggle({ isActive, onToggle, momentum }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
        isActive
          ? 'bg-purple-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
      title={isActive ? 'Exit Focus Mode' : 'Enter Focus Mode'}
    >
      <span>{isActive ? '🎯' : '👁️'}</span>
      <span className="text-sm font-medium">
        {isActive ? 'Focused' : 'Focus'}
      </span>
      {!isActive && momentum > 0.7 && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
          High momentum
        </span>
      )}
    </button>
  );
}

export function FocusModeOverlay({ depth }: { depth: number }) {
  const [breathePhase, setBreathePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathePhase(prev => (prev + 1) % 100);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const breatheScale = 1 + Math.sin(breathePhase * 0.0628) * 0.02;

  return (
    <>
      {/* Vignette effect */}
      <div
        className="fixed inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${0.3 + depth * 0.3}) 100%)`,
        }}
      />

      {/* Subtle breathing indicator */}
      <div
        className="fixed bottom-6 left-6 w-3 h-3 rounded-full bg-purple-500 z-40 transition-transform"
        style={{ transform: `scale(${breatheScale})` }}
      />

      {/* Depth indicator */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        <div className="w-1 h-32 bg-gray-800 rounded-r overflow-hidden">
          <div
            className="w-full bg-gradient-to-t from-purple-600 to-blue-400 transition-all duration-1000"
            style={{ height: `${depth * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 -rotate-90 origin-top-left translate-y-full">
          Depth
        </div>
      </div>
    </>
  );
}

export function MomentumNudge({ onAcknowledge }: { onAcknowledge: () => void }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
        <span className="text-yellow-400">💭</span>
        <span className="text-sm">
          The conversation paused on something important. Continue exploring?
        </span>
        <button
          onClick={onAcknowledge}
          className="px-3 py-1 bg-purple-600 text-sm rounded hover:bg-purple-700"
        >
          Continue
        </button>
        <button
          onClick={onAcknowledge}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
