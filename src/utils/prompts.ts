export function getSystemPrompt(goal: string): string {
  return `You are a helpful AI assistant. The user has stated their goal for this conversation:

"${goal}"

Help them achieve this goal. Be concise and focused. If the conversation starts to drift away from this goal, gently guide it back or acknowledge the tangent while offering to return to the main topic.`;
}

export function getDriftAnalysisPrompt(goal: string, recentMessages: string): string {
  return `Analyze whether this conversation is still aligned with the user's original goal.

Original Goal: "${goal}"

Recent conversation:
${recentMessages}

Respond with ONLY a JSON object in this exact format:
{
  "aligned": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

If the conversation is exploring related topics or making reasonable tangents that could eventually serve the goal, consider it aligned. Only mark as not aligned if the conversation has completely diverged from the original intent.`;
}

export interface DriftAnalysis {
  aligned: boolean;
  confidence: number;
  reason: string;
}

export function parseDriftAnalysis(response: string): DriftAnalysis {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall through to default
  }
  return { aligned: true, confidence: 0.5, reason: 'Could not analyze' };
}
