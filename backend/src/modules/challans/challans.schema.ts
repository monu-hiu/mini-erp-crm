import { z } from 'zod';

const challanItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0.'),
});

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.coerce.number().int().positive('A customer must be selected.'),
    items: z.array(challanItemSchema).min(1, 'At least one product must be added.'),
    status: z.enum(['DRAFT', 'CONFIRMED']).optional().default('DRAFT'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateChallanSchema = z.object({
  body: z.object({
    items: z.array(challanItemSchema).min(1).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const listChallansSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
    customerId: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
});

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});
