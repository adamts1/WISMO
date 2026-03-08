import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { env } from '../config/env.js';
import {
  WismoClassificationSchema,
  OpenSessionDecisionSchema,
  type WismoClassification,
  type OpenSessionDecision,
  type OpenSessionInput,
} from '@oytiot/shared';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ─── WISMO Classification ──────────────────────────────────────────────────

const WISMO_SYSTEM_PROMPT = `You are a helpful assistant that analyzes customer emails for an e-commerce store.
Your goal is to extract key data points to identify their order while handling potential conflicts between order numbers and zip codes.

Analyze the email and return a JSON object with:
1. "is_wismo": (boolean) true if the user is asking about order status, tracking, or delivery.
2. "order_name": (string or null) Look for a 4-digit number.
   - Prioritize this if it follows '#', 'order', 'ID', or 'number'.
   - If a 4-digit number stands alone without context, assign it here first.
   - NEVER treat years (2020–2039) as order numbers. Ignore numbers that appear in dates or timestamps (e.g. "Le 8 mars 2026", "March 2026", "2025-01-15").
3. "zip_code": (string or null) Look for a 4-10 digit/character sequence.
   - Assign here ONLY if it's explicitly called 'zip', 'postal code', or is mentioned next to a city/state/address.
4. "has_ambiguity": (boolean) true if there is a 4-digit number that could be either an order_name or a zip_code and the context isn't 100% clear.
5. "auto_reply": (string or null)
   - If "is_wismo" is false, generate a polite, kind, and helpful response to the customer's inquiry IN THE SAME LANGUAGE as the customer wrote.
   - Do NOT include a sign-off or signature — it will be appended automatically.
   - If "is_wismo" is true, return null for this field.
6. "language": (string) The ISO 639-1 language code of the email (e.g. "en", "he", "es", "fr"). Detect the primary language the customer wrote in.

If information is missing, return null for those fields.`;

export async function classifyWismo(
  subject: string,
  emailContent: string,
): Promise<WismoClassification> {
  const text = subject ? `Subject: ${subject}\n\n${emailContent}` : emailContent;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: zodResponseFormat(WismoClassificationSchema, 'wismo_classification'),
    messages: [
      { role: 'system', content: WISMO_SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  return WismoClassificationSchema.parse(JSON.parse(raw));
}

// ─── Open Session Agent ────────────────────────────────────────────────────

const OPEN_SESSION_SYSTEM_PROMPT = `You will receive:
- cleanContent (customer email text)
- hasOrderName (boolean)
- order_number (string, may be empty)
- attempts (number)
- status (string)
- language (ISO 639-1 code, e.g. "en", "he")

Your tasks:
1) Use the provided "language" field to determine the response language.
2) Decide needHumanSupport using this rule:

   needHumanSupport = true ONLY IF:
   - hasOrderName is false
   AND
   - cleanContent contains a real question, request, complaint, or requires action.

   needHumanSupport = false IF:
   - The message is only polite text such as "thanks", "thank you", "תודה", "ok", "great", "perfect"
   - Or general appreciation without asking anything.
   - Or hasOrderName is true.

3) Generate emailResponse in the SAME language as the customer.

Important:
- Do NOT try to extract order number from the text. Use hasOrderName only.
- Keep the response short, polite, and professional.
- Do not include "Best regards, Oytiot Team" — it will be appended automatically.

Response rules:
If needHumanSupport = true:
- Politely ask the customer to provide their order number.
- Also say a team member will assist them shortly.

If needHumanSupport = false:
- Reply politely.
- If it's a thank-you message → respond briefly and warmly.
- If order number exists → acknowledge and say you're checking the order.`;

export async function analyzeOpenSession(
  input: OpenSessionInput,
): Promise<OpenSessionDecision> {
  const hasOrderName = input.order_number !== 'no-order-name' && input.order_number !== '';

  const prompt = JSON.stringify({
    cleanContent: input.cleanContent,
    hasOrderName,
    order_number: input.order_number,
    attempts: input.attempts,
    status: input.status,
    language: input.language,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    response_format: zodResponseFormat(OpenSessionDecisionSchema, 'open_session_decision'),
    messages: [
      { role: 'system', content: OPEN_SESSION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  return OpenSessionDecisionSchema.parse(JSON.parse(raw));
}

// ─── Email Translation ─────────────────────────────────────────────────────

const TRANSLATE_SYSTEM_PROMPT = `You are a professional translator for an e-commerce customer support team.
Translate the given email text to the target language.
Rules:
- Keep product names, order numbers, tracking URLs, carrier names, and any technical identifiers EXACTLY as they are — do NOT translate them.
- Keep the same formatting (line breaks, bullet points, dashes, separators).
- Keep the sign-off "Oytiot Team" as-is.
- The tone should remain polite and professional.
- Return ONLY the translated text, nothing else.`;

export async function translateEmail(text: string, targetLanguage: string): Promise<string> {
  if (targetLanguage === 'en') return text;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: TRANSLATE_SYSTEM_PROMPT },
      { role: 'user', content: `Translate to ${targetLanguage}:\n\n${text}` },
    ],
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content ?? text;
}
