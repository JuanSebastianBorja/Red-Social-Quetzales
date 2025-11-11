# 🚀 Guía de Despliegue con Supabase + Vercel

**Fecha:** 11 de noviembre de 2025  
**Stack:** Supabase (PostgreSQL) + Vercel (Frontend + Backend)  
**Tiempo estimado:** 25-30 minutos

---

## 📋 ¿Por qué Supabase?

✅ **PostgreSQL gratis** hasta 500 MB  
✅ **Autenticación integrada** (opcional)  
✅ **API REST automática** generada desde BD  
✅ **Dashboard visual** para gestionar datos  
✅ **Backups automáticos**  
✅ **SSL incluido**  
✅ **Webhooks y funciones serverless**

---

## 🎯 Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIOS                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              VERCEL (Frontend)                          │
│  • HTML/CSS/JS estático                                 │
│  • SSL automático                                       │
│  • CDN global                                           │
│  • Deploy automático desde Git                         │
└─────────────────────────────────────────────────────────┘
                         │
                         │ API Calls
                         ▼
┌─────────────────────────────────────────────────────────┐
│         VERCEL SERVERLESS (Backend API)                 │
│  • Node.js Functions                                    │
│  • Auto-scaling                                         │
│  • Edge Functions                                       │
│  • /api/* routes                                        │
└─────────────────────────────────────────────────────────┘
                         │
                         │ SQL
                         ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                      │
│  • PostgreSQL 15                                        │
│  • 500 MB gratis                                        │
│  • Backups automáticos                                  │
│  • Dashboard SQL Editor                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ PASO 1: Configurar Base de Datos en Supabase (5 min)

### 1.1 Crear Proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com)
2. Click en **"Start your project"**
3. Login con GitHub
4. Click en **"New Project"**
5. Crear organización (si es primera vez)
6. Configurar proyecto:
   - **Name:** `quetzal-platform`
   - **Database Password:** Generar una segura (¡guárdala!)
   - **Region:** `South America (São Paulo)` (más cercano a Colombia)
   - **Pricing Plan:** `Free` (500 MB)
7. Click **"Create new project"**
8. Esperar 2-3 minutos mientras se crea

### 1.2 Obtener Credenciales de Conexión

1. En el dashboard → Sidebar → **"Settings"** (⚙️)
2. Click en **"Database"**
3. Scroll hasta **"Connection string"**
4. Seleccionar **"URI"** mode
5. Copiar la connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. **Guardar** esta URL (la necesitarás para el backend)

### 1.3 Configurar la Base de Datos

**Opción A: Desde SQL Editor (Recomendado)**

1. En Supabase Dashboard → **"SQL Editor"** (icono </> en sidebar)
2. Click **"New query"**
3. Abrir tu archivo `quetzal-platform/backend/database.sql` local
4. Copiar TODO el contenido
5. Pegar en el SQL Editor de Supabase
6. Click **"Run"** (o Ctrl/Cmd + Enter)
7. Verificar mensaje: "Success. No rows returned"

**Opción B: Desde cliente local**

```bash
# Instalar psql si no lo tienes
# Windows: https://www.postgresql.org/download/windows/

# Conectar a Supabase
psql "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Ejecutar script
\i quetzal-platform/backend/database.sql
```

### 1.4 Verificar Tablas Creadas

1. En Supabase Dashboard → **"Table Editor"**
2. Verificar que aparezcan estas tablas:
   - ✅ `Users`
   - ✅ `Services`
   - ✅ `Wallets`
   - ✅ `Transactions` (o `WalletTx`)
   - ✅ `Escrows`
   - ✅ `Ratings`
   - ✅ `Messages`

---

## 🔧 PASO 2: Preparar Backend para Vercel Serverless (10 min)

### 2.1 Estructura de Archivos

Vercel usa funciones serverless en la carpeta `/api`. Vamos a crear una estructura compatible:

```
quetzal-platform/
├── backend/
│   ├── src/           # Código existente (sin cambios)
│   ├── server.js      # No se usa en Vercel
│   └── package.json
└── fronted/
    ├── api/           # ← NUEVO: Funciones serverless
    │   ├── auth/
    │   │   ├── login.js
    │   │   └── register.js
    │   ├── services/
    │   │   └── index.js
    │   └── [...catchall].js  # Ruta catch-all
    ├── public/
    └── vercel.json
```

### 2.2 Crear Archivo `vercel.json` Principal

**Ubicación:** `quetzal-platform/vercel.json` (raíz del proyecto)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "fronted/public/**",
      "use": "@vercel/static"
    },
    {
      "src": "backend/src/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/fronted/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2.3 Crear Wrapper para API en Vercel

**Ubicación:** `quetzal-platform/backend/api/index.js`

```javascript
// ============================================
// API WRAPPER PARA VERCEL SERVERLESS
// ============================================

const app = require('../src/app');

// Vercel maneja las requests automáticamente
module.exports = app;
```

### 2.4 Actualizar `package.json` del Backend

Añadir en `scripts`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build needed'",
    "vercel-build": "echo 'Vercel build complete'"
  }
}
```

### 2.5 Crear `.env.example` para Supabase

**Ubicación:** `quetzal-platform/backend/.env.supabase`

```env
# Supabase Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Config
NODE_ENV=production
JWT_SECRET=tu_secreto_jwt_super_seguro_2024
JWT_EXPIRY=7d

# Frontend
FRONTEND_URL=https://tu-app.vercel.app
CORS_ORIGINS=https://tu-app.vercel.app,https://*.vercel.app
```

---

## 🌐 PASO 3: Desplegar en Vercel (5 min)

### 3.1 Importar Proyecto

1. Ir a [https://vercel.com](https://vercel.com)
2. Login con GitHub
3. Click **"Add New..."** → **"Project"**
4. Buscar `andresbot/Red-Social-Quetzales`
5. Click **"Import"**

### 3.2 Configurar Proyecto

**Framework Preset:** `Other`  
**Root Directory:** `quetzal-platform/fronted`  
**Build Command:** (dejar vacío)  
**Output Directory:** `public`  
**Install Command:** (dejar vacío)

### 3.3 Configurar Variables de Entorno

Click en **"Environment Variables"** y añadir:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Supabase Keys (opcional, para usar funciones de Supabase)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...

# JWT
JWT_SECRET=TU_SECRETO_ALEATORIO_64_CARACTERES
JWT_EXPIRY=7d

# CORS
FRONTEND_URL=https://tu-app.vercel.app
CORS_ORIGINS=https://tu-app.vercel.app,https://*.vercel.app

# Database SSL
DB_SSL=true
```

**Para obtener las keys de Supabase:**
1. Supabase Dashboard → **Settings** → **API**
2. Copiar:
   - **URL:** En "Project URL"
   - **anon/public:** En "Project API keys" → `anon` `public`

**Generar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.4 Deploy

1. Click **"Deploy"**
2. Esperar 2-3 minutos
3. Vercel mostrará la URL: `https://tu-app.vercel.app`

---

## ⚙️ PASO 4: Configuración Avanzada de Vercel

### 4.1 Actualizar `vercel.json` en Frontend

**Ubicación:** `quetzal-platform/fronted/vercel.json`

```json
{
  "version": 2,
  "public": true,
  "cleanUrls": true,
  "trailingSlash": false,
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://tu-app.vercel.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/public/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 4.2 Actualizar `config.js` para Supabase

**Ubicación:** `quetzal-platform/fronted/public/js/config.js`

```javascript
// Detectar entorno
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

// Supabase config (opcional si usas Supabase Auth)
const SUPABASE_CONFIG = {
    url: isProduction 
        ? 'https://xxxxx.supabase.co'  // Tu URL de Supabase
        : 'https://xxxxx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

const config = {
    api: {
        baseUrl: isProduction 
            ? `${window.location.origin}/api`  // Mismo dominio en producción
            : 'http://localhost:3000/api',
        rateLimit: 100,
        rateWindow: 900000,
    },

    // Supabase (opcional)
    supabase: SUPABASE_CONFIG,

    isDevelopment: !isProduction,
    isProduction: isProduction,

    features: {
        notifications: true,
        chat: true,
    },

    cache: {
        ttl: 3600,
    },

    endpoints: {
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            logout: '/auth/logout',
            verify: '/auth/verify',
        },
        users: {
            profile: '/users/profile',
            avatar: '/users/avatar',
        },
        services: {
            list: '/services',
            create: '/services',
            myServices: '/services/my-services',
        },
        wallet: {
            balance: '/wallet/balance',
            transactions: '/wallet/transactions',
        },
    },
};

if (config.isDevelopment) {
    console.log('🔧 Config:', {
        env: 'development',
        apiUrl: config.api.baseUrl
    });
}

export default config;
```

---

## 🔄 PASO 5: Configurar Backend como Serverless

### 5.1 Opción A: Backend Unificado (Más Simple)

Si quieres que tu backend actual funcione sin cambios, crea este archivo:

**Ubicación:** `quetzal-platform/fronted/api/index.js`

```javascript
// ============================================
// BACKEND SERVERLESS - VERCEL
// ============================================

// Cargar variables de entorno
process.env.NODE_ENV = 'production';

// Importar app de Express
const app = require('../../backend/src/app');

// Exportar para Vercel
module.exports = app;
```

**Actualizar `vercel.json`:**

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index"
    }
  ]
}
```

### 5.2 Opción B: Funciones Individuales (Más Eficiente)

Para mejor performance, puedes crear funciones serverless individuales:

**`fronted/api/auth/login.js`:**
```javascript
const { login } = require('../../../backend/src/controllers/authController');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    return login(req, res);
};
```

**`fronted/api/auth/register.js`:**
```javascript
const { register } = require('../../../backend/src/controllers/authController');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    return register(req, res);
};
```

---

## ✅ PASO 6: Verificación y Testing (5 min)

### 6.1 Verificar Deployment

1. Abrir `https://tu-app.vercel.app`
2. Verificar que cargue la landing page
3. F12 → Console → No debe haber errores

### 6.2 Probar Backend

```bash
# Health check
curl https://tu-app.vercel.app/api/health

# Debe responder:
{
  "status": "OK",
  "timestamp": "2024-11-11T...",
  "uptime": 123
}
```

### 6.3 Probar Flujos Críticos

**Test 1: Registro**
1. Ir a `/views/register.html`
2. Registrar usuario:
   - Email: `test@quetzal.com`
   - Password: `Test123!`
   - Nombre: `Usuario Prueba`
3. Debe guardar en Supabase

**Verificar en Supabase:**
1. Dashboard → **Table Editor** → `Users`
2. Debe aparecer el nuevo usuario

**Test 2: Login**
1. Login con el usuario creado
2. Debe redirigir a dashboard
3. Token debe guardarse en localStorage

**Test 3: Crear Servicio**
1. Dashboard → Crear Servicio
2. Llenar y guardar
3. Verificar en Supabase → `Services`

### 6.4 Monitorear Logs

**En Vercel:**
1. Dashboard → Tu proyecto → **Functions**
2. Ver logs de las funciones serverless
3. Revisar errores si los hay

**En Supabase:**
1. Dashboard → **Logs**
2. Ver queries ejecutadas
3. Revisar performance

---

## 🚨 Solución de Problemas

### Error: "Failed to connect to database"

**Síntomas:** Backend no puede conectar con Supabase

**Solución:**
1. Verificar `DATABASE_URL` en Vercel → Settings → Environment Variables
2. Confirmar que incluye el password correcto
3. Verificar que termina en `:5432/postgres`
4. En Supabase → Settings → Database → verificar que "Enable pooler" esté ON
5. Usar connection string de "Session mode" (no Transaction)

### Error: "SSL connection required"

**Solución:**
Actualizar conexión en `backend/src/config/database.js`:

```javascript
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false  // Para Supabase
        }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
```

### Error: "Function timeout"

**Síntomas:** Requests tardan mucho o fallan con timeout

**Solución:**
1. Vercel → Settings → Functions
2. Aumentar timeout a 10 segundos (plan gratis)
3. En `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 10
    }
  }
}
```

### Error: "CORS blocked"

**Solución:**
Verificar en `backend/src/app.js`:

```javascript
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://tu-app.vercel.app',
        'https://*.vercel.app'  // Para preview deployments
    ],
    credentials: true
}));
```

---

## 🔒 Configuración de Seguridad

### Supabase Row Level Security (RLS)

**Importante:** Habilitar RLS para proteger datos

1. Supabase → **Authentication** → **Policies**
2. Para cada tabla, crear políticas:

**Ejemplo para `Services`:**

```sql
-- Permitir que cualquiera lea servicios activos
CREATE POLICY "Servicios públicos visibles"
ON Services FOR SELECT
USING (status = 'active');

-- Solo el dueño puede editar sus servicios
CREATE POLICY "Dueño puede editar"
ON Services FOR UPDATE
USING (auth.uid() = userId);

-- Solo providers pueden crear servicios
CREATE POLICY "Providers pueden crear"
ON Services FOR INSERT
WITH CHECK (auth.role() = 'provider');
```

### Variables de Entorno Seguras

```env
# NUNCA commitear estos valores
JWT_SECRET=GENERADO_CON_CRYPTO_RANDOM_64_CHARS
DATABASE_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Solo en backend
```

---

## 📊 Monitoreo Post-Deployment

### Dashboard de Supabase

**Revisar diariamente:**
- **Database** → Uso de espacio (500 MB límite)
- **Logs** → Queries lentas
- **API** → Rate limits

### Dashboard de Vercel

**Revisar:**
- **Functions** → Invocaciones y errores
- **Analytics** → Tráfico
- **Deployments** → Historial

### Alertas

**Configurar en Supabase:**
1. Settings → **Billing & Usage**
2. Configurar alertas al 80% de uso

---

## 🎯 Ventajas de Supabase vs Railway

| Feature | Supabase | Railway |
|---------|----------|---------|
| **PostgreSQL gratis** | 500 MB | 500 MB |
| **Dashboard SQL** | ✅ Excelente | ❌ Básico |
| **Autenticación** | ✅ Incluida | ❌ Manual |
| **API REST automática** | ✅ Generada | ❌ Manual |
| **Realtime** | ✅ Incluido | ❌ Manual |
| **Backups** | ✅ Automático | ✅ Automático |
| **Storage** | ✅ 1 GB incluido | ❌ Separado |
| **Edge Functions** | ✅ Incluidas | ❌ No |
| **Comunidad** | ✅ Grande | ✅ Creciendo |

---

## 🔄 Actualizaciones Futuras

```bash
# Hacer cambios locales
git add .
git commit -m "Nuevo feature"
git push origin feature/frontend-deploy

# Vercel deplega automáticamente en ~30 segundos
# Supabase se actualiza con migraciones SQL
```

---

## 📝 Checklist Final

- [ ] Supabase proyecto creado
- [ ] Base de datos ejecutada (tablas creadas)
- [ ] CONNECTION_STRING copiada
- [ ] Vercel proyecto importado
- [ ] Variables de entorno configuradas
- [ ] Backend deployado como serverless
- [ ] Frontend deployado
- [ ] SSL/HTTPS activo (automático)
- [ ] Registro funciona
- [ ] Login funciona
- [ ] CRUD servicios funciona
- [ ] Logs revisados (sin errores)

---

## 🎉 ¡Deployment Completado!

**URLs Importantes:**

```
Frontend:  https://_____________________.vercel.app
Backend:   https://_____________________.vercel.app/api
Database:  Supabase Dashboard
API Docs:  https://_____________________.vercel.app/api
```

**Próximos pasos:**
1. Testing exhaustivo
2. Implementar features del `PLAN-ACCION-EPICAS.md`
3. Configurar dominio personalizado
4. Habilitar Supabase Auth (opcional)
5. Implementar Realtime (opcional)

---

**Suporte:**
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Discord](https://discord.supabase.com)

*Última actualización: 11 de noviembre de 2025*
