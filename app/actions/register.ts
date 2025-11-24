'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function registerUser(data: {
  businessName: string
  email: string
  password: string
  name: string
}) {
  try {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error('El email ya está registrado')
    }

    // Generar slug del negocio
    const slug = data.businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Verificar si el slug ya existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    })

    if (existingTenant) {
      throw new Error('Ya existe un negocio con ese nombre')
    }

    // Hash de la contraseña
    const hashedPassword = await hash(data.password, 10)

    // Obtener el plan Premium para el trial (acceso a todo)
    const premiumPlan = await prisma.plan.findUnique({
      where: { code: 'premium' },
    })

    if (!premiumPlan) {
      throw new Error('Error de configuración: Plan no encontrado')
    }

    // Calcular fecha de fin del trial (15 días)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 15)

    // Crear tenant, usuario y suscripción en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.businessName,
          slug,
          email: data.email,
          isActive: true,
        },
      })

      // Crear usuario admin
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: 'ADMIN',
          isActive: true,
        },
      })

      // Crear suscripción trial con acceso completo
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: premiumPlan.id,
          status: 'TRIAL',
          startDate: new Date(),
          trialEndsAt,
          billingCycle: 'MONTHLY',
        },
      })

      return { tenant, user }
    })

    return {
      success: true,
      message: 'Cuenta creada exitosamente',
      data: result,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error al crear la cuenta',
    }
  }
}
