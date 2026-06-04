import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeOutlookCode } from '@/lib/email/outlook';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=outlook_denied`
    );
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    // Exchange the code for tokens
    const tokens = await exchangeOutlookCode(code);

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

    // Store Outlook tokens in the organization record
    await supabase
      .from('organizations')
      .update({
        outlook_connected: true,
        outlook_access_token: tokens.access_token,
        outlook_refresh_token: tokens.refresh_token,
      })
      .eq('id', userData.org_id);

    // Log the action
    await supabase.from('action_history').insert({
      org_id: userData.org_id,
      action_type: 'outlook_connected',
      actor_type: 'human',
      actor_id: user.id,
      details: { provider: 'outlook', email: user.email },
      outcome: 'Outlook account connected successfully',
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?outlook=connected`
    );
  } catch (err: unknown) {
    console.error('Outlook callback error:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=outlook_failed`
    );
  }
}
