import { useCallback, useRef, useState } from 'react';
import type { Message, Settings } from '../types';
import type { Insight, InsightType } from '../types/insights';
import type { ActionItem } from '../components/ActionItems';
import { sendMessage } from '../utils/llm';
import { generateId } from '../utils/storage';

// Single unified prompt that combines drift, insights, and action items
const UNIFIED_ANALYSIS_PROMPT = `Analyze this conversation in ONE pass. Goal: "{goal}"

Recent messages (last {messageCount}):
{messages}

Respond with ONLY valid JSON:
{
  "drift": {
    "detected": true/false,
    "reason": "brief reason if drifting"
  },
  "insight": {
    "found": true/false,
    "type": "convergence|breakthrough|connection|clarification|pivot",
    "title": "5-10 word title",
    "description": "1 sentence",
    "confidence": 0.0-1.0
  },
  "actions": [
    {"text": "action item text", "priority": "high|medium|low"}
  ]
}

Rules:
- Only report drift if clearly off-topic from goal
- Only report insight if confidence > 0.7
- Only extract explicit action items (max 2)
- Keep ALL text brief`;

interface UnifiedAnalysisResult {
  drift: { detected: boolean; reason?: string };
  insight: Insight | null;
  actions: ActionItem[];
}

interface AnalysisState {
  isAnalyzing: boolean;
  lastAnalysis: UnifiedAnalysisResult | null;
  tokenEstimate: number;
}

export function useUnifiedAnalysis(settings: Settings) {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    lastAnalysis: null,
    tokenEstimate: 0,
  });

  const lastAnalyzedCountRef = useRef(0);
  const analysisIntervalRef = useRef(settings.analysisInterval || 5);

  // Estimate tokens (rough: 4 chars per token)
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  const analyze = useCallback(async (
    messages: Message[],
    goal: string
  ): Promise<UnifiedAnalysisResult | null> => {
    if (!settings.apiKey || !goal || messages.length < 2) return null;

    // Only analyze every N user messages
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    if (userMessageCount <= lastAnalyzedCountRef.current) return null;
    if (userMessageCount - lastAnalyzedCountRef.current < analysisIntervalRef.current) return null;

    lastAnalyzedCountRef.current = userMessageCount;
    setState(s => ({ ...s, isAnalyzing: true }));

    try {
      // Only send last 6 messages to reduce tokens
      const recentMessages = messages.slice(-6);
      const messagesText = recentMessages
        .map(m => `${m.role === 'user' ? 'U' : 'A'}: ${m.content.slice(0, 300)}`) // Truncate each message
        .join('\n');

      const prompt = UNIFIED_ANALYSIS_PROMPT
        .replace('{goal}', goal.slice(0, 100)) // Truncate goal too
        .replace('{messageCount}', String(recentMessages.length))
        .replace('{messages}', messagesText);

      const tokenEstimate = estimateTokens(prompt) + 200; // +200 for response
      setState(s => ({ ...s, tokenEstimate: s.tokenEstimate + tokenEstimate }));

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        'Respond only with valid JSON. Be concise.',
        settings
      );

      const parsed = parseResponse(response);
      if (!parsed) return null;

      const result: UnifiedAnalysisResult = {
        drift: parsed.drift || { detected: false },
        insight: parsed.insight?.found && parsed.insight.confidence > 0.7
          ? {
              id: generateId(),
              type: parsed.insight.type as InsightType,
              title: parsed.insight.title || 'Insight',
              description: parsed.insight.description || '',
              confidence: parsed.insight.confidence,
              crystallization: parsed.insight.confidence,
              relatedMessageIds: [],
              timestamp: new Date(),
            }
          : null,
        actions: (parsed.actions || []).map((a: any) => ({
          id: generateId(),
          text: a.text,
          priority: a.priority || 'medium',
          completed: false,
          messageId: messages[messages.length - 1]?.id,
        })),
      };

      setState(s => ({ ...s, isAnalyzing: false, lastAnalysis: result }));
      return result;
    } catch (err) {
      console.error('Unified analysis failed:', err);
      setState(s => ({ ...s, isAnalyzing: false }));
      return null;
    }
  }, [settings]);

  const resetAnalysis = useCallback(() => {
    lastAnalyzedCountRef.current = 0;
    setState({ isAnalyzing: false, lastAnalysis: null, tokenEstimate: 0 });
  }, []);

  const setAnalysisInterval = useCallback((interval: number) => {
    analysisIntervalRef.current = interval;
  }, []);

  return {
    ...state,
    analyze,
    resetAnalysis,
    setAnalysisInterval,
  };
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
