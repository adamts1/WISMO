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
    /\n\s*Le .* a écrit\s?:/i,          // French: "Le 8 mars 2026 à 11:52, x@y a écrit :"
    /\n\s*El .* escribió:/i,            // Spanish
    /\n\s*Am .* schrieb .+:/i,          // German
    /\n\s*ב.* כתב\/ה:/i,               // Hebrew
    /\n\s*---Original Message---/i,
    /\n\s*-{2,}\s*Forwarded message/i,
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
  // Try explicit #1234 first
  const hashMatch = text.match(/#(\d{4})\b/);
  if (hashMatch) return hashMatch[0];

  // Try bare 4-digit numbers, but skip years (2020–2039) and timestamps
  const barePattern = /\b(\d{4})\b/g;
  let m;
  while ((m = barePattern.exec(text)) !== null) {
    const num = parseInt(m[1], 10);
    if (num >= 2020 && num <= 2039) continue; // skip years
    return `#${m[1]}`;
  }
  return null;
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
