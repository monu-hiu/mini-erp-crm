import { Router } from 'express';
import { login, register, signup, me } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema, registerSchema, publicSignupSchema } from './auth.schema';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// POST /auth/login - public
router.post('/login', validate(loginSchema), login);

// POST /auth/signup - PUBLIC self-signup. Role is restricted to
// SALES/WAREHOUSE/ACCOUNTS at the schema level so no one can grant
// themselves Admin access through this route.
router.post('/signup', validate(publicSignupSchema), signup);

// POST /auth/register - only an existing ADMIN can create new users,
// including other Admins. Use this (or the seed script) to create admins.
router.post('/register', authenticate, authorize('ADMIN'), validate(registerSchema), register);

// GET /auth/me - whoami, any authenticated user
router.get('/me', authenticate, me);

export default router;
