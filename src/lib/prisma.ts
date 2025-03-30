import { PrismaClient } from '@prisma/client'

// Define the global shape
declare global {
    // This prevents TypeScript from complaining about the global variable
    var prisma: PrismaClient | undefined
}

// Configuration options for PrismaClient
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
}

// Use existing instance if available to prevent multiple instances during hot reloads in development
export const prisma = globalThis.prisma ?? prismaClientSingleton()

// Assign client to global object in non-production environments
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma
}