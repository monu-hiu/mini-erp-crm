import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { loginUser, registerUser, signupUser } from './auth.service';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.status(200).json({ success: true, data: result });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.status(201).json({ success: true, data: result });
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await signupUser(req.body);
  res.status(201).json({ success: true, data: result });
});

// Returns the currently logged-in user's info based on the JWT.
export const me = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: req.user });
});
