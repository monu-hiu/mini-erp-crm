import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
}

export async function listCustomers(params: ListParams) {
  const { page, limit, search, status, customerType } = params;

  const where: any = {
    ...(status && { status }),
    ...(customerType && { customerType }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
        { businessName: { contains: search } },
      ],
    }),
  };

  const [total, customers] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerById(id: number) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { id: true, name: true } } },
      },
      challans: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, challanNumber: true, status: true, totalQuantity: true, createdAt: true },
      },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }
  return customer;
}

export async function createCustomer(data: any, createdById: number) {
  const { notes, ...customerData } = data;

  return prisma.customer.create({
    data: {
      ...customerData,
      email: customerData.email || null,
      // If an initial note was provided, create it in the same write.
      ...(notes && {
        notes: {
          create: [{ note: notes, createdById }],
        },
      }),
    },
    include: { notes: true },
  });
}

export async function updateCustomer(id: number, data: any) {
  await getCustomerById(id); // 404s if missing

  return prisma.customer.update({
    where: { id },
    data: {
      ...data,
      ...(data.email !== undefined && { email: data.email || null }),
    },
  });
}

export async function addFollowUpNote(customerId: number, note: string, createdById: number) {
  await getCustomerById(customerId); // 404s if missing

  return prisma.followUpNote.create({
    data: { customerId, note, createdById },
    include: { createdBy: { select: { id: true, name: true } } },
  });
}
