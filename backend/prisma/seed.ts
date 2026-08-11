import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password@123', 10);

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@erp.test' },
      update: {},
      create: { name: 'Admin User', email: 'admin@erp.test', passwordHash: password, role: 'ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'sales@erp.test' },
      update: {},
      create: { name: 'Sales User', email: 'sales@erp.test', passwordHash: password, role: 'SALES' },
    }),
    prisma.user.upsert({
      where: { email: 'warehouse@erp.test' },
      update: {},
      create: { name: 'Warehouse User', email: 'warehouse@erp.test', passwordHash: password, role: 'WAREHOUSE' },
    }),
    prisma.user.upsert({
      where: { email: 'accounts@erp.test' },
      update: {},
      create: { name: 'Accounts User', email: 'accounts@erp.test', passwordHash: password, role: 'ACCOUNTS' },
    }),
  ]);

  const customer = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Rakesh Traders',
      mobile: '9876543210',
      email: 'rakesh@traders.com',
      businessName: 'Rakesh Traders Pvt Ltd',
      gstNumber: '24AAAAA0000A1Z5',
      customerType: 'WHOLESALE',
      address: 'Ring Road, Ahmedabad, Gujarat',
      status: 'ACTIVE',
    },
  });

  const product1 = await prisma.product.upsert({
    where: { sku: 'SKU-001' },
    update: {},
    create: {
      name: 'Steel Pipe 2 inch',
      sku: 'SKU-001',
      category: 'Hardware',
      unitPrice: 450.0,
      currentStock: 200,
      minStockAlert: 20,
      location: 'Warehouse A - Rack 3',
    },
  });

  const product2 = await prisma.product.upsert({
    where: { sku: 'SKU-002' },
    update: {},
    create: {
      name: 'PVC Fitting Elbow',
      sku: 'SKU-002',
      category: 'Hardware',
      unitPrice: 25.5,
      currentStock: 500,
      minStockAlert: 50,
      location: 'Warehouse A - Rack 5',
    },
  });

  console.log('✅ Seed complete.');
  console.log('Test login credentials (password for all: Password@123):');
  console.log(`  Admin:     ${admin.email}`);
  console.log(`  Sales:     ${sales.email}`);
  console.log(`  Warehouse: ${warehouse.email}`);
  console.log(`  Accounts:  ${accounts.email}`);
  console.log(`Sample customer: ${customer.name} (id ${customer.id})`);
  console.log(`Sample products: ${product1.name} (id ${product1.id}), ${product2.name} (id ${product2.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
