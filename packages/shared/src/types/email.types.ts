export interface ParsedEmail {
  messageId: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  senderDomain: string;
  subject: string;
  content: string;
  cleanContent: string;
  receivedAt: string;
  isReply: boolean;
  isAutoReply: boolean;
}

export interface EmailReply {
  threadId: string;
  body: string;
  isHtml?: boolean;
}
