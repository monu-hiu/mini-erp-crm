import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required.'),
    password: z.string().min(1, 'Password is required.'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

// Used by an authenticated ADMIN creating any user, including other admins.
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('A valid email is required.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

// Used by the PUBLIC self-signup form. Deliberately excludes ADMIN so an
// anonymous visitor can never grant themselves admin access -- Admin
// accounts are created only via the seed script or by an existing Admin
// through the /auth/register endpoint above.
export const publicSignupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('A valid email is required.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    role: z.enum(['SALES', 'WAREHOUSE', 'ACCOUNTS']),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type PublicSignupInput = z.infer<typeof publicSignupSchema>['body'];
