'use server'

import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/admin-auth'

export async function getAdminStats() {
  await requireSuperAdmin()

  const [
    totalTenants,
    activeTenants,
    inactiveTenants,
    trialTenants,
    activeSubscriptions,
    expiredSubscriptions,
    totalUsers,
    totalProducts,
    recentTenants,
    planStats,
    monthlyRevenue,
  ] = await Promise.all([
    // Total de tenants
    prisma.tenant.count(),

    // Tenants activos
    prisma.tenant.count({ where: { isActive: true } }),

    // Tenants inactivos
    prisma.tenant.count({ where: { isActive: false } }),

    // Tenants en trial
    prisma.subscription.count({ where: { status: 'TRIAL' } }),

    // Suscripciones activas
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),

    // Suscripciones expiradas
    prisma.subscription.count({
      where: { status: { in: ['EXPIRED', 'CANCELLED', 'SUSPENDED'] } },
    }),

    // Total de usuarios
    prisma.user.count(),

    // Total de productos en la plataforma
    prisma.product.count(),

    // Tenants recientes (últimos 5)
    prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: { users: true, products: true },
        },
      },
    }),

    // Estadísticas por plan
    prisma.subscription.groupBy({
      by: ['planId'],
      _count: { planId: true },
    }),

    // Ingresos del mes (pagos completados)
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paymentDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ])

  // Obtener nombres de planes para las estadísticas
  const plans = await prisma.plan.findMany()
  const planStatsWithNames = planStats.map((stat) => {
    const plan = plans.find((p) => p.id === stat.planId)
    return {
      planName: plan?.name || 'Sin plan',
      planCode: plan?.code || 'none',
      count: stat._count.planId,
    }
  })

  return {
    totalTenants,
    activeTenants,
    inactiveTenants,
    trialTenants,
    activeSubscriptions,
    expiredSubscriptions,
    totalUsers,
    totalProducts,
    recentTenants: recentTenants.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      isActive: t.isActive,
      createdAt: t.createdAt,
      plan: t.subscription?.plan.name || 'Sin plan',
      planCode: t.subscription?.plan.code || 'none',
      status: t.subscription?.status || 'NONE',
      usersCount: t._count.users,
      productsCount: t._count.products,
    })),
    planStats: planStatsWithNames,
    monthlyRevenue: monthlyRevenue._sum.amount || 0,
  }
}

export async function getTrialExpiringTenants() {
  await requireSuperAdmin()

  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const tenants = await prisma.subscription.findMany({
    where: {
      status: 'TRIAL',
      trialEndsAt: {
        lte: sevenDaysFromNow,
        gte: new Date(),
      },
    },
    include: {
      tenant: true,
      plan: true,
    },
    orderBy: { trialEndsAt: 'asc' },
  })

  return tenants.map((sub) => ({
    tenantId: sub.tenantId,
    tenantName: sub.tenant.name,
    email: sub.tenant.email,
    trialEndsAt: sub.trialEndsAt,
    daysRemaining: sub.trialEndsAt
      ? Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0,
  }))
}
