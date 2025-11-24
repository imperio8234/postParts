import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { prisma } from '@/lib/prisma'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect('/admin-login')
  }

  // Obtener el nombre completo del admin
  const adminUser = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { name: true, email: true, role: true },
  })

  if (!adminUser) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar user={adminUser} />
      <main className="lg:pl-72">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
