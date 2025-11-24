import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

// Cargar variables de entorno explícitamente desde la raíz del proyecto
config({ path: resolve(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // ============================================
  // CREAR PLANES DE SUSCRIPCIÓN
  // ============================================
  console.log('\n📦 Creando planes de suscripción...')

  const planBasico = await prisma.plan.upsert({
    where: { code: 'basic' },
    update: {
      name: 'Básico',
      description: 'Ideal para pequeños negocios que inician. Incluye POS, inventario básico y gestión de clientes.',
      monthlyPrice: 30000,
      yearlyPrice: 300000,
      maxUsers: 2,
      maxProducts: 500,
      maxLocations: 1,
      trialDays: 15,
      isActive: true,
      isPopular: false,
      sortOrder: 1,
    },
    create: {
      code: 'basic',
      name: 'Básico',
      description: 'Ideal para pequeños negocios que inician. Incluye POS, inventario básico y gestión de clientes.',
      monthlyPrice: 30000,
      yearlyPrice: 300000,
      currency: 'COP',
      maxUsers: 2,
      maxProducts: 500,
      maxLocations: 1,
      trialDays: 15,
      isActive: true,
      isPopular: false,
      sortOrder: 1,
    },
  })

  const planIntermedio = await prisma.plan.upsert({
    where: { code: 'intermediate' },
    update: {
      name: 'Intermedio',
      description: 'Para negocios en crecimiento. Incluye compras, gastos, pedidos y reportes avanzados.',
      monthlyPrice: 70000,
      yearlyPrice: 700000,
      maxUsers: 5,
      maxProducts: 2000,
      maxLocations: 2,
      trialDays: 15,
      isActive: true,
      isPopular: true,
      sortOrder: 2,
    },
    create: {
      code: 'intermediate',
      name: 'Intermedio',
      description: 'Para negocios en crecimiento. Incluye compras, gastos, pedidos y reportes avanzados.',
      monthlyPrice: 70000,
      yearlyPrice: 700000,
      currency: 'COP',
      maxUsers: 5,
      maxProducts: 2000,
      maxLocations: 2,
      trialDays: 15,
      isActive: true,
      isPopular: true,
      sortOrder: 2,
    },
  })

  const planPremium = await prisma.plan.upsert({
    where: { code: 'premium' },
    update: {
      name: 'Premium',
      description: 'Sin límites. Todos los módulos incluyendo Taller, sucursales ilimitadas y soporte prioritario.',
      monthlyPrice: 120000,
      yearlyPrice: 1200000,
      maxUsers: -1, // -1 = ilimitado
      maxProducts: -1,
      maxLocations: -1,
      trialDays: 15,
      isActive: true,
      isPopular: false,
      sortOrder: 3,
    },
    create: {
      code: 'premium',
      name: 'Premium',
      description: 'Sin límites. Todos los módulos incluyendo Taller, sucursales ilimitadas y soporte prioritario.',
      monthlyPrice: 120000,
      yearlyPrice: 1200000,
      currency: 'COP',
      maxUsers: -1,
      maxProducts: -1,
      maxLocations: -1,
      trialDays: 15,
      isActive: true,
      isPopular: false,
      sortOrder: 3,
    },
  })

  console.log('✅ Planes creados: Básico, Intermedio, Premium')

  // ============================================
  // CREAR FEATURES/MÓDULOS
  // ============================================
  console.log('\n🔧 Creando features/módulos...')

  const features = [
    // Módulo POS
    { code: 'pos_sales', name: 'Ventas', description: 'Registro de ventas y tickets', module: 'pos', icon: 'ShoppingCart' },
    { code: 'pos_cash_register', name: 'Caja', description: 'Apertura y cierre de caja', module: 'pos', icon: 'Calculator' },
    { code: 'pos_cash_history', name: 'Historial de Caja', description: 'Consulta de cajas cerradas', module: 'pos', icon: 'History' },

    // Módulo Inventario
    { code: 'inventory_products', name: 'Productos', description: 'Gestión de productos e inventario', module: 'inventory', icon: 'Package' },
    { code: 'inventory_categories', name: 'Categorías', description: 'Categorías de productos', module: 'inventory', icon: 'Tags' },
    { code: 'inventory_stock_alerts', name: 'Alertas de Stock', description: 'Notificaciones de stock bajo', module: 'inventory', icon: 'AlertTriangle' },

    // Módulo Clientes
    { code: 'customers', name: 'Clientes', description: 'Gestión de clientes', module: 'customers', icon: 'Users' },

    // Módulo Compras (Intermedio+)
    { code: 'purchases', name: 'Compras', description: 'Registro de compras a proveedores', module: 'purchases', icon: 'ShoppingBag' },
    { code: 'suppliers', name: 'Proveedores', description: 'Gestión de proveedores', module: 'purchases', icon: 'Truck' },

    // Módulo Gastos (Intermedio+)
    { code: 'expenses', name: 'Gastos', description: 'Registro de gastos operacionales', module: 'expenses', icon: 'Receipt' },
    { code: 'expense_categories', name: 'Categorías de Gastos', description: 'Categorías para gastos', module: 'expenses', icon: 'FolderOpen' },

    // Módulo Pedidos (Intermedio+)
    { code: 'orders', name: 'Pedidos', description: 'Órdenes de reposición y encargos', module: 'orders', icon: 'ClipboardList' },

    // Módulo Reportes
    { code: 'reports_basic', name: 'Reportes Básicos', description: 'Reporte de ventas del día', module: 'reports', icon: 'BarChart' },
    { code: 'reports_advanced', name: 'Reportes Avanzados', description: 'Reportes detallados y exportación', module: 'reports', icon: 'LineChart' },

    // Módulo Taller (Premium)
    { code: 'workshop', name: 'Taller', description: 'Gestión de servicios de taller', module: 'workshop', icon: 'Wrench' },
    { code: 'workshop_orders', name: 'Órdenes de Trabajo', description: 'Órdenes de servicio de taller', module: 'workshop', icon: 'FileText' },

    // Extras Premium
    { code: 'multi_location', name: 'Multi-Sucursal', description: 'Gestión de múltiples sucursales', module: 'settings', icon: 'Building' },
    { code: 'priority_support', name: 'Soporte Prioritario', description: 'Atención prioritaria', module: 'support', icon: 'Headphones' },
  ]

  const createdFeatures: Record<string, string> = {}

  for (const feature of features) {
    const created = await prisma.feature.upsert({
      where: { code: feature.code },
      update: feature,
      create: feature,
    })
    createdFeatures[feature.code] = created.id
  }

  console.log(`✅ Features creados: ${features.length}`)

  // ============================================
  // ASOCIAR FEATURES A PLANES
  // ============================================
  console.log('\n🔗 Asociando features a planes...')

  // Features del Plan Básico
  const basicFeatures = [
    'pos_sales', 'pos_cash_register', 'pos_cash_history',
    'inventory_products', 'inventory_categories', 'inventory_stock_alerts',
    'customers',
    'reports_basic',
  ]

  // Features del Plan Intermedio (incluye básico + extras)
  const intermediateFeatures = [
    ...basicFeatures,
    'purchases', 'suppliers',
    'expenses', 'expense_categories',
    'orders',
    'reports_advanced',
  ]

  // Features del Plan Premium (incluye todo)
  const premiumFeatures = [
    ...intermediateFeatures,
    'workshop', 'workshop_orders',
    'multi_location', 'priority_support',
  ]

  // Limpiar relaciones existentes
  await prisma.planFeature.deleteMany({})

  // Crear relaciones para Plan Básico
  for (const featureCode of basicFeatures) {
    await prisma.planFeature.create({
      data: {
        planId: planBasico.id,
        featureId: createdFeatures[featureCode],
      },
    })
  }

  // Crear relaciones para Plan Intermedio
  for (const featureCode of intermediateFeatures) {
    await prisma.planFeature.create({
      data: {
        planId: planIntermedio.id,
        featureId: createdFeatures[featureCode],
      },
    })
  }

  // Crear relaciones para Plan Premium
  for (const featureCode of premiumFeatures) {
    await prisma.planFeature.create({
      data: {
        planId: planPremium.id,
        featureId: createdFeatures[featureCode],
      },
    })
  }

  console.log('✅ Features asociados a planes')

  // ============================================
  // CREAR SUPER ADMIN
  // ============================================
  console.log('\n👑 Creando Super Admin...')

  const superAdminPassword = await hash('superadmin123', 10)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@motopartspos.com' },
    update: {},
    create: {
      email: 'superadmin@motopartspos.com',
      password: superAdminPassword,
      name: 'Super Administrador',
      role: 'SUPER_ADMIN',
      tenantId: null, // Super admin no pertenece a ningún tenant
      isActive: true,
    },
  })

  console.log('✅ Super Admin creado:', superAdmin.email)

  // Crear tenant de ejemplo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-motoparts' },
    update: {},
    create: {
      name: 'Demo Moto Parts',
      slug: 'demo-motoparts',
      email: 'contacto@demomotoparts.com',
      phone: '+57 300 123 4567',
      address: 'Calle 123 #45-67, Bogotá',
      isActive: true,
    },
  })

  console.log('✅ Tenant creado:', tenant.name)

  // Crear usuario admin
  const adminPassword = await hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@demomotoparts.com',
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demomotoparts.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Usuario admin creado:', admin.email)

  // Crear usuario vendedor
  const sellerPassword = await hash('seller123', 10)
  const seller = await prisma.user.upsert({
    where: {
      email: 'vendedor@demomotoparts.com',
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'vendedor@demomotoparts.com',
      password: sellerPassword,
      name: 'Vendedor',
      role: 'SELLER',
      isActive: true,
    },
  })

  console.log('✅ Usuario vendedor creado:', seller.email)

  // Crear categorías
  const categories = await Promise.all([
    prisma.category.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Motor',
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Motor',
      },
    }),
    prisma.category.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Frenos',
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Frenos',
      },
    }),
    prisma.category.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Suspensión',
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Suspensión',
      },
    }),
    prisma.category.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: 'Eléctrico',
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Eléctrico',
      },
    }),
  ])

  console.log('✅ Categorías creadas:', categories.length)

  // Crear productos de ejemplo
  const products = [
    {
      sku: 'MTR-001',
      name: 'Filtro de Aceite',
      description: 'Filtro de aceite universal para motos',
      brand: 'Honda',
      categoryId: categories[0].id,
      costPrice: 15000,
      salePrice: 25000,
      stock: 50,
      minStock: 10,
    },
    {
      sku: 'FRN-001',
      name: 'Pastillas de Freno Delanteras',
      description: 'Pastillas de freno de alta calidad',
      brand: 'Yamaha',
      categoryId: categories[1].id,
      costPrice: 45000,
      salePrice: 75000,
      stock: 30,
      minStock: 5,
    },
    {
      sku: 'SUS-001',
      name: 'Amortiguador Trasero',
      description: 'Amortiguador ajustable',
      brand: 'Suzuki',
      categoryId: categories[2].id,
      costPrice: 150000,
      salePrice: 250000,
      stock: 8,
      minStock: 3,
    },
    {
      sku: 'ELC-001',
      name: 'Batería 12V',
      description: 'Batería de gel para moto',
      brand: 'Kawasaki',
      categoryId: categories[3].id,
      costPrice: 120000,
      salePrice: 180000,
      stock: 15,
      minStock: 5,
    },
    {
      sku: 'MTR-002',
      name: 'Bujía NGK',
      description: 'Bujía de alta calidad',
      brand: 'Honda',
      categoryId: categories[0].id,
      costPrice: 8000,
      salePrice: 15000,
      stock: 100,
      minStock: 20,
    },
    {
      sku: 'FRN-002',
      name: 'Disco de Freno',
      description: 'Disco de freno ventilado',
      brand: 'Yamaha',
      categoryId: categories[1].id,
      costPrice: 80000,
      salePrice: 135000,
      stock: 12,
      minStock: 4,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        tenantId_sku: {
          tenantId: tenant.id,
          sku: product.sku,
        },
      },
      update: {},
      create: {
        ...product,
        tenantId: tenant.id,
      },
    })
  }

  console.log('✅ Productos creados:', products.length)

  // Crear clientes de ejemplo
  const customers = [
    {
      name: 'Juan Pérez',
      email: 'juan@email.com',
      phone: '3001234567',
      idNumber: '1234567890',
    },
    {
      name: 'María García',
      email: 'maria@email.com',
      phone: '3009876543',
      idNumber: '0987654321',
    },
  ]

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        ...customer,
        tenantId: tenant.id,
      },
    })
  }

  console.log('✅ Clientes creados:', customers.length)

  // ============================================
  // CREAR SUSCRIPCIÓN TRIAL PARA TENANT DEMO
  // ============================================
  console.log('\n📋 Creando suscripción trial...')

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 15) // 15 días de prueba

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {
      planId: planPremium.id, // Durante trial tiene acceso a todo
      status: 'TRIAL',
      trialEndsAt: trialEndsAt,
    },
    create: {
      tenantId: tenant.id,
      planId: planPremium.id, // Durante trial tiene acceso a todo
      status: 'TRIAL',
      startDate: new Date(),
      trialEndsAt: trialEndsAt,
      billingCycle: 'MONTHLY',
      adminNotes: 'Tenant de demostración con trial de 15 días',
    },
  })

  console.log('✅ Suscripción trial creada (expira:', trialEndsAt.toLocaleDateString('es-CO'), ')')

  console.log('\n🎉 Seed completado exitosamente!\n')
  console.log('═'.repeat(50))
  console.log('📝 CREDENCIALES DE ACCESO')
  console.log('═'.repeat(50))
  console.log('\n🏪 Panel de Negocio (Tenant):')
  console.log('   URL: http://localhost:3000/login')
  console.log('   Admin:')
  console.log('     Email: admin@demomotoparts.com')
  console.log('     Password: admin123')
  console.log('   Vendedor:')
  console.log('     Email: vendedor@demomotoparts.com')
  console.log('     Password: seller123')
  console.log('\n👑 Panel Administrativo (Super Admin):')
  console.log('   URL: http://localhost:3000/admin-login')
  console.log('   Email: superadmin@motopartspos.com')
  console.log('   Password: superadmin123')
  console.log('\n' + '═'.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
