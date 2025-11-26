'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { updateOrderStatus, deleteOrder, createRestockOrderFromLowStock } from '@/app/actions/orders'
import { OrderDetailModal } from './order-detail-modal'
import { EditOrderModal } from './edit-order-modal'
import { Package, ShoppingBag, Trash2, Eye, Truck, Check, RefreshCw, AlertTriangle, Edit2 } from 'lucide-react'

export type OrderItem = {
  id: string
  productId: string | null
  productName: string
  productSku: string | null
  description: string | null
  quantity: number
  unitCost: number | null
  received: boolean
  receivedQty: number
  notes: string | null
  product: {
    id: string
    sku: string
    name: string
    stock: number
  } | null
}

export type Order = {
  id: string
  orderNumber: string
  type: 'RESTOCK' | 'CUSTOMER_ORDER'
  status: 'PENDING' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  orderDate: Date
  expectedDate: Date | null
  receivedDate: Date | null
  notes: string | null
  customer: {
    id: string
    name: string
    phone: string | null
  } | null
  items: OrderItem[]
  _count: {
    items: number
  }
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
  restock: Order[]
  customerOrders: Order[]
  products: Product[]
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ORDERED: 'bg-blue-100 text-blue-800',
  PARTIAL: 'bg-purple-100 text-purple-800',
  RECEIVED: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const statusLabels = {
  PENDING: 'Pendiente',
  ORDERED: 'Pedido',
  PARTIAL: 'Parcial',
  RECEIVED: 'Recibido',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export function OrdersList({ restock, customerOrders, products }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'restock' | 'orders'>('restock')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleStatusChange = (id: string, status: 'PENDING' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED') => {
    startTransition(async () => {
      await updateOrderStatus(id, status)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) {
      startTransition(async () => {
        await deleteOrder(id)
      })
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowViewModal(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleAddLowStock = () => {
    startTransition(async () => {
      const result = await createRestockOrderFromLowStock()
      if (result.created) {
        alert(`Se creó un pedido con ${result.itemsCount} productos con stock bajo`)
      } else {
        alert(result.message)
      }
    })
  }

  const orders = activeTab === 'restock' ? restock : customerOrders

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle>Pedidos</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'restock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('restock')}
              >
                <Package className="w-4 h-4 mr-1" />
                Reposición de Stock ({restock.length})
              </Button>
              <Button
                variant={activeTab === 'orders' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingBag className="w-4 h-4 mr-1" />
                Encargos ({customerOrders.length})
              </Button>
            </div>
          </div>
          {activeTab === 'restock' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLowStock}
              disabled={isPending}
              className="mt-2 w-fit"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Crear Pedido Stock Bajo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {activeTab === 'restock'
                ? 'No hay reposiciones de stock pendientes'
                : 'No hay encargos pendientes'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pedido</TableHead>
                    <TableHead>Fecha</TableHead>
                    {activeTab === 'orders' && <TableHead>Cliente</TableHead>}
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.type === 'CUSTOMER_ORDER' ? (
                            <ShoppingBag className="w-4 h-4 text-purple-500" />
                          ) : (
                            <Package className="w-4 h-4 text-orange-500" />
                          )}
                          <span className="font-medium">{order.orderNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDate(order.orderDate)}</p>
                          {order.expectedDate && (
                            <p className="text-xs text-gray-500">
                              Esperado: {formatDate(order.expectedDate)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      {activeTab === 'orders' && (
                        <TableCell>
                          {order.customer ? (
                            <div>
                              <p className="font-medium text-sm">{order.customer.name}</p>
                              <p className="text-xs text-gray-500">{order.customer.phone}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <span className="font-semibold">{order._count.items}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${priorityColors[order.priority]}`}>
                          {order.priority === 'URGENT' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {order.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewOrder(order)}
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrder(order)}
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                          {order.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(order.id, 'ORDERED')}
                              disabled={isPending}
                              title="Marcar como pedido"
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          )}
                          {order.status === 'ORDERED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(order.id, 'RECEIVED')}
                              disabled={isPending}
                              title="Marcar como recibido"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {order.type === 'CUSTOMER_ORDER' && order.status === 'RECEIVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                              disabled={isPending}
                              title="Marcar como entregado"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(order.id)}
                              disabled={isPending}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedOrder(null)
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Modal de edición */}
      <EditOrderModal
        order={selectedOrder}
        products={products}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedOrder(null)
        }}
        onSave={() => {
          router.refresh()
        }}
      />
    </>
  )
}
