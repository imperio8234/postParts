'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrdersList } from './orders-list'
import { CreateOrderModal } from './create-order-modal'
import { Package, ShoppingBag, Plus } from 'lucide-react'
import type { Order } from './orders-list'

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
  restock: Order[]
  customerOrders: Order[]
  customers: Customer[]
  products: Product[]
}

export function OrdersPageClient({ restock, customerOrders, customers, products }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pedidos y Encargos</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reposición</CardTitle>
            <Package className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{restock.length}</div>
            <p className="text-xs text-gray-500">pedidos de reposición</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Encargos</CardTitle>
            <ShoppingBag className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{customerOrders.length}</div>
            <p className="text-xs text-gray-500">pedidos de clientes</p>
          </CardContent>
        </Card>
      </div>

      <OrdersList
        restock={restock}
        customerOrders={customerOrders}
        products={products}
      />

      {/* Modal para crear pedido */}
      <CreateOrderModal
        customers={customers}
        products={products}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
