/**
 * Handles emails that arrive within an existing open session.
 * Routes: searchOrder | guideMail | needHumanSupport | onlyReply
 */
import { env } from '../config/env.js';
import { analyzeOpenSession, translateEmail } from '../services/openai.service.js';
import { getOrdersByName, withShopifyRetry } from '../services/shopify.service.js';
import {
  incrementAttempts,
  closeSession,
} from '../services/session.service.js';
import { replyToMessage } from '../services/gmail.service.js';
import {
  composeOrderDetailsEmail,
  composeAskForOrderNumberHtml,
  composeHumanAlertEmail,
  appendSignature,
} from '../services/email-composer.service.js';
import { logEmail } from '../services/email-log.service.js';
import { extractOrderNumber } from '@oytiot/shared';
import type { ParsedEmail, ShopifyOrder, CustomerSession, SessionRoute } from '@oytiot/shared';

export async function handleOpenSession(
  email: ParsedEmail,
  session: CustomerSession,
): Promise<void> {
  const { threadId, senderEmail, cleanContent, subject, isReply } = email;

  const subjectForAI = isReply ? null : subject;
  const orderNumber = extractOrderNumber(`${subjectForAI ?? ''} ${cleanContent}`) ?? 'no-order-name';

  // Determine route logic
  const route = await determineRoute(email, session, orderNumber);

  await logEmail({
    thread_id: threadId,
    sender_email: senderEmail,
    subject,
    route_taken: `open_session:${route}`,
  });

  const lang = session.language ?? 'en';

  switch (route) {
    case 'searchOrder':
      await handleSearchOrder(email, orderNumber, lang);
      break;
    case 'guideMail':
      await handleGuideMail(email, session);
      break;
    case 'needHumanSupport':
      await handleNeedHumanSupport(email, lang);
      break;
    case 'onlyReply':
      await handleOnlyReply(email, lang);
      break;
  }
}

async function determineRoute(
  email: ParsedEmail,
  session: CustomerSession,
  orderNumber: string,
): Promise<SessionRoute> {
  // If order number found, always search
  if (orderNumber !== 'no-order-name') {
    return 'searchOrder';
  }

  const { attempts, status } = session;
  const { cleanContent } = email;

  // First attempt or guidance request → send guide email
  const requiresGuidance = /how|help|guide|instruction|explain|איך|עזרה|הדרכה|מה עושים/i.test(cleanContent);
  if (attempts === 0 || (requiresGuidance && status !== 'close')) {
    return 'guideMail';
  }

  // Too many attempts → human support
  if (attempts > 2) {
    return 'needHumanSupport';
  }

  // Ask AI for the rest
  let decision;
  try {
    decision = await analyzeOpenSession({
      cleanContent,
      subject_to_ai: email.isReply ? null : email.subject,
      order_number: orderNumber,
      attempts,
      status,
      language: session.language ?? 'en',
    });
  } catch {
    return 'needHumanSupport'; // safe fallback
  }

  if (decision.needHumanSupport) return 'needHumanSupport';
  return 'onlyReply';
}

async function handleSearchOrder(email: ParsedEmail, orderNumber: string, lang: string): Promise<void> {
  const { threadId, senderEmail } = email;

  let orders: ShopifyOrder[] = [];
  try {
    orders = await withShopifyRetry(() => getOrdersByName(orderNumber));
  } catch {
    orders = [];
  }

  if (orders.length === 0) {
    const notFoundBody = await translateEmail(
      `Hi there,\n\nWe couldn't find order ${orderNumber} in our system.\n` +
      `Please double-check the number and reply again, or a team member will assist you shortly.\n\nOytiot Team`,
      lang,
    );
    await replyToMessage({ threadId, to: senderEmail, body: notFoundBody });
    await incrementAttempts(threadId);
    return;
  }

  const composed = composeOrderDetailsEmail(orders);
  const body = await translateEmail(composed.body, lang);
  await replyToMessage({ threadId, to: senderEmail, subject: composed.subject, body });
  await closeSession(threadId);
}

async function handleGuideMail(email: ParsedEmail, session: CustomerSession): Promise<void> {
  const { threadId, senderEmail } = email;
  const lang = session.language ?? 'en';
  const htmlBody = await translateEmail(composeAskForOrderNumberHtml(), lang);
  await replyToMessage({ threadId, to: senderEmail, body: htmlBody, isHtml: true });
  await incrementAttempts(threadId);
}

async function handleNeedHumanSupport(email: ParsedEmail, lang: string): Promise<void> {
  const { threadId } = email;
  const alertBody = composeHumanAlertEmail({
    sender: email.sender,
    subject: email.subject,
    receivedAt: email.receivedAt,
    reason: 'Customer requires human intervention (too many attempts or complex request)',
  });

  // Notify the human handler
  await replyToMessage({ threadId, to: env.EMAIL_NISSAN, body: alertBody });
  // Tell the customer a human will help
  const patientBody = await translateEmail(
    `Hi there,\n\nThank you for your patience. A member of our team will get back to you shortly.\n\nOytiot Team`,
    lang,
  );
  await replyToMessage({ threadId, to: email.senderEmail, body: patientBody });
  await closeSession(threadId);
}

async function handleOnlyReply(
  email: ParsedEmail,
  lang: string,
): Promise<void> {
  const { threadId, cleanContent } = email;

  // Check if it's just a thank-you
  const isThankYou = /thank|thanks|תודה|great|perfect|awesome|ok\.?$/i.test(cleanContent.trim());

  if (isThankYou) {
    const thankBody = await translateEmail(
      `You're welcome! Feel free to reach out anytime.\n\nOytiot Team`,
      lang,
    );
    await replyToMessage({ threadId, to: email.senderEmail, body: thankBody });
    await closeSession(threadId);
    return;
  }

  // Generic polite acknowledgement
  const ackBody = await translateEmail(
    `Hi there,\n\nThank you for your message! To help you faster, please share your order number and we'll get right on it.`,
    lang,
  );
  await replyToMessage({ threadId, to: email.senderEmail, body: appendSignature(ackBody) });
  await incrementAttempts(threadId);
}
