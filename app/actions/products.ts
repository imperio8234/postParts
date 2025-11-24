'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from '@/lib/tenant'
import { Decimal } from '@prisma/client/runtime/library'
import { canAddProduct } from '@/lib/subscription'

export type CreateProductInput = {
  sku: string
  barcode?: string
  name: string
  description?: string
  brand?: string
  model?: string
  year?: string
  categoryId?: string
  costPrice: number
  salePrice: number
  stock: number
  minStock?: number
  location?: string
}

export async function createProduct(data: CreateProductInput) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  // Verificar límite de productos según el plan
  const canAdd = await canAddProduct()
  if (!canAdd.allowed) {
    throw new Error(canAdd.message || 'No puedes agregar más productos con tu plan actual')
  }

  // Verificar que el SKU no exista
  const existing = await prisma.product.findUnique({
    where: {
      tenantId_sku: {
        tenantId,
        sku: data.sku,
      },
    },
  })

  if (existing) {
    throw new Error('El SKU ya existe')
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      tenantId,
      costPrice: new Decimal(data.costPrice),
      salePrice: new Decimal(data.salePrice),
      minStock: data.minStock || 5,
    },
  })

  revalidatePath('/dashboard/products')
  return product
}

export async function updateProduct(id: string, data: Partial<CreateProductInput>) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const product = await prisma.product.findUnique({
    where: { id },
  })

  if (!product || product.tenantId !== tenantId) {
    throw new Error('Producto no encontrado')
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      costPrice: data.costPrice ? new Decimal(data.costPrice) : undefined,
      salePrice: data.salePrice ? new Decimal(data.salePrice) : undefined,
    },
  })

  revalidatePath('/dashboard/products')
  return updated
}

export async function getProducts(search?: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
}

export async function getProductByBarcode(barcode: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  return await prisma.product.findFirst({
    where: {
      tenantId,
      barcode,
      isActive: true,
    },
    include: {
      category: true,
    },
  })
}

export async function getLowStockProducts() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      stock: {
        lte: prisma.product.fields.minStock,
      },
    },
    orderBy: {
      stock: 'asc',
    },
  })
}

export async function getProductById(id: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  })

  if (!product || product.tenantId !== tenantId) {
    return null
  }

  return product
}

export async function updateStock(productId: string, quantity: number) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product || product.tenantId !== tenantId) {
    throw new Error('Producto no encontrado')
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      stock: product.stock + quantity,
    },
  })

  revalidatePath('/dashboard/products')
  return updated
}
