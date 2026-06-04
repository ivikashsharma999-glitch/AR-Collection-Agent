import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/quickbooks/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'Missing QuickBooks Client ID' }, { status: 500 });
  }

  // Scopes needed for AR Collections Agent
  const scope = 'com.intuit.quickbooks.accounting';
  
  // Generate a random CSRF token
  const state = crypto.randomBytes(16).toString('hex');
  
  const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('state', state);

  // We should ideally store the state in a cookie to verify it in the callback
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('qb_oauth_state', state, { httpOnly: true, secure: true, maxAge: 3600 });

  return response;
}
