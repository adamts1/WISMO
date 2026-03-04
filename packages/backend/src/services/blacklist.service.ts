import { env } from '../config/env.js';

const BLOCKED_DOMAINS = ['info.printful.com'];

function getBlockedEmails(): string[] {
  return [
    'tsityat.ai.agency@gmail.com',
    env.EMAIL_TEST,
    env.EMAIL_PROD,
  ].filter((e): e is string => Boolean(e));
}

export function isBlacklisted(senderEmail: string, senderDomain: string): boolean {
  const email = senderEmail.toLowerCase();
  const domain = senderDomain.toLowerCase();

  return (
    getBlockedEmails().includes(email) ||
    BLOCKED_DOMAINS.includes(domain)
  );
}
