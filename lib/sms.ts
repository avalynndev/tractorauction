/**
 * Universal SMS Service
 * Supports multiple SMS providers: Twilio, MSG91, TextLocal
 * Automatically falls back if one provider fails
 */

// Twilio
import twilio from "twilio";

// SMS Provider Types
type SMSProvider = "TWILIO" | "MSG91" | "TEXTLOCAL" | "CONSOLE";

interface SMSConfig {
  provider: SMSProvider;
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  msg91?: {
    authKey: string;
    senderId: string;
  };
  textLocal?: {
    apiKey: string;
    senderId: string;
  };
}

/**
 * Get SMS configuration from environment variables
 */
function getSMSConfig(): SMSConfig {
  // Determine which provider to use based on available credentials
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    return {
      provider: "TWILIO",
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      },
    };
  } else if (process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID) {
    return {
      provider: "MSG91",
      msg91: {
        authKey: process.env.MSG91_AUTH_KEY,
        senderId: process.env.MSG91_SENDER_ID,
      },
    };
  } else if (process.env.TEXTLOCAL_API_KEY && process.env.TEXTLOCAL_SENDER_ID) {
    return {
      provider: "TEXTLOCAL",
      textLocal: {
        apiKey: process.env.TEXTLOCAL_API_KEY,
        senderId: process.env.TEXTLOCAL_SENDER_ID,
      },
    };
  } else {
    return { provider: "CONSOLE" };
  }
}

/**
 * Format phone number for India (+91)
 */
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.trim().replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return `91${cleaned}`; // MSG91 and TextLocal use format without +
  }
  return cleaned;
}

/**
 * Send OTP via Twilio
 */
async function sendViaTwilio(config: NonNullable<SMSConfig["twilio"]>, phone: string, otp: string): Promise<boolean> {
  try {
    const client = twilio(config.accountSid, config.authToken);
    const formattedNumber = phone.startsWith("+") ? phone : `+91${phone}`;
    
    const message = `Your Tractor Auction OTP is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
    
    const response = await client.messages.create({
      body: message,
      from: config.phoneNumber,
      to: formattedNumber,
    });
    
    console.log(`✅ [Twilio] OTP sent to ${formattedNumber}. SID: ${response.sid}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [Twilio] Error:`, error.message);
    return false;
  }
}

/**
 * Send OTP via MSG91 (Popular in India)
 */
async function sendViaMSG91(config: NonNullable<SMSConfig["msg91"]>, phone: string, otp: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const message = `Your Tractor Auction OTP is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
    
    // MSG91 OTP API endpoint (simpler, no template required)
    const url = "https://control.msg91.com/api/sendotp.php";
    
    const params = new URLSearchParams({
      authkey: config.authKey,
      message: message,
      sender: config.senderId,
      mobile: formattedPhone,
      otp: otp,
      otp_length: "6",
      otp_expiry: "10", // 10 minutes
    });
    
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
    });
    
    const result = await response.text(); // MSG91 returns plain text
    
    // MSG91 returns "error" or success message
    if (result.includes("error") || result.toLowerCase().includes("invalid")) {
      console.error(`❌ [MSG91] Error:`, result);
      return false;
    } else {
      console.log(`✅ [MSG91] OTP sent to ${formattedPhone}. Response: ${result}`);
      return true;
    }
  } catch (error: any) {
    console.error(`❌ [MSG91] Error:`, error.message);
    return false;
  }
}

/**
 * Send OTP via TextLocal (Popular in India)
 */
