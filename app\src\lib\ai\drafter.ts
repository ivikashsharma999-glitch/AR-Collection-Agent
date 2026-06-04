import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { type ToneDirective } from './tone-adapter';
import { generatePaymentLink } from '@/lib/payments/stripe';

export interface DrafterInput {
  customerName: string;
  invoiceNumber: string;
  amountDue: number;
  daysOverdue: number;
  tone: 'soft' | 'professional' | 'firm' | 'escalation';
  reasoning: string;
  previousInteractions?: string;
}

// ── Enhanced input that accepts a ToneDirective from the diagnosis engine ──
export interface IntelligentDrafterInput {
  customerName: string;
  invoiceNumber: string;
  amountDue: number;
  daysOverdue: number;
  totalOutstanding: number;
  toneDirective: ToneDirective;
  diagnosisReasoning: string;
  previousInteractions?: string;
}

export async function draftReminderEmail(input: DrafterInput): Promise<{ subject: string; body: string }> {
  const systemPrompt = `You are an expert AR (Accounts Receivable) Collections AI.
Your goal is to draft a collection email that is highly professional, concise, and optimized for getting paid while preserving the client relationship.
Adhere strictly to the requested tone: ${input.tone}.

Tone Guidelines:
- soft: Gentle reminder, assume they just forgot, very polite.
- professional: Direct but polite, standard business communication.
- firm: Urgent, serious, clear deadlines.
- escalation: Very serious, warning of service suspension or legal action.

Input Data:
Customer: ${input.customerName}
Invoice: ${input.invoiceNumber}
Amount: $${input.amountDue.toFixed(2)}
Days Overdue: ${input.daysOverdue}
Reasoning for this draft: ${input.reasoning}

Output the response exactly in this JSON format:
{
  "subject": "The email subject line",
  "body": "The full email body. Use formatting like paragraphs but keep it plain text style."
}`;

  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: 'Draft the email now. Only output valid JSON.',
  });

  try {
    const result = JSON.parse(text);
    return {
      subject: result.subject || `Regarding Invoice ${input.invoiceNumber}`,
      body: result.body || text,
    };
  } catch (e) {
    console.error('Failed to parse LLM drafting response:', e);
    return {
      subject: `Regarding Invoice ${input.invoiceNumber}`,
      body: text,
    };
  }
}

// ── Intelligent Drafter: Uses ToneDirective from diagnosis engine ──

export async function draftIntelligentEmail(input: IntelligentDrafterInput): Promise<{ subject: string; body: string }> {
  const td = input.toneDirective;

  const toneInstructions = [
    `TONE: ${td.tone}`,
    `OPENING STYLE: ${td.openingStyle}`,
    `CLOSING STYLE: ${td.closingStyle}`,
    td.offerPaymentPlan ? 'OFFER PAYMENT PLAN: Yes — proactively offer to split the balance into installments.' : '',
    td.offerDiscount ? 'OFFER EARLY SETTLEMENT DISCOUNT: Yes — mention a small discount for prompt payment.' : '',
    td.mentionEscalation ? 'MENTION ESCALATION: Yes — mention that continued non-response may require escalation.' : '',
    td.suppressUrgency ? 'SUPPRESS URGENCY: Yes — avoid words like "immediately", "urgent", "overdue", "final notice".' : '',
    td.customInstructions ? `ADDITIONAL INSTRUCTIONS: ${td.customInstructions}` : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are an expert AR (Accounts Receivable) Collections AI.
Your goal is to draft a collection email that gets paid while preserving the client relationship.

CRITICAL TONE DIRECTIVES (follow these exactly):
${toneInstructions}

Input Data:
Customer: ${input.customerName}
Invoice: ${input.invoiceNumber}
Amount Due: $${input.amountDue.toFixed(2)}
Days Overdue: ${input.daysOverdue}
Total Outstanding: $${input.totalOutstanding.toFixed(2)}
Diagnosis: ${input.diagnosisReasoning}

RULES:
1. Never use threatening legal language unless explicitly instructed.
2. Never include specific account numbers or sensitive data.
3. Always include a clear call-to-action.
4. Keep the email under 200 words.
5. Sign off as the company — not as an AI.

Output the response exactly in this JSON format:
{
  "subject": "The email subject line",
  "body": "The full email body in plain text."
}`;

  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: 'Draft the email now. Only output valid JSON.',
  });

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    
    let finalBody = result.body || text;

    // ── Inject Payment Link ──
    // If the email is asking for payment (not a dispute/apology), we append the Pay Now link.
    if (td.tone !== 'apologetic' && input.diagnosisReasoning !== 'genuine_dispute') {
      const paymentLink = await generatePaymentLink({
        orgId: 'mock-org-id', // In a real app, pass this down
        customerId: 'mock-customer-id',
        invoiceId: input.invoiceNumber,
        amountDue: input.amountDue,
      });
      
      finalBody += `\n\n---\n💳 Pay securely online: ${paymentLink}`;
    }

    return {
      subject: result.subject || `Regarding Invoice ${input.invoiceNumber}`,
      body: finalBody,
    };
  } catch (e) {
    console.error('Failed to parse intelligent drafter response:', e);
    return {
      subject: `Regarding Invoice ${input.invoiceNumber}`,
      body: text,
    };
  }
}

