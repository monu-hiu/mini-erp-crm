import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient instance across the app (avoids exhausting
// MySQL connections during development hot-reloads).
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
