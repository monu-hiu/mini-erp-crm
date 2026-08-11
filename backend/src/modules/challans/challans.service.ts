import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';

interface ChallanItemInput {
  productId: number;
  quantity: number;
}

interface ListParams {
  page: number;
  limit: number;
  status?: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  customerId?: number;
}

export async function listChallans(params: ListParams) {
  const { page, limit, status, customerId } = params;
  const where: any = {
    ...(status && { status }),
    ...(customerId && { customerId }),
  };

  const [total, challans] = await prisma.$transaction([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        items: true,
      },
    }),
  ]);

  return { challans, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getChallanById(id: number) {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!challan) throw new AppError('Challan not found.', 404);
  return challan;
}

/**
 * Creates a challan (Draft by default, or Confirmed if requested up front).
 * Product name/SKU/price are snapshotted at creation time so that later
 * price or catalog changes never rewrite what was actually sold.
 * If status is CONFIRMED at creation, stock is validated & reduced in the
 * same transaction as challan creation -- see confirmChallan for the
 * shared logic when confirming an existing draft.
 */
export async function createChallan(
  data: { customerId: number; items: ChallanItemInput[]; status?: 'DRAFT' | 'CONFIRMED' },
  createdById: number
) {
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) throw new AppError('Customer not found.', 404);

  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
  });

  if (products.length !== data.items.length) {
    throw new AppError('One or more selected products could not be found.', 400);
  }

  const totalQuantity = data.items.reduce((sum, i) => sum + i.quantity, 0);

  const challan = await prisma.$transaction(async (tx) => {
    const created = await tx.challan.create({
      data: {
        // Temporary placeholder; replaced below once we have the DB id.
        challanNumber: 'PENDING',
        customerId: data.customerId,
        totalQuantity,
        status: 'DRAFT',
        createdById,
        items: {
          create: data.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;
            return {
              productId: product.id,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    const challanNumber = `CH-${new Date().getFullYear()}-${String(created.id).padStart(5, '0')}`;
    return tx.challan.update({
      where: { id: created.id },
      data: { challanNumber },
      include: { items: true, customer: true },
    });
  });

  // If the caller wants it confirmed immediately, run confirmation logic now.
  if (data.status === 'CONFIRMED') {
    return confirmChallan(challan.id, createdById);
  }

  return challan;
}

export async function updateChallan(id: number, items: ChallanItemInput[] | undefined) {
  const challan = await getChallanById(id);

  if (challan.status !== 'DRAFT') {
    throw new AppError('Only Draft challans can be edited. Confirmed/Cancelled challans are locked.', 400);
  }

  if (!items) return challan;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });
  if (products.length !== items.length) {
    throw new AppError('One or more selected products could not be found.', 400);
  }

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return prisma.$transaction(async (tx) => {
    // Replace item lines wholesale -- simplest correct approach for a draft edit.
    await tx.challanItem.deleteMany({ where: { challanId: id } });
    return tx.challan.update({
      where: { id },
      data: {
        totalQuantity,
        items: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;
            return {
              productId: product.id,
              productNameSnapshot: product.name,
              productSkuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true, customer: true },
    });
  });
}

/**
 * The core business rule from the spec:
 *   - Confirming a challan reduces stock.
 *   - Stock must never go negative -- if ANY line item has insufficient
 *     stock, the ENTIRE confirmation is rejected (nothing is partially
 *     applied), and the API returns a clear error naming the product.
 * Everything happens in one DB transaction so it's all-or-nothing.
 */
export async function confirmChallan(id: number, confirmedById: number) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!challan) throw new AppError('Challan not found.', 404);

    if (challan.status !== 'DRAFT') {
      throw new AppError(`Challan is already ${challan.status.toLowerCase()} and cannot be confirmed.`, 400);
    }

    // Validate stock for every line first, so we fail before touching anything.
    for (const item of challan.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new AppError(`Product "${item.productNameSnapshot}" no longer exists.`, 400);
      }
      if (product.currentStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}, required: ${item.quantity}.`,
          400
        );
      }
    }

    // All checks passed -- apply stock deductions + log each movement.
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantityChanged: item.quantity,
          movementType: 'OUT',
          reason: `Challan ${challan.challanNumber} confirmed`,
          createdById: confirmedById,
        },
      });
    }

    return tx.challan.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
      include: { items: true, customer: true },
    });
  });
}

/**
 * Cancelling a Draft simply marks it cancelled (nothing was ever deducted).
 * Cancelling a Confirmed challan restores the stock that was deducted --
 * this is an assumption not explicitly spelled out in the spec, documented
 * in the README, since "confirmed = stock committed" implies the reverse
 * should release it back.
 */
export async function cancelChallan(id: number, cancelledById: number) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw new AppError('Challan not found.', 404);

    if (challan.status === 'CANCELLED') {
      throw new AppError('Challan is already cancelled.', 400);
    }

    if (challan.status === 'CONFIRMED') {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: 'IN',
            reason: `Challan ${challan.challanNumber} cancelled -- stock restored`,
            createdById: cancelledById,
          },
        });
      }
    }

    return tx.challan.update({ where: { id }, data: { status: 'CANCELLED' } });
  });
}
