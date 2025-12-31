import type { Settings, Message } from '../types';

// Convert MIME type to Anthropic media type
function getAnthropicMediaType(mimeType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf' {
  const mapping: Record<string, 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'> = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/gif': 'image/gif',
    'image/webp': 'image/webp',
    'application/pdf': 'application/pdf',
  };
  return mapping[mimeType] || 'image/png';
}

// Format message content for Anthropic API (handles attachments)
function formatAnthropicContent(message: Message): string | Array<{type: string; [key: string]: unknown}> {
  if (!message.attachments || message.attachments.length === 0) {
    return message.content;
  }

  const contentBlocks: Array<{type: string; [key: string]: unknown}> = [];

  // Add file attachments first
  for (const attachment of message.attachments) {
    if (attachment.type.startsWith('image/')) {
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: getAnthropicMediaType(attachment.type),
          data: attachment.data,
        },
      });
    } else if (attachment.type === 'application/pdf') {
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: attachment.data,
        },
      });
    } else if (attachment.type.startsWith('text/') || attachment.type === 'application/json') {
      // Text files - decode and include as text
      try {
        const decoded = atob(attachment.data);
        contentBlocks.push({
          type: 'text',
          text: `[File: ${attachment.name}]\n${decoded}`,
        });
      } catch {
        contentBlocks.push({
          type: 'text',
          text: `[File: ${attachment.name} - could not decode]`,
        });
      }
    }
  }

  // Add the text content
  if (message.content) {
    contentBlocks.push({
      type: 'text',
      text: message.content,
    });
  }

  return contentBlocks;
}

export async function sendMessage(
  messages: Message[],
  systemPrompt: string,
  settings: Settings
): Promise<string> {
  if (settings.provider === 'openai') {
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content, // OpenAI format is simpler for now
    }));
    return sendToOpenAI(formattedMessages, systemPrompt, settings);
  } else {
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: formatAnthropicContent(m),
    }));
    return sendToAnthropic(formattedMessages, systemPrompt, settings);
  }
}

async function sendToOpenAI(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  settings: Settings
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function sendToAnthropic(
  messages: { role: string; content: string | Array<{type: string; [key: string]: unknown}> }[],
  systemPrompt: string,
  settings: Settings
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.model || 'claude-opus-4-5-20251101',
      max_tokens: 8192,
      system: systemPrompt,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}
