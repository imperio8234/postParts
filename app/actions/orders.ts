'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId, getCurrentUser } from '@/lib/tenant'

export type OrderItemInput = {
  id?: string
  productId?: string
  productName: string
  productSku?: string
  description?: string
  quantity: number
  unitCost?: number
  notes?: string
}

export type CreateOrderInput = {
  type: 'RESTOCK' | 'CUSTOMER_ORDER'
  customerId?: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  expectedDate?: Date
  notes?: string
  items: OrderItemInput[]
}

export type UpdateOrderInput = {
  customerId?: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  expectedDate?: Date
  notes?: string
  items?: OrderItemInput[]
}

async function generateOrderNumber(tenantId: string): Promise<string> {
  const today = new Date()
  const prefix = `PED-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`

  const lastOrder = await prisma.order.findFirst({
    where: {
      tenantId,
      orderNumber: { startsWith: prefix },
    },
    orderBy: { orderNumber: 'desc' },
  })

  if (!lastOrder) {
    return `${prefix}-0001`
  }

  const lastNumber = parseInt(lastOrder.orderNumber.split('-').pop() || '0', 10)
  return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`
}

async function addOrderHistory(
  orderId: string,
  action: string,
  description: string,
  oldValue?: string,
  newValue?: string
) {
  const user = await getCurrentUser()
  await prisma.orderHistory.create({
    data: {
      orderId,
      action,
      description,
      oldValue,
      newValue,
      createdBy: user?.name || 'Sistema',
    },
  })
}

export async function createOrder(data: CreateOrderInput) {
  const tenantId = await getCurrentTenantId()
  const user = await getCurrentUser()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  if (!data.items || data.items.length === 0) {
    throw new Error('El pedido debe tener al menos un item')
  }

  const orderNumber = await generateOrderNumber(tenantId)

  const order = await prisma.order.create({
    data: {
      tenantId,
      orderNumber,
      type: data.type,
      customerId: data.customerId,
      priority: data.priority || 'NORMAL',
      expectedDate: data.expectedDate,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost,
          notes: item.notes,
        })),
      },
      history: {
        create: {
          action: 'CREATED',
          description: `Pedido creado con ${data.items.length} item(s)`,
          newValue: JSON.stringify({
            type: data.type,
            items: data.items.map((i) => ({ name: i.productName, qty: i.quantity })),
          }),
          createdBy: user?.name || 'Sistema',
        },
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  revalidatePath('/dashboard/replenishment')
  return order
}

export async function getOrders(
  type?: 'RESTOCK' | 'CUSTOMER_ORDER',
  status?: 'PENDING' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED'
) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.order.findMany({
    where: {
      tenantId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              stock: true,
            },
          },
        },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { orderDate: 'desc' },
    ],
  })
}

export async function getOrderById(id: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      history: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!order || order.tenantId !== tenantId) {
    return null
  }

  return order
}

export async function getPendingOrders() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { restock: [], customerOrders: [] }
  }

  const [restock, customerOrders] = await Promise.all([
    prisma.order.findMany({
      where: {
        tenantId,
        type: 'RESTOCK',
        status: { in: ['PENDING', 'ORDERED', 'PARTIAL'] },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true, stock: true, minStock: true },
            },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: [{ priority: 'desc' }, { orderDate: 'desc' }],
    }),
    prisma.order.findMany({
      where: {
        tenantId,
        type: 'CUSTOMER_ORDER',
        status: { in: ['PENDING', 'ORDERED', 'PARTIAL', 'RECEIVED'] },
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        items: {
          include: {
            product: true,
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: [{ priority: 'desc' }, { orderDate: 'desc' }],
    }),
  ])

  return { restock, customerOrders }
}

export async function updateOrder(id: string, data: UpdateOrderInput) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!order || order.tenantId !== tenantId) {
    throw new Error('Pedido no encontrado')
  }

  const changes: string[] = []

  // Detectar cambios
  if (data.priority && data.priority !== order.priority) {
    changes.push(`Prioridad: ${order.priority} → ${data.priority}`)
  }
  if (data.notes !== undefined && data.notes !== order.notes) {
    changes.push('Notas actualizadas')
  }
  if (data.items) {
    const oldCount = order.items.length
    const newCount = data.items.length
    changes.push(`Items: ${oldCount} → ${newCount}`)
  }

  // Si se actualizan los items, eliminar los existentes y crear nuevos
  if (data.items) {
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    })
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      customerId: data.customerId,
      priority: data.priority,
      expectedDate: data.expectedDate,
      notes: data.notes,
      ...(data.items
        ? {
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                description: item.description,
                quantity: item.quantity,
                unitCost: item.unitCost,
                notes: item.notes,
              })),
            },
          }
        : {}),
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  // Registrar en historial
  if (changes.length > 0) {
    await addOrderHistory(
      id,
      'EDITED',
      changes.join(', '),
      JSON.stringify({ items: order.items.map((i) => ({ name: i.productName, qty: i.quantity })) }),
      data.items
        ? JSON.stringify({ items: data.items.map((i) => ({ name: i.productName, qty: i.quantity })) })
        : undefined
    )
  }

  revalidatePath('/dashboard/replenishment')
  return updated
}

export async function updateOrderStatus(
  id: string,
  status: 'PENDING' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED'
) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id },
  })

  if (!order || order.tenantId !== tenantId) {
    throw new Error('Pedido no encontrado')
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    ORDERED: 'Pedido al proveedor',
    PARTIAL: 'Parcialmente recibido',
    RECEIVED: 'Recibido',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      receivedDate: ['RECEIVED', 'DELIVERED'].includes(status) ? new Date() : order.receivedDate,
    },
  })

  // Registrar cambio de estado
  await addOrderHistory(
    id,
    'STATUS_CHANGED',
    `Estado: ${statusLabels[order.status]} → ${statusLabels[status]}`,
    order.status,
    status
  )

  revalidatePath('/dashboard/replenishment')
  return updated
}

export async function deleteOrder(id: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id },
  })

  if (!order || order.tenantId !== tenantId) {
    throw new Error('Pedido no encontrado')
  }

  await prisma.order.delete({
    where: { id },
  })

  revalidatePath('/dashboard/replenishment')
}

export async function getOrderHistory(orderId: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { tenantId: true },
  })

  if (!order || order.tenantId !== tenantId) {
    return []
  }

  return await prisma.orderHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  })
}

// Agregar automáticamente productos con stock bajo a un nuevo pedido de reposición
export async function createRestockOrderFromLowStock() {
  const tenantId = await getCurrentTenantId()
  const user = await getCurrentUser()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  // Obtener productos con stock bajo que NO están ya en un pedido pendiente
  const lowStockProducts = await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      stock: { lte: prisma.product.fields.minStock },
      orderItems: {
        none: {
          order: {
            type: 'RESTOCK',
            status: { in: ['PENDING', 'ORDERED', 'PARTIAL'] },
          },
        },
      },
    },
  })

  if (lowStockProducts.length === 0) {
    return { created: false, message: 'No hay productos con stock bajo para agregar' }
  }

  const orderNumber = await generateOrderNumber(tenantId)

  const order = await prisma.order.create({
    data: {
      tenantId,
      orderNumber,
      type: 'RESTOCK',
      priority: lowStockProducts.some((p) => p.stock === 0) ? 'URGENT' : 'NORMAL',
      notes: 'Pedido generado automáticamente por stock bajo',
      items: {
        create: lowStockProducts.map((product) => ({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: Math.max(product.minStock - product.stock + 5, 1),
        })),
      },
      history: {
        create: {
          action: 'CREATED',
          description: `Pedido automático con ${lowStockProducts.length} productos de stock bajo`,
          createdBy: user?.name || 'Sistema',
        },
      },
    },
    include: {
      items: true,
    },
  })

  revalidatePath('/dashboard/replenishment')
  return { created: true, order, itemsCount: lowStockProducts.length }
}

// Obtener productos con stock bajo para mostrar sugerencias
export async function getLowStockProducts() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      stock: { lte: prisma.product.fields.minStock },
    },
    select: {
      id: true,
      sku: true,
      name: true,
      stock: true,
      minStock: true,
      costPrice: true,
    },
    orderBy: { stock: 'asc' },
  })
}

// Agregar item a un pedido existente
export async function addItemToOrder(orderId: string, item: OrderItemInput) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order || order.tenantId !== tenantId) {
    throw new Error('Pedido no encontrado')
  }

  const newItem = await prisma.orderItem.create({
    data: {
      orderId,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      description: item.description,
      quantity: item.quantity,
      unitCost: item.unitCost,
      notes: item.notes,
    },
  })

  await addOrderHistory(
    orderId,
    'ITEM_ADDED',
    `Item agregado: ${item.productName} x${item.quantity}`
  )

  revalidatePath('/dashboard/replenishment')
  return newItem
}

// Eliminar item de un pedido
export async function removeItemFromOrder(orderId: string, itemId: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order || order.tenantId !== tenantId) {
    throw new Error('Pedido no encontrado')
  }

  const item = order.items.find((i) => i.id === itemId)
  if (!item) {
    throw new Error('Item no encontrado')
  }

  await prisma.orderItem.delete({
    where: { id: itemId },
  })

  await addOrderHistory(
    orderId,
    'ITEM_REMOVED',
    `Item eliminado: ${item.productName} x${item.quantity}`
  )

  revalidatePath('/dashboard/replenishment')
}

// Actualizar item de un pedido
export async function updateOrderItem(
  orderId: string,
  itemId: string,
  data: Partial<OrderItemInput>
) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order || order.tenantId !== tenantId) {
    throw new Error('Pedido no encontrado')
  }

  const updated = await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      productName: data.productName,
      productSku: data.productSku,
      description: data.description,
      quantity: data.quantity,
      unitCost: data.unitCost,
      notes: data.notes,
    },
  })

  await addOrderHistory(
    orderId,
    'ITEM_UPDATED',
    `Item actualizado: ${data.productName || updated.productName}`
  )

  revalidatePath('/dashboard/replenishment')
  return updated
}
