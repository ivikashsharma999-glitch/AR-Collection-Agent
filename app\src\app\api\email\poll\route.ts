import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pollInbox, markAsRead, type EmailProvider, type UnifiedEmailMessage } from '@/lib/email/service';
import { classifyReply } from '@/lib/ai/classifier';
import { extractPromise } from '@/lib/ai/promise-extractor';
import { detectDispute } from '@/lib/ai/dispute-detector';
import { updateProfileOnReply } from '@/lib/services/behavioral-profiler';

// POST: Manually trigger inbox poll (also callable by cron)
export async function POST() {
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

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.org_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Determine provider and poll
    let provider: EmailProvider;
    let accessToken: string;

    if (org.gmail_connected && org.gmail_access_token) {
      provider = 'gmail';
      accessToken = org.gmail_access_token;
    } else if (org.outlook_connected && org.outlook_access_token) {
      provider = 'outlook';
      accessToken = org.outlook_access_token;
    } else {
      return NextResponse.json(
        { error: 'No email provider connected' },
        { status: 400 }
      );
    }

    // Poll for new messages
    const messages = await pollInbox(provider, accessToken);
    const processed: string[] = [];

    for (const message of messages) {
      const result = await processInboundMessage(supabase, userData.org_id, message, provider);
      if (result) {
        processed.push(result);
        await markAsRead(provider, accessToken, message.id);
      }
    }

    return NextResponse.json({
      success: true,
      messagesPolled: messages.length,
      messagesProcessed: processed.length,
      processed,
    });
  } catch (err: unknown) {
    console.error('Inbox poll error:', err);
    return NextResponse.json(
      { error: 'Failed to poll inbox', details: String(err) },
      { status: 500 }
    );
  }
}

// ── Process an inbound email message ──
async function processInboundMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orgId: string,
  message: UnifiedEmailMessage,
  provider: EmailProvider
): Promise<string | null> {
  // Extract sender email from "Name <email>" format
  const fromEmail = extractEmail(message.from);

  // Try to match this sender to a known customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, email')
    .eq('org_id', orgId)
    .or(`email.eq.${fromEmail},secondary_emails.cs.{${fromEmail}}`)
    .single();

  if (!customer) {
    // Unknown sender — skip for now
    return null;
  }

  // Find or create conversation
  let conversationId: string;
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('org_id', orgId)
    .eq('customer_id', customer.id)
    .eq('status', 'active')
    .order('last_activity_at', { ascending: false })
    .limit(1)
    .single();

  if (existingConv) {
    conversationId = existingConv.id;
  } else {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        org_id: orgId,
        customer_id: customer.id,
        email_thread_id: message.threadId,
        channel: 'email',
        status: 'active',
      })
      .select()
      .single();
    conversationId = newConv?.id;
  }

  // Update conversation last activity
  await supabase
    .from('conversations')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Step 1: Classify the reply using LLM
  const classification = await classifyReply(message.body);

  // Step 2: Store the reply
  const { data: reply } = await supabase
    .from('replies')
    .insert({
      org_id: orgId,
      conversation_id: conversationId,
      customer_id: customer.id,
      from_email: fromEmail,
      subject: message.subject,
      raw_body: message.body,
      cleaned_body: message.body.trim(),
      classification: classification.classification,
      intent_detail: classification.intentDetail,
      confidence_score: classification.confidenceScore,
      email_message_id: message.id,
      received_at: new Date().toISOString(),
    })
    .select()
    .single();

  // Log the classification
  await supabase.from('action_history').insert({
    org_id: orgId,
    action_type: 'reply_classified',
    customer_id: customer.id,
    conversation_id: conversationId,
    actor_type: 'agent',
    details: {
      classification: classification.classification,
      confidence: classification.confidenceScore,
      intent_detail: classification.intentDetail,
      from_email: fromEmail,
      provider,
    },
    outcome: `Reply classified as ${classification.classification} (${Math.round(classification.confidenceScore * 100)}%)`,
  });

  // Step 2.5: Update the customer's behavioral profile
  await updateProfileOnReply(
    orgId,
    customer.id,
    classification.classification,
    new Date().toISOString()
  );

  // Step 3: Handle based on classification
  if (classification.classification === 'promise_to_pay' || classification.classification === 'partial_pay') {
    await handlePromise(supabase, orgId, customer, reply, message.body);
  }

  if (classification.classification === 'dispute') {
    await handleDispute(supabase, orgId, customer, reply, message.body);
  }

  if (classification.classification === 'opt_out') {
    // Suppress the conversation — stop all reminders
    await supabase
      .from('conversations')
      .update({ status: 'suppressed' })
      .eq('id', conversationId);

    await supabase.from('action_history').insert({
      org_id: orgId,
      action_type: 'account_suppressed',
      customer_id: customer.id,
      conversation_id: conversationId,
      actor_type: 'agent',
      details: { reason: 'opt_out', from_email: fromEmail },
      outcome: `Account suppressed — ${customer.name} opted out of communications`,
    });
  }

  return `Processed reply from ${fromEmail} → ${classification.classification}`;
}

