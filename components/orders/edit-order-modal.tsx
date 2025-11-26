'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  updateOrder,
  addItemToOrder,
  removeItemFromOrder,
  updateOrderItem,
  getOrderHistory,
} from '@/app/actions/orders'
import {
  X,
  Plus,
  Trash2,
  Save,
  History,
  Edit2,
  Check,
  Package,
  ShoppingBag,
} from 'lucide-react'
import type { Order, OrderItem } from './orders-list'

type OrderHistory = {
  id: string
  action: string
  description: string
  createdAt: Date
  createdBy: string | null
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
  order: Order | null
  products: Product[]
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

type EditableItem = {
  id: string
  isNew?: boolean
  productId: string | null
  productName: string
  productSku: string
  description: string
  quantity: number
  unitCost: string
  notes: string
  isEditing?: boolean
}

export function EditOrderModal({ order, products, isOpen, onClose, onSave }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'items' | 'history'>('items')
  const [items, setItems] = useState<EditableItem[]>([])
  const [history, setHistory] = useState<OrderHistory[]>([])
  const [searchProduct, setSearchProduct] = useState('')
  const [error, setError] = useState('')

  const [orderData, setOrderData] = useState({
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    expectedDate: '',
    notes: '',
  })

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (order && isOpen) {
      setItems(
        order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku || '',
          description: item.description || '',
          quantity: item.quantity,
          unitCost: item.unitCost?.toString() || '',
          notes: item.notes || '',
          isEditing: false,
        }))
      )
      setOrderData({
        priority: order.priority,
        expectedDate: order.expectedDate
          ? new Date(order.expectedDate).toISOString().split('T')[0]
          : '',
        notes: order.notes || '',
      })
      // Cargar historial
      loadHistory(order.id)
    }
  }, [order, isOpen])

  const loadHistory = async (orderId: string) => {
    const hist = await getOrderHistory(orderId)
    setHistory(hist)
  }

  if (!isOpen || !order) return null

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  )

  const addNewItem = (product?: Product) => {
    const newItem: EditableItem = {
      id: `new-${Date.now()}`,
      isNew: true,
      productId: product?.id || null,
      productName: product?.name || '',
      productSku: product?.sku || '',
      description: '',
      quantity: 1,
      unitCost: product?.costPrice?.toString() || '',
      notes: '',
      isEditing: true,
    }
    setItems([...items, newItem])
    setSearchProduct('')
  }

  const updateItem = (id: string, field: keyof EditableItem, value: string | number | boolean | null) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSave = async () => {
    setError('')

    if (items.length === 0) {
      setError('El pedido debe tener al menos un item')
      return
    }

    if (items.some((item) => !item.productName)) {
      setError('Todos los items deben tener un nombre')
      return
    }

    startTransition(async () => {
      try {
        await updateOrder(order.id, {
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
        onSave()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {order.type === 'CUSTOMER_ORDER' ? (
              <ShoppingBag className="w-6 h-6 text-purple-500" />
            ) : (
              <Package className="w-6 h-6 text-orange-500" />
            )}
            <div>
              <h2 className="text-xl font-bold">Editar {order.orderNumber}</h2>
              <p className="text-sm text-gray-500">
                {order.type === 'CUSTOMER_ORDER' ? 'Encargo de Cliente' : 'Reposición de Stock'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'items'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('items')}
          >
            Items ({items.length})
          </button>
          <button
            className={`px-4 py-2 font-medium flex items-center gap-1 ${
              activeTab === 'history'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-4 h-4" />
            Historial
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-220px)]">
          {activeTab === 'items' && (
            <div className="space-y-4">
              {/* Datos del pedido */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Prioridad</Label>
                  <select
                    value={orderData.priority}
                    onChange={(e) =>
                      setOrderData({
                        ...orderData,
                        priority: e.target.value as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  >
                    <option value="LOW">Baja</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <Label>Fecha Esperada</Label>
                  <Input
                    type="date"
                    value={orderData.expectedDate}
                    onChange={(e) =>
                      setOrderData({ ...orderData, expectedDate: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Notas</Label>
                  <Input
                    value={orderData.notes}
                    onChange={(e) =>
                      setOrderData({ ...orderData, notes: e.target.value })
                    }
                    placeholder="Notas del pedido..."
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Agregar producto */}
              <div>
                <Label>Agregar Item</Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="Buscar producto..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                  />
                  {searchProduct && (
                    <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border rounded-md shadow-lg">
                      {filteredProducts.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          onClick={() => addNewItem(p)}
                        >
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-gray-500">
                              SKU: {p.sku} | Stock: {p.stock}
                            </p>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                      <div
                        className="p-2 hover:bg-blue-50 cursor-pointer border-t"
                        onClick={() => addNewItem()}
                      >
                        <p className="text-sm text-blue-600">+ Agregar item manual</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de items */}
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg ${
                      item.isNew ? 'bg-green-50 border-green-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">
                        Item #{index + 1} {item.isNew && '(nuevo)'}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => updateItem(item.id, 'isEditing', !item.isEditing)}
                        >
                          {item.isEditing ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Edit2 className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {item.isEditing ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Nombre del producto *"
                          value={item.productName}
                          onChange={(e) =>
                            updateItem(item.id, 'productName', e.target.value)
                          }
                        />
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            placeholder="SKU"
                            value={item.productSku}
                            onChange={(e) =>
                              updateItem(item.id, 'productSku', e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            min="1"
                            placeholder="Cantidad"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Costo"
                            value={item.unitCost}
                            onChange={(e) =>
                              updateItem(item.id, 'unitCost', e.target.value)
                            }
                          />
                          <Input
                            placeholder="Descripción"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, 'description', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.productSku && (
                            <p className="text-xs text-gray-500">SKU: {item.productSku}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">x{item.quantity}</p>
                          {item.unitCost && (
                            <p className="text-xs text-gray-500">
                              ${parseFloat(item.unitCost).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <p>No hay items en el pedido</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => addNewItem()}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Item
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay historial de cambios
                </div>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            entry.action === 'CREATED'
                              ? 'bg-green-100 text-green-800'
                              : entry.action === 'STATUS_CHANGED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {entry.action === 'CREATED' && 'Creado'}
                          {entry.action === 'STATUS_CHANGED' && 'Estado'}
                          {entry.action === 'EDITED' && 'Editado'}
                          {entry.action === 'ITEM_ADDED' && 'Item Agregado'}
                          {entry.action === 'ITEM_REMOVED' && 'Item Eliminado'}
                          {entry.action === 'ITEM_UPDATED' && 'Item Actualizado'}
                        </span>
                        <p className="mt-1 text-sm">{entry.description}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{formatDate(entry.createdAt)}</p>
                        <p>{entry.createdBy}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
