'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from '@/lib/tenant'

export type CreateCustomerInput = {
  name: string
  email?: string
  phone?: string
  idNumber?: string
  address?: string
  notes?: string
}

export async function createCustomer(data: CreateCustomerInput) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const customer = await prisma.customer.create({
    data: {
      ...data,
      tenantId,
    },
  })

  revalidatePath('/dashboard/customers')
  return customer
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerInput>) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
  })

  if (!customer || customer.tenantId !== tenantId) {
    throw new Error('Cliente no encontrado')
  }

  const updated = await prisma.customer.update({
    where: { id },
    data,
  })

  revalidatePath('/dashboard/customers')
  return updated
}

export async function getCustomers(search?: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.customer.findMany({
    where: {
      tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: {
      name: 'asc',
    },
  })
}

export async function getCustomerById(id: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: {
          saleDate: 'desc',
        },
        take: 10,
      },
    },
  })

  if (!customer || customer.tenantId !== tenantId) {
    return null
  }

  return customer
}
