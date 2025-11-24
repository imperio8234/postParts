'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSalesReport, getExpensesReport, getProfitReport } from '@/app/actions/reports'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  ArrowRightLeft,
  Package,
} from 'lucide-react'

type SalesReportData = {
  totalSales: number
  totalDiscount: number
  salesCount: number
  byPaymentMethod: {
    CASH: number
    CARD: number
    TRANSFER: number
    MIXED: number
  }
  byDay: Record<string, number>
  topProducts: { name: string; quantity: number; total: number }[]
} | null

type ExpensesReportData = {
  totalExpenses: number
  expensesCount: number
  byCategory: Record<string, number>
  byDay: Record<string, number>
} | null

type ProfitReportData = {
  totalRevenue: number
  costOfSales: number
  grossProfit: number
  totalExpenses: number
  totalPurchases: number
  netProfit: number
  grossMargin: number
  netMargin: number
} | null

export function ReportsClient() {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'profit'>('profit')

  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])

  const [salesReport, setSalesReport] = useState<SalesReportData>(null)
  const [expensesReport, setExpensesReport] = useState<ExpensesReportData>(null)
  const [profitReport, setProfitReport] = useState<ProfitReportData>(null)

  const loadReports = () => {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    startTransition(async () => {
      const [sales, expenses, profit] = await Promise.all([
        getSalesReport(start, end),
        getExpensesReport(start, end),
        getProfitReport(start, end),
      ])
      setSalesReport(sales)
      setExpensesReport(expenses)
      setProfitReport(profit)
    })
  }

  const setQuickRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6">
      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Desde</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={loadReports} disabled={isPending}>
              {isPending ? 'Cargando...' : 'Generar Reportes'}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickRange(0)}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
                7 días
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
                30 días
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'profit' ? 'default' : 'outline'}
          onClick={() => setActiveTab('profit')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Ganancias
        </Button>
        <Button
          variant={activeTab === 'sales' ? 'default' : 'outline'}
          onClick={() => setActiveTab('sales')}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Ventas
        </Button>
        <Button
          variant={activeTab === 'expenses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('expenses')}
        >
          <TrendingDown className="w-4 h-4 mr-2" />
          Gastos
        </Button>
      </div>

      {/* Reporte de Ganancias */}
      {activeTab === 'profit' && profitReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(profitReport.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  Costo de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(profitReport.costOfSales)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(profitReport.totalExpenses)}
                </div>
              </CardContent>
            </Card>

            <Card className={profitReport.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Utilidad Neta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${profitReport.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profitReport.netProfit)}
                </div>
                <p className="text-xs text-gray-500">
                  Margen: {profitReport.netMargin.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span>Ingresos por Ventas</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(profitReport.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>(-) Costo de Productos Vendidos</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(profitReport.costOfSales)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b bg-gray-50 px-2 -mx-2">
                  <span className="font-semibold">Utilidad Bruta</span>
                  <span className="font-bold">
                    {formatCurrency(profitReport.grossProfit)}
                    <span className="text-xs text-gray-500 ml-2">
                      ({profitReport.grossMargin.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>(-) Gastos Operativos</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(profitReport.totalExpenses)}
                  </span>
                </div>
                <div className={`flex justify-between py-2 px-2 -mx-2 rounded ${profitReport.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className="font-bold">UTILIDAD NETA</span>
                  <span className={`font-bold text-lg ${profitReport.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profitReport.netProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reporte de Ventas */}
      {activeTab === 'sales' && salesReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesReport.totalSales)}
                </div>
                <p className="text-xs text-gray-500">{salesReport.salesCount} transacciones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Efectivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatCurrency(salesReport.byPaymentMethod.CASH)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Tarjeta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatCurrency(salesReport.byPaymentMethod.CARD)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Transferencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatCurrency(salesReport.byPaymentMethod.TRANSFER)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {salesReport.topProducts.map((product, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <span className="text-gray-500 mr-2">#{index + 1}</span>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{product.quantity} uds</span>
                      <span className="text-gray-500 ml-2">
                        ({formatCurrency(product.total)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reporte de Gastos */}
      {activeTab === 'expenses' && expensesReport && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(expensesReport.totalExpenses)}
              </div>
              <p className="text-xs text-gray-500">{expensesReport.expensesCount} registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(expensesReport.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="font-medium">{category}</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!salesReport && !expensesReport && !profitReport && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Selecciona un rango de fechas y haz clic en "Generar Reportes"
          </CardContent>
        </Card>
      )}
    </div>
  )
}
