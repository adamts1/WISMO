/**
 * Handles new emails with NO open session.
 * Routes based on WISMO AI classification.
 */
import { env } from '../config/env.js';
import { classifyWismo, translateEmail } from '../services/openai.service.js';
import {
  getOrdersByName,
  getOrdersByEmail,
  getOrdersByZip,
  withShopifyRetry,
} from '../services/shopify.service.js';
import { createSession } from '../services/session.service.js';
import { replyToMessage } from '../services/gmail.service.js';
import {
  composeOrderDetailsEmail,
  composeAskForOrderNumberEmail,
  composeHumanAlertEmail,
  composeNoEmailZipMatchEmail,
  appendSignature,
} from '../services/email-composer.service.js';
import { logEmail } from '../services/email-log.service.js';
import type { ParsedEmail, ShopifyOrder } from '@oytiot/shared';

export async function handleNewEmail(email: ParsedEmail): Promise<void> {
  const { threadId, senderEmail, sender, subject, cleanContent, isReply } = email;

  // Don't send subject to AI if it's a reply (avoids subject confusion)
  const subjectForAI = isReply ? '' : subject;

  let classification;
  try {
    classification = await classifyWismo(subjectForAI, cleanContent);
  } catch (err) {
    await logEmail({
      thread_id: threadId,
      sender_email: senderEmail,
      subject,
      error: `OpenAI classifyWismo failed: ${String(err)}`,
    });
    // Fallback: alert human
    await sendHumanAlert(email, 'AI classification failed');
    return;
  }

  await logEmail({
    thread_id: threadId,
    sender_email: senderEmail,
    subject,
    ai_classification: classification as unknown as Record<string, unknown>,
  });

  const lang = classification.language ?? 'en';

  // Non-WISMO email → use AI auto-reply (already in customer's language via prompt)
  if (!classification.is_wismo) {
    if (classification.auto_reply) {
      await replyToMessage({ threadId, to: senderEmail, body: appendSignature(classification.auto_reply) });
      await logEmail({ thread_id: threadId, route_taken: 'auto_reply_non_wismo' });
    }
    return;
  }

  const hasOrder = Boolean(classification.order_name);
  const hasZip = Boolean(classification.zip_code);

  // ── Has order name → search by name ──────────────────────────────────────
  if (hasOrder) {
    await handleOrderByName(email, classification.order_name!, lang);
    return;
  }

  // ── Has zip code → search by zip + verify email match ────────────────────
  if (hasZip) {
    await handleOrderByZip(email, classification.zip_code!, lang);
    return;
  }

  // ── No identifier → create session and ask for order number ──────────────
  await createSession(senderEmail, threadId, 'waiting_for_order_number', lang);
  const askBody = await translateEmail(composeAskForOrderNumberEmail(), lang);
  await replyToMessage({ threadId, to: senderEmail, subject: 'We need your order number', body: askBody });
  await logEmail({ thread_id: threadId, route_taken: 'ask_order_number' });
}

async function handleOrderByName(email: ParsedEmail, orderName: string, lang: string): Promise<void> {
  const { threadId, senderEmail, sender, subject, receivedAt } = email;

  let orders;
  try {
    orders = await withShopifyRetry(() => getOrdersByName(orderName));
  } catch (err) {
    await sendHumanAlert(email, `Shopify lookup by name failed: ${String(err)}`);
    return;
  }

  if (orders.length === 0) {
    // Order not found → try by email, then alert human
    let emailOrders: ShopifyOrder[] = [];
    try {
      emailOrders = await withShopifyRetry(() => getOrdersByEmail(senderEmail));
    } catch {
      emailOrders = [];
    }

    if (emailOrders.length > 0) {
      const composed = composeOrderDetailsEmail(emailOrders);
      const body = await translateEmail(composed.body, lang);
      await replyToMessage({ threadId, to: senderEmail, subject: composed.subject, body });
      await logEmail({ thread_id: threadId, route_taken: 'order_by_email_fallback' });
    } else {
      await sendHumanAlert(email, `Order "${orderName}" not found in Shopify`);
      await logEmail({ thread_id: threadId, route_taken: 'human_alert_order_not_found' });
    }
    return;
  }

  const composed = composeOrderDetailsEmail(orders);
  const body = await translateEmail(composed.body, lang);
  await replyToMessage({ threadId, to: senderEmail, subject: composed.subject, body });
  await logEmail({ thread_id: threadId, route_taken: 'order_found_by_name' });
}

async function handleOrderByZip(email: ParsedEmail, zip: string, lang: string): Promise<void> {
  const { threadId, senderEmail } = email;

  let orders;
  try {
    orders = await withShopifyRetry(() => getOrdersByZip(zip));
  } catch (err) {
    await sendHumanAlert(email, `Shopify lookup by zip failed: ${String(err)}`);
    return;
  }

  if (orders.length === 0) {
    // Zip not found → ask for order number
    await createSession(senderEmail, threadId, 'waiting_for_order_number', lang);
    const askBody = await translateEmail(composeAskForOrderNumberEmail(), lang);
    await replyToMessage({ threadId, to: senderEmail, subject: 'We need your order number', body: askBody });
    await logEmail({ thread_id: threadId, route_taken: 'zip_not_found_ask_order' });
    return;
  }

  // Verify the sender's email matches an order from this zip
  const matchedOrders = orders.filter(
    (o) => o.email.toLowerCase() === senderEmail.toLowerCase(),
  );

  if (matchedOrders.length === 0) {
    // Email doesn't match → send mismatch message and ask for order number
    await createSession(senderEmail, threadId, 'waiting_for_order_number', lang);
    const mismatchBody = await translateEmail(composeNoEmailZipMatchEmail(), lang);
    await replyToMessage({ threadId, to: senderEmail, subject: 'We need your order number', body: mismatchBody });
    await logEmail({ thread_id: threadId, route_taken: 'email_zip_mismatch' });
    return;
  }

  const composed = composeOrderDetailsEmail(matchedOrders);
  const body = await translateEmail(composed.body, lang);
  await replyToMessage({ threadId, to: senderEmail, subject: composed.subject, body });
  await logEmail({ thread_id: threadId, route_taken: 'order_found_by_zip' });
}

async function sendHumanAlert(email: ParsedEmail, reason: string): Promise<void> {
  const body = composeHumanAlertEmail({
    sender: email.sender,
    subject: email.subject,
    receivedAt: email.receivedAt,
    reason,
  });

  await replyToMessage({
    threadId: email.threadId,
    to: env.EMAIL_NISSAN,
    body,
  });
}
