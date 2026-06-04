import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeGmailCode } from '@/lib/email/gmail';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=gmail_denied`
    );
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    // Exchange the code for tokens
    const tokens = await exchangeGmailCode(code);

    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get user's org
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!userData?.org_id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_org`
      );
    }

    // Store Gmail tokens in the organization record
    await supabase
      .from('organizations')
      .update({
        gmail_connected: true,
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        send_from_email: user.email,
      })
      .eq('id', userData.org_id);

    // Log the action
    await supabase.from('action_history').insert({
      org_id: userData.org_id,
      action_type: 'gmail_connected',
      actor_type: 'human',
      actor_id: user.id,
      details: { provider: 'gmail', email: user.email },
      outcome: 'Gmail account connected successfully',
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?gmail=connected`
    );
  } catch (err: unknown) {
    console.error('Gmail callback error:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=gmail_failed`
    );
  }
}
