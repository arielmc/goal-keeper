import type { Session } from '../types';

interface Props {
  sessions: Session[];
  currentSessionId: string | null;
  onSelect: (session: Session) => void;
  onDelete: (id: string) => void;
  onExport: (session: Session) => void;
}

export function SessionList({ sessions, currentSessionId, onSelect, onDelete, onExport }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No past sessions
      </div>
    );
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <ul className="space-y-2">
      {sortedSessions.map(session => {
        const isActive = session.id === currentSessionId;
        const progress = session.subGoals.length > 0
          ? Math.round((session.subGoals.filter(sg => sg.completed).length / session.subGoals.length) * 100)
          : null;

        return (
          <li
            key={session.id}
            className={`group p-2 rounded cursor-pointer transition-colors ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => onSelect(session)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.name || session.goal.slice(0, 50)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(session.updatedAt).toLocaleDateString()}
                  {progress !== null && ` • ${progress}%`}
                </p>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onExport(session);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500"
                  title="Export as Markdown"
                >
                  ↓
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm('Delete this session?')) {
                      onDelete(session.id);
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
