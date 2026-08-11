import { z } from 'zod';

const customerTypeEnum = z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']);
const customerStatusEnum = z.enum(['LEAD', 'ACTIVE', 'INACTIVE']);

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name is required.'),
    mobile: z.string().min(7, 'A valid mobile number is required.'),
    email: z.string().email().optional().or(z.literal('')),
    businessName: z.string().optional(),
    gstNumber: z.string().optional(),
    customerType: customerTypeEnum,
    address: z.string().optional(),
    status: customerStatusEnum.optional().default('LEAD'),
    followUpDate: z.coerce.date().optional(),
    notes: z.string().optional(), // optional initial note
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateCustomerSchema = z.object({
  body: createCustomerSchema.shape.body.partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const listCustomersSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().optional(), // matches name, mobile, email, business name
    status: customerStatusEnum.optional(),
    customerType: customerTypeEnum.optional(),
  }),
  params: z.object({}).optional(),
});

export const addFollowUpNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note text is required.'),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
});
