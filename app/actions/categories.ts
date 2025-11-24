'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from '@/lib/tenant'

export async function getCategories() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })
}

export async function createCategory(name: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const category = await prisma.category.create({
    data: {
      tenantId,
      name,
    },
  })

  revalidatePath('/dashboard/products')
  return category
}
