'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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

export type CartItem = {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
}

type CartContextType = {
  cart: CartItem[]
  selectedCustomer: Customer | null
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED'
  globalDiscount: number
  notes: string
  cashReceived: number
  addToCart: (product: Product) => void
  updateQuantity: (productId: string, delta: number) => void
  updateItemDiscount: (productId: string, discount: number) => void
  removeFromCart: (productId: string) => void
  setSelectedCustomer: (customer: Customer | null) => void
  setPaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED') => void
  setGlobalDiscount: (discount: number) => void
  setNotes: (notes: string) => void
  setCashReceived: (cash: number) => void
  clearCart: () => void
  subtotal: number
  total: number
  change: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'bike-pos-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'MIXED'>('CASH')
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [cashReceived, setCashReceived] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar del localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setCart(data.cart || [])
        setSelectedCustomer(data.selectedCustomer || null)
        setPaymentMethod(data.paymentMethod || 'CASH')
        setGlobalDiscount(data.globalDiscount || 0)
        setNotes(data.notes || '')
        setCashReceived(data.cashReceived || 0)
      } catch (e) {
        console.error('Error loading cart from storage:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          cart,
          selectedCustomer,
          paymentMethod,
          globalDiscount,
          notes,
          cashReceived,
        })
      )
    }
  }, [cart, selectedCustomer, paymentMethod, globalDiscount, notes, cashReceived, isLoaded])

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) {
        return // Stock insuficiente
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      if (product.stock < 1) {
        return // Sin stock
      }
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unitPrice: parseFloat(product.salePrice.toString()),
          discount: 0,
        },
      ])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            if (newQty > item.product.stock || newQty < 1) {
              return item
            }
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, discount } : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
    setPaymentMethod('CASH')
    setGlobalDiscount(0)
    setNotes('')
    setCashReceived(0)
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
    0
  )
  const total = subtotal - globalDiscount
  const change = cashReceived > total ? cashReceived - total : 0

  return (
    <CartContext.Provider
      value={{
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
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
