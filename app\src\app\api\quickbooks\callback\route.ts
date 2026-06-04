import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const realmId = url.searchParams.get('realmId'); // The QuickBooks Company ID
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${error}`);
  }

  if (!code || !realmId) {
    return NextResponse.json({ error: 'Missing code or realmId' }, { status: 400 });
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID!;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/quickbooks/callback`;

  try {
    // Exchange the authorization code for access and refresh tokens
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Failed to exchange tokens: ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Authenticate with Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Since we are building an MVP, let's ensure the user has an organization.
    // We will check if one exists, and if not, create one.
    const { data: orgData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    let orgId = orgData?.org_id;

    if (!orgId) {
      // Create a default organization for this new user
      const { data: newOrg } = await supabase
        .from('organizations')
        .insert({ name: 'My Company' })
        .select()
        .single();
      
      orgId = newOrg?.id;

      // Link user to this new org
      if (orgId) {
        await supabase.from('users').upsert({
          id: user.id,
          org_id: orgId,
          email: user.email!,
          role: 'admin'
        });
      }
    }

    // Now securely store the QuickBooks tokens in the organization record
    // Note: In a true production app, we would encrypt these before storing.
    if (orgId) {
      await supabase
        .from('organizations')
        .update({
          qb_realm_id: realmId,
          qb_access_token: tokenData.access_token,
          qb_refresh_token: tokenData.refresh_token,
        })
        .eq('id', orgId);
    }

    // Redirect the user back to the dashboard with a success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?qb_sync=success`);

  } catch (err: unknown) {
    console.error('QB Callback Error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=qb_sync_failed`);
  }
}
