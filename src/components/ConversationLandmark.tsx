interface Props {
  messageIndex: number;
  summary: string;
  keyTopics: string[];
}

export function ConversationLandmark({ summary, keyTopics }: Props) {
  return (
    <div className="relative py-4 my-2">
      {/* Horizontal line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

      {/* Landmark badge */}
      <div className="relative flex justify-center">
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">📍</span>
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {summary}
            </span>
          </div>
          {keyTopics.length > 0 && (
            <div className="flex justify-center gap-1 mt-1">
              {keyTopics.slice(0, 3).map((topic, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
