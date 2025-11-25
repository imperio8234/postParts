'use server'

import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'

interface TenantFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  plan?: string
  subscriptionStatus?: string
}

export async function getTenants(filters: TenantFilters = {}) {
  await requireSuperAdmin()

  const where: Record<string, unknown> = {}

  // Filtro por búsqueda
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { slug: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  // Filtro por estado activo/inactivo
  if (filters.status === 'active') {
    where.isActive = true
  } else if (filters.status === 'inactive') {
    where.isActive = false
  }

  // Filtro por plan
  if (filters.plan && filters.plan !== 'all') {
    where.subscription = {
      plan: { code: filters.plan },
    }
  }

  // Filtro por estado de suscripción
  if (filters.subscriptionStatus && filters.subscriptionStatus !== 'all') {
    where.subscription = {
      ...((where.subscription as Record<string, unknown>) || {}),
      status: filters.subscriptionStatus,
    }
  }

  const tenants = await prisma.tenant.findMany({
    where,
    include: {
      subscription: {
        include: { plan: true },
      },
      _count: {
        select: { users: true, products: true, sales: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    email: t.email,
    phone: t.phone,
    city: t.city,
    isActive: t.isActive,
    createdAt: t.createdAt,
    plan: t.subscription?.plan.name || 'Sin plan',
    planCode: t.subscription?.plan.code || 'none',
    subscriptionStatus: t.subscription?.status || 'NONE',
    trialEndsAt: t.subscription?.trialEndsAt,
    usersCount: t._count.users,
    productsCount: t._count.products,
    salesCount: t._count.sales,
  }))
}

export async function getTenantById(id: string) {
  await requireSuperAdmin()

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      subscription: {
        include: {
          plan: true,
          payments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          invoices: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          products: true,
          sales: true,
          customers: true,
          purchases: true,
        },
      },
    },
  })

  if (!tenant) {
    throw new Error('Negocio no encontrado')
  }

  return tenant
}

export async function toggleTenantStatus(id: string) {
  const admin = await requireSuperAdmin()

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { isActive: true, name: true },
  })

  if (!tenant) {
    throw new Error('Negocio no encontrado')
  }

  const newStatus = !tenant.isActive

  await prisma.$transaction([
    // Actualizar estado del tenant
    prisma.tenant.update({
      where: { id },
      data: { isActive: newStatus },
    }),
    // Registrar actividad
    prisma.adminActivityLog.create({
      data: {
        userId: admin.id,
        action: newStatus ? 'tenant.activate' : 'tenant.deactivate',
        entityType: 'tenant',
        entityId: id,
        description: `${newStatus ? 'Activó' : 'Desactivó'} el negocio "${tenant.name}"`,
        oldValue: { isActive: tenant.isActive },
        newValue: { isActive: newStatus },
      },
    }),
  ])

  revalidatePath('/admin/tenants')
  revalidatePath(`/admin/tenants/${id}`)

  return { success: true, isActive: newStatus }
}

export async function updateTenantSubscription(
  tenantId: string,
  data: {
    planCode: string
    status?: string
    billingCycle?: 'MONTHLY' | 'YEARLY'
    adminNotes?: string
  }
) {
  const admin = await requireSuperAdmin()

  const plan = await prisma.plan.findUnique({
    where: { code: data.planCode },
  })

  if (!plan) {
    throw new Error('Plan no encontrado')
  }

  const currentSubscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  })

  // Calcular fechas si se activa
  const now = new Date()
  const periodEnd = new Date()
  if (data.billingCycle === 'YEARLY') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  const updateData: Record<string, unknown> = {
    planId: plan.id,
    billingCycle: data.billingCycle || 'MONTHLY',
    adminNotes: data.adminNotes,
  }

  // Si se cambia a ACTIVE, actualizar fechas
  if (data.status === 'ACTIVE') {
    updateData.status = 'ACTIVE'
    updateData.currentPeriodStart = now
    updateData.currentPeriodEnd = periodEnd
    updateData.nextBillingDate = periodEnd
    updateData.trialEndsAt = null
  } else if (data.status) {
    updateData.status = data.status
  }

  await prisma.$transaction([
    // Actualizar o crear suscripción
    currentSubscription
      ? prisma.subscription.update({
          where: { tenantId },
          data: updateData,
        })
      : prisma.subscription.create({
          data: {
            tenantId,
            planId: plan.id,
            status: (data.status as 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED') || 'ACTIVE',
            startDate: now,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            billingCycle: data.billingCycle || 'MONTHLY',
            adminNotes: data.adminNotes,
          },
        }),
    // Registrar actividad
    prisma.adminActivityLog.create({
      data: {
        userId: admin.id,
        action: 'subscription.update',
        entityType: 'subscription',
        entityId: tenantId,
        description: `Actualizó suscripción a plan "${plan.name}"`,
        oldValue: currentSubscription
          ? { plan: currentSubscription.plan.code, status: currentSubscription.status }
          : undefined,
        newValue: { plan: plan.code, status: data.status },
      },
    }),
  ])

  revalidatePath('/admin/tenants')
  revalidatePath(`/admin/tenants/${tenantId}`)

  return { success: true }
}

