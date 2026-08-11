/**
 * Standard operational error. Throw this anywhere in a controller/service
 * and the global error handler will turn it into a clean JSON response
 * with the right HTTP status code.
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
