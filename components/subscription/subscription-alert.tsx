import { getSubscriptionInfo } from '@/lib/subscription'
import { AlertTriangle, Clock, XCircle } from 'lucide-react'

export async function SubscriptionAlert() {
  const info = await getSubscriptionInfo()

  if (!info) {
    return null
  }

  // Alerta de trial por expirar
  if (info.isTrial && info.trialDaysRemaining !== null) {
    if (info.trialDaysRemaining <= 0) {
      return (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-400">
              Tu período de prueba ha expirado
            </p>
            <p className="text-sm text-red-400/80 mt-1">
              Selecciona un plan para continuar usando todas las funcionalidades.
            </p>
          </div>
        </div>
      )
    }

    if (info.trialDaysRemaining <= 7) {
      return (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-400">
              Tu período de prueba expira en {info.trialDaysRemaining} día{info.trialDaysRemaining !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-amber-400/80 mt-1">
              Selecciona un plan antes de que expire para no perder acceso a tus datos.
            </p>
          </div>
        </div>
      )
    }

    // Trial activo con más de 7 días
    return (
      <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-400">
            Período de prueba: {info.trialDaysRemaining} días restantes
          </p>
          <p className="text-sm text-blue-400/80 mt-1">
            Tienes acceso completo a todas las funcionalidades durante tu prueba gratuita.
          </p>
        </div>
      </div>
    )
  }

  // Alerta de límite de productos
  if (info.maxProducts !== -1 && info.productsRemaining <= 50 && info.productsRemaining > 0) {
    return (
      <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-400">
            Te quedan {info.productsRemaining} productos disponibles
          </p>
          <p className="text-sm text-amber-400/80 mt-1">
            Has usado {info.currentProducts} de {info.maxProducts} productos de tu plan {info.planName}.
          </p>
        </div>
      </div>
    )
  }

  // Alerta de suscripción no activa
  if (!info.isActive) {
    return (
      <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-red-400">
            Tu suscripción está {info.status === 'SUSPENDED' ? 'suspendida' : 'inactiva'}
          </p>
          <p className="text-sm text-red-400/80 mt-1">
            Contacta a soporte o actualiza tu método de pago para restaurar el acceso.
          </p>
        </div>
      </div>
    )
  }

  return null
}
