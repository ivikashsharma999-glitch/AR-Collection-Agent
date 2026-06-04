import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export type ClassificationType = 
  | 'promise_to_pay' 
  | 'dispute' 
  | 'already_paid' 
  | 'partial_pay' 
  | 'no_intent' 
  | 'unclear' 
  | 'opt_out';

export interface ClassifierResult {
  classification: ClassificationType;
  confidenceScore: number;
  intentDetail: string;
}

export async function classifyReply(emailBody: string): Promise<ClassifierResult> {
  const systemPrompt = `You are an expert AR (Accounts Receivable) Collections AI.
Your task is to read an inbound customer email reply and classify their intent into exactly one of the following 7 categories:

1. "promise_to_pay" (e.g., "I will pay on Friday", "Sending a check next week")
2. "dispute" (e.g., "This amount is wrong", "We never received this service", "I need to talk to my rep")
3. "already_paid" (e.g., "We paid this yesterday", "Check was sent on the 1st")
4. "partial_pay" (e.g., "I can only pay half now", "Paying $500 today")
5. "no_intent" (e.g., "We don't have the funds", "We are going bankrupt", refusing to pay)
6. "opt_out" (e.g., "Stop emailing me", "Remove me from this list")
7. "unclear" (e.g., "Out of office", "Who is this?", generic questions)

Return the result as a strictly formatted JSON object:
{
  "classification": "one of the 7 exact string values above",
  "confidenceScore": a number between 0.0 and 1.0 representing your confidence,
  "intentDetail": "A brief 1-sentence summary explaining why you chose this classification based on the text."
}`;

  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: `Classify this email:\n\n"${emailBody}"\n\nOnly output valid JSON.`,
  });

  try {
    const result = JSON.parse(text);
    return {
      classification: result.classification || 'unclear',
      confidenceScore: result.confidenceScore || 0.5,
      intentDetail: result.intentDetail || 'Failed to parse reasoning.',
    };
  } catch (e) {
    console.error('Failed to parse LLM classification response:', e);
    return {
      classification: 'unclear',
      confidenceScore: 0,
      intentDetail: 'LLM returned malformed JSON.',
    };
  }
}
