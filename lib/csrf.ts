import { randomBytes, createHmac } from 'crypto';

/**
 * CSRF Protection Utilities
 * Generates and validates CSRF tokens to prevent cross-site request forgery attacks
 */

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'default-csrf-secret-change-in-production';

/**
 * Generate a CSRF token
 * @param sessionId - Optional session identifier
 * @returns CSRF token
 */
export function generateCsrfToken(sessionId?: string): string {
  const random = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const data = `${random}:${timestamp}${sessionId ? `:${sessionId}` : ''}`;
  
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(data);
  const signature = hmac.digest('hex');
  
  return `${random}:${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token
 * @param token - CSRF token to validate
 * @param sessionId - Optional session identifier
 * @param maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns true if token is valid
 */
export function validateCsrfToken(
  token: string,
  sessionId?: string,
  maxAge: number = 3600000 // 1 hour
): boolean {
  if (!token) return false;
  
  const parts = token.split(':');
  if (parts.length < 3) return false;
  
  const [random, timestamp, signature] = parts;
  
  // Check token age
  const tokenAge = Date.now() - parseInt(timestamp, 10);
  if (tokenAge > maxAge || tokenAge < 0) {
    return false; // Token expired or invalid timestamp
  }
  
  // Recreate signature
  const data = `${random}:${timestamp}${sessionId ? `:${sessionId}` : ''}`;
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(data);
  const expectedSignature = hmac.digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Get CSRF token from request headers
 */
export function getCsrfTokenFromHeader(request: Request): string | null {
  return request.headers.get('X-CSRF-Token') || 
         request.headers.get('X-Csrf-Token') || 
         null;
}

/**
 * Get CSRF token from request body (for form submissions)
 */
export async function getCsrfTokenFromBody(request: Request): Promise<string | null> {
  try {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      return body._csrf || body.csrfToken || null;
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      return formData.get('_csrf') as string || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Middleware helper to validate CSRF token
 */
export async function validateCsrfRequest(
  request: Request,
  sessionId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }
  
  // Get token from header or body
  const tokenFromHeader = getCsrfTokenFromHeader(request);
  const tokenFromBody = await getCsrfTokenFromBody(request);
  const token = tokenFromHeader || tokenFromBody;
  
  if (!token) {
    return { valid: false, error: 'CSRF token missing' };
  }
  
  if (!validateCsrfToken(token, sessionId)) {
    return { valid: false, error: 'Invalid CSRF token' };
  }
  
  return { valid: true };
}
