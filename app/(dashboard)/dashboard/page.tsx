import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCurrentCashRegister } from '@/app/actions/cash-register'
import { getTodaySales } from '@/app/actions/sales'
import { getLowStockProducts } from '@/app/actions/products'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { DollarSign, Package, ShoppingCart, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { OpenCashRegisterButton, CloseCashRegisterButton } from './cash-register-buttons'
import { SubscriptionAlert } from '@/components/subscription/subscription-alert'

export default async function DashboardPage() {
  const cashRegister = await getCurrentCashRegister()
  const { total, count } = await getTodaySales()
  const lowStockProducts = await getLowStockProducts()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Alerta de suscripción */}
      <SubscriptionAlert />

      {/* Cash Register Status */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Caja</CardTitle>
          <CardDescription>
            {cashRegister ? 'Caja abierta' : 'No hay caja abierta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cashRegister ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Apertura</p>
                  <p className="text-lg font-semibold">
                    {formatDateTime(cashRegister.openingDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monto Inicial</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(Number(cashRegister.initialAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Usuario</p>
                  <p className="text-lg font-semibold">{cashRegister.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ventas</p>
                  <p className="text-lg font-semibold">{cashRegister.sales.length}</p>
                </div>
              </div>
              <CloseCashRegisterButton cashRegisterId={cashRegister.id} />
            </div>
          ) : (
            <OpenCashRegisterButton />
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(total)} en total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Productos con stock mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nueva Venta</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/sales/new">
              <Button className="w-full" disabled={!cashRegister}>
                Crear Venta
              </Button>
            </Link>
            {!cashRegister && (
              <p className="text-xs text-red-500 mt-2">
                Abre la caja primero
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Stock</CardTitle>
            <CardDescription>
              Productos que necesitan reabastecimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-yellow-600">
                      Stock: {product.stock}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mín: {product.minStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {lowStockProducts.length > 5 && (
              <Link href="/dashboard/products">
                <Button variant="link" className="mt-2">
                  Ver todos
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
