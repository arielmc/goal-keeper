import { useState } from 'react';
import type { Message, Settings } from '../types';
import type { Insight, InsightType } from '../types/insights';
import { INSIGHT_CONFIG } from '../types/insights';
import { sendMessage } from '../utils/llm';
import { generateId } from '../utils/storage';

interface Props {
  messages: Message[];
  goal: string;
  settings: Settings;
  onInsightFound: (insight: Insight) => void;
}

const INSIGHT_PROMPT = `Analyze this conversation for the most significant insight or breakthrough.

Goal: "{goal}"

Recent conversation:
{messages}

Respond with ONLY valid JSON:
{
  "type": "convergence|breakthrough|connection|clarification|pivot",
  "title": "5-8 word title",
  "description": "1-2 sentence description",
  "confidence": 0.0-1.0,
  "suggestedAction": "One concrete next step"
}

Types:
- convergence: Ideas coming together
- breakthrough: Major realization
- connection: Link between concepts
- clarification: Something became clear
- pivot: Productive direction change`;

export function CallInsight({ messages, goal, settings, onInsightFound }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastInsight, setLastInsight] = useState<Insight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCallInsight = async () => {
    if (!settings.apiKey || messages.length < 2) {
      setError('Need API key and conversation to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Only send last 6 messages, truncated
      const recentMessages = messages
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.slice(0, 300)}`)
        .join('\n\n');

      const prompt = INSIGHT_PROMPT
        .replace('{goal}', goal.slice(0, 100))
        .replace('{messages}', recentMessages);

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        'Respond only with valid JSON.',
        settings
      );

      const parsed = parseResponse(response);

      if (parsed && parsed.confidence > 0.5) {
        const insight: Insight = {
          id: generateId(),
          type: parsed.type as InsightType,
          title: parsed.title,
          description: parsed.description,
          confidence: parsed.confidence,
          crystallization: parsed.confidence,
          relatedMessageIds: [],
          suggestedActions: parsed.suggestedAction ? [parsed.suggestedAction] : [],
          timestamp: new Date(),
        };

        setLastInsight(insight);
        onInsightFound(insight);
      } else {
        setError('No clear insight found in recent conversation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative">
      {/* Call Insight Button */}
      <button
        onClick={handleCallInsight}
        disabled={isAnalyzing || !settings.apiKey}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isAnalyzing
            ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
            : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:from-yellow-500 hover:to-orange-500 shadow-md hover:shadow-lg'
        } disabled:opacity-50`}
        title="Analyze conversation for insights (uses 1 API call)"
      >
        {isAnalyzing ? (
          <>
            <span className="animate-spin">🔮</span>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span>💡</span>
            <span>Call Insight</span>
          </>
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded-lg shadow-lg max-w-xs z-50">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Quick insight preview */}
      {lastInsight && !isAnalyzing && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-yellow-200 dark:border-yellow-800 max-w-sm z-50">
          <div className="flex items-start gap-2">
            <span className="text-xl">{INSIGHT_CONFIG[lastInsight.type].emoji}</span>
            <div>
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {lastInsight.title}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {lastInsight.description}
              </div>
              {lastInsight.suggestedActions?.[0] && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  → {lastInsight.suggestedActions[0]}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setLastInsight(null)}
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 text-sm"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function parseResponse(response: string): any {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through
  }
  return null;
}
