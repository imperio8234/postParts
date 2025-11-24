'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCashRegisterSummary } from '@/app/actions/cash-register'
import { formatCurrency } from '@/lib/utils'
import {
  X,
  Wallet,
  DollarSign,
  CreditCard,
  ArrowRightLeft,
  ShoppingCart,
  TrendingDown,
  Package,
  User,
  Calendar,
  Clock,
} from 'lucide-react'

type CashRegisterSummary = {
  cashRegister: {
    id: string
    openingDate: Date
    closingDate: Date | null
    initialAmount: { toString: () => string }
    finalAmount: { toString: () => string } | null
    expectedAmount: { toString: () => string } | null
    difference: { toString: () => string } | null
    notes: string | null
    user: { name: string | null }
  }
  sales: {
    id: string
    saleNumber: string
    saleDate: Date
    total: { toString: () => string }
    paymentMethod: string
    items: {
      id: string
      quantity: number
      unitPrice: { toString: () => string }
      subtotal: { toString: () => string }
      product: { name: string }
    }[]
  }[]
  salesCount: number
  totals: {
    cash: number
    card: number
    transfer: number
    mixed: number
  }
  totalSales: number
  expectedCash: number
  expenses: {
    id: string
    description: string
    amount: { toString: () => string }
    category: { name: string } | null
  }[]
  totalExpenses: number
  netCash: number
}

type Props = {
  cashRegisterId: string | null
  isOpen: boolean
  onClose: () => void
}

export function CashRegisterDetailModal({ cashRegisterId, isOpen, onClose }: Props) {
  const [data, setData] = useState<CashRegisterSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'sales' | 'products' | 'expenses'>('summary')

  useEffect(() => {
    if (isOpen && cashRegisterId) {
      setLoading(true)
      getCashRegisterSummary(cashRegisterId).then((result) => {
        setData(result as CashRegisterSummary | null)
        setLoading(false)
      })
    }
  }, [isOpen, cashRegisterId])

  if (!isOpen) return null

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    MIXED: 'Mixto',
  }

  // Agregar productos vendidos
  const getProductsSold = () => {
    if (!data) return []
    const products: Record<string, { name: string; quantity: number; total: number }> = {}

    data.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.product.name
        if (!products[key]) {
          products[key] = { name: item.product.name, quantity: 0, total: 0 }
        }
        products[key].quantity += item.quantity
        products[key].total += Number(item.subtotal)
      })
    })

    return Object.values(products).sort((a, b) => b.quantity - a.quantity)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Detalle de Caja</h2>
              {data && (
                <p className="text-sm text-blue-100">
                  {formatDate(data.cashRegister.openingDate)}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-blue-400">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Cargando información...</p>
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-gray-500">
            No se encontró información de la caja
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b overflow-x-auto">
              <button
                className={`px-4 py-3 font-medium whitespace-nowrap ${
                  activeTab === 'summary' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('summary')}
              >
                Resumen
              </button>
              <button
                className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'sales' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('sales')}
              >
                <ShoppingCart className="w-4 h-4" />
                Ventas ({data.salesCount})
              </button>
              <button
                className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'products' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('products')}
              >
                <Package className="w-4 h-4" />
                Productos
              </button>
              <button
                className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'expenses' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('expenses')}
              >
                <TrendingDown className="w-4 h-4" />
                Gastos ({data.expenses.length})
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Resumen */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Info general */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <User className="w-3 h-3" />
                        Cajero
                      </div>
                      <p className="font-medium">{data.cashRegister.user.name}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Calendar className="w-3 h-3" />
                        Fecha
                      </div>
                      <p className="font-medium">{formatDate(data.cashRegister.openingDate).split(',')[0]}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Clock className="w-3 h-3" />
                        Apertura
                      </div>
                      <p className="font-medium">{formatTime(data.cashRegister.openingDate)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                        <Clock className="w-3 h-3" />
                        Cierre
                      </div>
                      <p className="font-medium">
                        {data.cashRegister.closingDate ? formatTime(data.cashRegister.closingDate) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Ventas por método de pago */}
                  <div>
                    <h3 className="font-semibold mb-3">Ventas por Método de Pago</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                          <DollarSign className="w-5 h-5" />
                          <span className="font-medium">Efectivo</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(data.totals.cash)}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <CreditCard className="w-5 h-5" />
                          <span className="font-medium">Tarjeta</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(data.totals.card)}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                          <ArrowRightLeft className="w-5 h-5" />
                          <span className="font-medium">Transferencia</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          {formatCurrency(data.totals.transfer)}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-600 mb-2">
                          <Wallet className="w-5 h-5" />
                          <span className="font-medium">Mixto</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-700">
                          {formatCurrency(data.totals.mixed)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de caja */}
                  <div>
                    <h3 className="font-semibold mb-3">Resumen de Caja</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Monto inicial</span>
                        <span className="font-medium">{formatCurrency(Number(data.cashRegister.initialAmount))}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Total ventas</span>
                        <span className="font-medium text-green-600">{formatCurrency(data.totalSales)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Total gastos</span>
                        <span className="font-medium text-red-600">-{formatCurrency(data.totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b bg-blue-50 -mx-4 px-4">
                        <span className="font-semibold">Esperado en efectivo</span>
                        <span className="font-bold">{formatCurrency(data.expectedCash)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Monto reportado</span>
                        <span className="font-medium">{formatCurrency(Number(data.cashRegister.finalAmount))}</span>
                      </div>
                      <div className={`flex justify-between py-2 -mx-4 px-4 rounded ${
                        Number(data.cashRegister.difference) >= 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <span className="font-semibold">Diferencia</span>
                        <span className={`font-bold ${
                          Number(data.cashRegister.difference) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Number(data.cashRegister.difference) > 0 ? '+' : ''}
                          {formatCurrency(Number(data.cashRegister.difference))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  {data.cashRegister.notes && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-1">Notas del cierre</h4>
                      <p className="text-sm text-yellow-700">{data.cashRegister.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de ventas */}
              {activeTab === 'sales' && (
                <div>
                  {data.sales.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay ventas registradas
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Venta</TableHead>
                          <TableHead>Hora</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.sales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                            <TableCell>{formatTime(sale.saleDate)}</TableCell>
                            <TableCell>{sale.items.length}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-1 rounded ${
                                sale.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                                sale.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-800' :
                                sale.paymentMethod === 'TRANSFER' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {paymentMethodLabels[sale.paymentMethod]}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(Number(sale.total))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Productos vendidos */}
              {activeTab === 'products' && (
                <div>
                  {getProductsSold().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos vendidos
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">Cantidad</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getProductsSold().map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-center">{product.quantity}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(product.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Gastos */}
              {activeTab === 'expenses' && (
                <div>
                  {data.expenses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay gastos registrados
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                {expense.category?.name || 'Sin categoría'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium text-red-600">
                              {formatCurrency(Number(expense.amount))}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={2} className="text-right font-semibold">
                            Total Gastos:
                          </TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {formatCurrency(data.totalExpenses)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
