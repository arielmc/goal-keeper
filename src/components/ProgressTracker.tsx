import { useState } from 'react';
import type { SubGoal } from '../types';
import { generateId } from '../utils/storage';

interface Props {
  subGoals: SubGoal[];
  onToggle: (id: string) => void;
  onAdd: (subGoal: SubGoal) => void;
  onRemove: (id: string) => void;
}

export function ProgressTracker({ subGoals, onToggle, onAdd, onRemove }: Props) {
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = subGoals.filter(sg => sg.completed).length;
  const progress = subGoals.length > 0 ? (completedCount / subGoals.length) * 100 : 0;

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd({ id: generateId(), text: input.trim(), completed: false });
    setInput('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</h3>
        {subGoals.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {completedCount}/{subGoals.length} ({Math.round(progress)}%)
          </span>
        )}
      </div>

      {subGoals.length > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <ul className="space-y-1">
        {subGoals.map(sg => (
          <li
            key={sg.id}
            className="flex items-center gap-2 group"
          >
            <input
              type="checkbox"
              checked={sg.completed}
              onChange={() => onToggle(sg.id)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span
              className={`flex-1 text-sm ${
                sg.completed
                  ? 'text-gray-400 line-through'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {sg.text}
            </span>
            <button
              onClick={() => onRemove(sg.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="New sub-goal"
            autoFocus
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add sub-goal
        </button>
      )}
    </div>
  );
}