export async function createTenant(data: {
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  city?: string
  nit?: string
  adminName: string
  adminEmail: string
  adminPassword: string
  planCode: string
  startAsTrial: boolean
}) {
  const admin = await requireSuperAdmin()

  // Verificar slug único
  const existingSlug = await prisma.tenant.findUnique({
    where: { slug: data.slug },
  })

  if (existingSlug) {
    throw new Error('El slug ya está en uso')
  }

  // Obtener plan
  const plan = await prisma.plan.findUnique({
    where: { code: data.planCode },
  })

  if (!plan) {
    throw new Error('Plan no encontrado')
  }

  const hashedPassword = await hash(data.adminPassword, 10)

  // Calcular fechas
  const now = new Date()
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays)

  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  const tenant = await prisma.$transaction(async (tx) => {
    // Crear tenant
    const newTenant = await tx.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        nit: data.nit,
        isActive: true,
      },
    })

    // Crear usuario admin del tenant
    await tx.user.create({
      data: {
        tenantId: newTenant.id,
        email: data.adminEmail,
        password: hashedPassword,
        name: data.adminName,
        role: 'ADMIN',
        isActive: true,
      },
    })

    // Crear suscripción
    // Si es trial, dar acceso a Premium (todos los módulos)
    const subscriptionPlanId = data.startAsTrial
      ? (await tx.plan.findUnique({ where: { code: 'premium' } }))?.id || plan.id
      : plan.id

    await tx.subscription.create({
      data: {
        tenantId: newTenant.id,
        planId: subscriptionPlanId,
        status: data.startAsTrial ? 'TRIAL' : 'ACTIVE',
        startDate: now,
        trialEndsAt: data.startAsTrial ? trialEndsAt : null,
        currentPeriodStart: data.startAsTrial ? null : now,
        currentPeriodEnd: data.startAsTrial ? null : periodEnd,
        billingCycle: 'MONTHLY',
        adminNotes: `Creado por admin: ${admin.email}`,
      },
    })

    // Registrar actividad
    await tx.adminActivityLog.create({
      data: {
        userId: admin.id,
        action: 'tenant.create',
        entityType: 'tenant',
        entityId: newTenant.id,
        description: `Creó nuevo negocio "${newTenant.name}"`,
        newValue: {
          name: newTenant.name,
          email: newTenant.email,
          plan: data.planCode,
          isTrial: data.startAsTrial,
        },
      },
    })

    return newTenant
  })

  revalidatePath('/admin/tenants')

  return { success: true, tenantId: tenant.id }
}

export async function getPlans() {
  await requireSuperAdmin()

  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      features: {
        include: { feature: true },
      },
    },
  })
}

export async function updateTenantUser(
  tenantId: string,
  userId: string,
  data: { isActive?: boolean; role?: 'ADMIN' | 'SELLER' | 'VIEWER' }
) {
  const admin = await requireSuperAdmin()

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  })

  if (!user) {
    throw new Error('Usuario no encontrado')
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data,
    }),
    prisma.adminActivityLog.create({
      data: {
        userId: admin.id,
        action: 'user.update',
        entityType: 'user',
        entityId: userId,
        description: `Actualizó usuario "${user.name}" del negocio`,
        oldValue: { isActive: user.isActive, role: user.role },
        newValue: data,
      },
    }),
  ])

  revalidatePath(`/admin/tenants/${tenantId}`)

  return { success: true }
}
