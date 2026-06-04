import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { DisputeReasonTag } from '@/types';

export interface DisputeDetection {
  isDispute: boolean;
  reasonTag: DisputeReasonTag | null;
  description: string | null;
  confidence: number;
  shouldPauseReminders: boolean;
  suggestedAction: string;
}

export async function detectDispute(
  emailBody: string,
  invoiceNumber: string,
  customerName: string
): Promise<DisputeDetection> {
  const systemPrompt = `You are an expert AR (Accounts Receivable) Collections AI.
Your task is to analyze a customer email reply and determine if the customer is raising a dispute about an invoice.

Dispute Reason Tags:
1. "pricing_error" — Customer claims incorrect pricing, wrong amounts, unauthorized charges
2. "already_paid" — Customer claims they already sent payment
3. "service_issue" — Customer is disputing due to service problems, downtime, quality issues
4. "contract_dispute" — Customer disputes contract terms, auto-renewal, scope of agreement
5. "wrong_contact" — Invoice sent to the wrong person/company, needs reassignment
6. "other" — Any other dispute reason not covered above

Context:
- Invoice: ${invoiceNumber}
- Customer: ${customerName}

Rules:
- A dispute ALWAYS means reminders should be paused
- Generate a clear, concise description of the dispute for the internal team
- Even mild pushback like "this doesn't look right" counts as a dispute signal
- "We need to verify this with our team" is NOT a dispute — it's a process delay
- Provide a suggested next action for the human reviewer

Return the result as strictly formatted JSON:
{
  "isDispute": true/false,
  "reasonTag": "one of the 6 tags above" or null,
  "description": "Internal description of the dispute for the team" or null,
  "confidence": 0.0 to 1.0,
  "shouldPauseReminders": true/false,
  "suggestedAction": "What should the human reviewer do next"
}`;

  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: `Analyze this email for dispute signals:\n\n"${emailBody}"\n\nOnly output valid JSON.`,
  });

  try {
    const result = JSON.parse(text);
    return {
      isDispute: result.isDispute ?? false,
      reasonTag: result.reasonTag ?? null,
      description: result.description ?? null,
      confidence: result.confidence ?? 0.5,
      shouldPauseReminders: result.shouldPauseReminders ?? false,
      suggestedAction: result.suggestedAction ?? 'Review the reply manually.',
    };
  } catch (e) {
    console.error('Failed to parse LLM dispute detection response:', e);
    return {
      isDispute: false,
      reasonTag: null,
      description: null,
      confidence: 0,
      shouldPauseReminders: false,
      suggestedAction: 'LLM parsing failed — review manually.',
    };
  }
}
