'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  TrendingDown,
  BarChart3,
  ClipboardList,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Wallet,
  Settings,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'

type Props = {
  session: {
    user: {
      name?: string | null
      email?: string | null
      tenantName?: string
    }
  }
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Productos', icon: Package },
  { href: '/dashboard/sales', label: 'Ventas', icon: ShoppingCart },
  { href: '/dashboard/purchases', label: 'Compras', icon: Receipt },
  { href: '/dashboard/expenses', label: 'Gastos', icon: TrendingDown },
  { href: '/dashboard/replenishment', label: 'Pedidos', icon: ClipboardList },
  { href: '/dashboard/cash-history', label: 'Historial Caja', icon: Wallet },
  { href: '/dashboard/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
]

export function Sidebar({ session }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div>
            <h1 className="text-lg font-bold text-primary">Moto Parts POS</h1>
            {session.user.tenantName && (
              <p className="text-xs text-gray-600 truncate max-w-[200px]">
                {session.user.tenantName}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r shadow-lg
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex flex-col justify-center px-6 border-b">
          <h1 className="text-xl font-bold text-primary">Moto Parts POS</h1>
          {session.user.tenantName && (
            <p className="text-xs text-gray-600 mt-0.5 truncate">
              {session.user.tenantName}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="border-t p-4 space-y-2">
          <div className="mb-3">
            <p className="font-medium text-sm text-gray-900 truncate">
              {session.user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session.user.tenantName || session.user.email}
            </p>
          </div>

          {/* Botón de Soporte - WhatsApp */}
          <a
            href="https://wa.me/573205318658"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full border-green-500 text-green-600 hover:bg-green-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Soporte
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16" />
    </>
  )
}
