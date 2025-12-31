import { useCallback, useRef } from 'react';
import type { Message, Settings } from '../types';
import { sendMessage } from '../utils/llm';
import type { DriftAnalysis } from '../utils/prompts';
import { getDriftAnalysisPrompt, parseDriftAnalysis } from '../utils/prompts';

export function useDriftDetection(
  goal: string,
  settings: Settings,
  onDriftDetected: (reason: string) => void
) {
  const messageCountRef = useRef(0);
  const isCheckingRef = useRef(false);

  const checkDrift = useCallback(async (messages: Message[]) => {
    if (!settings.apiKey || !goal || isCheckingRef.current) return;

    messageCountRef.current++;

    if (messageCountRef.current < settings.driftCheckFrequency) return;

    messageCountRef.current = 0;
    isCheckingRef.current = true;

    try {
      // Only use last 4 messages and truncate each to 200 chars to save tokens
      const recentMessages = messages
        .slice(-4)
        .map(m => `${m.role}: ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`)
        .join('\n');

      const prompt = getDriftAnalysisPrompt(goal.slice(0, 100), recentMessages);

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        'You are a conversation analyzer. Respond only with valid JSON.',
        settings
      );

      const analysis: DriftAnalysis = parseDriftAnalysis(response);

      if (!analysis.aligned && analysis.confidence > 0.7) {
        onDriftDetected(analysis.reason);
      }
    } catch (err) {
      console.error('Drift check failed:', err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [goal, settings, onDriftDetected]);

  const resetCounter = useCallback(() => {
    messageCountRef.current = 0;
  }, []);

  return { checkDrift, resetCounter };
}
