'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId, getCurrentUser } from '@/lib/tenant'
import { Decimal } from '@prisma/client/runtime/library'

export type PurchaseItem = {
  productId: string
  quantity: number
  unitCost: number
}

export type CreatePurchaseInput = {
  supplierId?: string
  purchaseNumber: string
  purchaseDate?: Date
  items: PurchaseItem[]
  tax?: number
  notes?: string
}

export async function createPurchase(data: CreatePurchaseInput) {
  const tenantId = await getCurrentTenantId()
  const user = await getCurrentUser()

  if (!tenantId || !user) {
    throw new Error('No autorizado')
  }

  // Calcular subtotal
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  )
  const tax = data.tax || 0
  const total = subtotal + tax

  // Crear compra con transacción
  const purchase = await prisma.$transaction(async (tx) => {
    // Crear la compra
    const newPurchase = await tx.purchase.create({
      data: {
        tenantId,
        userId: user.id,
        supplierId: data.supplierId,
        purchaseNumber: data.purchaseNumber,
        purchaseDate: data.purchaseDate || new Date(),
        subtotal: new Decimal(subtotal),
        tax: new Decimal(tax),
        total: new Decimal(total),
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: new Decimal(item.unitCost),
            subtotal: new Decimal(item.quantity * item.unitCost),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
    })

    // Actualizar stock de productos (incrementar)
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          // Actualizar precio de costo si es diferente
          costPrice: new Decimal(item.unitCost),
        },
      })
    }

    return newPurchase
  })

  revalidatePath('/dashboard/purchases')
  revalidatePath('/dashboard/products')
  return purchase
}

export async function getPurchases(limit = 50) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.purchase.findMany({
    where: { tenantId },
    include: {
      supplier: true,
      user: {
        select: { name: true },
      },
      items: {
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
      },
    },
    orderBy: { purchaseDate: 'desc' },
    take: limit,
  })
}

export async function getPurchaseById(id: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      user: {
        select: { name: true, email: true },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!purchase || purchase.tenantId !== tenantId) {
    return null
  }

  return purchase
}

export async function getTodayPurchases() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { purchases: [], total: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const purchases = await prisma.purchase.findMany({
    where: {
      tenantId,
      purchaseDate: { gte: today },
      status: 'COMPLETED',
    },
    include: {
      supplier: true,
    },
  })

  const total = purchases.reduce((sum, p) => sum + Number(p.total), 0)

  return { purchases, total }
}
