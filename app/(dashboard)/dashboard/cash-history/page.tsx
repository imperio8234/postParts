import { getCashRegisterHistory } from '@/app/actions/cash-register'
import { CashHistoryList } from '@/components/cash-register/cash-history-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function CashHistoryPage() {
  const history = await getCashRegisterHistory(50)

  // Calcular estadísticas
  const totalRegisters = history.length
  const totalSales = history.reduce(
    (sum, r) => sum + (Number(r.expectedAmount) - Number(r.initialAmount)),
    0
  )
  const totalDifference = history.reduce(
    (sum, r) => sum + Number(r.difference || 0),
    0
  )
  const positiveDiff = history.filter((r) => Number(r.difference || 0) > 0).length
  const negativeDiff = history.filter((r) => Number(r.difference || 0) < 0).length

  // Serializar para el cliente
  const serializedHistory = history.map((r) => ({
    id: r.id,
    openingDate: r.openingDate,
    closingDate: r.closingDate,
    initialAmount: Number(r.initialAmount),
    finalAmount: Number(r.finalAmount || 0),
    expectedAmount: Number(r.expectedAmount || 0),
    difference: Number(r.difference || 0),
    notes: r.notes,
    user: r.user,
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Historial de Cajas</h1>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cajas Cerradas</CardTitle>
            <Wallet className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegisters}</div>
            <p className="text-xs text-gray-500">registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalSales)}
            </div>
            <p className="text-xs text-gray-500">en todas las cajas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sobrantes</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{positiveDiff}</div>
            <p className="text-xs text-gray-500">cierres con sobrante</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faltantes</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{negativeDiff}</div>
            <p className="text-xs text-gray-500">cierres con faltante</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de cajas */}
      <CashHistoryList history={serializedHistory} />
    </div>
  )
}
