// ============================================
// Tone Adapter
// Maps diagnosis + behavioral profile → tone directives
// ============================================

import { type DiagnosisCategory } from './diagnosis-engine';

export type ToneLevel = 'gentle' | 'professional' | 'firm' | 'urgent' | 'empathetic' | 'apologetic';

export interface ToneDirective {
  tone: ToneLevel;
  openingStyle: string;       // How to start the email
  closingStyle: string;       // How to close the email
  offerPaymentPlan: boolean;  // Should the email suggest a payment plan?
  offerDiscount: boolean;     // Should the email offer an early settlement discount?
  mentionEscalation: boolean; // Should the email hint at escalation?
  suppressUrgency: boolean;   // Should urgency language be avoided?
  customInstructions: string; // Additional free-text instructions for the drafter
}

export interface ToneContext {
  diagnosis: DiagnosisCategory;
  daysOverdue: number;
  remindersSent: number;
  isStrategicAccount: boolean;
  renewalWithin90Days: boolean;
  payPattern: string;
  avgDaysLate: number;
  disputeRate: number;
}

// ── Main adaptation function ──

export function adaptTone(ctx: ToneContext): ToneDirective {
  // Start with the diagnosis-based default
  let directive = getBaseToneForDiagnosis(ctx.diagnosis);

  // Layer on behavioral modifiers
  directive = applyStrategicModifier(directive, ctx);
  directive = applyRenewalModifier(directive, ctx);
  directive = applyEscalationModifier(directive, ctx);
  directive = applyPayPatternModifier(directive, ctx);

  return directive;
}

// ── Base tone per diagnosis category ──

function getBaseToneForDiagnosis(diagnosis: DiagnosisCategory): ToneDirective {
  const toneMap: Record<DiagnosisCategory, ToneDirective> = {
    forgot_or_never_saw: {
      tone: 'gentle',
      openingStyle: 'Friendly, casual check-in. Assume the invoice was simply overlooked.',
      closingStyle: 'Warm and helpful. Offer to resend the invoice or answer any questions.',
      offerPaymentPlan: false,
      offerDiscount: false,
      mentionEscalation: false,
      suppressUrgency: true,
      customInstructions: 'Keep it brief. Do not imply any fault. This is likely a simple oversight.',
    },
    cash_flow_problem: {
      tone: 'empathetic',
      openingStyle: 'Understanding and supportive. Acknowledge that timing can be challenging.',
      closingStyle: 'Offer flexibility. Mention willingness to discuss payment arrangements.',
      offerPaymentPlan: true,
      offerDiscount: false,
      mentionEscalation: false,
      suppressUrgency: true,
      customInstructions: 'Be genuinely empathetic. Avoid any language that could feel threatening. Proactively suggest a payment plan or timeline extension.',
    },
    internal_approval_stuck: {
      tone: 'professional',
      openingStyle: 'Polite and process-aware. Acknowledge that AP cycles can be complex.',
      closingStyle: 'Offer to provide any documentation needed to expedite approval (PO, W-9, etc.).',
      offerPaymentPlan: false,
      offerDiscount: false,
      mentionEscalation: false,
      suppressUrgency: false,
      customInstructions: 'Ask if there is a specific person or department we should loop in. Offer to resend the invoice in a different format if needed.',
    },
    genuine_dispute: {
      tone: 'professional',
      openingStyle: 'Respectful and solution-oriented. Acknowledge their concern directly.',
      closingStyle: 'Assure them we want to resolve the issue quickly and fairly.',
      offerPaymentPlan: false,
      offerDiscount: false,
      mentionEscalation: false,
      suppressUrgency: true,
      customInstructions: 'DO NOT ask for payment. Focus entirely on understanding and resolving the dispute. This email should be reviewed by a human before sending.',
    },
    relationship_gone_cold: {
      tone: 'professional',
      openingStyle: 'Direct but not aggressive. Acknowledge the lack of response without accusation.',
      closingStyle: 'Mention that you will need to escalate if no response is received.',
      offerPaymentPlan: false,
      offerDiscount: false,
      mentionEscalation: true,
      suppressUrgency: false,
      customInstructions: 'This customer has gone silent. The email should be concise and direct, with a clear call to action. Mention a specific deadline for response.',
    },
    financial_trouble: {
      tone: 'empathetic',
      openingStyle: 'Careful and respectful. Do not reference financial difficulties directly.',
      closingStyle: 'Express willingness to work together on a resolution.',
      offerPaymentPlan: true,
      offerDiscount: true,
      mentionEscalation: false,
      suppressUrgency: true,
      customInstructions: 'This is a legally sensitive situation. Do NOT use aggressive language. Do NOT threaten legal action. Offer maximum flexibility. This email MUST be reviewed by a human.',
    },
    already_paid_tracking_error: {
      tone: 'apologetic',
      openingStyle: 'Apologetic and grateful. Thank them for their patience.',
      closingStyle: 'Ask them to share payment confirmation so we can reconcile our records.',
      offerPaymentPlan: false,
      offerDiscount: false,
      mentionEscalation: false,
      suppressUrgency: true,
      customInstructions: 'Apologize for the inconvenience. Do NOT ask for payment. Instead, ask for proof of payment (transaction ID, date, amount) so we can match it in our system.',
    },
  };

  // Deep clone to avoid mutations
  return { ...toneMap[diagnosis] };
}

