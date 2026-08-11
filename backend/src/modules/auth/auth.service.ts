import bcrypt from 'bcryptjs';
import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';
import { signToken } from '../../utils/jwt';
import { LoginInput, RegisterInput, PublicSignupInput } from './auth.schema';

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    // Same message for "not found" and "wrong password" -- don't leak
    // which emails exist in the system.
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Only an already-authenticated ADMIN should be able to call this in
 * production (wired up that way in auth.routes.ts). Kept separate from
 * login so seeding/admin-creation logic stays in one place.
 */
export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('A user with this email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Public self-signup. Deliberately shares the same uniqueness/hashing
 * logic as registerUser, but is only ever called with a role that Zod
 * has already restricted to non-admin values (see publicSignupSchema).
 */
export async function signupUser(input: PublicSignupInput) {
  return registerUser(input);
}
