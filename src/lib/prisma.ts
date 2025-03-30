import { PrismaClient } from '../../generated/prisma'

// Use a global variable to prevent multiple instances during hot reloading in development
const globalForPrisma = global as { prisma?: PrismaClient }

// Create or use existing Prisma client instance
export const prisma = globalForPrisma.prisma || new PrismaClient()

// Set the global variable in development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma