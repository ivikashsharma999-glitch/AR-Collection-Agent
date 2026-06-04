import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getGmailAuthUrl } from '@/lib/email/gmail';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing Google Client ID. Configure GOOGLE_CLIENT_ID in .env.local' },
      { status: 500 }
    );
  }

  // Generate CSRF token
  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = getGmailAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('gmail_oauth_state', state, {
    httpOnly: true,
    secure: true,
    maxAge: 3600,
    sameSite: 'lax',
  });

  return response;
}
