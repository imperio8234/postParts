'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from '@/lib/tenant'

export async function getSalesReport(startDate: Date, endDate: Date) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'COMPLETED',
    },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
      },
    },
    orderBy: { saleDate: 'asc' },
  })

  // Totales por método de pago
  const byPaymentMethod = {
    CASH: sales.filter((s) => s.paymentMethod === 'CASH').reduce((sum, s) => sum + Number(s.total), 0),
    CARD: sales.filter((s) => s.paymentMethod === 'CARD').reduce((sum, s) => sum + Number(s.total), 0),
    TRANSFER: sales.filter((s) => s.paymentMethod === 'TRANSFER').reduce((sum, s) => sum + Number(s.total), 0),
    MIXED: sales.filter((s) => s.paymentMethod === 'MIXED').reduce((sum, s) => sum + Number(s.total), 0),
  }

  // Totales por día
  const byDay: Record<string, number> = {}
  sales.forEach((sale) => {
    const day = sale.saleDate.toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + Number(sale.total)
  })

  // Productos más vendidos
  const productSales: Record<string, { name: string; quantity: number; total: number }> = {}
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const productId = item.productId
      if (!productSales[productId]) {
        productSales[productId] = {
          name: item.product.name,
          quantity: 0,
          total: 0,
        }
      }
      productSales[productId].quantity += item.quantity
      productSales[productId].total += Number(item.subtotal)
    })
  })

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0)
  const totalDiscount = sales.reduce((sum, s) => sum + Number(s.discount), 0)

  return {
    totalSales,
    totalDiscount,
    salesCount: sales.length,
    byPaymentMethod,
    byDay,
    topProducts,
  }
}

export async function getExpensesReport(startDate: Date, endDate: Date) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const expenses = await prisma.expense.findMany({
    where: {
      tenantId,
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
    orderBy: { expenseDate: 'asc' },
  })

  // Totales por categoría
  const byCategory: Record<string, number> = {}
  expenses.forEach((expense) => {
    const categoryName = expense.category?.name || 'Sin categoría'
    byCategory[categoryName] = (byCategory[categoryName] || 0) + Number(expense.amount)
  })

  // Totales por día
  const byDay: Record<string, number> = {}
  expenses.forEach((expense) => {
    const day = expense.expenseDate.toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + Number(expense.amount)
  })

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return {
    totalExpenses,
    expensesCount: expenses.length,
    byCategory,
    byDay,
  }
}

export async function getProfitReport(startDate: Date, endDate: Date) {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  // Obtener ventas
  const sales = await prisma.sale.findMany({
    where: {
      tenantId,
      saleDate: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
    },
    include: {
      items: {
        include: {
          product: {
            select: { costPrice: true },
          },
        },
      },
    },
  })

  // Obtener gastos
  const expenses = await prisma.expense.findMany({
    where: {
      tenantId,
      expenseDate: { gte: startDate, lte: endDate },
    },
  })

  // Obtener compras
  const purchases = await prisma.purchase.findMany({
    where: {
      tenantId,
      purchaseDate: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
    },
  })

  // Calcular ingresos
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0)

  // Calcular costo de ventas
  const costOfSales = sales.reduce((sum, sale) => {
    const saleCost = sale.items.reduce((itemSum, item) => {
      return itemSum + Number(item.product.costPrice) * item.quantity
    }, 0)
    return sum + saleCost
  }, 0)

  // Calcular gastos operativos
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Calcular compras de inventario
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total), 0)

  // Utilidad bruta
  const grossProfit = totalRevenue - costOfSales

  // Utilidad neta (sin considerar compras como gasto directo)
  const netProfit = grossProfit - totalExpenses

  return {
    totalRevenue,
    costOfSales,
    grossProfit,
    totalExpenses,
    totalPurchases,
    netProfit,
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
  }
}

export async function getInventoryReport() {
  const tenantId = await getCurrentTenantId()

  if (!tenantId) {
    return null
  }

  const products = await prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    include: {
      category: true,
    },
    orderBy: { stock: 'asc' },
  })

  const lowStock = products.filter((p) => p.stock <= p.minStock)
  const outOfStock = products.filter((p) => p.stock === 0)

  // Valor del inventario
  const totalCostValue = products.reduce(
    (sum, p) => sum + Number(p.costPrice) * p.stock,
    0
  )
  const totalSaleValue = products.reduce(
    (sum, p) => sum + Number(p.salePrice) * p.stock,
    0
  )

  // Por categoría
  const byCategory: Record<string, { count: number; value: number }> = {}
  products.forEach((product) => {
    const categoryName = product.category?.name || 'Sin categoría'
    if (!byCategory[categoryName]) {
      byCategory[categoryName] = { count: 0, value: 0 }
    }
    byCategory[categoryName].count += product.stock
    byCategory[categoryName].value += Number(product.costPrice) * product.stock
  })

  return {
    totalProducts: products.length,
    totalUnits: products.reduce((sum, p) => sum + p.stock, 0),
    totalCostValue,
    totalSaleValue,
    potentialProfit: totalSaleValue - totalCostValue,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockProducts: lowStock.slice(0, 20),
    outOfStockProducts: outOfStock,
    byCategory,
  }
}
