import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, type EmailProvider } from '@/lib/email/service';
import { canSendReminder } from '@/lib/compliance/shield';
import { checkLegalCompliance } from '@/lib/compliance/legal-filter';
import { checkRateLimit } from '@/lib/email/deliverability';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's org
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!userData?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get the org's email tokens
    const { data: org } = await supabase
      .from('organizations')
      .select('gmail_connected, gmail_access_token, outlook_connected, outlook_access_token, send_from_email')
      .eq('id', userData.org_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Determine which provider to use
    let provider: EmailProvider;
    let accessToken: string;

    if (org.gmail_connected && org.gmail_access_token) {
      provider = 'gmail';
      accessToken = org.gmail_access_token;
    } else if (org.outlook_connected && org.outlook_access_token) {
      provider = 'outlook';
      accessToken = org.outlook_access_token;
    } else {
      await supabase.from('action_history').insert({
        org_id: userData.org_id,
        action_type: 'send_blocked',
        actor_type: 'system',
        details: {
          blocked_by: 'missing_email_provider',
          required_action: 'connect_gmail_or_outlook',
        },
        outcome: 'Send blocked: no Gmail or Outlook provider connected',
      });

      return NextResponse.json(
        { error: 'No email provider connected. Connect Gmail or Outlook in Settings.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { to, subject, emailBody, reminderId, customerId, inReplyTo, references, conversationId } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing to, subject, or emailBody' }, { status: 400 });
    }

    // ── Email Rate Limiting (Anti-Spam) ──
    const rateLimitCheck = await checkRateLimit(userData.org_id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate Limit Exceeded', details: rateLimitCheck.reason },
        { status: 429 }
      );
    }

    // ── Legal Guardrail Check ──
    const legalCheck = checkLegalCompliance(emailBody);
    if (!legalCheck.isClean) {
      await supabase.from('action_history').insert({
        org_id: userData.org_id,
        action_type: 'send_blocked',
        customer_id: customerId,
        actor_type: 'system',
        details: {
          blocked_by: 'legal_filter',
          violations: legalCheck.violations,
          to,
          subject,
        },
        outcome: `Send blocked: Prohibited language detected (${legalCheck.violations.join(', ')})`,
      });

      return NextResponse.json(
        {
          error: 'Blocked by Legal Filter',
          violations: legalCheck.violations,
          message: 'The email contains prohibited language and cannot be sent.',
        },
        { status: 403 }
      );
    }

    // ── Compliance Shield Check ──
    if (customerId) {
      const complianceResult = await canSendReminder({
        customerId,
        orgId: userData.org_id,
      });

      if (!complianceResult.allowed) {
        // Log the blocked attempt
        await supabase.from('action_history').insert({
          org_id: userData.org_id,
          action_type: 'send_blocked',
          customer_id: customerId,
          actor_type: 'system',
          details: {
            blocked_by: complianceResult.blockedBy,
            reason: complianceResult.details,
            to,
            subject,
          },
          outcome: `Send blocked by compliance shield: ${complianceResult.blockedBy}`,
        });

        return NextResponse.json(
          {
            error: 'Blocked by Compliance Shield',
            blockedBy: complianceResult.blockedBy,
            details: complianceResult.details,
          },
          { status: 403 }
        );
      }
    }

    // Send the email
    const result = await sendEmail({
      provider,
      accessToken,
      to,
      subject,
      body: emailBody,
      inReplyTo,
      references,
      conversationId,
      fromName: org.send_from_email,
    });

    // If this was tied to a reminder, update the reminder status
    if (reminderId) {
      await supabase
        .from('reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          email_message_id: result.messageId,
        })
        .eq('id', reminderId);

      // Log the send action
      await supabase.from('action_history').insert({
        org_id: userData.org_id,
        action_type: 'reminder_sent',
        actor_type: 'human',
        actor_id: user.id,
        details: {
          reminder_id: reminderId,
          to,
          subject,
          provider,
          message_id: result.messageId,
        },
        outcome: `Email sent to ${to}`,
      });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
    });
  } catch (err: unknown) {
    console.error('Email send error:', err);
    return NextResponse.json(
      { error: 'Failed to send email', details: String(err) },
      { status: 500 }
    );
  }
}
