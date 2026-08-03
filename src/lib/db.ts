import { PrismaClient } from '@prisma/client'
import { getDatabaseUrl } from '@/lib/env-config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is set in process.env BEFORE Prisma client is constructed,
// so that Prisma's internal env-var reader picks it up.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getDatabaseUrl()
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
    datasources: {
      db: { url: getDatabaseUrl() },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
