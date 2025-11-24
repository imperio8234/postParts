# Quick Start - Moto Parts POS

Configuración en **5 minutos** para comenzar a probar el sistema.

## Opción 1: Con Supabase (Más Rápido - Recomendado)

### 1. Clonar e instalar

```bash
npm install
```

### 2. Crear base de datos gratuita en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera 2 minutos a que se cree
4. Ve a **Settings** > **Database**
5. Busca **Connection String** (Transaction Mode)
6. Copia la URL (se ve así: `postgresql://postgres.xxx:password@...`)

### 3. Configurar .env

Edita el archivo `.env` en la raíz:

```env
DATABASE_URL="pega-aqui-la-url-de-supabase"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cualquier-texto-largo-y-aleatorio-aqui-123456789"
```

### 4. Inicializar base de datos

```bash
npm run db:migrate
npm run db:seed
```

### 5. Ejecutar

```bash
npm run dev
```

Abre: http://localhost:3000

**Login:**
- Email: `admin@demomotoparts.com`
- Password: `admin123`

---

## Opción 2: Con PostgreSQL Local

### 1. Instalar PostgreSQL

**Windows:**
- Descarga de [postgresql.org](https://www.postgresql.org/download/windows/)
- Instala con pgAdmin
- Crea una base de datos llamada `motoparts`

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb motoparts
```

**Linux:**
```bash
sudo apt install postgresql
sudo -u postgres createdb motoparts
sudo -u postgres createuser motouser -P
```

### 2. Configurar .env

```env
DATABASE_URL="postgresql://postgres:tupassword@localhost:5432/motoparts?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
```

### 3. Inicializar y ejecutar

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

---

## Verificar Instalación

Después de `npm run dev`, deberías ver:

```
✓ Ready in 2.3s
○ Local:   http://localhost:3000
```

### Checklist

- [ ] Página de login carga en http://localhost:3000
- [ ] Puedes hacer login con `admin@demomotoparts.com` / `admin123`
- [ ] Ves el dashboard con botón "Abrir Caja"
- [ ] Puedes navegar a Productos y ver 6 productos
- [ ] Puedes abrir la caja con un monto inicial

## Primeros Pasos

### 1. Abrir Caja

1. En el dashboard, ingresa un monto inicial (ej: `100000`)
2. Click en **Abrir Caja**
3. Verás el estado de la caja abierta

### 2. Explorar Productos

1. Ve a **Productos** en el menú
2. Verás 6 productos de ejemplo
3. Observa el stock de cada uno

### 3. Ver Ventas

1. Ve a **Ventas**
2. Todavía no hay ventas (está vacío)
3. El botón "Nueva Venta" estará disponible cuando abras la caja

## Datos de Ejemplo Incluidos

El seed crea:

- **1 Negocio**: Demo Moto Parts
- **2 Usuarios**:
  - Admin (`admin@demomotoparts.com` / `admin123`)
  - Vendedor (`vendedor@demomotoparts.com` / `seller123`)
- **4 Categorías**: Motor, Frenos, Suspensión, Eléctrico
- **6 Productos**: Filtros, pastillas, amortiguadores, etc.
- **2 Clientes**: Juan Pérez, María García

## Comandos Útiles

```bash
# Ver la base de datos visualmente
npm run db:studio

# Reiniciar todo (borra datos)
npm run db:reset

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Problemas Comunes

### "Can't reach database server"

**Supabase:**
- Verifica que copiaste bien la URL
- Verifica que incluiste la contraseña en la URL

**Local:**
- Verifica que PostgreSQL esté corriendo
- Windows: Abre "Services" y busca "postgresql"
- Mac/Linux: `brew services list` o `systemctl status postgresql`

### "prisma command not found"

```bash
npm install
```

### "Migration failed"

```bash
npm run db:reset
npm run db:seed
```

### Olvidé la contraseña

Ejecuta de nuevo el seed:

```bash
npm run db:seed
```

Esto NO borrará tus datos, solo actualizará los usuarios.

## Próximo: Personalizar

1. Cambia las credenciales en `prisma/seed.ts`
2. Ejecuta `npm run db:seed`
3. Agrega tus propios productos
4. Configura tu negocio en la base de datos

## Soporte

- 📖 Documentación completa: [README.md](./README.md)
- 🔧 Configuración detallada: [SETUP.md](./SETUP.md)
