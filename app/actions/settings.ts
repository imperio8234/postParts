'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from '@/lib/tenant'

export type BusinessSettings = {
  name: string
  nit?: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  website?: string
  taxRegime?: string
}

export async function getBusinessSettings() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      nit: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      website: true,
      taxRegime: true,
    },
  })

  return tenant
}

export async function updateBusinessSettings(data: BusinessSettings) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: data.name,
      nit: data.nit || null,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || null,
      website: data.website || null,
      taxRegime: data.taxRegime || null,
    },
  })

  revalidatePath('/dashboard/settings')
  return tenant
}
