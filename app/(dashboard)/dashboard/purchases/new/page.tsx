import { getAllProducts } from '@/app/actions/products'
import { getSuppliers } from '@/app/actions/suppliers'
import { NewPurchaseForm } from '@/components/purchases/new-purchase-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewPurchasePage() {
  const [products, suppliers] = await Promise.all([
    getAllProducts(),
    getSuppliers(),
  ])

  const serializedProducts = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    costPrice: p.costPrice,
  }))

  const serializedSuppliers = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/purchases">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Nueva Compra</h1>
      </div>

      <NewPurchaseForm products={serializedProducts} suppliers={serializedSuppliers} />
    </div>
  )
}
