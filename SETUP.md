# Guía de Configuración Rápida - Moto Parts POS

## Paso 1: Instalar Dependencias

```bash
npm install
```

## Paso 2: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/motoparts?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-aqui"
```

### Generar NEXTAUTH_SECRET

En Windows (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

En Mac/Linux:
```bash
openssl rand -base64 32
```

## Paso 3: Configurar PostgreSQL

### Opción A: PostgreSQL Local

Instala PostgreSQL y crea una base de datos:

```sql
CREATE DATABASE motoparts;
CREATE USER motouser WITH PASSWORD 'tupassword';
GRANT ALL PRIVILEGES ON DATABASE motoparts TO motouser;
```

### Opción B: Base de Datos en la Nube (Recomendado para MVP)

**Supabase (Gratis):**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto nuevo
3. Ve a Settings > Database
4. Copia la Connection String (Transaction Mode)
5. Pégala en `DATABASE_URL` en tu `.env`

**Neon (Gratis):**
1. Ve a [neon.tech](https://neon.tech)
2. Crea un proyecto nuevo
3. Copia la Connection String
4. Pégala en `DATABASE_URL` en tu `.env`

## Paso 4: Inicializar la Base de Datos

```bash
# Crear las tablas
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

## Paso 5: Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Credenciales de Prueba

Después del seed, puedes ingresar con:

**Administrador:**
- Email: `admin@demomotoparts.com`
- Password: `admin123`

**Vendedor:**
- Email: `vendedor@demomotoparts.com`
- Password: `seller123`

## Flujo de Uso Inicial

1. **Login**: Ingresa con las credenciales de admin
2. **Abrir Caja**: En el dashboard, abre la caja con un monto inicial (ej: 100000)
3. **Verificar Productos**: Ve a Productos para ver el inventario inicial
4. **Crear Venta**: Ve a Ventas > Nueva Venta (próximamente)
5. **Cerrar Caja**: Al final del día, cierra la caja desde el dashboard

## Comandos Útiles

```bash
# Ver la base de datos en navegador
npm run db:studio

# Resetear la base de datos (¡cuidado! borra todo)
npm run db:reset

# Ver logs de desarrollo
npm run dev
```

## Solución de Problemas

### Error: "Can't reach database server"

- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica la conexión de red

### Error: "prisma command not found"

```bash
npm install
```

### Error de migración

```bash
npm run db:reset
```

## Próximos Pasos

1. Explora el dashboard
2. Crea nuevos productos
3. Registra algunas ventas
4. Revisa los reportes

Para más información, consulta el [README.md](./README.md)