// ── Handle promise-to-pay ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePromise(supabase: any, orgId: string, customer: any, reply: any, emailBody: string) {
  // Find the most recent overdue invoice for this customer
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount_due')
    .eq('org_id', orgId)
    .eq('customer_id', customer.id)
    .eq('status', 'overdue')
    .order('priority_score', { ascending: false })
    .limit(1)
    .single();

  if (!invoice) return;

  // Extract promise details using LLM
  const promiseData = await extractPromise(emailBody, invoice.amount_due, invoice.invoice_number);

  if (promiseData.hasPromise) {
    // Create promise record
    await supabase.from('promises').insert({
      org_id: orgId,
      customer_id: customer.id,
      invoice_id: invoice.id,
      reply_id: reply.id,
      promised_amount: promiseData.promisedAmount || invoice.amount_due,
      promised_date: promiseData.promisedDate,
      status: 'pending',
    });

    // Update invoice status
    await supabase
      .from('invoices')
      .update({ status: 'promised' })
      .eq('id', invoice.id);

    // Log it
    await supabase.from('action_history').insert({
      org_id: orgId,
      action_type: 'promise_captured',
      customer_id: customer.id,
      invoice_id: invoice.id,
      actor_type: 'agent',
      details: {
        promised_amount: promiseData.promisedAmount,
        promised_date: promiseData.promisedDate,
        confidence: promiseData.confidence,
        reasoning: promiseData.reasoning,
      },
      outcome: `Promise captured: $${promiseData.promisedAmount || invoice.amount_due} by ${promiseData.promisedDate || 'unspecified date'}`,
    });
  }
}

// ── Handle dispute ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDispute(supabase: any, orgId: string, customer: any, reply: any, emailBody: string) {
  // Find the most relevant invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount_due')
    .eq('org_id', orgId)
    .eq('customer_id', customer.id)
    .in('status', ['overdue', 'promised'])
    .order('priority_score', { ascending: false })
    .limit(1)
    .single();

  // Detect dispute details
  const disputeData = await detectDispute(emailBody, invoice?.invoice_number || 'Unknown', customer.name);

  if (disputeData.isDispute) {
    // Create dispute record
    await supabase.from('disputes').insert({
      org_id: orgId,
      customer_id: customer.id,
      invoice_id: invoice?.id,
      reply_id: reply.id,
      reason_tag: disputeData.reasonTag || 'other',
      description: disputeData.description || 'Dispute detected by AI — review required.',
      status: 'open',
    });

    // Update invoice status if we have one
    if (invoice) {
      await supabase
        .from('invoices')
        .update({ status: 'disputed' })
        .eq('id', invoice.id);
    }

    // Pause reminders for this customer's active conversations
    if (disputeData.shouldPauseReminders) {
      await supabase
        .from('conversations')
        .update({ status: 'suppressed' })
        .eq('org_id', orgId)
        .eq('customer_id', customer.id)
        .eq('status', 'active');
    }

    // Log it
    await supabase.from('action_history').insert({
      org_id: orgId,
      action_type: 'dispute_flagged',
      customer_id: customer.id,
      invoice_id: invoice?.id,
      actor_type: 'agent',
      details: {
        reason_tag: disputeData.reasonTag,
        description: disputeData.description,
        confidence: disputeData.confidence,
        reminders_paused: disputeData.shouldPauseReminders,
        suggested_action: disputeData.suggestedAction,
      },
      outcome: `Dispute flagged: ${disputeData.reasonTag} — ${disputeData.description?.slice(0, 80)}`,
    });
  }
}

// ── Helper: Extract email from "Name <email>" format ──
function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : from.toLowerCase().trim();
}
