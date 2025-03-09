import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
const prisma = global.__prisma || new PrismaClient();

// In development, hot module reloading can create multiple instances of PrismaClient
// This prevents that by saving the instance to the global object
if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

export { prisma };

// TypeScript: Add type definition for the global variable
declare global {
  var __prisma: PrismaClient | undefined;
}
