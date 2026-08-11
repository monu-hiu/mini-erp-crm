import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Validates req.body/query/params against a Zod schema.
 * On failure the ZodError is thrown and caught by the global error handler,
 * which returns a 422 with per-field messages.
 * On success, req.body etc. is replaced with the *parsed* (typed, defaulted) data.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.body = parsed.body ?? req.body;
    req.query = parsed.query ?? req.query;
    req.params = parsed.params ?? req.params;
    next();
  };
}
