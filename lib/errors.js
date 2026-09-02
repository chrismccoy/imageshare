/**
 * Domain-specific error types.
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 422);
  }
}

class RateLimitError extends AppError {
  constructor(windowMs) {
    const minutes = Math.ceil(windowMs / 60000);
    super(
      `You've hit the rate limit. Please try again in ${minutes} minutes.`,
      429
    );
  }
}

module.exports = { AppError, NotFoundError, ValidationError, RateLimitError };
