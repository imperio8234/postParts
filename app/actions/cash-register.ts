'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentTenantId, getCurrentUser } from '@/lib/tenant'
import { Decimal } from '@prisma/client/runtime/library'

export async function openCashRegister(initialAmount: number) {
  const tenantId = await getCurrentTenantId()
  const user = await getCurrentUser()

  if (!tenantId || !user) {
    throw new Error('No autorizado')
  }

  // Verificar que no haya una caja abierta
  const openRegister = await prisma.cashRegister.findFirst({
    where: {
      tenantId,
      status: 'OPEN',
    },
  })

  if (openRegister) {
    throw new Error('Ya existe una caja abierta')
  }

  const cashRegister = await prisma.cashRegister.create({
    data: {
      tenantId,
      userId: user.id,
      initialAmount: new Decimal(initialAmount),
      status: 'OPEN',
    },
  })

  revalidatePath('/dashboard')
  return cashRegister
}

export type CloseCashRegisterInput = {
  cashRegisterId: string
  cashAmount: number      // Efectivo contado
  cardAmount: number      // Total tarjetas
  transferAmount: number  // Total transferencias
  notes?: string
}

export async function closeCashRegister(data: CloseCashRegisterInput) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    throw new Error('No autorizado')
  }

  const cashRegister = await prisma.cashRegister.findUnique({
    where: { id: data.cashRegisterId },
    include: {
      sales: true,
    },
  })

  if (!cashRegister || cashRegister.tenantId !== tenantId) {
    throw new Error('Caja no encontrada')
  }

  if (cashRegister.status === 'CLOSED') {
    throw new Error('La caja ya está cerrada')
  }

  // Calcular el monto esperado solo de efectivo
  const cashSales = cashRegister.sales
    .filter((s) => s.paymentMethod === 'CASH' || s.paymentMethod === 'MIXED')
    .reduce((sum, sale) => sum + Number(sale.total), 0)

  const expectedCash = Number(cashRegister.initialAmount) + cashSales
  const cashDifference = data.cashAmount - expectedCash

  // Total reportado
  const finalAmount = data.cashAmount + data.cardAmount + data.transferAmount

  // Total de ventas
  const totalSales = cashRegister.sales.reduce(
    (sum, sale) => sum + Number(sale.total),
    0
  )
  const expectedAmount = Number(cashRegister.initialAmount) + totalSales
  const difference = finalAmount - expectedAmount

  const updated = await prisma.cashRegister.update({
    where: { id: data.cashRegisterId },
    data: {
      closingDate: new Date(),
      finalAmount: new Decimal(finalAmount),
      expectedAmount: new Decimal(expectedAmount),
      difference: new Decimal(difference),
      status: 'CLOSED',
      notes: data.notes,
    },
  })

  revalidatePath('/dashboard')
  return {
    ...updated,
    cashDifference,
    expectedCash,
    totalSales,
    salesByMethod: {
      cash: cashRegister.sales.filter((s) => s.paymentMethod === 'CASH').reduce((sum, s) => sum + Number(s.total), 0),
      card: cashRegister.sales.filter((s) => s.paymentMethod === 'CARD').reduce((sum, s) => sum + Number(s.total), 0),
      transfer: cashRegister.sales.filter((s) => s.paymentMethod === 'TRANSFER').reduce((sum, s) => sum + Number(s.total), 0),
      mixed: cashRegister.sales.filter((s) => s.paymentMethod === 'MIXED').reduce((sum, s) => sum + Number(s.total), 0),
    },
  }
}

export async function getCurrentCashRegister() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  return await prisma.cashRegister.findFirst({
    where: {
      tenantId,
      status: 'OPEN',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      sales: {
        orderBy: {
          saleDate: 'desc',
        },
        take: 10,
      },
    },
  })
}

export async function getCashRegisterHistory(limit = 10) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return []
  }

  return await prisma.cashRegister.findMany({
    where: {
      tenantId,
      status: 'CLOSED',
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      closingDate: 'desc',
    },
    take: limit,
  })
}

export async function getCashRegisterSummary(cashRegisterId: string) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const cashRegister = await prisma.cashRegister.findUnique({
    where: { id: cashRegisterId },
    include: {
      user: { select: { name: true } },
      sales: {
        include: {
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { saleDate: 'asc' },
      },
    },
  })

  if (!cashRegister || cashRegister.tenantId !== tenantId) {
    return null
  }

  // Calcular totales por método de pago
  const salesByMethod = {
    CASH: cashRegister.sales.filter((s) => s.paymentMethod === 'CASH'),
    CARD: cashRegister.sales.filter((s) => s.paymentMethod === 'CARD'),
    TRANSFER: cashRegister.sales.filter((s) => s.paymentMethod === 'TRANSFER'),
    MIXED: cashRegister.sales.filter((s) => s.paymentMethod === 'MIXED'),
  }

  const totals = {
    cash: salesByMethod.CASH.reduce((sum, s) => sum + Number(s.total), 0),
    card: salesByMethod.CARD.reduce((sum, s) => sum + Number(s.total), 0),
    transfer: salesByMethod.TRANSFER.reduce((sum, s) => sum + Number(s.total), 0),
    mixed: salesByMethod.MIXED.reduce((sum, s) => sum + Number(s.total), 0),
  }

  const totalSales = totals.cash + totals.card + totals.transfer + totals.mixed
  const expectedCash = Number(cashRegister.initialAmount) + totals.cash + totals.mixed

  // Obtener gastos del día
  const expenses = await prisma.expense.findMany({
    where: {
      tenantId,
      expenseDate: {
        gte: cashRegister.openingDate,
        lte: cashRegister.closingDate || new Date(),
      },
    },
    include: {
      category: true,
    },
  })

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return {
    cashRegister,
    sales: cashRegister.sales,
    salesCount: cashRegister.sales.length,
    totals,
    totalSales,
    expectedCash,
    expenses,
    totalExpenses,
    netCash: expectedCash - totalExpenses,
  }
}