async function sendViaTextLocal(config: NonNullable<SMSConfig["textLocal"]>, phone: string, otp: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const message = `Your Tractor Auction OTP is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
    
    // TextLocal API endpoint
    const url = "https://api.textlocal.in/send/";
    
    const formData = new URLSearchParams();
    formData.append("apikey", config.apiKey);
    formData.append("numbers", formattedPhone);
    formData.append("message", message);
    formData.append("sender", config.senderId);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    
    const result = await response.json();
    
    if (result.status === "success") {
      console.log(`✅ [TextLocal] OTP sent to ${formattedPhone}`);
      return true;
    } else {
      console.error(`❌ [TextLocal] Error:`, result.errors?.[0]?.message || "Unknown error");
      return false;
    }
  } catch (error: any) {
    console.error(`❌ [TextLocal] Error:`, error.message);
    return false;
  }
}

/**
 * Send general SMS message (not OTP)
 */
async function sendGeneralSMS(phone: string, message: string): Promise<boolean> {
  const config = getSMSConfig();
  
  console.log(`📱 Attempting to send SMS to ${phone} via ${config.provider}...`);
  
  let success = false;
  
  switch (config.provider) {
    case "TWILIO":
      if (config.twilio) {
        try {
          const client = twilio(config.twilio.accountSid, config.twilio.authToken);
          const formattedNumber = phone.startsWith("+") ? phone : `+91${phone}`;
          
          const response = await client.messages.create({
            body: message,
            from: config.twilio.phoneNumber,
            to: formattedNumber,
          });
          
          console.log(`✅ [Twilio] SMS sent to ${formattedNumber}. SID: ${response.sid}`);
          success = true;
        } catch (error: any) {
          console.error(`❌ [Twilio] Error:`, error.message);
          success = false;
        }
      }
      break;
      
    case "MSG91":
      if (config.msg91) {
        try {
          const formattedPhone = formatPhoneNumber(phone);
          const url = "https://control.msg91.com/api/sendhttp.php";
          
          const params = new URLSearchParams({
            authkey: config.msg91.authKey,
            mobiles: formattedPhone,
            message: message,
            sender: config.msg91.senderId,
            route: "4", // Transactional route
          });
          
          const response = await fetch(`${url}?${params.toString()}`, {
            method: "GET",
          });
          
          const result = await response.text();
          
          if (result && !result.includes("error")) {
            console.log(`✅ [MSG91] SMS sent to ${formattedPhone}`);
            success = true;
          } else {
            console.error(`❌ [MSG91] Error:`, result);
            success = false;
          }
        } catch (error: any) {
          console.error(`❌ [MSG91] Error:`, error.message);
          success = false;
        }
      }
      break;
      
    case "TEXTLOCAL":
      if (config.textLocal) {
        try {
          const formattedPhone = formatPhoneNumber(phone);
          const url = "https://api.textlocal.in/send/";
          
          const formData = new URLSearchParams();
          formData.append("apikey", config.textLocal.apiKey);
          formData.append("numbers", formattedPhone);
          formData.append("message", message);
          formData.append("sender", config.textLocal.senderId);
          
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });
          
          const result = await response.json();
          
          if (result.status === "success") {
            console.log(`✅ [TextLocal] SMS sent to ${formattedPhone}`);
            success = true;
          } else {
            console.error(`❌ [TextLocal] Error:`, result.errors?.[0]?.message || "Unknown error");
            success = false;
          }
        } catch (error: any) {
          console.error(`❌ [TextLocal] Error:`, error.message);
          success = false;
        }
      }
      break;
      
    case "CONSOLE":
      console.log(`[CONSOLE MODE] SMS to ${phone}:\n${message}`);
      success = true;
      break;
  }
  
  // Fallback to other providers if primary fails
  if (!success && config.provider !== "CONSOLE") {
    if (config.provider !== "MSG91" && process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID) {
      try {
        const formattedPhone = formatPhoneNumber(phone);
        const url = "https://control.msg91.com/api/sendhttp.php";
        const params = new URLSearchParams({
          authkey: process.env.MSG91_AUTH_KEY,
          mobiles: formattedPhone,
          message: message,
          sender: process.env.MSG91_SENDER_ID,
          route: "4",
        });
        const response = await fetch(`${url}?${params.toString()}`);
        const result = await response.text();
        if (result && !result.includes("error")) {
          success = true;
        }
      } catch (e) {
        // Ignore fallback errors
      }
    }
  }
  
  return success;
}

/**
 * Send OTP via SMS (Universal function - tries multiple providers)
 * @param phone - Phone number (10 digits for India)
 * @param otp - 6-digit OTP code
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendOTPviaSMS(phone: string, otp: string): Promise<boolean> {
  const config = getSMSConfig();
  
  console.log(`📱 Attempting to send OTP to ${phone} via ${config.provider}...`);
  
  // Try primary provider
  let success = false;
  
  switch (config.provider) {
    case "TWILIO":
      if (config.twilio) {
        success = await sendViaTwilio(config.twilio, phone, otp);
      }
      break;
      
    case "MSG91":
      if (config.msg91) {
        success = await sendViaMSG91(config.msg91, phone, otp);
      }
      break;
      
    case "TEXTLOCAL":
      if (config.textLocal) {
        success = await sendViaTextLocal(config.textLocal, phone, otp);
      }
      break;
      
    case "CONSOLE":
      console.log(`[CONSOLE MODE] OTP for ${phone}: ${otp}`);
      success = true; // Console mode always "succeeds"
      break;
  }
  
  // Fallback: Try other providers if primary fails
  if (!success && config.provider !== "CONSOLE") {
    console.log(`⚠️ Primary provider failed, trying fallbacks...`);
    
    // Try MSG91 as fallback
    if (config.provider !== "MSG91" && process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID) {
      console.log(`Trying MSG91 as fallback...`);
      success = await sendViaMSG91(
        {
          authKey: process.env.MSG91_AUTH_KEY,
          senderId: process.env.MSG91_SENDER_ID,
        },
        phone,
        otp
      );
    }
    
    // Try TextLocal as fallback
    if (!success && config.provider !== "TEXTLOCAL" && process.env.TEXTLOCAL_API_KEY && process.env.TEXTLOCAL_SENDER_ID) {
      console.log(`Trying TextLocal as fallback...`);
      success = await sendViaTextLocal(
        {
          apiKey: process.env.TEXTLOCAL_API_KEY,
          senderId: process.env.TEXTLOCAL_SENDER_ID,
        },
        phone,
        otp
      );
    }
  }
  
  return success;
}

/**
 * Check if any SMS provider is configured
 */
export function isSMSConfigured(): boolean {
  const config = getSMSConfig();
  return config.provider !== "CONSOLE";
}

/**
 * Get SMS provider status (for debugging)
 */
export function getSMSStatus() {
  const config = getSMSConfig();
  return {
    provider: config.provider,
    configured: config.provider !== "CONSOLE",
    hasTwilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
    hasMSG91: !!(process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID),
    hasTextLocal: !!(process.env.TEXTLOCAL_API_KEY && process.env.TEXTLOCAL_SENDER_ID),
  };
}

/**
 * Send general SMS message (for notifications, alerts, etc.)
 * @param phone - Phone number (10 digits for India)
 * @param message - Message text
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendSMSMessage(phone: string, message: string): Promise<boolean> {
  return await sendGeneralSMS(phone, message);
}

// Export for backward compatibility (if code still uses old Twilio functions)
export { isSMSConfigured as isTwilioConfigured };

