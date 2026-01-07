import crypto from "crypto";

/**
 * Database Encryption at Rest
 * Encrypts sensitive fields before storing in database
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "default-encryption-key-change-in-production";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Derive encryption key from secret
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  if (!text) {
    return text;
  }

  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(ENCRYPTION_KEY, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    return (
      salt.toString("hex") +
      ":" +
      iv.toString("hex") +
      ":" +
      tag.toString("hex") +
      ":" +
      encrypted
    );
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted data format");
    }

    const salt = Buffer.from(parts[0], "hex");
    const iv = Buffer.from(parts[1], "hex");
    const tag = Buffer.from(parts[2], "hex");
    const encrypted = parts[3];

    const key = deriveKey(ENCRYPTION_KEY, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash sensitive data (one-way, for fields that don't need decryption)
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash("sha256").update(data + ENCRYPTION_KEY).digest("hex");
}

/**
 * Encrypt PII (Personally Identifiable Information)
 */
export function encryptPII(data: {
  phoneNumber?: string;
  email?: string;
  address?: string;
  panCard?: string;
  aadharCard?: string;
}): {
  phoneNumber?: string;
  email?: string;
  address?: string;
  panCard?: string;
  aadharCard?: string;
} {
  const encrypted: any = {};
  
  if (data.phoneNumber) encrypted.phoneNumber = encrypt(data.phoneNumber);
  if (data.email) encrypted.email = encrypt(data.email);
  if (data.address) encrypted.address = encrypt(data.address);
  if (data.panCard) encrypted.panCard = encrypt(data.panCard);
  if (data.aadharCard) encrypted.aadharCard = encrypt(data.aadharCard);
  
  return encrypted;
}

/**
 * Decrypt PII
 */
export function decryptPII(data: {
  phoneNumber?: string;
  email?: string;
  address?: string;
  panCard?: string;
  aadharCard?: string;
}): {
  phoneNumber?: string;
  email?: string;
  address?: string;
  panCard?: string;
  aadharCard?: string;
} {
  const decrypted: any = {};
  
  if (data.phoneNumber) decrypted.phoneNumber = decrypt(data.phoneNumber);
  if (data.email) decrypted.email = decrypt(data.email);
  if (data.address) decrypted.address = decrypt(data.address);
  if (data.panCard) decrypted.panCard = decrypt(data.panCard);
  if (data.aadharCard) decrypted.aadharCard = decrypt(data.aadharCard);
  
  return decrypted;
}

