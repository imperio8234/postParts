import { getAdminStats, getTrialExpiringTenants } from '@/app/actions/admin/stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  Building2,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [stats, expiringTenants] = await Promise.all([
    getAdminStats(),
    getTrialExpiringTenants(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Resumen general de la plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Negocios
            </CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTenants}</div>
            <p className="text-xs text-slate-500">
              {stats.activeTenants} activos, {stats.inactiveTenants} inactivos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              En Trial
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.trialTenants}</div>
            <p className="text-xs text-slate-500">
              Pruebas gratuitas activas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Usuarios Totales
            </CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-slate-500">
              En todos los negocios
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Ingresos del Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(Number(stats.monthlyRevenue))}
            </div>
            <p className="text-xs text-slate-500">
              Pagos completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Suscripciones Activas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Productos Totales
            </CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Expiradas/Canceladas
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.expiredSubscriptions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trials por expirar */}
        {expiringTenants.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Trials por Expirar
              </CardTitle>
              <CardDescription className="text-slate-400">
                Negocios cuyo período de prueba expira en los próximos 7 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringTenants.map((tenant) => (
                  <div
                    key={tenant.tenantId}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                  >
                    <div>
                      <p className="font-medium text-white">{tenant.tenantName}</p>
                      <p className="text-sm text-slate-400">{tenant.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        tenant.daysRemaining <= 3 ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {tenant.daysRemaining} días
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Negocios recientes */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Negocios Recientes</CardTitle>
            <CardDescription className="text-slate-400">
              Últimos registros en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentTenants.map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/admin/tenants/${tenant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      tenant.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-white">{tenant.name}</p>
                      <p className="text-sm text-slate-400">
                        {tenant.usersCount} usuarios · {tenant.productsCount} productos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      tenant.status === 'TRIAL'
                        ? 'bg-amber-500/10 text-amber-500'
                        : tenant.status === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-slate-600 text-slate-400'
                    }`}>
                      {tenant.status === 'TRIAL' ? 'Trial' : tenant.plan}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribución por plan */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Distribución por Plan</CardTitle>
            <CardDescription className="text-slate-400">
              Negocios por tipo de suscripción
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.planStats.map((stat) => (
                <div key={stat.planCode} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{stat.planName}</span>
                    <span className="text-white font-medium">{stat.count}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stat.planCode === 'premium'
                          ? 'bg-amber-500'
                          : stat.planCode === 'intermediate'
                          ? 'bg-blue-500'
                          : 'bg-slate-500'
                      }`}
                      style={{
                        width: `${(stat.count / stats.totalTenants) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
