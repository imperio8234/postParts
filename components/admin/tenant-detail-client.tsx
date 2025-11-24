'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  toggleTenantStatus,
  updateTenantSubscription,
  updateTenantUser,
} from '@/app/actions/admin/tenants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Power,
  Edit,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

interface Plan {
  id: string
  code: string
  name: string
  monthlyPrice: unknown
  yearlyPrice: unknown | null
  maxUsers: number
  maxProducts: number
}

interface TenantDetailClientProps {
  tenant: {
    id: string
    name: string
    slug: string
    email: string
    phone: string | null
    address: string | null
    city: string | null
    nit: string | null
    isActive: boolean
    createdAt: Date
    subscription: {
      id: string
      status: string
      startDate: Date
      trialEndsAt: Date | null
      currentPeriodStart: Date | null
      currentPeriodEnd: Date | null
      billingCycle: string
      adminNotes: string | null
      plan: {
        id: string
        code: string
        name: string
        monthlyPrice: unknown
      }
      payments: Array<{
        id: string
        amount: unknown
        status: string
        paymentDate: Date | null
        createdAt: Date
      }>
    } | null
    users: Array<{
      id: string
      name: string
      email: string
      role: string
      isActive: boolean
      createdAt: Date
    }>
    _count: {
      products: number
      sales: number
      customers: number
      purchases: number
    }
  }
  plans: Plan[]
}

const subscriptionStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  TRIAL: { label: 'Período de Prueba', color: 'text-amber-500 bg-amber-500/10', icon: Clock },
  ACTIVE: { label: 'Activa', color: 'text-green-500 bg-green-500/10', icon: CheckCircle },
  PAST_DUE: { label: 'Pago Vencido', color: 'text-orange-500 bg-orange-500/10', icon: AlertTriangle },
  SUSPENDED: { label: 'Suspendida', color: 'text-red-500 bg-red-500/10', icon: XCircle },
  CANCELLED: { label: 'Cancelada', color: 'text-slate-400 bg-slate-500/10', icon: XCircle },
  EXPIRED: { label: 'Expirada', color: 'text-red-500 bg-red-500/10', icon: XCircle },
}

