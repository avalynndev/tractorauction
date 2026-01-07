import sanitizeHtml from 'sanitize-html';

// For client-side, we'll use sanitize-html in both cases
// DOMPurify can be added later if needed for client-side specific use

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify for client-side and sanitize-html for server-side
 */

/**
 * Server-side HTML sanitization
 * Use this in API routes and server components
 */
export function sanitizeHtmlServer(html: string, options?: sanitizeHtml.IOptions): string {
  const defaultOptions: sanitizeHtml.IOptions = {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target'],
      'code': ['class'],
      'pre': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      'a': ['http', 'https', 'mailto']
    },
    // Remove all script tags and event handlers
    disallowedTagsMode: 'discard',
    // Strip all HTML if it contains dangerous content
    enforceHtmlBoundary: true,
  };

  return sanitizeHtml(html, { ...defaultOptions, ...options });
}

/**
 * Client-side HTML sanitization
 * Use this in client components
 * Note: In Next.js, server-side sanitization works for both server and client
 */
export function sanitizeHtmlClient(html: string): string {
  // Use same sanitization as server-side for consistency
  return sanitizeHtmlServer(html);
}

/**
 * Sanitize plain text (removes all HTML)
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Sanitize user input for database storage
 * Removes potentially dangerous characters and normalizes whitespace
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  // Remove potentially dangerous patterns
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized;
}

/**
 * Sanitize vehicle description or other rich text fields
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtmlServer(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
    allowedAttributes: {},
  });
}

/**
 * Sanitize URL to prevent XSS via href attributes
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // Only allow http, https, and mailto
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  try {
    const parsedUrl = new URL(url);
    if (allowedProtocols.includes(parsedUrl.protocol)) {
      return url;
    }
  } catch {
    // Invalid URL, return empty string
  }
  
  return '';
}

