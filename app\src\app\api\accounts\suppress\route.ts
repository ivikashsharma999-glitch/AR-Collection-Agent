import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: Suppress an account — stop all automated reminders
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
    const { customerId, action } = body; // action: 'suppress' or 'unsuppress'

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    }

    if (!['suppress', 'unsuppress'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "suppress" or "unsuppress"' },
        { status: 400 }
      );
    }

    // Verify customer belongs to org
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name')
      .eq('id', customerId)
      .eq('org_id', userData.org_id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const newStatus = action === 'suppress' ? 'suppressed' : 'active';

    // Update all active/suppressed conversations for this customer
    await supabase
      .from('conversations')
      .update({ status: newStatus })
      .eq('org_id', userData.org_id)
      .eq('customer_id', customerId)
      .in('status', ['active', 'suppressed']);

    // If suppressing, also cancel any queued/draft reminders
    if (action === 'suppress') {
      await supabase
        .from('reminders')
        .update({ status: 'recalled', recalled_at: new Date().toISOString() })
        .eq('org_id', userData.org_id)
        .eq('customer_id', customerId)
        .in('status', ['draft', 'queued']);
    }

    // Log the action
    await supabase.from('action_history').insert({
      org_id: userData.org_id,
      action_type: 'account_suppressed',
      customer_id: customerId,
      actor_type: 'human',
      actor_id: user.id,
      details: {
        action,
        customer_name: customer.name,
      },
      outcome: action === 'suppress'
        ? `Account suppressed — all reminders paused for ${customer.name}`
        : `Account unsuppressed — reminders resumed for ${customer.name}`,
    });

    return NextResponse.json({
      success: true,
      action,
      customerId,
      customerName: customer.name,
    });
  } catch (err: unknown) {
    console.error('Suppress error:', err);
    return NextResponse.json(
      { error: 'Failed to update suppression', details: String(err) },
      { status: 500 }
    );
  }
}
