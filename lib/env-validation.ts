import { z } from 'zod';

/**
 * Environment variable validation schema
 * This ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Cloudinary (optional but recommended)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // Twilio (optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Razorpay (optional)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(), // Webhook secret from Razorpay dashboard
  
  // CSRF
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters long').optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * Throws error if validation fails
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(
        `❌ Environment variable validation failed:\n${missingVars}\n\n` +
        `Please check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

// Validate on module load (only in production or when explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_ENV === 'true') {
  validateEnv();
}

// Export validated env (will throw if validation fails in production)
export const env: Env = process.env as Env;

/**
 * Get environment variable with validation
 * Use this for optional variables that need validation
 */
export function getEnvVar(key: keyof Env, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

/**
 * Check if all required environment variables are set
 */
export function validateEnvironmentVariables(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    envSchema.parse(process.env);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
    }
    return { valid: false, errors };
  }
}