export function TenantDetailClient({ tenant, plans }: TenantDetailClientProps) {
  const router = useRouter()
  const [isToggling, setIsToggling] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(tenant.subscription?.plan.code || '')
  const [selectedStatus, setSelectedStatus] = useState(tenant.subscription?.status || 'ACTIVE')
  const [billingCycle, setBillingCycle] = useState(tenant.subscription?.billingCycle || 'MONTHLY')
  const [adminNotes, setAdminNotes] = useState(tenant.subscription?.adminNotes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

  const handleToggleStatus = async () => {
    setIsToggling(true)
    try {
      await toggleTenantStatus(tenant.id)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleUpdateSubscription = async () => {
    setIsSaving(true)
    try {
      await updateTenantSubscription(tenant.id, {
        planCode: selectedPlan,
        status: selectedStatus,
        billingCycle: billingCycle as 'MONTHLY' | 'YEARLY',
        adminNotes,
      })
      setShowPlanModal(false)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    setTogglingUserId(userId)
    try {
      await updateTenantUser(tenant.id, userId, { isActive: !currentStatus })
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setTogglingUserId(null)
    }
  }

  const statusConfig = subscriptionStatusConfig[tenant.subscription?.status || 'NONE'] || {
    label: 'Sin suscripción',
    color: 'text-slate-400 bg-slate-500/10',
    icon: XCircle,
  }
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tenants">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
              <span className={`w-3 h-3 rounded-full ${tenant.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <p className="text-slate-400">{tenant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={isToggling}
            className={`border-slate-600 ${
              tenant.isActive
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-green-400 hover:bg-green-500/10'
            }`}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Power className="w-4 h-4 mr-2" />
            )}
            {tenant.isActive ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info del negocio */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Información del Negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <Mail className="w-4 h-4 text-slate-500" />
              {tenant.email}
            </div>
            {tenant.phone && (
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-slate-500" />
                {tenant.phone}
              </div>
            )}
            {(tenant.address || tenant.city) && (
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-500" />
                {[tenant.address, tenant.city].filter(Boolean).join(', ')}
              </div>
            )}
            {tenant.nit && (
              <div className="flex items-center gap-3 text-slate-300">
                <CreditCard className="w-4 h-4 text-slate-500" />
                NIT: {tenant.nit}
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="w-4 h-4 text-slate-500" />
              Registrado: {formatDate(tenant.createdAt)}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Users className="w-4 h-4" />
                  Usuarios
                </div>
                <p className="text-2xl font-bold text-white mt-1">{tenant.users.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Package className="w-4 h-4" />
                  Productos
                </div>
                <p className="text-2xl font-bold text-white mt-1">{tenant._count.products}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <ShoppingCart className="w-4 h-4" />
                  Ventas
                </div>
                <p className="text-2xl font-bold text-white mt-1">{tenant._count.sales}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Users className="w-4 h-4" />
                  Clientes
                </div>
                <p className="text-2xl font-bold text-white mt-1">{tenant._count.customers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suscripción */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Suscripción</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPlanModal(true)}
              className="text-slate-400 hover:text-white"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Plan</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                tenant.subscription?.plan.code === 'premium'
                  ? 'bg-amber-500/10 text-amber-500'
                  : tenant.subscription?.plan.code === 'intermediate'
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'bg-slate-600/50 text-slate-300'
              }`}>
                {tenant.subscription?.plan.name || 'Sin plan'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Estado</span>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
            </div>
            {tenant.subscription?.status === 'TRIAL' && tenant.subscription.trialEndsAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trial expira</span>
                <span className="text-amber-400 text-sm">
                  {formatDate(tenant.subscription.trialEndsAt)}
                </span>
              </div>
            )}
            {tenant.subscription?.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Período actual</span>
                <span className="text-slate-300 text-sm">
                  {formatDate(tenant.subscription.currentPeriodEnd)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Precio mensual</span>
              <span className="text-white font-medium">
                {formatCurrency(Number(tenant.subscription?.plan.monthlyPrice) || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuarios */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Usuarios del Negocio</CardTitle>
          <CardDescription className="text-slate-400">
            Gestiona los usuarios de este negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Usuario</TableHead>
                <TableHead className="text-slate-400">Rol</TableHead>
                <TableHead className="text-slate-400">Estado</TableHead>
                <TableHead className="text-slate-400">Registro</TableHead>
                <TableHead className="text-slate-400 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant.users.map((user) => (
                <TableRow key={user.id} className="border-slate-700">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-500/10 text-purple-400'
                        : user.role === 'SELLER'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`flex items-center gap-1.5 ${
                      user.isActive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {user.isActive ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleUser(user.id, user.isActive)}
                      disabled={togglingUserId === user.id}
                      className={`${
                        user.isActive
                          ? 'text-green-400 hover:text-red-400'
                          : 'text-red-400 hover:text-green-400'
                      }`}
                    >
                      {togglingUserId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historial de pagos */}
      {tenant.subscription?.payments && tenant.subscription.payments.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Fecha</TableHead>
                  <TableHead className="text-slate-400">Monto</TableHead>
                  <TableHead className="text-slate-400">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.subscription.payments.map((payment) => (
                  <TableRow key={payment.id} className="border-slate-700">
                    <TableCell className="text-slate-300">
                      {formatDateTime(payment.paymentDate || payment.createdAt)}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'COMPLETED'
                          ? 'bg-green-500/10 text-green-400'
                          : payment.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {payment.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal para editar suscripción */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Actualizar Suscripción</DialogTitle>
            <DialogDescription className="text-slate-400">
              Modifica el plan y estado de la suscripción de {tenant.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {plans.map((plan) => (
                    <SelectItem key={plan.code} value={plan.code}>
                      {plan.name} - {formatCurrency(Number(plan.monthlyPrice))}/mes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Estado</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                  <SelectItem value="PAST_DUE">Pago Vencido</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Ciclo de Facturación</Label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="MONTHLY">Mensual</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notas del Admin</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notas internas sobre esta suscripción..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowPlanModal(false)}
              className="text-slate-400"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateSubscription}
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
