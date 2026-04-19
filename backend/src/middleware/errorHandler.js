/**
 * DispatchIQ — Error Handling Middleware
 */

/**
 * Custom application error with HTTP status code.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Validation error (400).
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

/**
 * Not found error (404).
 */
export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`, 404);
  }
}

/**
 * Conflict error (409) — e.g., driver already assigned.
 */
export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

/**
 * Compliance error (422) — e.g., HOS violation would occur.
 */
export class ComplianceError extends AppError {
  constructor(message, details = null) {
    super(message, 422, details);
  }
}

/**
 * Express error handling middleware.
 * Place this LAST in the middleware chain.
 */
export function errorHandler(err, req, res, _next) {
  // Log the error
  const timestamp = new Date().toISOString();
  if (err.isOperational) {
    console.error(`[${timestamp}] ${err.statusCode} — ${err.message}`);
  } else {
    console.error(`[${timestamp}] UNHANDLED ERROR:`, err);
  }

  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      message: err.isOperational ? err.message : 'Internal server error',
      code: statusCode,
      ...(err.details && { details: err.details }),
    },
    timestamp,
  };

  res.status(statusCode).json(response);
}

/**
 * Async route handler wrapper — catches errors and forwards to errorHandler.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
