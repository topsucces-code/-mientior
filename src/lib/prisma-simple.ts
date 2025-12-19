import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaSimple: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaSimple ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') globalThis.prismaSimple = prisma
