import { notFound } from 'next/navigation'
import { getProductById } from '@/app/actions/products'
import { getCategories } from '@/app/actions/categories'
import { EditProductForm } from '@/components/products/edit-product-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Editar Producto</h1>
      </div>

      <EditProductForm product={product} categories={categories} />
    </div>
  )
}
