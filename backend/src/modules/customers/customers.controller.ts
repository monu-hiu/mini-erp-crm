import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as customerService from './customers.service';

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.listCustomers(req.query as any);
  res.status(200).json({ success: true, ...result });
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerById(Number(req.params.id));
  res.status(200).json({ success: true, data: customer });
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(req.body, req.user!.userId);
  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(Number(req.params.id), req.body);
  res.status(200).json({ success: true, data: customer });
});

export const addFollowUpNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await customerService.addFollowUpNote(
    Number(req.params.id),
    req.body.note,
    req.user!.userId
  );
  res.status(201).json({ success: true, data: note });
});
