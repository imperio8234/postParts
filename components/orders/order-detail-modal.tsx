'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { X, Package, ShoppingBag, User, Calendar, AlertTriangle, Truck, Check } from 'lucide-react'
import type { Order } from './orders-list'

type Props = {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (id: string, status: 'PENDING' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'DELIVERED' | 'CANCELLED') => void
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

const priorityLabels = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
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
  ORDERED: 'Pedido al Proveedor',
  PARTIAL: 'Parcialmente Recibido',
  RECEIVED: 'Recibido',
  DELIVERED: 'Entregado al Cliente',
  CANCELLED: 'Cancelado',
}

export function OrderDetailModal({ order, isOpen, onClose, onStatusChange }: Props) {
  if (!isOpen || !order) return null

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const estimatedTotal = order.items.reduce(
    (sum, item) => sum + (Number(item.unitCost) || 0) * item.quantity,
    0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {order.type === 'CUSTOMER_ORDER' ? (
              <ShoppingBag className="w-6 h-6 text-purple-500" />
            ) : (
              <Package className="w-6 h-6 text-orange-500" />
            )}
            <div>
              <h2 className="text-xl font-bold">{order.orderNumber}</h2>
              <p className="text-sm text-gray-500">
                {order.type === 'CUSTOMER_ORDER' ? 'Encargo de Cliente' : 'Reposición de Stock'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <span className={`text-sm px-2 py-1 rounded ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Prioridad</p>
              <span className={`text-sm px-2 py-1 rounded ${priorityColors[order.priority]}`}>
                {order.priority === 'URGENT' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                {priorityLabels[order.priority]}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Fecha
              </p>
              <p className="text-sm font-medium">{formatDate(order.orderDate)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Items</p>
              <p className="text-lg font-bold">{totalItems}</p>
            </div>
          </div>

          {/* Cliente (solo para encargos) */}
          {order.type === 'CUSTOMER_ORDER' && order.customer && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-purple-800">Cliente</span>
              </div>
              <p className="font-semibold">{order.customer.name}</p>
              {order.customer.phone && (
                <p className="text-sm text-gray-600">{order.customer.phone}</p>
              )}
            </div>
          )}

          {/* Fechas */}
          {(order.expectedDate || order.receivedDate) && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              {order.expectedDate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Fecha Esperada</p>
                  <p className="font-medium">{formatDate(order.expectedDate)}</p>
                </div>
              )}
              {order.receivedDate && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Fecha Recibido</p>
                  <p className="font-medium">{formatDate(order.receivedDate)}</p>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          {order.notes && (
            <div className="mb-6 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700 mb-1">Notas</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="font-semibold mb-3">Detalle del Pedido</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  {order.items.some(i => i.unitCost) && (
                    <TableHead className="text-right">Costo Unit.</TableHead>
                  )}
                  {order.items.some(i => i.unitCost) && (
                    <TableHead className="text-right">Subtotal</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        {item.productSku && (
                          <p className="text-xs text-gray-500">SKU: {item.productSku}</p>
                        )}
                        {item.description && (
                          <p className="text-xs text-gray-500">{item.description}</p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-blue-500 italic">{item.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{item.quantity}</span>
                      {item.received && (
                        <span className="text-green-500 ml-1">
                          <Check className="w-3 h-3 inline" />
                        </span>
                      )}
                    </TableCell>
                    {order.items.some(i => i.unitCost) && (
                      <TableCell className="text-right">
                        {item.unitCost ? formatCurrency(Number(item.unitCost)) : '-'}
                      </TableCell>
                    )}
                    {order.items.some(i => i.unitCost) && (
                      <TableCell className="text-right">
                        {item.unitCost
                          ? formatCurrency(Number(item.unitCost) * item.quantity)
                          : '-'}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {estimatedTotal > 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-right font-semibold">
                      Total Estimado:
                    </TableCell>
                    <TableCell colSpan={2} className="text-right font-bold text-lg">
                      {formatCurrency(estimatedTotal)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {order._count.items} items en este pedido
          </div>
          <div className="flex gap-2">
            {order.status === 'PENDING' && (
              <Button
                variant="outline"
                onClick={() => {
                  onStatusChange(order.id, 'ORDERED')
                  onClose()
                }}
              >
                <Truck className="w-4 h-4 mr-2" />
                Marcar como Pedido
              </Button>
            )}
            {order.status === 'ORDERED' && (
              <Button
                variant="outline"
                onClick={() => {
                  onStatusChange(order.id, 'RECEIVED')
                  onClose()
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Marcar como Recibido
              </Button>
            )}
            {order.type === 'CUSTOMER_ORDER' && order.status === 'RECEIVED' && (
              <Button
                onClick={() => {
                  onStatusChange(order.id, 'DELIVERED')
                  onClose()
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Marcar como Entregado
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
