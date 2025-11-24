import { getProducts } from '@/app/actions/products'
import { getCustomers } from '@/app/actions/customers'
import { getCurrentUser } from '@/lib/tenant'
import { NewSaleForm } from '@/components/sales/new-sale-form'
import { CartProvider } from '@/lib/cart-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewSalePage() {
  const [products, customers, user] = await Promise.all([
    getProducts(),
    getCustomers(),
    getCurrentUser(),
  ])

  const serializedProducts = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    brand: p.brand,
    salePrice: p.salePrice,
    stock: p.stock,
  }))

  const serializedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/sales">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Nueva Venta</h1>
      </div>

      <CartProvider>
        <NewSaleForm
          products={serializedProducts}
          customers={serializedCustomers}
          userName={user?.name || 'Usuario'}
        />
      </CartProvider>
    </div>
  )
}
