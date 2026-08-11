import prisma from '../../config/db';
import { AppError } from '../../utils/AppError';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}

export async function listProducts(params: ListParams) {
  const { page, limit, search, category, lowStockOnly } = params;

  const where: any = {
    isActive: true,
    ...(category && { category }),
    ...(search && {
      OR: [{ name: { contains: search } }, { sku: { contains: search } }],
    }),
  };

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Low stock filtering happens after the query since Prisma can't compare
  // two columns of the same row (currentStock vs minStockAlert) directly.
  const filtered = lowStockOnly
    ? products.filter((p) => p.currentStock <= p.minStockAlert)
    : products;

  return {
    products: filtered,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProductById(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { createdBy: { select: { id: true, name: true } } },
      },
    },
  });
  if (!product) throw new AppError('Product not found.', 404);
  return product;
}

export async function createProduct(data: any) {
  return prisma.product.create({ data });
}

export async function updateProduct(id: number, data: any) {
  await getProductById(id);
  return prisma.product.update({ where: { id }, data });
}

/**
 * Records a stock movement AND updates the product's currentStock
 * atomically in a single DB transaction. This is the only path that
 * should ever change currentStock directly (challan confirmation uses
 * its own internal version of this same pattern).
 */
export async function recordStockMovement(
  productId: number,
  quantity: number,
  movementType: 'IN' | 'OUT',
  reason: string,
  createdById: number
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found.', 404);

    const delta = movementType === 'IN' ? quantity : -quantity;
    const newStock = product.currentStock + delta;

    if (newStock < 0) {
      throw new AppError(
        `Insufficient stock. Current stock is ${product.currentStock}, cannot remove ${quantity}.`,
        400
      );
    }

    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { currentStock: newStock },
    });

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        quantityChanged: quantity,
        movementType,
        reason,
        createdById,
      },
    });

    return { product: updatedProduct, movement };
  });
}
