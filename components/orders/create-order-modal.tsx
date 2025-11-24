'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrder } from '@/app/actions/orders'
import {
  Plus,
  ShoppingBag,
  Package,
  Trash2,
  Save,
  X,
  Search,
  Settings,
  List,
} from 'lucide-react'

type Customer = {
  id: string
  name: string
  phone: string | null
}

type Product = {
  id: string
  sku: string
  name: string
  stock: number
  minStock: number
  costPrice?: number
}

type Props = {
  customers: Customer[]
  products: Product[]
  isOpen: boolean
  onClose: () => void
}

type OrderItemForm = {
  id: string
  productId: string | null
  productName: string
  productSku: string
  description: string
  quantity: number
  unitCost: string
  notes: string
}

export function CreateOrderModal({ customers, products, isOpen, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<'CUSTOMER_ORDER' | 'RESTOCK'>('CUSTOMER_ORDER')
  const [searchCustomer, setSearchCustomer] = useState('')
  const [searchProduct, setSearchProduct] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'config' | 'items'>('config')

  const [orderData, setOrderData] = useState({
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    expectedDate: '',
    notes: '',
  })

  const [items, setItems] = useState<OrderItemForm[]>([])

  if (!isOpen) return null

  const filteredCustomers = searchCustomer
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
          (c.phone && c.phone.includes(searchCustomer))
      )
    : customers

  const filteredProducts = searchProduct
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchProduct.toLowerCase())
      )
    : products

  const addItem = (product?: Product) => {
    const newItem: OrderItemForm = {
      id: Date.now().toString(),
      productId: product?.id || null,
      productName: product?.name || '',
      productSku: product?.sku || '',
      description: '',
      quantity: 1,
      unitCost: product?.costPrice?.toString() || '',
      notes: '',
    }
    setItems([...items, newItem])
    setSearchProduct('')
    // En móvil, cambiar a la pestaña de items después de agregar
    setActiveTab('items')
  }

  const updateItem = (id: string, field: keyof OrderItemForm, value: string | number | null) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSubmit = async () => {
    setError('')

    if (items.length === 0) {
      setError('Agrega al menos un item al pedido')
      setActiveTab('config')
      return
    }

    if (items.some((item) => !item.productName)) {
      setError('Todos los items deben tener un nombre de producto')
      setActiveTab('items')
      return
    }

    startTransition(async () => {
      try {
        await createOrder({
          type,
          customerId: type === 'CUSTOMER_ORDER' ? selectedCustomer?.id : undefined,
          priority: orderData.priority,
          expectedDate: orderData.expectedDate ? new Date(orderData.expectedDate) : undefined,
          notes: orderData.notes || undefined,
          items: items.map((item) => ({
            productId: item.productId || undefined,
            productName: item.productName,
            productSku: item.productSku || undefined,
            description: item.description || undefined,
            quantity: item.quantity,
            unitCost: item.unitCost ? parseFloat(item.unitCost) : undefined,
            notes: item.notes || undefined,
          })),
        })

        resetForm()
        onClose()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear pedido')
      }
    })
  }

  const resetForm = () => {
    setItems([])
    setSelectedCustomer(null)
    setOrderData({ priority: 'NORMAL', expectedDate: '', notes: '' })
    setSearchProduct('')
    setSearchCustomer('')
    setError('')
    setActiveTab('config')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 text-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {type === 'CUSTOMER_ORDER' ? (
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Nuevo Pedido</h2>
              <p className="text-xs sm:text-sm text-orange-100 hidden sm:block">
                {type === 'CUSTOMER_ORDER' ? 'Encargo de Cliente' : 'Reposición de Inventario'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-orange-400">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs para móvil */}
        <div className="flex lg:hidden border-b shrink-0">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'config'
                ? 'border-b-2 border-orange-500 text-orange-600 bg-orange-50'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('config')}
          >
            <Settings className="w-4 h-4" />
            Configurar
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'items'
                ? 'border-b-2 border-orange-500 text-orange-600 bg-orange-50'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('items')}
          >
            <List className="w-4 h-4" />
            Items ({items.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full lg:grid lg:grid-cols-2">
            {/* Panel izquierdo - Configuración */}
            <div className={`h-full overflow-y-auto p-4 lg:border-r ${activeTab === 'config' ? 'block' : 'hidden lg:block'}`}>
              <h3 className="font-semibold mb-4 hidden lg:block">Configuración del Pedido</h3>

              {/* Tipo */}
              <div className="mb-4">
                <Label>Tipo de Pedido</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    type="button"
                    variant={type === 'CUSTOMER_ORDER' ? 'default' : 'outline'}
                    onClick={() => setType('CUSTOMER_ORDER')}
                    className="w-full"
                    size="sm"
                  >
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    Encargo
                  </Button>
                  <Button
                    type="button"
                    variant={type === 'RESTOCK' ? 'default' : 'outline'}
                    onClick={() => setType('RESTOCK')}
                    className="w-full"
                    size="sm"
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Reposición
                  </Button>
                </div>
              </div>

              {/* Cliente (solo para encargos) */}
              {type === 'CUSTOMER_ORDER' && (
                <div className="mb-4">
                  <Label>Cliente</Label>
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between p-2 border rounded mt-1 bg-blue-50">
                      <div>
                        <p className="font-medium text-sm">{selectedCustomer.name}</p>
                        <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <Input
                        placeholder="Buscar cliente..."
                        value={searchCustomer}
                        onChange={(e) => setSearchCustomer(e.target.value)}
                      />
                      <div className="mt-1 max-h-28 overflow-y-auto border rounded">
                        {filteredCustomers.slice(0, 5).map((c) => (
                          <div
                            key={c.id}
                            className="p-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedCustomer(c)
                              setSearchCustomer('')
                            }}
                          >
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.phone}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prioridad y Fecha */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label className="text-sm">Prioridad</Label>
                  <select
                    value={orderData.priority}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        priority: e.target.value as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
                      })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                  >
                    <option value="LOW">Baja</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Fecha Esperada</Label>
                  <Input
                    type="date"
                    value={orderData.expectedDate}
                    onChange={(e) => setOrderData({ ...orderData, expectedDate: e.target.value })}
                    className="mt-1 h-9"
                  />
                </div>
              </div>

              {/* Notas - más compacto en móvil */}
              <div className="mb-4">
                <Label className="text-sm">Notas</Label>
                <textarea
                  placeholder="Notas adicionales..."
                  value={orderData.notes}
                  onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 min-h-[60px]"
                />
              </div>

              {/* Buscar productos */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold">Agregar Productos</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o SKU..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Lista de productos */}
                <div className="mt-2 max-h-36 overflow-y-auto border rounded bg-white">
                  {filteredProducts.slice(0, 8).map((p) => (
                    <div
                      key={p.id}
                      className="p-2 hover:bg-green-50 cursor-pointer flex justify-between items-center border-b last:border-0 active:bg-green-100"
                      onClick={() => addItem(p)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          SKU: {p.sku} | Stock: {p.stock}
                        </p>
                      </div>
                      <div className="ml-2 shrink-0">
                        <Plus className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botón agregar manual - SIEMPRE VISIBLE */}
                <Button
                  type="button"
                  variant="default"
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                  onClick={() => addItem()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Item Manual
                </Button>
              </div>
            </div>

            {/* Panel derecho - Items del pedido */}
            <div className={`h-full overflow-y-auto p-4 bg-gray-50 ${activeTab === 'items' ? 'block' : 'hidden lg:block'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Items del Pedido</h3>
                <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                  {items.length} item(s)
                </span>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No hay items</p>
                  <p className="text-sm mt-1">Busca productos o agrega manualmente</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setActiveTab('config')
                      addItem()
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-3 bg-white border rounded-lg shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          Item #{index + 1}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Nombre del producto *"
                          value={item.productName}
                          onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                          className="font-medium"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">SKU</label>
                            <Input
                              placeholder="SKU"
                              value={item.productSku}
                              onChange={(e) => updateItem(item.id, 'productSku', e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Cant. *</label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                              }
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Costo</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="$0"
                              value={item.unitCost}
                              onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                        <Input
                          placeholder="Descripción / Especificaciones"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Botón agregar más en la lista de items */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => setActiveTab('config')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar más items
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 shrink-0">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
        <div className="flex justify-between items-center p-3 sm:p-4 border-t bg-white shrink-0">
          <div className="text-sm text-gray-500 hidden sm:block">
            {items.length > 0 && `${items.length} item(s) en el pedido`}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || items.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" />
              {isPending ? 'Creando...' : 'Crear Pedido'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
