'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
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
import { createSale, type SaleItem } from '@/app/actions/sales'
import { getProductByBarcode } from '@/app/actions/products'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/lib/cart-context'
import { printInvoice, buildPrintData } from '@/lib/print-service'
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, Barcode } from 'lucide-react'

type Product = {
  id: string
  sku: string
  barcode: string | null
  name: string
  brand: string | null
  salePrice: { toString(): string }
  stock: number
}

type Customer = {
  id: string
  name: string
  phone: string | null
}

type BusinessInfo = {
  name: string
  nit: string
  address: string
  city: string
  country: string
  phone: string
  website?: string
  taxRegime?: string
}

type Props = {
  products: Product[]
  customers: Customer[]
  userName: string
  businessInfo: BusinessInfo
}

export function NewSaleForm({ products, customers, userName, businessInfo }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const {
    cart,
    selectedCustomer,
    paymentMethod,
    globalDiscount,
    notes,
    cashReceived,
    addToCart,
    updateQuantity,
    updateItemDiscount,
    removeFromCart,
    setSelectedCustomer,
    setPaymentMethod,
    setGlobalDiscount,
    setNotes,
    setCashReceived,
    clearCart,
    subtotal,
    total,
    change,
  } = useCart()

  const [searchProduct, setSearchProduct] = useState('')
  const [searchCustomer, setSearchCustomer] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [error, setError] = useState('')
  const [printError, setPrintError] = useState('')

  // Focus en el campo de código de barras al cargar
  useEffect(() => {
    barcodeInputRef.current?.focus()
  }, [])

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchProduct.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(searchProduct.toLowerCase()))
  )

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      (c.phone && c.phone.includes(searchCustomer))
  )

  const handleAddToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id)
    if (existing && existing.quantity >= product.stock) {
      setError(`Stock insuficiente para ${product.name}`)
      return
    }
    if (!existing && product.stock < 1) {
      setError(`Sin stock disponible para ${product.name}`)
      return
    }
    addToCart(product)
    setError('')
    setSearchProduct('')
  }

  // Búsqueda por código de barras
  const handleBarcodeSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault()

      // Primero buscar en productos locales
      const localProduct = products.find(
        (p) => p.barcode === barcodeInput.trim() || p.sku === barcodeInput.trim()
      )

      if (localProduct) {
        handleAddToCart(localProduct)
        setBarcodeInput('')
        return
      }

      // Si no está local, buscar en la base de datos
      try {
        const product = await getProductByBarcode(barcodeInput.trim())
        if (product) {
          handleAddToCart({
            id: product.id,
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            brand: product.brand,
            salePrice: product.salePrice,
            stock: product.stock,
          })
        } else {
          setError(`Producto no encontrado: ${barcodeInput}`)
        }
      } catch {
        setError('Error al buscar producto')
      }
      setBarcodeInput('')
    }
  }

  const handleSubmit = async (shouldPrint: boolean = false) => {
    if (cart.length === 0) {
      setError('Agrega productos al carrito')
      return
    }

    if ((paymentMethod === 'CASH' || paymentMethod === 'MIXED') && cashReceived < total) {
      setError('El efectivo recibido es menor al total')
      return
    }

    setError('')
    setPrintError('')

    const saleItems: SaleItem[] = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
    }))

    startTransition(async () => {
      try {
        const sale = await createSale({
          customerId: selectedCustomer?.id,
          items: saleItems,
          discount: globalDiscount,
          paymentMethod,
          notes: notes || undefined,
        })

        // TODO: IMPLEMENTACIÓN TEMPORAL DE IMPRESIÓN
        // Actualmente se abre una ventana con la factura en HTML para imprimir como PDF
        // Cuando se implemente el plugin de impresión, esto enviará los datos directamente
        // a la impresora térmica
        if (shouldPrint) {
          const printItems = cart.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.unitPrice,
          }))

          const printData = buildPrintData(
            printItems,
            sale.saleNumber,
            userName,
            paymentMethod,
            cashReceived,
            subtotal,
            globalDiscount,
            total,
            businessInfo,
            selectedCustomer?.name,
            notes
          )

          const printResult = await printInvoice(printData)
          if (!printResult.success) {
            setPrintError(printResult.error || 'Error al imprimir')
          }
        }

        clearCart()
        router.push('/dashboard/sales')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear la venta')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel izquierdo - Búsqueda de productos */}
      <div className="lg:col-span-2 space-y-6">
        {/* Búsqueda por código de barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Barcode className="w-5 h-5" />
              Escanear Código de Barras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              ref={barcodeInputRef}
              placeholder="Escanea o ingresa el código de barras..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeSearch}
              className="text-lg font-mono"
            />
            <p className="text-xs text-gray-500 mt-2">
              Presiona Enter después de escanear o escribir el código
            </p>
          </CardContent>
        </Card>

        {/* Búsqueda manual de productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre, SKU, código o marca..."
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
                      onClick={() => handleAddToCart(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          SKU: {product.sku}
                          {product.barcode && ` | Cód: ${product.barcode}`}
                          {' '}| Stock: {product.stock}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(parseFloat(product.salePrice.toString()))}
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

        {/* Carrito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrito ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                El carrito está vacío
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Desc.</TableHead>
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
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          className="w-20 text-right"
                          value={item.discount}
                          onChange={(e) =>
                            updateItemDiscount(
                              item.product.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(
                          item.quantity * item.unitPrice - item.discount
                        )}
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

      {/* Panel derecho - Resumen y pago */}
      <div className="space-y-6">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Buscar cliente..."
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                />
                {searchCustomer && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                    {filteredCustomers.length === 0 ? (
                      <p className="p-3 text-gray-500 text-center text-sm">
                        No encontrado
                      </p>
                    ) : (
                      filteredCustomers.slice(0, 5).map((customer) => (
                        <div
                          key={customer.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setSearchCustomer('')
                          }}
                        >
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Opcional - dejar vacío para Cliente General
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Método de pago */}
        <Card>
          <CardHeader>
            <CardTitle>Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {(['CASH', 'CARD', 'TRANSFER', 'MIXED'] as const).map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod(method)}
                  className="w-full"
                >
                  {method === 'CASH' && 'Efectivo'}
                  {method === 'CARD' && 'Tarjeta'}
                  {method === 'TRANSFER' && 'Transfer.'}
                  {method === 'MIXED' && 'Mixto'}
                </Button>
              ))}
            </div>
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
              <Label>Descuento</Label>
              <Input
                type="number"
                min="0"
                className="w-28 text-right"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Efectivo recibido y devueltas */}
            {(paymentMethod === 'CASH' || paymentMethod === 'MIXED') && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Efectivo Recibido</Label>
                  <Input
                    type="number"
                    min="0"
                    className="w-32 text-right text-lg"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                {cashReceived > 0 && (
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Devueltas</span>
                    <span className={`font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(change)}
                    </span>
                  </div>
                )}
              </div>
            )}

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
            {printError && (
              <p className="text-yellow-600 text-sm text-center">{printError}</p>
            )}

            <div className="space-y-2">
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleSubmit(false)}
                disabled={isPending || cart.length === 0}
              >
                {isPending ? 'Procesando...' : 'Confirmar Venta'}
              </Button>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isPending || cart.length === 0}
              >
                <Printer className="w-4 h-4 mr-2" />
                {isPending ? 'Procesando...' : 'Confirmar e Imprimir'}
              </Button>
              {cart.length > 0 && (
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={clearCart}
                  disabled={isPending}
                >
                  Limpiar Carrito
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
