import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export async function getCurrentTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.tenantId || null
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  return await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      tenant: true,
    },
  })
}

export async function validateTenantAccess(tenantId: string): Promise<boolean> {
  const currentTenantId = await getCurrentTenantId()
  return currentTenantId === tenantId
}

// Middleware para agregar tenantId automáticamente en queries
export function withTenant<T>(tenantId: string, data: T): T & { tenantId: string } {
  return {
    ...data,
    tenantId,
  }
}
