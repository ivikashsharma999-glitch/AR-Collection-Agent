import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: Recall a sent reminder (5-minute window)
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
    const { reminderId } = body;

    if (!reminderId) {
      return NextResponse.json({ error: 'Missing reminderId' }, { status: 400 });
    }

    // Get the reminder
    const { data: reminder } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .eq('org_id', userData.org_id)
      .single();

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    if (reminder.status !== 'sent') {
      return NextResponse.json(
        { error: 'Only sent reminders can be recalled' },
        { status: 400 }
      );
    }

    // Check the 5-minute recall window
    const sentAt = new Date(reminder.sent_at);
    const now = new Date();
    const diffMs = now.getTime() - sentAt.getTime();
    const RECALL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

    if (diffMs > RECALL_WINDOW_MS) {
      return NextResponse.json(
        {
          error: 'Recall window expired',
          detail: 'Reminders can only be recalled within 5 minutes of sending.',
          sentAt: reminder.sent_at,
          windowExpiredAt: new Date(sentAt.getTime() + RECALL_WINDOW_MS).toISOString(),
        },
        { status: 400 }
      );
    }

    // Mark as recalled
    await supabase
      .from('reminders')
      .update({
        status: 'recalled',
        recalled_at: now.toISOString(),
      })
      .eq('id', reminderId);

    // Log the recall
    await supabase.from('action_history').insert({
      org_id: userData.org_id,
      action_type: 'reminder_recalled',
      customer_id: reminder.customer_id,
      invoice_id: reminder.invoice_id,
      conversation_id: reminder.conversation_id,
      actor_type: 'human',
      actor_id: user.id,
      details: {
        reminder_id: reminderId,
        recalled_after_seconds: Math.round(diffMs / 1000),
      },
      outcome: `Reminder recalled ${Math.round(diffMs / 1000)}s after sending`,
    });

    return NextResponse.json({
      success: true,
      recalledAt: now.toISOString(),
      recalledAfterSeconds: Math.round(diffMs / 1000),
    });
  } catch (err: unknown) {
    console.error('Recall error:', err);
    return NextResponse.json(
      { error: 'Failed to recall reminder', details: String(err) },
      { status: 500 }
    );
  }
}
