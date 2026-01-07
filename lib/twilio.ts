import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Only initialize client if credentials are provided
const client = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null;

/**
 * Send OTP via SMS using Twilio
 * @param to - Phone number to send OTP to (with country code, e.g., +91XXXXXXXXXX)
 * @param otp - 6-digit OTP code
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendOTPviaSMS(to: string, otp: string): Promise<boolean> {
  try {
    // Check if Twilio is configured
    if (!client || !phoneNumber) {
      console.warn("Twilio is not configured. OTP not sent via SMS.");
      return false;
    }

    // Format phone number (ensure it starts with +91 for India)
    let formattedNumber = to.trim();
    if (!formattedNumber.startsWith("+")) {
      // Add +91 if it's a 10-digit Indian number
      if (formattedNumber.length === 10 && /^[6-9]\d{9}$/.test(formattedNumber)) {
        formattedNumber = `+91${formattedNumber}`;
      } else {
        console.error(`Invalid phone number format: ${to}`);
        return false;
      }
    }

    // OTP message template
    const message = `Your Tractor Auction OTP is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

    // Send SMS via Twilio
    console.log(`Attempting to send OTP to ${formattedNumber} from ${phoneNumber}...`);
    
    const messageResponse = await client.messages.create({
      body: message,
      from: phoneNumber,
      to: formattedNumber,
    });

    console.log(`✅ OTP sent successfully to ${formattedNumber}. Message SID: ${messageResponse.sid}`);
    console.log(`Message Status: ${messageResponse.status}`);
    return true;
  } catch (error: any) {
    console.error("❌ Error sending OTP via Twilio:", error);
    
    // Log specific error details
    if (error.code) {
      console.error(`Twilio Error Code: ${error.code}`);
      console.error(`Twilio Error Message: ${error.message}`);
      
      // Common error codes and messages
      if (error.code === 21211) {
        console.error("Invalid 'To' phone number. Check phone number format.");
      } else if (error.code === 21212) {
        console.error("Invalid 'From' phone number. Check Twilio phone number in .env");
      } else if (error.code === 21608) {
        console.error("Unverified phone number. For trial accounts, verify the number first.");
      } else if (error.code === 21408) {
        console.error("Permission denied. Check Twilio account permissions.");
      }
    }
    
    // Re-throw error with more context
    throw new Error(`Twilio SMS failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Check if Twilio is properly configured
 */
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && phoneNumber);
}

/**
 * Get Twilio configuration status (for debugging)
 */
export function getTwilioStatus() {
  return {
    configured: isTwilioConfigured(),
    hasAccountSid: !!accountSid,
    hasAuthToken: !!authToken,
    hasPhoneNumber: !!phoneNumber,
  };
}

