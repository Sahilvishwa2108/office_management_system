import { PrismaClient } from '@prisma/client';

// Add prisma to the NodeJS global type
declare global {
    var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient();

// Set the prisma instance on the global object to prevent duplicates during hot reloading
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}