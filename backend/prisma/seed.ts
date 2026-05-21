import path from 'node:path'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { PrismaClient } from '../generated/prisma'

// tsx prisma/seed.ts does not load .env automatically; Prisma needs DATABASE_URL in process.env.
dotenv.config({ path: path.join(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function main() {
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Super Admin' },
    { name: 'ADMIN', description: 'Admin' },
    { name: 'OPERATOR', description: 'Operator' },
    { name: 'STAFF', description: 'Staff' },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    })
  }

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } })

  const email = process.env.SUPER_ADMIN_EMAIL ?? 'admin@mahadev.local'
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe@12345'
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { roleId: superAdminRole.id, passwordHash, status: 'ACTIVE' },
    create: {
      email,
      name: 'Super Admin',
      passwordHash,
      roleId: superAdminRole.id,
      status: 'ACTIVE',
    },
  })

  // eslint-disable-next-line no-console
  console.log(`Seeded roles + super admin: ${email}`)
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
