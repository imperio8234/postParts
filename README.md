# Moto Parts POS - Sistema de Punto de Venta para Repuestos de Moto

Sistema multitenant de punto de venta especializado en repuestos de motocicletas, con manejo de caja, inventario y ventas.

## Características

- **Multitenancy**: Soporte para múltiples negocios en una sola instancia
- **Gestión de Caja**: Apertura y cierre de caja diaria con control de diferencias
- **Inventario**: Control de productos con alertas de stock mínimo
- **Ventas**: Registro de ventas con múltiples métodos de pago
- **Clientes**: Gestión de clientes y historial de compras
- **Reportes**: Estadísticas de ventas diarias

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **TypeScript**: Tipado estático completo

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/motoparts?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-con-openssl-rand-base64-32"
```

### 3. Configurar Prisma

```bash
# Crear la base de datos y tablas
npx prisma migrate dev --name init

# Generar el cliente de Prisma
npx prisma generate
```

### 4. Crear datos iniciales (Opcional)

Para crear un tenant y usuario de prueba:

```bash
npx prisma studio
```

Luego crea manualmente:

1. **Tenant**:
   - name: "Mi Negocio"
   - slug: "mi-negocio"
   - email: "contacto@minegocio.com"

2. **User**:
   - email: "admin@minegocio.com"
   - name: "Administrador"
   - password: (usa bcrypt para hashear)
   - role: "ADMIN"
   - tenantId: (ID del tenant creado)

Para hashear la contraseña:

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('tupassword', 10);
console.log(hash);
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
bike/
├── app/
│   ├── (auth)/
│   │   └── login/          # Página de login
│   ├── (dashboard)/
│   │   └── dashboard/      # Dashboard principal
│   │       ├── products/   # Gestión de productos
│   │       └── sales/      # Gestión de ventas
│   ├── actions/            # Server Actions
│   │   ├── cash-register.ts
│   │   ├── products.ts
│   │   ├── sales.ts
│   │   └── customers.ts
│   └── api/
│       └── auth/           # NextAuth API routes
├── components/
│   └── ui/                 # Componentes UI reutilizables
├── lib/
│   ├── auth.ts            # Configuración de NextAuth
│   ├── prisma.ts          # Cliente de Prisma
│   ├── tenant.ts          # Utilidades de multitenancy
│   └── utils.ts           # Utilidades generales
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
└── types/
    └── next-auth.d.ts     # Tipos de NextAuth
```

## Flujo de Trabajo

### 1. Abrir Caja

Antes de realizar ventas, debes abrir la caja del día:

1. Ve al Dashboard
2. Ingresa el monto inicial en caja
3. Haz clic en "Abrir Caja"

### 2. Registrar Productos

1. Ve a Productos
2. Haz clic en "Nuevo Producto"
3. Completa la información del repuesto
4. Guarda el producto

### 3. Realizar Ventas

1. Ve a Ventas > Nueva Venta
2. Agrega productos al carrito
3. Selecciona cliente (opcional)
4. Elige método de pago
5. Confirma la venta

### 4. Cerrar Caja

Al finalizar el día:

1. Ve al Dashboard
2. Ingresa el monto final contado
3. Agrega notas si hay diferencias
4. Haz clic en "Cerrar Caja"

## Modelo de Datos

### Entidades Principales

- **Tenant**: Representa cada negocio
- **User**: Usuarios del sistema (vendedores, admins)
- **Product**: Repuestos en inventario
- **Category**: Categorías de productos
- **Customer**: Clientes
- **CashRegister**: Cajas diarias
- **Sale**: Ventas realizadas
- **SaleItem**: Items de cada venta

### Multitenancy

El sistema implementa multitenancy a nivel de base de datos (Row-Level Security):

- Cada registro tiene un `tenantId`
- Las queries automáticamente filtran por tenant
- Los usuarios solo ven datos de su tenant

## Despliegue

### Vercel (Recomendado)

1. Sube el proyecto a GitHub
2. Conecta el repositorio en Vercel
3. Configura las variables de entorno
4. Despliega

### Railway/Render

1. Crea un proyecto nuevo
2. Conecta tu repositorio
3. Agrega PostgreSQL
4. Configura las variables de entorno
5. Despliega

## Próximas Características (Roadmap)

- [ ] Reportes avanzados y gráficos
- [ ] Exportación de datos (Excel, PDF)
- [ ] Múltiples cajas por ubicación
- [ ] Códigos de barras
- [ ] Impresión de tickets
- [ ] Devoluciones y ajustes de inventario
- [ ] Compras a proveedores
- [ ] Notificaciones de stock bajo
- [ ] App móvil

## Soporte

Para reportar problemas o sugerir mejoras, crea un issue en el repositorio.

## Licencia

MIT
