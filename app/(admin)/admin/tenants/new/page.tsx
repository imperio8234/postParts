import { getPlans } from '@/app/actions/admin/tenants'
import { NewTenantForm } from '@/components/admin/new-tenant-form'

export const dynamic = 'force-dynamic'

export default async function NewTenantPage() {
  const plans = await getPlans()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Nuevo Negocio</h1>
        <p className="text-slate-400">Registra un nuevo negocio en la plataforma</p>
      </div>

      <NewTenantForm plans={plans.map((p) => ({
        code: p.code,
        name: p.name,
        monthlyPrice: Number(p.monthlyPrice),
      }))} />
    </div>
  )
}
