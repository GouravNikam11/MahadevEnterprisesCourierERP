import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma'
import { fail, ok } from '../utils/response'
import { createUserSchema } from '../validators/users'

export async function listUsers(_req: Request, res: Response) {
  const items = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      createdAt: true,
      role: { select: { name: true } },
    },
  })
  return res.json(ok('Success', { items }))
}

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json(fail('Validation failed', parsed.error.flatten()))
  }

  const actorRole = req.user?.role
  if (!actorRole) return res.status(401).json(fail('Unauthorized', { code: 'UNAUTHORIZED' }))

  const { email, password, name, roleName } = parsed.data

  if (actorRole === 'ADMIN' && roleName === 'SUPER_ADMIN') {
    return res.status(403).json(fail('Admins cannot create Super Admin users', { code: 'FORBIDDEN' }))
  }

  const role = await prisma.role.findFirst({ where: { name: roleName, deletedAt: null } })
  if (!role) return res.status(400).json(fail('Invalid role', { code: 'INVALID_ROLE' }))

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
        roleId: role.id,
        status: 'ACTIVE',
      },
      include: { role: { select: { name: true } } },
    })
    return res.status(201).json(
      ok('Created', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        status: user.status,
      }),
    )
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json(fail('Email already exists', { code: 'DUPLICATE_EMAIL' }))
    }
    throw e
  }
}
