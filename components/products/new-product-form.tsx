'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createProduct } from '@/app/actions/products'
import { createCategory } from '@/app/actions/categories'
import { Save, Plus } from 'lucide-react'

type Category = {
  id: string
  name: string
}

type Props = {
  categories: Category[]
}

export function NewProductForm({ categories: initialCategories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCategories)
  const [error, setError] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    brand: '',
    model: '',
    year: '',
    categoryId: '',
    costPrice: '',
    salePrice: '',
    stock: '',
    minStock: '5',
    location: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const newCategory = await createCategory(newCategoryName.trim())
      setCategories([...categories, newCategory])
      setFormData({ ...formData, categoryId: newCategory.id })
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.sku || !formData.name || !formData.costPrice || !formData.salePrice) {
      setError('SKU, nombre, precio de costo y precio de venta son requeridos')
      return
    }

    startTransition(async () => {
      try {
        await createProduct({
          sku: formData.sku,
          barcode: formData.barcode || undefined,
          name: formData.name,
          description: formData.description || undefined,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          year: formData.year || undefined,
          categoryId: formData.categoryId || undefined,
          costPrice: parseFloat(formData.costPrice),
          salePrice: parseFloat(formData.salePrice),
          stock: parseInt(formData.stock) || 0,
          minStock: parseInt(formData.minStock) || 5,
          location: formData.location || undefined,
        })
        router.push('/dashboard/products')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear producto')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU / Código *</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="REP-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="7701234567890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Pastillas de freno"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripción del producto..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="categoryId">Categoría</Label>
              <div className="flex gap-2">
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {showNewCategory && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nueva categoría..."
                  />
                  <Button type="button" onClick={handleAddCategory}>
                    Agregar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compatibilidad */}
        <Card>
          <CardHeader>
            <CardTitle>Compatibilidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="brand">Marca (moto)</Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Honda, Yamaha, Suzuki..."
              />
            </div>

            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="CBR 600, YZF-R6..."
              />
            </div>

            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="2020-2024"
              />
            </div>
          </CardContent>
        </Card>

        {/* Precios */}
        <Card>
          <CardHeader>
            <CardTitle>Precios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costPrice">Precio de Costo *</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="salePrice">Precio de Venta *</Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            {formData.costPrice && formData.salePrice && (
              <p className="text-sm text-gray-500">
                Margen:{' '}
                <span className="font-semibold text-green-600">
                  {(
                    ((parseFloat(formData.salePrice) - parseFloat(formData.costPrice)) /
                      parseFloat(formData.costPrice)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Inventario */}
        <Card>
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock Inicial</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  name="minStock"
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={handleChange}
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Ubicación en bodega</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Estante A, Fila 3..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/products')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="w-4 h-4 mr-2" />
          {isPending ? 'Guardando...' : 'Guardar Producto'}
        </Button>
      </div>
    </form>
  )
}
