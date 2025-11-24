import { getTenantById, getPlans } from '@/app/actions/admin/tenants'
import { TenantDetailClient } from '@/components/admin/tenant-detail-client'
import { notFound } from 'next/navigation'

interface TenantDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { id } = await params

  try {
    const [tenant, plans] = await Promise.all([
      getTenantById(id),
      getPlans(),
    ])

    return (
      <TenantDetailClient
        tenant={tenant}
        plans={plans}
      />
    )
  } catch {
    notFound()
  }
}
