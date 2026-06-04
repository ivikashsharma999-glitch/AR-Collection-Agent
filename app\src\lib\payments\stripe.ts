// ============================================
// Payment Link Generator (Stripe Mock for MVP)
// ============================================

export interface PaymentLinkParams {
  orgId: string;
  customerId: string;
  invoiceId: string;
  amountDue: number;
}

/**
 * Generates a checkout link for an invoice.
 * For the MVP, this returns a mocked Stripe test URL.
 * In production, this would call the Stripe API to create a PaymentIntent or Checkout Session.
 */
export async function generatePaymentLink(params: PaymentLinkParams): Promise<string> {
  // In a real implementation:
  // const session = await stripe.checkout.sessions.create({ ... })
  // return session.url;
  
  // Create a realistic-looking mock URL that embeds the invoice info for demo purposes
  const encodedAmount = encodeURIComponent(params.amountDue.toFixed(2));
  const mockUrl = `https://checkout.stripe.com/pay/cs_test_mock_${params.invoiceId}?amount=${encodedAmount}`;
  
  // We simulate a slight network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockUrl;
}
