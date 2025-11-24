import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    tenantId?: string
    tenantName?: string
    role: string
    isAdmin?: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      tenantId?: string
      tenantName?: string
      role: string
      isAdmin?: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    tenantId?: string
    tenantName?: string
    role: string
    isAdmin?: boolean
  }
}