// ── Behavioral Modifiers ──

function applyStrategicModifier(directive: ToneDirective, ctx: ToneContext): ToneDirective {
  if (ctx.isStrategicAccount) {
    directive.suppressUrgency = true;
    directive.mentionEscalation = false;
    directive.customInstructions += ' STRATEGIC ACCOUNT: Use the softest possible tone. Preserve the relationship above all else.';
    if (directive.tone === 'firm' || directive.tone === 'urgent') {
      directive.tone = 'professional';
    }
  }
  return directive;
}

function applyRenewalModifier(directive: ToneDirective, ctx: ToneContext): ToneDirective {
  if (ctx.renewalWithin90Days) {
    directive.suppressUrgency = true;
    directive.mentionEscalation = false;
    directive.customInstructions += ' RENEWAL APPROACHING: Be extra careful with tone. The customer is evaluating whether to renew.';
    if (directive.tone === 'firm' || directive.tone === 'urgent') {
      directive.tone = 'professional';
    }
  }
  return directive;
}

function applyEscalationModifier(directive: ToneDirective, ctx: ToneContext): ToneDirective {
  // After 3+ unanswered reminders, increase firmness (unless strategic/renewal)
  if (ctx.remindersSent >= 3 && !ctx.isStrategicAccount && !ctx.renewalWithin90Days) {
    if (directive.tone === 'gentle') {
      directive.tone = 'professional';
    } else if (directive.tone === 'professional') {
      directive.tone = 'firm';
    }
    directive.mentionEscalation = true;
    directive.customInstructions += ' Multiple reminders have been sent with no response. Increase directness.';
  }

  // After 5+ reminders, mark as urgent
  if (ctx.remindersSent >= 5 && !ctx.isStrategicAccount) {
    directive.tone = 'urgent';
    directive.mentionEscalation = true;
    directive.customInstructions += ' This account has been unresponsive for an extended period. Use a final-notice tone.';
  }

  return directive;
}

function applyPayPatternModifier(directive: ToneDirective, ctx: ToneContext): ToneDirective {
  // If customer historically pays on time, this is probably an anomaly — be extra gentle
  if (ctx.payPattern === 'pays_on_time' && ctx.avgDaysLate < 5) {
    directive.suppressUrgency = true;
    directive.customInstructions += ' This customer has an excellent payment history. Treat this as an anomaly, not a pattern.';
    if (directive.tone !== 'apologetic' && directive.tone !== 'empathetic') {
      directive.tone = 'gentle';
    }
  }

  // If customer has high dispute rate, be more cautious
  if (ctx.disputeRate > 0.3) {
    directive.customInstructions += ' This customer frequently disputes invoices. Double-check all details before sending.';
  }

  return directive;
}
