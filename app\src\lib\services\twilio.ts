import twilio from 'twilio';

// Initialize the Twilio client if credentials are provided in the environment
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'mock_sid';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'mock_token';
const defaultFromNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

// In a real production environment, you'd instantiate the client:
// const client = twilio(accountSid, authToken);

export async function sendSMS(to: string, body: string, fromNumber: string = defaultFromNumber) {
  try {
    // For MVP/Demo purposes, we will mock the SMS sending if mock credentials are used
    if (accountSid === 'mock_sid') {
      console.log(`[MOCK TWILIO] Sending SMS to ${to} from ${fromNumber}`);
      console.log(`[MOCK TWILIO] Body: ${body}`);
      return { success: true, messageId: 'mock_msg_id', status: 'queued' };
    }

    // Real implementation
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: body,
      from: fromNumber,
      to: to
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('[TWILIO ERROR] Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Twilio error'
    };
  }
}
