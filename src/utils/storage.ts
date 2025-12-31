import type { Session, Settings } from '../types';

const SESSIONS_KEY = 'goalkeeper_sessions';
const SETTINGS_KEY = 'goalkeeper_settings';

export function loadSessions(): Session[] {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    if (!data) return [];
    const sessions = JSON.parse(data);
    return sessions.map((s: Session) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      messages: s.messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

const DEFAULT_SETTINGS: Settings = {
  provider: 'openai',
  apiKey: '',
  model: '',
  driftCheckFrequency: 5,
  analysisInterval: 8,           // Analyze every 8 messages (less frequent)
  useUnifiedAnalysis: true,
  maxContextMessages: 6,         // Only send 6 messages (was 10)
  enableBackgroundAnalysis: false, // OFF by default to save tokens!
};

export function loadSettings(): Settings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      // Merge with defaults to handle new settings fields
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function exportSessionAsMarkdown(session: Session): string {
  const lines: string[] = [];

  lines.push(`# ${session.name || 'Untitled Session'}`);
  lines.push('');
  lines.push(`**Goal:** ${session.goal}`);
  lines.push(`**Created:** ${session.createdAt.toLocaleString()}`);
  lines.push('');

  if (session.subGoals.length > 0) {
    lines.push('## Sub-goals');
    session.subGoals.forEach(sg => {
      lines.push(`- [${sg.completed ? 'x' : ' '}] ${sg.text}`);
    });
    lines.push('');
  }

  if (session.pinnedItems.length > 0) {
    lines.push('## Pinned Items');
    session.pinnedItems.forEach(pin => {
      lines.push(`- **${pin.tag}**: ${pin.excerpt}`);
      if (pin.note) lines.push(`  - Note: ${pin.note}`);
    });
    lines.push('');
  }

  lines.push('## Conversation');
  lines.push('');
  session.messages.forEach(msg => {
    const prefix = msg.role === 'user' ? '**You:**' : '**Assistant:**';
    lines.push(`${prefix} ${msg.content}`);
    lines.push('');
  });

  return lines.join('\n');
}
