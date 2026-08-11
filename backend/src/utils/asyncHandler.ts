import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express handler so any thrown error / rejected promise
 * is automatically passed to next(), reaching the global error handler
 * instead of crashing the process or being silently swallowed.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
