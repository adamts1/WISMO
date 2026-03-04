/**
 * Extract a clean email address from a "Name <email@example.com>" or plain email string.
 */
export function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/) ?? raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return (match ? match[1] ?? match[0] : raw).trim().toLowerCase();
}

/**
 * Strip email thread history from content (quoted replies, "On ... wrote:", etc.)
 */
export function stripThreadHistory(content: string): string {
  const threadMarkers = [
    /\n\s*On .* wrote:/i,
    /\n\s*---Original Message---/i,
    /\n\s*> /,
  ];

  let result = content;
  for (const marker of threadMarkers) {
    const match = result.match(marker);
    if (match && match.index !== undefined) {
      result = result.substring(0, match.index);
    }
  }
  return result.trim();
}

/**
 * Extract a 4-digit order number (with or without # prefix) from text.
 * Returns e.g. "#1234" or null.
 */
export function extractOrderNumber(text: string): string | null {
  const match = text.match(/#?\b(\d{4})\b/);
  if (!match) return null;
  return match[0].startsWith('#') ? match[0] : `#${match[0]}`;
}

/**
 * Decode base64url-encoded Gmail message body data.
 */
export function decodeGmailBody(data: string): string {
  if (!data) return '';
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    return atob(base64);
  }
}

/**
 * Recursively extract plain-text body from Gmail message parts.
 */
export function extractPlainTextBody(part: {
  mimeType?: string;
  body?: { data?: string };
  parts?: unknown[];
}): string {
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeGmailBody(part.body.data);
  }
  if (Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      const text = extractPlainTextBody(subPart as Parameters<typeof extractPlainTextBody>[0]);
      if (text) return text;
    }
  }
  return '';
}
