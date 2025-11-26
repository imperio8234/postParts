import { getBusinessSettings } from '@/app/actions/settings'
import { BusinessSettingsForm } from '@/components/settings/business-settings-form'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const settings = await getBusinessSettings()

  if (!settings) {
    redirect('/login')
  }

  // Convertir null a undefined para compatibilidad con el formulario
  const businessSettings = {
    name: settings.name,
    email: settings.email,
    nit: settings.nit || undefined,
    phone: settings.phone || undefined,
    address: settings.address || undefined,
    city: settings.city || undefined,
    country: settings.country || undefined,
    website: settings.website || undefined,
    taxRegime: settings.taxRegime || undefined,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-gray-500 mt-1">
            Administra la información de tu negocio
          </p>
        </div>
      </div>

      <BusinessSettingsForm initialData={businessSettings} />
    </div>
  )
}
