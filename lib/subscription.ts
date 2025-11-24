import { prisma } from './prisma'
import { getCurrentTenantId } from './tenant'

export interface SubscriptionInfo {
  planCode: string
  planName: string
  status: string
  isActive: boolean
  isTrial: boolean
  trialDaysRemaining: number | null
  maxProducts: number
  maxUsers: number
  currentProducts: number
  currentUsers: number
  canAddProducts: boolean
  canAddUsers: boolean
  productsRemaining: number
  usersRemaining: number
  features: string[]
}

export async function getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: {
      plan: {
        include: {
          features: {
            include: { feature: true },
          },
        },
      },
      tenant: {
        include: {
          _count: {
            select: { products: true, users: true },
          },
        },
      },
    },
  })

  if (!subscription) {
    return null
  }

  const isTrial = subscription.status === 'TRIAL'
  const isActive = ['TRIAL', 'ACTIVE'].includes(subscription.status)

  // Calcular días restantes del trial
  let trialDaysRemaining: number | null = null
  if (isTrial && subscription.trialEndsAt) {
    const diff = subscription.trialEndsAt.getTime() - Date.now()
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const maxProducts = subscription.plan.maxProducts
  const maxUsers = subscription.plan.maxUsers
  const currentProducts = subscription.tenant._count.products
  const currentUsers = subscription.tenant._count.users

  // -1 significa ilimitado
  const canAddProducts = maxProducts === -1 || currentProducts < maxProducts
  const canAddUsers = maxUsers === -1 || currentUsers < maxUsers

  const productsRemaining = maxProducts === -1 ? Infinity : Math.max(0, maxProducts - currentProducts)
  const usersRemaining = maxUsers === -1 ? Infinity : Math.max(0, maxUsers - currentUsers)

  // Durante el trial, tiene acceso a todas las features
  const features = subscription.plan.features.map((pf) => pf.feature.code)

  return {
    planCode: subscription.plan.code,
    planName: subscription.plan.name,
    status: subscription.status,
    isActive,
    isTrial,
    trialDaysRemaining,
    maxProducts,
    maxUsers,
    currentProducts,
    currentUsers,
    canAddProducts,
    canAddUsers,
    productsRemaining,
    usersRemaining,
    features,
  }
}

export async function hasFeature(featureCode: string): Promise<boolean> {
  const info = await getSubscriptionInfo()

  if (!info || !info.isActive) {
    return false
  }

  // Durante el trial tiene acceso a todo
  if (info.isTrial) {
    return true
  }

  return info.features.includes(featureCode)
}

export async function canAddProduct(): Promise<{ allowed: boolean; message?: string }> {
  const info = await getSubscriptionInfo()

  if (!info) {
    return { allowed: false, message: 'No hay suscripción activa' }
  }

  if (!info.isActive) {
    return { allowed: false, message: 'La suscripción no está activa' }
  }

  if (!info.canAddProducts) {
    return {
      allowed: false,
      message: `Has alcanzado el límite de ${info.maxProducts} productos de tu plan ${info.planName}. Actualiza tu plan para agregar más.`,
    }
  }

  return { allowed: true }
}

export async function canAddUser(): Promise<{ allowed: boolean; message?: string }> {
  const info = await getSubscriptionInfo()

  if (!info) {
    return { allowed: false, message: 'No hay suscripción activa' }
  }

  if (!info.isActive) {
    return { allowed: false, message: 'La suscripción no está activa' }
  }

  if (!info.canAddUsers) {
    return {
      allowed: false,
      message: `Has alcanzado el límite de ${info.maxUsers} usuarios de tu plan ${info.planName}. Actualiza tu plan para agregar más.`,
    }
  }

  return { allowed: true }
}

export async function checkFeatureAccess(featureCode: string): Promise<{ allowed: boolean; message?: string }> {
  const info = await getSubscriptionInfo()

  if (!info) {
    return { allowed: false, message: 'No hay suscripción activa' }
  }

  if (!info.isActive) {
    return { allowed: false, message: 'La suscripción no está activa' }
  }

  // Durante el trial tiene acceso a todo
  if (info.isTrial) {
    return { allowed: true }
  }

  if (!info.features.includes(featureCode)) {
    return {
      allowed: false,
      message: `Esta función no está disponible en tu plan ${info.planName}. Actualiza tu plan para acceder.`,
    }
  }

  return { allowed: true }
}

// Feature codes para cada módulo
export const FEATURE_CODES = {
  // POS
  POS_SALES: 'pos_sales',
  POS_CASH_REGISTER: 'pos_cash_register',
  POS_CASH_HISTORY: 'pos_cash_history',

  // Inventario
  INVENTORY_PRODUCTS: 'inventory_products',
  INVENTORY_CATEGORIES: 'inventory_categories',
  INVENTORY_STOCK_ALERTS: 'inventory_stock_alerts',

  // Clientes
  CUSTOMERS: 'customers',

  // Compras (Intermedio+)
  PURCHASES: 'purchases',
  SUPPLIERS: 'suppliers',

  // Gastos (Intermedio+)
  EXPENSES: 'expenses',
  EXPENSE_CATEGORIES: 'expense_categories',

  // Pedidos (Intermedio+)
  ORDERS: 'orders',

  // Reportes
  REPORTS_BASIC: 'reports_basic',
  REPORTS_ADVANCED: 'reports_advanced',

  // Taller (Premium)
  WORKSHOP: 'workshop',
  WORKSHOP_ORDERS: 'workshop_orders',

  // Extras
  MULTI_LOCATION: 'multi_location',
  PRIORITY_SUPPORT: 'priority_support',
} as const

export type FeatureCode = (typeof FEATURE_CODES)[keyof typeof FEATURE_CODES]
