import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getOutlookAuthUrl } from '@/lib/email/outlook';

export async function GET() {
  const clientId = process.env.AZURE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing Azure Client ID. Configure AZURE_CLIENT_ID in .env.local' },
      { status: 500 }
    );
  }

  // Generate CSRF token
  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = getOutlookAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('outlook_oauth_state', state, {
    httpOnly: true,
    secure: true,
    maxAge: 3600,
    sameSite: 'lax',
  });

  return response;
}
