import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as challanService from './challans.service';

export const listChallans = asyncHandler(async (req: Request, res: Response) => {
  const result = await challanService.listChallans(req.query as any);
  res.status(200).json({ success: true, ...result });
});

export const getChallan = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.getChallanById(Number(req.params.id));
  res.status(200).json({ success: true, data: challan });
});

export const createChallan = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.createChallan(req.body, req.user!.userId);
  res.status(201).json({ success: true, data: challan });
});

export const updateChallan = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.updateChallan(Number(req.params.id), req.body.items);
  res.status(200).json({ success: true, data: challan });
});

export const confirmChallan = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.confirmChallan(Number(req.params.id), req.user!.userId);
  res.status(200).json({ success: true, data: challan });
});

export const cancelChallan = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.cancelChallan(Number(req.params.id), req.user!.userId);
  res.status(200).json({ success: true, data: challan });
});
