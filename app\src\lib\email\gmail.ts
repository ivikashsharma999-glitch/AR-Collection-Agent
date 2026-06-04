// ============================================
// Gmail Integration — OAuth + Send/Receive
// ============================================

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

// ── OAuth Helpers ──

export function getGmailAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/gmail/callback`,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGmailCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/gmail/callback`,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail token exchange failed: ${err}`);
  }

  return response.json();
}

export async function refreshGmailToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail token refresh failed: ${err}`);
  }

  return response.json();
}

// ── Email Send ──

export interface SendEmailParams {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string; // Message-ID for threading
  references?: string;
  fromName?: string;
}

function encodeEmail(params: SendEmailParams): string {
  const headers = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `MIME-Version: 1.0`,
  ];

  if (params.fromName) {
    headers.push(`From: ${params.fromName}`);
  }

  if (params.inReplyTo) {
    headers.push(`In-Reply-To: ${params.inReplyTo}`);
    headers.push(`References: ${params.references || params.inReplyTo}`);
  }

  const email = `${headers.join('\r\n')}\r\n\r\n${params.body}`;
  
  // RFC 4648 base64url encoding
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailMessage(params: SendEmailParams): Promise<{
  messageId: string;
  threadId: string;
}> {
  const raw = encodeEmail(params);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail send failed: ${err}`);
  }

  const data = await response.json();
  return { messageId: data.id, threadId: data.threadId };
}

// ── Email Receive (Inbox Polling) ──

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  messageIdHeader: string; // The Message-ID header for threading
}

export async function pollGmailInbox(
  accessToken: string,
  afterTimestamp?: number
): Promise<GmailMessage[]> {
  // Build the Gmail search query
  let query = 'in:inbox is:unread';
  if (afterTimestamp) {
    query += ` after:${afterTimestamp}`;
  }

  const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  listUrl.searchParams.set('q', query);
  listUrl.searchParams.set('maxResults', '25');

  const listResponse = await fetch(listUrl.toString(), {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!listResponse.ok) {
    const err = await listResponse.text();
    throw new Error(`Gmail list failed: ${err}`);
  }

  const listData = await listResponse.json();
  const messageRefs = listData.messages || [];

  // Fetch full message details for each
  const messages: GmailMessage[] = [];
  for (const ref of messageRefs) {
    const msg = await fetchGmailMessage(accessToken, ref.id);
    if (msg) messages.push(msg);
  }

  return messages;
}

async function fetchGmailMessage(accessToken: string, messageId: string): Promise<GmailMessage | null> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const headers = data.payload?.headers || [];

  function getHeader(name: string): string {
    return headers.find((h: { name: string; value: string }) => 
      h.name.toLowerCase() === name.toLowerCase()
    )?.value || '';
  }

  // Extract plain text body
  let body = '';
  if (data.payload?.body?.data) {
    body = Buffer.from(data.payload.body.data, 'base64').toString('utf-8');
  } else if (data.payload?.parts) {
    const textPart = data.payload.parts.find(
      (p: { mimeType: string }) => p.mimeType === 'text/plain'
    );
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  }

  return {
    id: data.id,
    threadId: data.threadId,
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    body,
    date: getHeader('Date'),
    messageIdHeader: getHeader('Message-ID'),
  };
}

// Mark a message as read
export async function markGmailAsRead(accessToken: string, messageId: string): Promise<void> {
  await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    }
  );
}
