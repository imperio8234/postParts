import { getAllProducts } from '@/app/actions/products'
import { getCustomers } from '@/app/actions/customers'
import { getCurrentUser } from '@/lib/tenant'
import { getBusinessSettings } from '@/app/actions/settings'
import { NewSaleForm } from '@/components/sales/new-sale-form'
import { CartProvider } from '@/lib/cart-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewSalePage() {
  const [products, customers, user, businessSettings] = await Promise.all([
    getAllProducts(),
    getCustomers(),
    getCurrentUser(),
    getBusinessSettings(),
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

  const businessInfo = {
    name: businessSettings?.name || 'Mi Negocio',
    nit: businessSettings?.nit || '000.000.000',
    address: businessSettings?.address || 'Dirección del negocio',
    city: businessSettings?.city || 'Ciudad',
    country: businessSettings?.country || 'Colombia',
    phone: businessSettings?.phone || '3000000000',
    website: businessSettings?.website || undefined,
    taxRegime: businessSettings?.taxRegime || undefined,
  }

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
          businessInfo={businessInfo}
        />
      </CartProvider>
    </div>
  )
}
