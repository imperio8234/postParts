import { getTenants, getPlans } from '@/app/actions/admin/tenants'
import { TenantsListClient } from '@/components/admin/tenants-list-client'

export default async function TenantsPage() {
  const [tenants, plans] = await Promise.all([
    getTenants(),
    getPlans(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Negocios</h1>
          <p className="text-slate-400">Gestiona todos los negocios registrados en la plataforma</p>
        </div>
      </div>

      <TenantsListClient
        initialTenants={tenants}
        plans={plans.map((p) => ({ code: p.code, name: p.name }))}
      />
    </div>
  )
}
