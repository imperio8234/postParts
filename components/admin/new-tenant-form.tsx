'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTenant } from '@/app/actions/admin/tenants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Building2, User, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface NewTenantFormProps {
  plans: Array<{
    code: string
    name: string
    monthlyPrice: number
  }>
}

export function NewTenantForm({ plans }: NewTenantFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    // Datos del negocio
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    nit: '',
    // Datos del admin del negocio
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    // Plan
    planCode: 'basic',
    startAsTrial: true,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-generar slug basado en el nombre
    if (field === 'name') {
      const slug = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await createTenant(formData)
      if (result.success) {
        router.push(`/admin/tenants/${result.tenantId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el negocio')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Link href="/admin/tenants">
        <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al listado
        </Button>
      </Link>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Datos del negocio */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Datos del Negocio
          </CardTitle>
          <CardDescription className="text-slate-400">
            Información básica del negocio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Nombre del Negocio *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Mi Moto Parts"
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Slug (URL) *</Label>
              <Input
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="mi-moto-parts"
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">Identificador único para URLs</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Email del Negocio *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contacto@motoparts.com"
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+57 300 123 4567"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Ciudad</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Bogotá"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">NIT</Label>
              <Input
                value={formData.nit}
                onChange={(e) => handleChange('nit', e.target.value)}
                placeholder="900.123.456-7"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Dirección</Label>
            <Input
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Calle 123 #45-67"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Usuario administrador */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Usuario Administrador
          </CardTitle>
          <CardDescription className="text-slate-400">
            Credenciales del administrador del negocio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Nombre del Administrador *</Label>
            <Input
              value={formData.adminName}
              onChange={(e) => handleChange('adminName', e.target.value)}
              placeholder="Juan Pérez"
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Email del Administrador *</Label>
              <Input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => handleChange('adminEmail', e.target.value)}
                placeholder="admin@motoparts.com"
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Contraseña *</Label>
              <Input
                type="password"
                value={formData.adminPassword}
                onChange={(e) => handleChange('adminPassword', e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan de suscripción */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plan de Suscripción
          </CardTitle>
          <CardDescription className="text-slate-400">
            Selecciona el plan inicial para este negocio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Plan</Label>
            <Select
              value={formData.planCode}
              onValueChange={(value) => handleChange('planCode', value)}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {plans.map((plan) => (
                  <SelectItem key={plan.code} value={plan.code}>
                    {plan.name} - {formatCurrency(plan.monthlyPrice)}/mes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-700/50">
            <input
              type="checkbox"
              id="startAsTrial"
              checked={formData.startAsTrial}
              onChange={(e) => handleChange('startAsTrial', e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="startAsTrial" className="text-slate-300">
              <span className="font-medium">Iniciar con período de prueba gratuito</span>
              <p className="text-sm text-slate-400">
                El negocio tendrá 15 días de acceso completo a todas las funcionalidades
              </p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Link href="/admin/tenants">
          <Button type="button" variant="ghost" className="text-slate-400">
            Cancelar
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-amber-500 hover:bg-amber-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear Negocio'
          )}
        </Button>
      </div>
    </form>
  )
}
