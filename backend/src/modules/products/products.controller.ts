import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as productService from './products.service';

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.listProducts(req.query as any);
  res.status(200).json({ success: true, ...result });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(Number(req.params.id));
  res.status(200).json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(Number(req.params.id), req.body);
  res.status(200).json({ success: true, data: product });
});

export const recordStockMovement = asyncHandler(async (req: Request, res: Response) => {
  const { quantity, movementType, reason } = req.body;
  const result = await productService.recordStockMovement(
    Number(req.params.id),
    quantity,
    movementType,
    reason,
    req.user!.userId
  );
  res.status(201).json({ success: true, data: result });
});
