'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from '@/lib/tenant'

export type CreateSupplierInput = {
  name: string
  nit?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export async function createSupplier(data: CreateSupplierInput) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const supplier = await prisma.supplier.create({
    data: {
      ...data,
      tenantId,
    },
  })

  revalidatePath('/dashboard/purchases')
  return supplier
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierInput>) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id },
  })

  if (!supplier || supplier.tenantId !== tenantId) {
    throw new Error('Proveedor no encontrado')
  }

  const updated = await prisma.supplier.update({
    where: { id },
    data,
  })

  revalidatePath('/dashboard/purchases')
  return updated
}

export async function getSuppliers(search?: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.supplier.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { nit: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
  })
}
