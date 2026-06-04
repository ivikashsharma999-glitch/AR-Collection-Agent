// ============================================
// Non-Payment Diagnosis Engine
// Analyzes WHY a customer hasn't paid
// ============================================

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The 7 diagnosis categories from the product spec
export type DiagnosisCategory =
  | 'forgot_or_never_saw'      // Polite reminder, no urgency
  | 'cash_flow_problem'         // Offer payment plan, empathetic tone
  | 'internal_approval_stuck'   // Ask for approver, offer to resend
  | 'genuine_dispute'           // Flag for human, stop reminders
  | 'relationship_gone_cold'    // Notify AE/CSM, no automation
  | 'financial_trouble'         // Escalate, legal-sensitive guardrails
  | 'already_paid_tracking_error'; // Verify before sending, apologize

export interface DiagnosisResult {
  category: DiagnosisCategory;
  confidence: number;         // 0–1
  reasoning: string;          // Why the engine reached this conclusion
  suggestedAction: string;    // Human-readable next step
  shouldAutomate: boolean;    // Can the agent handle this, or escalate?
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface DiagnosisContext {
  customerName: string;
  invoiceNumber: string;
  amountDue: number;
  daysOverdue: number;
  totalOutstanding: number;
  previousReplies: string[];       // Last N reply bodies
  previousClassifications: string[]; // e.g. ['promise_to_pay', 'stall']
  remindersSent: number;           // How many reminders have been sent
  isStrategicAccount: boolean;
  hasActiveDispute: boolean;
  renewalWithin90Days: boolean;
  payPattern: string;              // From behavioral profile
  avgDaysLate: number;
  disputeRate: number;
}

const SYSTEM_PROMPT = `You are a non-payment diagnosis engine for B2B accounts receivable.

Your job is to analyze context about an overdue invoice and determine the MOST LIKELY reason the customer hasn't paid.

You must classify into exactly one of these 7 categories:
1. "forgot_or_never_saw" — The invoice was lost, overlooked, or the customer simply forgot. Common for first-time overdue with no prior issues.
2. "cash_flow_problem" — The customer is experiencing temporary cash constraints. Look for stalling language, partial payment history, or requests for extensions.
3. "internal_approval_stuck" — Payment is waiting on internal bureaucracy (PO approval, budget sign-off, AP processing). Common in enterprise customers.
4. "genuine_dispute" — The customer has a real issue with the invoice (wrong amount, service not delivered, quality complaint). Look for dispute-related language in replies.
5. "relationship_gone_cold" — The customer has stopped engaging entirely. Multiple unanswered reminders, no replies at all. The business relationship may be deteriorating.
6. "financial_trouble" — Signs of serious financial distress (layoffs mentioned, company restructuring, very long delays across all invoices). Requires careful, legal-sensitive handling.
7. "already_paid_tracking_error" — The customer claims they've already paid, or there's evidence of a payment that wasn't recorded. Verify before sending any reminder.

For each diagnosis, also determine:
- confidence: 0.0 to 1.0
- reasoning: A brief explanation (1-2 sentences)
- suggestedAction: What the agent or human should do next
- shouldAutomate: Can the AI agent handle the next step, or must a human intervene?
- urgency: low / medium / high / critical

Respond ONLY with valid JSON matching the schema above. No markdown, no explanation outside the JSON.`;

export async function diagnoseNonPayment(context: DiagnosisContext): Promise<DiagnosisResult> {
  const userPrompt = buildUserPrompt(context);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '{}';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      category: parsed.category || 'forgot_or_never_saw',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || 'Unable to determine reasoning.',
      suggestedAction: parsed.suggestedAction || 'Send a polite follow-up reminder.',
      shouldAutomate: parsed.shouldAutomate ?? true,
      urgency: parsed.urgency || 'medium',
    };
  } catch (error) {
    console.error('Diagnosis engine error:', error);
    // Safe fallback — assume they forgot
    return {
      category: 'forgot_or_never_saw',
      confidence: 0.3,
      reasoning: 'Diagnosis engine encountered an error. Defaulting to safe category.',
      suggestedAction: 'Send a polite follow-up reminder.',
      shouldAutomate: true,
      urgency: 'medium',
    };
  }
}

function buildUserPrompt(ctx: DiagnosisContext): string {
  const replySection = ctx.previousReplies.length > 0
    ? `\n\nPrevious customer replies (most recent first):\n${ctx.previousReplies.map((r, i) => `--- Reply ${i + 1} ---\n${r}`).join('\n\n')}`
    : '\n\nNo previous replies from the customer.';

  const classificationSection = ctx.previousClassifications.length > 0
    ? `\nPrevious reply classifications: ${ctx.previousClassifications.join(', ')}`
    : '';

  return `Diagnose why this customer hasn't paid:

Customer: ${ctx.customerName}
Invoice: ${ctx.invoiceNumber}
Amount Due: $${ctx.amountDue.toLocaleString()}
Days Overdue: ${ctx.daysOverdue}
Total Outstanding (all invoices): $${ctx.totalOutstanding.toLocaleString()}
Reminders Sent: ${ctx.remindersSent}
Strategic Account: ${ctx.isStrategicAccount ? 'Yes' : 'No'}
Active Dispute: ${ctx.hasActiveDispute ? 'Yes' : 'No'}
Renewal Within 90 Days: ${ctx.renewalWithin90Days ? 'Yes' : 'No'}
Historical Pay Pattern: ${ctx.payPattern || 'Unknown'}
Average Days Late: ${ctx.avgDaysLate}
Dispute Rate: ${(ctx.disputeRate * 100).toFixed(1)}%${classificationSection}${replySection}`;
}
