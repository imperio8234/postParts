'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTenants, toggleTenantStatus } from '@/app/actions/admin/tenants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  Eye,
  Power,
  Filter,
  Building2,
  Users,
  Package,
  Loader2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone: string | null
  city: string | null
  isActive: boolean
  createdAt: Date
  plan: string
  planCode: string
  subscriptionStatus: string
  trialEndsAt: Date | null
  usersCount: number
  productsCount: number
  salesCount: number
}

interface TenantsListClientProps {
  initialTenants: Tenant[]
  plans: { code: string; name: string }[]
}

const subscriptionStatusLabels: Record<string, { label: string; color: string }> = {
  TRIAL: { label: 'Trial', color: 'bg-amber-500/10 text-amber-500' },
  ACTIVE: { label: 'Activo', color: 'bg-green-500/10 text-green-500' },
  PAST_DUE: { label: 'Vencido', color: 'bg-orange-500/10 text-orange-500' },
  SUSPENDED: { label: 'Suspendido', color: 'bg-red-500/10 text-red-500' },
  CANCELLED: { label: 'Cancelado', color: 'bg-slate-500/10 text-slate-400' },
  EXPIRED: { label: 'Expirado', color: 'bg-red-500/10 text-red-500' },
  NONE: { label: 'Sin plan', color: 'bg-slate-500/10 text-slate-400' },
}

export function TenantsListClient({ initialTenants, plans }: TenantsListClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tenants, setTenants] = useState(initialTenants)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleSearch = () => {
    startTransition(async () => {
      const results = await getTenants({
        search: search || undefined,
        status: statusFilter as 'all' | 'active' | 'inactive',
        plan: planFilter,
        subscriptionStatus: subscriptionFilter,
      })
      setTenants(results)
    })
  }

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id)
    try {
      const result = await toggleTenantStatus(id)
      if (result.success) {
        setTenants((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: result.isActive } : t))
        )
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    } finally {
      setTogglingId(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-white flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Buscar por nombre, email o slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos los planes</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.code} value={plan.code}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Suscripción" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Activas</SelectItem>
                <SelectItem value="PAST_DUE">Vencidas</SelectItem>
                <SelectItem value="SUSPENDED">Suspendidas</SelectItem>
                <SelectItem value="EXPIRED">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSearch}
              disabled={isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Buscar
            </Button>
            <Link href="/admin/tenants/new">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Negocio
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Negocio</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Suscripción</TableHead>
                <TableHead className="text-slate-400 text-center">Usuarios</TableHead>
                <TableHead className="text-slate-400 text-center">Productos</TableHead>
                <TableHead className="text-slate-400">Registro</TableHead>
                <TableHead className="text-slate-400 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No se encontraron negocios
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          tenant.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium text-white">{tenant.name}</p>
                          <p className="text-sm text-slate-400">{tenant.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tenant.planCode === 'premium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : tenant.planCode === 'intermediate'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-slate-600/50 text-slate-300'
                      }`}>
                        {tenant.plan}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        subscriptionStatusLabels[tenant.subscriptionStatus]?.color || 'bg-slate-600 text-slate-400'
                      }`}>
                        {subscriptionStatusLabels[tenant.subscriptionStatus]?.label || tenant.subscriptionStatus}
                      </span>
                      {tenant.subscriptionStatus === 'TRIAL' && tenant.trialEndsAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          Expira: {formatDate(tenant.trialEndsAt)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-300">
                        <Users className="w-4 h-4 text-slate-500" />
                        {tenant.usersCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-300">
                        <Package className="w-4 h-4 text-slate-500" />
                        {tenant.productsCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {formatDate(tenant.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/tenants/${tenant.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white hover:bg-slate-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(tenant.id)}
                          disabled={togglingId === tenant.id}
                          className={`${
                            tenant.isActive
                              ? 'text-green-500 hover:text-red-500'
                              : 'text-red-500 hover:text-green-500'
                          } hover:bg-slate-700`}
                        >
                          {togglingId === tenant.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Mostrando {tenants.length} negocio(s)
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Activos: {tenants.filter((t) => t.isActive).length}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Inactivos: {tenants.filter((t) => !t.isActive).length}
          </span>
        </div>
      </div>
    </div>
  )
}
