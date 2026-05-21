import { createRequire } from 'module'
import type { PrismaClient } from '../types/prisma-client'

// Resolve generated client from backend root (works in src/ and dist/config/ after build).
const nodeRequire = createRequire(__filename)
const { PrismaClient: PrismaClientCtor } = nodeRequire('../../generated/prisma') as {
  PrismaClient: new () => PrismaClient
}

export const prisma: PrismaClient = new PrismaClientCtor()
