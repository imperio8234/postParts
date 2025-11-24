import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPurchases, getTodayPurchases } from '@/app/actions/purchases'
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
import { Plus, Package } from 'lucide-react'

export default async function PurchasesPage() {
  const [purchases, todayData] = await Promise.all([
    getPurchases(50),
    getTodayPurchases(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compras</h1>
        <Link href="/dashboard/purchases/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Compra
          </Button>
        </Link>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Compras Hoy</CardTitle>
            <Package className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(todayData.total)}
            </div>
            <p className="text-xs text-gray-500">
              {todayData.purchases.length} compras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listado de compras */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No hay compras registradas
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono text-sm">
                      {purchase.purchaseNumber}
                    </TableCell>
                    <TableCell>{formatDateTime(purchase.purchaseDate)}</TableCell>
                    <TableCell>{purchase.supplier?.name || 'Sin proveedor'}</TableCell>
                    <TableCell>
                      {purchase.items.length} productos
                    </TableCell>
                    <TableCell>{purchase.user.name}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(purchase.total))}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          purchase.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : purchase.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {purchase.status}
                      </span>
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
