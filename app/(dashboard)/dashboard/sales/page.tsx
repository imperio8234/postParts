import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSales } from '@/app/actions/sales'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import Link from 'next/link'
import { Plus } from 'lucide-react'

type Props = {
  searchParams: { page?: string }
}

export default async function SalesPage({ searchParams }: Props) {
  const page = Number(searchParams.page) || 1
  const { sales, total, totalPages, currentPage } = await getSales(page, 50)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ventas</h1>
        <Link href="/dashboard/sales/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No hay ventas registradas
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">
                      {sale.saleNumber}
                    </TableCell>
                    <TableCell>{formatDateTime(sale.saleDate)}</TableCell>
                    <TableCell>
                      {sale.customer?.name || 'Cliente General'}
                    </TableCell>
                    <TableCell>{sale.user.name}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {sale.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(sale.total))}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          sale.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : sale.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination currentPage={currentPage} totalPages={totalPages} total={total} />
        </CardContent>
      </Card>
    </div>
  )
}
