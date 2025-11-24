'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createExpense, createExpenseCategory } from '@/app/actions/expenses'
import { Save, Plus } from 'lucide-react'

type Category = {
  id: string
  name: string
}

type Props = {
  categories: Category[]
}

export function NewExpenseForm({ categories: initialCategories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCategories)
  const [error, setError] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    paymentMethod: 'CASH' as 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED',
    reference: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const newCategory = await createExpenseCategory(newCategoryName.trim())
      setCategories([...categories, newCategory])
      setFormData({ ...formData, categoryId: newCategory.id })
      setNewCategoryName('')
      setShowNewCategory(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría')
    }
  }

  const handleQuickCategory = async (name: string) => {
    try {
      const newCategory = await createExpenseCategory(name)
      setCategories([...categories, newCategory])
      setFormData({ ...formData, categoryId: newCategory.id })
    } catch {
      // Si ya existe, buscarla
      const existing = categories.find(c => c.name === name)
      if (existing) {
        setFormData({ ...formData, categoryId: existing.id })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.amount || !formData.description) {
      setError('Monto y descripción son requeridos')
      return
    }

    startTransition(async () => {
      try {
        await createExpense({
          categoryId: formData.categoryId || undefined,
          amount: parseFloat(formData.amount),
          description: formData.description,
          paymentMethod: formData.paymentMethod,
          reference: formData.reference || undefined,
          notes: formData.notes || undefined,
        })
        router.push('/dashboard/expenses')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al registrar gasto')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del gasto */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Gasto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className="text-xl"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Pago de servicios, nómina, etc..."
                required
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

            {/* Categorías rápidas */}
            {categories.length === 0 && (
              <div>
                <Label>Categorías sugeridas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Nómina / Salarios', 'Servicios Públicos', 'Arriendo', 'Transporte', 'Otros'].map((name) => (
                    <Button
                      key={name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickCategory(name)}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Método de Pago</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['CASH', 'CARD', 'TRANSFER', 'MIXED'] as const).map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={formData.paymentMethod === method ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className="w-full"
                  >
                    {method === 'CASH' && 'Efectivo'}
                    {method === 'CARD' && 'Tarjeta'}
                    {method === 'TRANSFER' && 'Transferencia'}
                    {method === 'MIXED' && 'Mixto'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reference">Referencia / Factura</Label>
              <Input
                id="reference"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Número de factura o referencia"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notas adicionales..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[120px]"
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
          onClick={() => router.push('/dashboard/expenses')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="w-4 h-4 mr-2" />
          {isPending ? 'Guardando...' : 'Registrar Gasto'}
        </Button>
      </div>
    </form>
  )
}
