import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required.'),
    sku: z.string().min(1, 'SKU/code is required.'),
    category: z.string().optional(),
    unitPrice: z.coerce.number().nonnegative('Unit price cannot be negative.'),
    currentStock: z.coerce.number().int().nonnegative().optional().default(0),
    minStockAlert: z.coerce.number().int().nonnegative().optional().default(0),
    location: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.omit({ currentStock: true }).partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const listProductsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().optional(),
    category: z.string().optional(),
    lowStockOnly: z.coerce.boolean().optional().default(false),
  }),
  params: z.object({}).optional(),
});

// Stock movement is the ONLY way stock quantity should change outside
// of a confirmed challan -- this keeps every change auditable.
export const stockMovementSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().positive('Quantity must be a positive number.'),
    movementType: z.enum(['IN', 'OUT']),
    reason: z.string().min(1, 'A reason is required for every stock movement.'),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});
