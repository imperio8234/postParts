import { getPendingOrders } from '@/app/actions/orders'
import { getCustomers } from '@/app/actions/customers'
import { getAllProducts } from '@/app/actions/products'
import { OrdersPageClient } from '@/components/orders/orders-page-client'

export default async function OrdersPage() {
  const [{ restock, customerOrders }, customers, products] = await Promise.all([
    getPendingOrders(),
    getCustomers(),
    getAllProducts(),
  ])

  const serializedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
  }))

  const serializedProducts = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    stock: p.stock,
    minStock: p.minStock,
    costPrice: Number(p.costPrice),
  }))

  // Serializar las fechas para pasar al cliente
  const serializedRestock = restock.map((order) => ({
    ...order,
    orderDate: order.orderDate,
    expectedDate: order.expectedDate,
    receivedDate: order.receivedDate,
    items: order.items.map((item) => ({
      ...item,
      unitCost: item.unitCost ? Number(item.unitCost) : null,
    })),
  }))

  const serializedCustomerOrders = customerOrders.map((order) => ({
    ...order,
    orderDate: order.orderDate,
    expectedDate: order.expectedDate,
    receivedDate: order.receivedDate,
    items: order.items.map((item) => ({
      ...item,
      unitCost: item.unitCost ? Number(item.unitCost) : null,
    })),
  }))

  return (
    <OrdersPageClient
    //@ts-ignore
      restock={serializedRestock}
      customerOrders={serializedCustomerOrders}
      customers={serializedCustomers}
      products={serializedProducts}
    />
  )
}
