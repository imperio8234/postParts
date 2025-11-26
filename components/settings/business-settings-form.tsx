'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updateBusinessSettings, type BusinessSettings } from '@/app/actions/settings'
import { Store, Save } from 'lucide-react'

type Props = {
  initialData: BusinessSettings
}

export function BusinessSettingsForm({ initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<BusinessSettings>(initialData)

  const handleChange = (field: keyof BusinessSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      setError('El nombre y email son obligatorios')
      return
    }

    setError('')
    setSuccess(false)

    startTransition(async () => {
      try {
        await updateBusinessSettings(formData)
        setSuccess(true)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar la configuración')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" />
          Información del Negocio
        </CardTitle>
        <CardDescription>
          Esta información se utilizará en las facturas y documentos del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre del Negocio */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Negocio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: MotoParts Store"
                required
              />
            </div>

            {/* NIT */}
            <div className="space-y-2">
              <Label htmlFor="nit">NIT / Documento</Label>
              <Input
                id="nit"
                value={formData.nit || ''}
                onChange={(e) => handleChange('nit', e.target.value)}
                placeholder="Ej: 900.123.456-7"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contacto@negocio.com"
                required
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Ej: 3001234567"
              />
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Ej: Calle 123 #45-67"
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ej: Bogotá"
              />
            </div>

            {/* País */}
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Ej: Colombia"
              />
            </div>

            {/* Sitio Web */}
            <div className="space-y-2">
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="Ej: www.minegocios.com"
              />
            </div>

            {/* Régimen Tributario */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="taxRegime">Régimen Tributario</Label>
              <Input
                id="taxRegime"
                value={formData.taxRegime || ''}
                onChange={(e) => handleChange('taxRegime', e.target.value)}
                placeholder="Ej: Régimen Simplificado / Responsable de IVA"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              ¡Configuración guardada exitosamente!
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} size="lg">
              <Save className="w-4 h-4 mr-2" />
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
