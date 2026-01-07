/**
 * Error handling utilities for consistent error management across the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "You don't have permission to perform this action") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Handles errors in API routes and returns appropriate responses
 */
export function handleApiError(error: unknown): Response {
  // Log error for debugging
  console.error("API Error:", error);

  // Handle known error types
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
        ...(error instanceof ValidationError && { fields: error.fields }),
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    const fields: Record<string, string[]> = {};
    
    zodError.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path].push(issue.message);
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        fields,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: any };
    
    switch (prismaError.code) {
      case "P2002":
        return new Response(
          JSON.stringify({
            success: false,
            message: "A record with this information already exists",
            code: "DUPLICATE_ENTRY",
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      case "P2025":
        return new Response(
          JSON.stringify({
            success: false,
            message: "Record not found",
            code: "NOT_FOUND",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      default:
        break;
    }
  }

  // Handle network/connection errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Network error. Please check your connection and try again.",
        code: "NETWORK_ERROR",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Generic error handler
  const errorMessage =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred. Please try again.";

  return new Response(
    JSON.stringify({
      success: false,
      message: process.env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again."
        : errorMessage,
      code: "INTERNAL_ERROR",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Gets user-friendly error message from API response
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message: string };
    return err.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return error.message.includes("fetch") || error.message.includes("network");
  }
  return false;
}

/**
 * Checks if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof ValidationError;
}

/**
 * Checks if error is an authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}





















