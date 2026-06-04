// ============================================
// Outlook / Microsoft Graph Integration — OAuth + Send/Receive
// ============================================

const GRAPH_SCOPES = [
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send',
  'offline_access',
].join(' ');

// ── OAuth Helpers ──

export function getOutlookAuthUrl(state: string): string {
  const tenantId = process.env.AZURE_TENANT_ID || 'common';
  const params = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/outlook/callback`,
    response_type: 'code',
    scope: GRAPH_SCOPES,
    response_mode: 'query',
    state,
  });
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeOutlookCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const tenantId = process.env.AZURE_TENANT_ID || 'common';
  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/outlook/callback`,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Outlook token exchange failed: ${err}`);
  }

  return response.json();
}

export async function refreshOutlookToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const tenantId = process.env.AZURE_TENANT_ID || 'common';
  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      client_secret: process.env.AZURE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Outlook token refresh failed: ${err}`);
  }

  return response.json();
}

// ── Email Send ──

export interface OutlookSendParams {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  conversationId?: string; // For threading
  fromName?: string;
}

export async function sendOutlookMessage(params: OutlookSendParams): Promise<{
  messageId: string;
  conversationId: string;
}> {
  const message: Record<string, unknown> = {
    subject: params.subject,
    body: {
      contentType: 'Text',
      content: params.body,
    },
    toRecipients: [
      {
        emailAddress: {
          address: params.to,
        },
      },
    ],
  };

  // If replying to an existing thread, use the conversationId
  if (params.conversationId) {
    message.conversationId = params.conversationId;
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      saveToSentItems: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Outlook send failed: ${err}`);
  }

  // Microsoft Graph sendMail returns 202 with no body, so we need to find the sent message
  // For MVP, return placeholder IDs
  return {
    messageId: `msg-${Date.now()}`,
    conversationId: params.conversationId || `conv-${Date.now()}`,
  };
}

// ── Email Receive (Inbox Polling) ──

export interface OutlookMessage {
  id: string;
  conversationId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  internetMessageId: string;
}

export async function pollOutlookInbox(
  accessToken: string,
  afterTimestamp?: string
): Promise<OutlookMessage[]> {
  let filter = 'isRead eq false';
  if (afterTimestamp) {
    filter += ` and receivedDateTime ge ${afterTimestamp}`;
  }

  const url = new URL('https://graph.microsoft.com/v1.0/me/messages');
  url.searchParams.set('$filter', filter);
  url.searchParams.set('$top', '25');
  url.searchParams.set('$orderby', 'receivedDateTime desc');
  url.searchParams.set('$select', 'id,conversationId,from,toRecipients,subject,body,receivedDateTime,internetMessageId');

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Outlook inbox poll failed: ${err}`);
  }

  const data = await response.json();
  const messages: OutlookMessage[] = (data.value || []).map(
    (msg: {
      id: string;
      conversationId: string;
      from: { emailAddress: { address: string } };
      toRecipients: { emailAddress: { address: string } }[];
      subject: string;
      body: { content: string };
      receivedDateTime: string;
      internetMessageId: string;
    }) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      from: msg.from?.emailAddress?.address || '',
      to: msg.toRecipients?.[0]?.emailAddress?.address || '',
      subject: msg.subject || '',
      body: stripHtml(msg.body?.content || ''),
      receivedAt: msg.receivedDateTime,
      internetMessageId: msg.internetMessageId || '',
    })
  );

  return messages;
}

// Strip HTML tags for plain text processing
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Mark a message as read
export async function markOutlookAsRead(accessToken: string, messageId: string): Promise<void> {
  await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isRead: true }),
  });
}
