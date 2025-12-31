import { useState } from 'react';
import type { SubGoal } from '../types';
import { generateId } from '../utils/storage';

interface Props {
  onSubmit: (goal: string, subGoals: SubGoal[]) => void;
  onClose: () => void;
}

export function GoalModal({ onSubmit, onClose }: Props) {
  const [goal, setGoal] = useState('');
  const [subGoalInput, setSubGoalInput] = useState('');
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);

  const addSubGoal = () => {
    if (!subGoalInput.trim()) return;
    setSubGoals([
      ...subGoals,
      { id: generateId(), text: subGoalInput.trim(), completed: false },
    ]);
    setSubGoalInput('');
  };

  const removeSubGoal = (id: string) => {
    setSubGoals(subGoals.filter(sg => sg.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    onSubmit(goal.trim(), subGoals);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          What do you want to accomplish?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Define your goal to stay focused throughout the conversation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Primary Goal
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g., Design a REST API for a todo app"
              rows={3}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sub-goals (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={subGoalInput}
                onChange={e => setSubGoalInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubGoal())}
                placeholder="Add a milestone"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addSubGoal}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Add
              </button>
            </div>

            {subGoals.length > 0 && (
              <ul className="mt-2 space-y-1">
                {subGoals.map(sg => (
                  <li
                    key={sg.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{sg.text}</span>
                    <button
                      type="button"
                      onClick={() => removeSubGoal(sg.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
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
              disabled={!goal.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
