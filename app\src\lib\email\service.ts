// ============================================
// Unified Email Service
// Orchestrates Gmail + Outlook behind a single interface
// ============================================

import {
  sendGmailMessage,
  pollGmailInbox,
  markGmailAsRead,
  refreshGmailToken,
  type GmailMessage,
  type SendEmailParams,
} from './gmail';

import {
  sendOutlookMessage,
  pollOutlookInbox,
  markOutlookAsRead,
  refreshOutlookToken,
  type OutlookMessage,
  type OutlookSendParams,
} from './outlook';

export type EmailProvider = 'gmail' | 'outlook';

export interface UnifiedEmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  messageIdHeader: string;
  provider: EmailProvider;
}

export interface SendEmailRequest {
  provider: EmailProvider;
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
  conversationId?: string;
  fromName?: string;
}

export interface SendEmailResult {
  messageId: string;
  threadId: string;
}

// ── Send ──

export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResult> {
  if (request.provider === 'gmail') {
    const params: SendEmailParams = {
      accessToken: request.accessToken,
      to: request.to,
      subject: request.subject,
      body: request.body,
      inReplyTo: request.inReplyTo,
      references: request.references,
      fromName: request.fromName,
    };
    const result = await sendGmailMessage(params);
    return { messageId: result.messageId, threadId: result.threadId };
  }

  if (request.provider === 'outlook') {
    const params: OutlookSendParams = {
      accessToken: request.accessToken,
      to: request.to,
      subject: request.subject,
      body: request.body,
      conversationId: request.conversationId,
      fromName: request.fromName,
    };
    const result = await sendOutlookMessage(params);
    return { messageId: result.messageId, threadId: result.conversationId };
  }

  throw new Error(`Unsupported email provider: ${request.provider}`);
}

// ── Poll ──

export async function pollInbox(
  provider: EmailProvider,
  accessToken: string,
  afterTimestamp?: string
): Promise<UnifiedEmailMessage[]> {
  if (provider === 'gmail') {
    const epoch = afterTimestamp ? Math.floor(new Date(afterTimestamp).getTime() / 1000) : undefined;
    const messages: GmailMessage[] = await pollGmailInbox(accessToken, epoch);
    return messages.map(m => ({
      id: m.id,
      threadId: m.threadId,
      from: m.from,
      to: m.to,
      subject: m.subject,
      body: m.body,
      receivedAt: m.date,
      messageIdHeader: m.messageIdHeader,
      provider: 'gmail' as EmailProvider,
    }));
  }

  if (provider === 'outlook') {
    const messages: OutlookMessage[] = await pollOutlookInbox(accessToken, afterTimestamp);
    return messages.map(m => ({
      id: m.id,
      threadId: m.conversationId,
      from: m.from,
      to: m.to,
      subject: m.subject,
      body: m.body,
      receivedAt: m.receivedAt,
      messageIdHeader: m.internetMessageId,
      provider: 'outlook' as EmailProvider,
    }));
  }

  throw new Error(`Unsupported email provider: ${provider}`);
}

// ── Mark as Read ──

export async function markAsRead(
  provider: EmailProvider,
  accessToken: string,
  messageId: string
): Promise<void> {
  if (provider === 'gmail') {
    await markGmailAsRead(accessToken, messageId);
  } else if (provider === 'outlook') {
    await markOutlookAsRead(accessToken, messageId);
  }
}

// ── Token Refresh ──

export async function refreshToken(
  provider: EmailProvider,
  refreshTokenStr: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  if (provider === 'gmail') {
    const result = await refreshGmailToken(refreshTokenStr);
    return { access_token: result.access_token, expires_in: result.expires_in };
  }

  if (provider === 'outlook') {
    const result = await refreshOutlookToken(refreshTokenStr);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
    };
  }

  throw new Error(`Unsupported email provider: ${provider}`);
}
