import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export interface PromiseExtraction {
  hasPromise: boolean;
  promisedAmount: number | null;
  promisedDate: string | null; // ISO date string
  confidence: number;
  reasoning: string;
}

export async function extractPromise(
  emailBody: string,
  invoiceAmount: number,
  invoiceNumber: string
): Promise<PromiseExtraction> {
  const systemPrompt = `You are an expert AR (Accounts Receivable) Collections AI.
Your task is to analyze a customer email reply and determine if the customer is making a promise to pay.

If a promise is detected, extract:
1. The promised amount (if mentioned; otherwise assume the full invoice amount)
2. The promised date (if mentioned; otherwise null)

Context:
- Invoice: ${invoiceNumber}
- Outstanding Amount: $${invoiceAmount.toFixed(2)}

Rules:
- "I'll pay next week" → promisedDate = next Monday from today (estimate as best you can)
- "We'll send a check Friday" → promisedDate = this coming Friday
- "Paying half now" → promisedAmount = half of invoice amount
- Vague statements like "we'll look into it" are NOT promises
- "Out of office" replies are NOT promises
- If they say they already paid, that's NOT a promise (that's 'already_paid' classification)

Return the result as strictly formatted JSON:
{
  "hasPromise": true/false,
  "promisedAmount": number or null,
  "promisedDate": "YYYY-MM-DD" or null,
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of why this is/isn't a promise"
}`;

  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: `Analyze this email for payment promises:\n\n"${emailBody}"\n\nToday's date: ${new Date().toISOString().split('T')[0]}. Only output valid JSON.`,
  });

  try {
    const result = JSON.parse(text);
    return {
      hasPromise: result.hasPromise ?? false,
      promisedAmount: result.promisedAmount ?? null,
      promisedDate: result.promisedDate ?? null,
      confidence: result.confidence ?? 0.5,
      reasoning: result.reasoning ?? 'Failed to parse reasoning.',
    };
  } catch (e) {
    console.error('Failed to parse LLM promise extraction response:', e);
    return {
      hasPromise: false,
      promisedAmount: null,
      promisedDate: null,
      confidence: 0,
      reasoning: 'LLM returned malformed JSON.',
    };
  }
}
