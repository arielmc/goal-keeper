import { useCallback, useRef, useState, useEffect } from 'react';
import type { Message, Settings, Session } from '../types';
import type { Insight, InsightContext, InsightType } from '../types/insights';
import { sendMessage } from '../utils/llm';
import { generateId } from '../utils/storage';

const INSIGHTS_HISTORY_KEY = 'goalkeeper_insights_history';

const INSIGHT_DETECTION_PROMPT = `Analyze this conversation for emerging insights and breakthrough moments.

Goal: "{goal}"

Recent conversation:
{messages}

Look for:
1. CONVERGENCE: Multiple separate ideas coming together into a unified concept
2. BREAKTHROUGH: Major realization, solution, or "aha moment"
3. CONNECTION: A link being drawn between previously unrelated concepts
4. CLARIFICATION: A murky or confused concept becoming clear
5. PIVOT: A productive change in direction that opens new possibilities

Respond with ONLY valid JSON:
{
  "hasInsight": true/false,
  "type": "convergence" | "breakthrough" | "connection" | "clarification" | "pivot",
  "title": "Brief title (5-10 words)",
  "description": "What's crystallizing (1-2 sentences)",
  "confidence": 0.0-1.0,
  "crystallization": 0.0-1.0,
  "suggestedActions": ["optional action 1", "optional action 2"],
  "relatedQuotes": ["key phrase from conversation that shows this insight"]
}

Only report insights with confidence > 0.6. If no clear insight is forming, return {"hasInsight": false}.`;

function loadInsightsHistory(): Insight[] {
  try {
    const data = localStorage.getItem(INSIGHTS_HISTORY_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.map((i: Insight) => ({
        ...i,
        timestamp: new Date(i.timestamp),
      }));
    }
  } catch {
    // Fall through
  }
  return [];
}

function saveInsightsHistory(insights: Insight[]): void {
  localStorage.setItem(INSIGHTS_HISTORY_KEY, JSON.stringify(insights));
}

export function useInsightDetection(
  goal: string,
  settings: Settings,
  currentSession: Session | null,
  allSessions: Session[]
) {
  const [currentInsight, setCurrentInsight] = useState<Insight | null>(null);
  const [insightContext, setInsightContext] = useState<InsightContext | null>(null);
  const [insightsHistory, setInsightsHistory] = useState<Insight[]>(() => loadInsightsHistory());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastAnalyzedCountRef = useRef(0);

  // Save history when it changes
  useEffect(() => {
    saveInsightsHistory(insightsHistory);
  }, [insightsHistory]);

  const analyzeForInsights = useCallback(async (messages: Message[]) => {
    if (!settings.apiKey || !goal || messages.length < 3) return;

    // Only analyze every 2 messages
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    if (userMessageCount <= lastAnalyzedCountRef.current) return;
    if (userMessageCount - lastAnalyzedCountRef.current < 2) return;

    lastAnalyzedCountRef.current = userMessageCount;
    setIsAnalyzing(true);

    try {
      const recentMessages = messages
        .slice(-8)
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      const prompt = INSIGHT_DETECTION_PROMPT
        .replace('{goal}', goal)
        .replace('{messages}', recentMessages);

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        'You are an insight detection system. Respond only with valid JSON.',
        settings
      );

      const parsed = parseInsightResponse(response);

      if (parsed && parsed.hasInsight && parsed.confidence > 0.6) {
        const insight: Insight = {
          id: generateId(),
          type: parsed.type as InsightType,
          title: parsed.title,
          description: parsed.description,
          confidence: parsed.confidence,
          crystallization: parsed.crystallization,
          relatedMessageIds: findRelatedMessageIds(messages, parsed.relatedQuotes || []),
          suggestedActions: parsed.suggestedActions,
          timestamp: new Date(),
        };

        setCurrentInsight(insight);

        // Add to history
        setInsightsHistory(prev => [insight, ...prev].slice(0, 50)); // Keep last 50

        // Surface related context
        const context = await surfaceRelatedContext(
          insight,
          currentSession,
          allSessions
        );
        setInsightContext(context);
      }
    } catch (err) {
      console.error('Insight detection failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [goal, settings, currentSession, allSessions]);

  const dismissInsight = useCallback(() => {
    setCurrentInsight(null);
    setInsightContext(null);
  }, []);

  const showInsight = useCallback(async (insight: Insight) => {
    setCurrentInsight(insight);
    const context = await surfaceRelatedContext(insight, currentSession, allSessions);
    setInsightContext(context);
  }, [currentSession, allSessions]);

  const resetAnalysis = useCallback(() => {
    lastAnalyzedCountRef.current = 0;
    setCurrentInsight(null);
    setInsightContext(null);
  }, []);

  return {
    currentInsight,
    insightContext,
    insightsHistory,
    isAnalyzing,
    analyzeForInsights,
    dismissInsight,
    showInsight,
    resetAnalysis,
  };
}

function parseInsightResponse(response: string): any {
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

function findRelatedMessageIds(messages: Message[], quotes: string[]): string[] {
  const ids: string[] = [];
  for (const quote of quotes) {
    const found = messages.find(m =>
      m.content.toLowerCase().includes(quote.toLowerCase().slice(0, 50))
    );
    if (found) ids.push(found.id);
  }
  return ids;
}

async function surfaceRelatedContext(
  insight: Insight,
  currentSession: Session | null,
  allSessions: Session[]
): Promise<InsightContext> {
  const context: InsightContext = {
    fromPinnedItems: [],
    fromPastSessions: [],
  };

  // Gather pinned items from current session
  if (currentSession?.pinnedItems.length) {
    context.fromPinnedItems = currentSession.pinnedItems
      .slice(0, 5)
      .map(pin => ({
        id: pin.id,
        excerpt: pin.excerpt,
        relevance: 0.5,
      }));
  }

  // Gather relevant excerpts from past sessions
  const otherSessions = allSessions.filter(s => s.id !== currentSession?.id);
  for (const session of otherSessions.slice(0, 3)) {
    if (session.messages.length > 0) {
      const lastMessage = session.messages[session.messages.length - 1];
      context.fromPastSessions.push({
        sessionId: session.id,
        sessionGoal: session.goal,
        excerpt: lastMessage.content.slice(0, 150),
        relevance: 0.5,
      });
    }
  }

  // Generate synthesis prompt
  context.synthesisPrompt = generateSynthesisPrompt(insight);

  return context;
}

function generateSynthesisPrompt(insight: Insight): string {
  const prompts: Record<InsightType, string> = {
    convergence: `How might you combine these converging ideas into a single actionable concept?`,
    breakthrough: `What immediate next step would help you build on this realization?`,
    connection: `What other areas of your work might benefit from this connection?`,
    clarification: `Now that this is clearer, what question should you explore next?`,
    pivot: `What assumptions from before should you revisit given this new direction?`,
  };
  return prompts[insight.type] || 'How would you like to build on this insight?';
}
