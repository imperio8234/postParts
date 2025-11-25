import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const adminAuthOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin-login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const adminUser = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!adminUser || !adminUser.isActive) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, adminUser.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          isAdmin: true,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isAdmin = true
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
}

// Helper para obtener el admin actual desde cookie JWT
export async function getCurrentAdmin() {
  try {
    const { cookies } = await import('next/headers')
    const { jwtVerify } = await import('jose')

    const cookieStore = await cookies()
    const token = cookieStore.get('admin-token')

    if (!token) {
      return null
    }

    const SECRET = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this'
    )

    const { payload } = await jwtVerify(token.value, SECRET)

    if (!payload.isAdmin) {
      return null
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as string,
      isAdmin: true,
    }
  } catch {
    return null
  }
}

// Helper para verificar si es Super Admin
export async function isSuperAdmin() {
  const admin = await getCurrentAdmin()
  return admin?.role === 'SUPER_ADMIN'
}

// Helper para verificar acceso admin
export async function requireAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    throw new Error('No autorizado')
  }
  return admin
}

// Helper para verificar acceso super admin
export async function requireSuperAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin || admin.role !== 'SUPER_ADMIN') {
    throw new Error('Se requiere acceso de Super Admin')
  }
  return admin
}
