'use server'

import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this'
)

export async function adminLogin(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Verificar que sea un super admin (sin tenant)
    if (!user || !user.isActive || user.role !== 'SUPER_ADMIN' || user.tenantId !== null) {
      return { success: false, error: 'Credenciales incorrectas' }
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return { success: false, error: 'Credenciales incorrectas' }
    }

    // Crear JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: true,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(SECRET)

    // Guardar en cookie
    const cookieStore = await cookies()
    cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return { success: false, error: 'Error al iniciar sesión' }
  }
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-token')
}
