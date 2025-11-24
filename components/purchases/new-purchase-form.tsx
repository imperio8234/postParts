'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createPurchase, type PurchaseItem } from '@/app/actions/purchases'
import { createSupplier } from '@/app/actions/suppliers'
import { formatCurrency } from '@/lib/utils'
import { Save, Plus, Minus, Trash2, Search, Package } from 'lucide-react'

type Product = {
  id: string
  sku: string
  name: string
  costPrice: { toString(): string }
}

type Supplier = {
  id: string
  name: string
  phone: string | null
}

type CartItem = {
  product: Product
  quantity: number
  unitCost: number
}

type Props = {
  products: Product[]
  suppliers: Supplier[]
}

export function NewPurchaseForm({ products, suppliers: initialSuppliers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [searchProduct, setSearchProduct] = useState('')
  const [searchSupplier, setSearchSupplier] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [purchaseNumber, setPurchaseNumber] = useState('')
  const [tax, setTax] = useState(0)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  )

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchSupplier.toLowerCase()) ||
      (s.phone && s.phone.includes(searchSupplier))
  )

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id)
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitCost: parseFloat(product.costPrice.toString()),
        },
      ])
    }
    setSearchProduct('')
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            if (newQty < 1) return item
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const updateUnitCost = (productId: string, cost: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, unitCost: cost } : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim()) return

    try {
      const newSupplier = await createSupplier({ name: newSupplierName.trim() })
      setSuppliers([...suppliers, newSupplier])
      setSelectedSupplier(newSupplier)
      setNewSupplierName('')
      setShowNewSupplier(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proveedor')
    }
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  )
  const total = subtotal + tax

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError('Agrega productos a la compra')
      return
    }

    if (!purchaseNumber) {
      setError('Ingresa el número de factura')
      return
    }

    setError('')

    const purchaseItems: PurchaseItem[] = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitCost: item.unitCost,
    }))

    startTransition(async () => {
      try {
        await createPurchase({
          supplierId: selectedSupplier?.id,
          purchaseNumber,
          items: purchaseItems,
          tax,
          notes: notes || undefined,
        })
        router.push('/dashboard/purchases')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear la compra')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel izquierdo - Productos */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
            />
            {searchProduct && (
              <div className="mt-4 max-h-64 overflow-y-auto border rounded-md">
                {filteredProducts.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">
                    No se encontraron productos
                  </p>
                ) : (
                  filteredProducts.slice(0, 10).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(parseFloat(product.costPrice.toString()))}
                        </p>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items de compra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay productos agregados
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.product.sku}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-28 text-right"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateUnitCost(
                              item.product.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.quantity * item.unitCost)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel derecho - Resumen */}
      <div className="space-y-6">
        {/* Número de factura */}
        <Card>
          <CardHeader>
            <CardTitle>Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="purchaseNumber">Número de Factura *</Label>
            <Input
              id="purchaseNumber"
              value={purchaseNumber}
              onChange={(e) => setPurchaseNumber(e.target.value)}
              placeholder="FAC-001"
              className="mt-1"
            />
          </CardContent>
        </Card>

        {/* Proveedor */}
        <Card>
          <CardHeader>
            <CardTitle>Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSupplier ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedSupplier.name}</p>
                  <p className="text-sm text-gray-500">{selectedSupplier.phone}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSupplier(null)}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Buscar proveedor..."
                  value={searchSupplier}
                  onChange={(e) => setSearchSupplier(e.target.value)}
                />
                {searchSupplier && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                    {filteredSuppliers.length === 0 ? (
                      <p className="p-3 text-gray-500 text-center text-sm">
                        No encontrado
                      </p>
                    ) : (
                      filteredSuppliers.slice(0, 5).map((supplier) => (
                        <div
                          key={supplier.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedSupplier(supplier)
                            setSearchSupplier('')
                          }}
                        >
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-gray-500">{supplier.phone}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowNewSupplier(!showNewSupplier)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nuevo Proveedor
                </Button>
                {showNewSupplier && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      placeholder="Nombre del proveedor..."
                    />
                    <Button onClick={handleAddSupplier}>
                      Crear
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label>IVA / Impuestos</Label>
              <Input
                type="number"
                min="0"
                className="w-28 text-right"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <Input
                placeholder="Notas opcionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isPending || cart.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {isPending ? 'Procesando...' : 'Registrar Compra'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
