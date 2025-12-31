import { useState, useCallback, useRef } from 'react';
import type { Message, Settings } from '../types';
import { sendMessage } from '../utils/llm';

export interface ConversationLandmark {
  afterMessageIndex: number;
  summary: string;
  keyTopics: string[];
}

export interface MessageSummary {
  messageId: string;
  brief: string;
  evidence: string[];
}

export interface ConversationMomentum {
  level: number;  // 0-1
  trend: 'rising' | 'stable' | 'falling';
  depth: number;  // 0-1, how deep into the current topic
}

const LANDMARK_PROMPT = `Summarize the key development in this conversation segment.

Messages:
{messages}

Respond with ONLY valid JSON:
{
  "summary": "Brief 5-10 word summary of what was accomplished",
  "keyTopics": ["topic1", "topic2", "topic3"]
}`;

const SUMMARY_PROMPT = `Create a brief summary of this message and extract supporting evidence.

Message:
{message}

Context (previous messages):
{context}

Respond with ONLY valid JSON:
{
  "brief": "1-2 sentence summary",
  "evidence": ["Supporting point 1", "Supporting point 2"]
}`;

export function useConversationAnalysis(settings: Settings) {
  const [landmarks, setLandmarks] = useState<ConversationLandmark[]>([]);
  const [summaries, setSummaries] = useState<Map<string, MessageSummary>>(new Map());
  const [momentum, setMomentum] = useState<ConversationMomentum>({
    level: 0.5,
    trend: 'stable',
    depth: 0,
  });

  const lastLandmarkIndexRef = useRef(0);

  const generateLandmark = useCallback(async (
    messages: Message[],
    afterIndex: number
  ) => {
    if (!settings.apiKey) return;

    try {
      const segmentMessages = messages
        .slice(Math.max(0, afterIndex - 10), afterIndex)
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      const prompt = LANDMARK_PROMPT.replace('{messages}', segmentMessages);

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        'You are a conversation summarizer. Respond only with valid JSON.',
        settings
      );

      const parsed = parseJsonResponse(response);

      if (parsed?.summary) {
        const landmark: ConversationLandmark = {
          afterMessageIndex: afterIndex,
          summary: parsed.summary,
          keyTopics: parsed.keyTopics || [],
        };

        setLandmarks(prev => [...prev, landmark]);
        lastLandmarkIndexRef.current = afterIndex;
      }
    } catch (err) {
      console.error('Landmark generation failed:', err);
    }
  }, [settings]);

  const checkForLandmark = useCallback((messages: Message[]) => {
    // Generate landmark every 12 messages
    if (messages.length - lastLandmarkIndexRef.current >= 12) {
      generateLandmark(messages, messages.length);
    }
  }, [generateLandmark]);

  const generateSummary = useCallback(async (
    message: Message,
    context: Message[]
  ) => {
    if (!settings.apiKey || message.content.length < 200) return;

    try {
      const contextStr = context
        .slice(-3)
        .map(m => `${m.role}: ${m.content.slice(0, 100)}...`)
        .join('\n');

      const prompt = SUMMARY_PROMPT
        .replace('{message}', message.content)
        .replace('{context}', contextStr);

      const response = await sendMessage(
        [{ id: '1', role: 'user', content: prompt, timestamp: new Date() }],
        'You are a message summarizer. Respond only with valid JSON.',
        settings
      );

      const parsed = parseJsonResponse(response);

      if (parsed?.brief) {
        const summary: MessageSummary = {
          messageId: message.id,
          brief: parsed.brief,
          evidence: parsed.evidence || [],
        };

        setSummaries(prev => new Map(prev).set(message.id, summary));
      }
    } catch (err) {
      console.error('Summary generation failed:', err);
    }
  }, [settings]);

  const updateMomentum = useCallback((messages: Message[]) => {
    if (messages.length < 3) return;

    // Calculate momentum based on message patterns
    const recentMessages = messages.slice(-6);
    const avgLength = recentMessages.reduce((sum, m) => sum + m.content.length, 0) / recentMessages.length;
    const questionCount = recentMessages.filter(m =>
      m.content.includes('?')
    ).length;

    // Higher momentum when: longer messages, more questions, faster pace
    const timeDiffs = recentMessages.slice(1).map((m, i) => {
      const prev = recentMessages[i];
      return new Date(m.timestamp).getTime() - new Date(prev.timestamp).getTime();
    });
    const avgTimeDiff = timeDiffs.length > 0
      ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
      : 60000;

    const paceScore = Math.min(1, 60000 / avgTimeDiff);
    const lengthScore = Math.min(1, avgLength / 500);
    const questionScore = questionCount / 6;

    const newLevel = (paceScore * 0.3 + lengthScore * 0.4 + questionScore * 0.3);

    setMomentum(prev => ({
      level: prev.level * 0.7 + newLevel * 0.3, // Smooth transition
      trend: newLevel > prev.level + 0.1 ? 'rising'
        : newLevel < prev.level - 0.1 ? 'falling'
        : 'stable',
      depth: Math.min(1, messages.length / 20), // Depth increases with conversation length
    }));
  }, []);

  const getSummary = useCallback((messageId: string) => {
    return summaries.get(messageId);
  }, [summaries]);

  const resetAnalysis = useCallback(() => {
    setLandmarks([]);
    setSummaries(new Map());
    setMomentum({ level: 0.5, trend: 'stable', depth: 0 });
    lastLandmarkIndexRef.current = 0;
  }, []);

  return {
    landmarks,
    momentum,
    getSummary,
    checkForLandmark,
    generateSummary,
    updateMomentum,
    resetAnalysis,
  };
}

function parseJsonResponse(response: string): any {
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
