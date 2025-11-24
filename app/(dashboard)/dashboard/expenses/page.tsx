import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getExpenses, getTodayExpenses } from '@/app/actions/expenses'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Plus, TrendingDown } from 'lucide-react'

export default async function ExpensesPage() {
  const [expenses, todayData] = await Promise.all([
    getExpenses(50),
    getTodayExpenses(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gastos</h1>
        <Link href="/dashboard/expenses/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Registrar Gasto
          </Button>
        </Link>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos Hoy</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(todayData.total)}
            </div>
            <p className="text-xs text-gray-500">
              {todayData.expenses.length} transacciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listado de gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No hay gastos registrados
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDateTime(expense.expenseDate)}</TableCell>
                    <TableCell>
                      <p className="font-medium">{expense.description}</p>
                      {expense.reference && (
                        <p className="text-xs text-gray-500">Ref: {expense.reference}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {expense.category?.name || 'Sin categoría'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {expense.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell>{expense.user.name}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(Number(expense.amount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
