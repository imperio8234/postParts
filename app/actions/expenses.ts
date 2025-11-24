'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId, getCurrentUser } from '@/lib/tenant'
import { Decimal } from '@prisma/client/runtime/library'

export type CreateExpenseInput = {
  categoryId?: string
  expenseDate?: Date
  amount: number
  description: string
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED'
  reference?: string
  notes?: string
}

export async function createExpense(data: CreateExpenseInput) {
  const tenantId = await getCurrentTenantId()
  const user = await getCurrentUser()

  if (!tenantId || !user) {
    throw new Error('No autorizado')
  }

  const expense = await prisma.expense.create({
    data: {
      tenantId,
      userId: user.id,
      categoryId: data.categoryId,
      expenseDate: data.expenseDate || new Date(),
      amount: new Decimal(data.amount),
      description: data.description,
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      notes: data.notes,
    },
    include: {
      category: true,
      user: {
        select: { name: true },
      },
    },
  })

  revalidatePath('/dashboard/expenses')
  return expense
}

export async function getExpenses(limit = 50) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.expense.findMany({
    where: { tenantId },
    include: {
      category: true,
      user: {
        select: { name: true },
      },
    },
    orderBy: { expenseDate: 'desc' },
    take: limit,
  })
}

export async function getTodayExpenses() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return { expenses: [], total: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expenses = await prisma.expense.findMany({
    where: {
      tenantId,
      expenseDate: { gte: today },
    },
    include: {
      category: true,
    },
    orderBy: { expenseDate: 'desc' },
  })

  const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  return { expenses, total }
}

export async function getExpensesByDateRange(startDate: Date, endDate: Date) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.expense.findMany({
    where: {
      tenantId,
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
      user: { select: { name: true } },
    },
    orderBy: { expenseDate: 'desc' },
  })
}

// Categorías de gastos
export async function getExpenseCategories() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.expenseCategory.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })
}

export async function createExpenseCategory(name: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const category = await prisma.expenseCategory.create({
    data: {
      tenantId,
      name,
    },
  })

  revalidatePath('/dashboard/expenses')
  return category
}

// Categorías predefinidas comunes
export async function getDefaultExpenseCategories() {
  return [
    'Nómina / Salarios',
    'Servicios Públicos',
    'Arriendo',
    'Transporte',
    'Alimentación',
    'Mantenimiento',
    'Publicidad',
    'Impuestos',
    'Otros',
  ]
}
