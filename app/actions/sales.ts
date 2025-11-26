'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId, getCurrentUser } from '@/lib/tenant'
import { Decimal } from '@prisma/client/runtime/library'

export type SaleItem = {
  productId: string
  quantity: number
  unitPrice: number
  discount?: number
}

export type CreateSaleInput = {
  customerId?: string
  items: SaleItem[]
  discount?: number
  tax?: number
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED'
  notes?: string
}

export async function createSale(data: CreateSaleInput) {
  const tenantId = await getCurrentTenantId()
  const user = await getCurrentUser()

  if (!tenantId || !user) {
    throw new Error('No autorizado')
  }

  // Verificar que haya una caja abierta
  const cashRegister = await prisma.cashRegister.findFirst({
    where: {
      tenantId,
      status: 'OPEN',
    },
  })

  if (!cashRegister) {
    throw new Error('No hay una caja abierta')
  }

  // Verificar stock de todos los productos
  for (const item of data.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    })

    if (!product || product.tenantId !== tenantId) {
      throw new Error(`Producto no encontrado: ${item.productId}`)
    }

    if (product.stock < item.quantity) {
      throw new Error(`Stock insuficiente para: ${product.name}`)
    }
  }

  // Calcular totales
  const subtotal = data.items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice - (item.discount || 0)
    return sum + itemSubtotal
  }, 0)

  const discount = data.discount || 0
  const tax = data.tax || 0
  const total = subtotal - discount + tax

  // Generar número de venta
  const lastSale = await prisma.sale.findFirst({
    where: { tenantId },
    orderBy: { saleNumber: 'desc' },
  })

  const nextNumber = lastSale
    ? parseInt(lastSale.saleNumber.split('-')[1]) + 1
    : 1

  const saleNumber = `V-${nextNumber.toString().padStart(6, '0')}`

  // Crear venta con transacción
  const sale = await prisma.$transaction(async (tx) => {
    // Crear la venta
    const newSale = await tx.sale.create({
      data: {
        tenantId,
        cashRegisterId: cashRegister.id,
        userId: user.id,
        customerId: data.customerId,
        saleNumber,
        subtotal: new Decimal(subtotal),
        discount: new Decimal(discount),
        tax: new Decimal(tax),
        total: new Decimal(total),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            discount: new Decimal(item.discount || 0),
            subtotal: new Decimal(
              item.quantity * item.unitPrice - (item.discount || 0)
            ),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    })

    // Actualizar stock de productos
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }

    return newSale
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/sales')
  return sale
}

export async function getSales(page: number = 1, limit: number = 50) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { sales: [], total: 0, totalPages: 0, currentPage: page }
  }

  const skip = (page - 1) * limit

  const where = {
    tenantId,
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ])

  return {
    sales,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  }
}

export async function getSaleById(id: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!sale || sale.tenantId !== tenantId) {
    return null
  }

  return sale
}

export async function getTodaySales() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { sales: [], total: 0, count: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      saleDate: {
        gte: today,
      },
      status: 'COMPLETED',
    },
    include: {
      customer: true,
    },
  })

  const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0)

  return {
    sales,
    total,
    count: sales.length,
  }
}
