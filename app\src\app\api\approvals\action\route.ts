import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: Approve or reject a queued reminder
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!userData?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    const body = await request.json();
    const { approvalId, action, overrideNote, editedSubject, editedBody } = body;

    if (!approvalId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing approvalId or invalid action (must be "approve" or "reject")' },
        { status: 400 }
      );
    }

    // Get the approval record
    const { data: approval } = await supabase
      .from('approvals')
      .select('*, reminder:reminders(*)')
      .eq('id', approvalId)
      .eq('org_id', userData.org_id)
      .single();

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    if (approval.status !== 'pending') {
      return NextResponse.json(
        { error: `Approval already ${approval.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const delivery = {
      status: 'not_attempted',
      message: action === 'approve'
        ? 'Reminder approved. Delivery has not been attempted.'
        : 'Reminder rejected. No delivery attempted.',
    };

    // Update approval record
    await supabase
      .from('approvals')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: now,
        override_note: overrideNote || null,
      })
      .eq('id', approvalId);

    // Update the associated reminder
    if (action === 'approve') {
      const updateData: Record<string, unknown> = {
        status: 'approved',
        approved_by: user.id,
        approved_at: now,
      };

      // If the user edited the draft, apply edits
      if (editedSubject) updateData.subject = editedSubject;
      if (editedBody) updateData.body = editedBody;

      await supabase
        .from('reminders')
        .update(updateData)
        .eq('id', approval.reminder_id);

      if (approval.reminder?.channel === 'email' || !approval.reminder?.channel) {
        const { data: org } = await supabase
          .from('organizations')
          .select('gmail_connected, gmail_access_token, outlook_connected, outlook_access_token')
          .eq('id', userData.org_id)
          .single();

        const hasGmail = Boolean(org?.gmail_connected && org.gmail_access_token);
        const hasOutlook = Boolean(org?.outlook_connected && org.outlook_access_token);

        if (!hasGmail && !hasOutlook) {
          delivery.status = 'blocked_missing_provider';
          delivery.message = 'Reminder approved, but send is blocked until Gmail or Outlook is connected.';

          await supabase.from('action_history').insert({
            org_id: userData.org_id,
            action_type: 'send_blocked',
            customer_id: approval.reminder?.customer_id,
            invoice_id: approval.reminder?.invoice_id,
            conversation_id: approval.reminder?.conversation_id,
            actor_type: 'system',
            details: {
              approval_id: approvalId,
              reminder_id: approval.reminder_id,
              blocked_by: 'missing_email_provider',
              required_action: 'connect_gmail_or_outlook',
            },
            outcome: 'Send blocked: no Gmail or Outlook provider connected',
          });
        } else {
          delivery.status = 'ready_to_send';
          delivery.message = `Reminder approved and ready to send via ${hasGmail ? 'Gmail' : 'Outlook'}.`;
        }
      }
    } else {
      await supabase
        .from('reminders')
        .update({ status: 'recalled', recalled_at: now })
        .eq('id', approval.reminder_id);
    }

    // Log the action
    await supabase.from('action_history').insert({
      org_id: userData.org_id,
      action_type: action === 'approve' ? 'approval_granted' : 'approval_rejected',
      customer_id: approval.reminder?.customer_id,
      invoice_id: approval.reminder?.invoice_id,
      conversation_id: approval.reminder?.conversation_id,
      actor_type: 'human',
      actor_id: user.id,
      details: {
        approval_id: approvalId,
        reminder_id: approval.reminder_id,
        action,
        override_note: overrideNote,
        was_edited: !!(editedSubject || editedBody),
      },
      outcome: `Reminder ${action === 'approve' ? 'approved' : 'rejected'}${overrideNote ? ` — ${overrideNote}` : ''}`,
    });

    return NextResponse.json({
      success: true,
      approvalId,
      action,
      reminderId: approval.reminder_id,
      reminderStatus: action === 'approve' ? 'approved' : 'recalled',
      delivery,
    });
  } catch (err: unknown) {
    console.error('Approval action error:', err);
    return NextResponse.json(
      { error: 'Failed to process approval', details: String(err) },
      { status: 500 }
    );
  }
}
