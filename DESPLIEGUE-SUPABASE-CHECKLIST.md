# ✅ Checklist Rápido - Despliegue con Supabase

**Tiempo estimado:** 20-25 minutos  
**Stack:** Supabase + Vercel  
**Última actualización:** 11 de noviembre de 2025

---

## 🎯 Lo que vamos a hacer

1. Crear base de datos PostgreSQL en Supabase (gratis, 500 MB)
2. Desplegar backend y frontend en Vercel (gratis, serverless)
3. Conectar todo y probar

---

## 📋 PARTE 1: Supabase - Base de Datos (7 min)

### Paso 1: Crear Proyecto

- [ ] Ir a [supabase.com](https://supabase.com)
- [ ] Click **"Start your project"** → Login con GitHub
- [ ] Click **"New Project"**
- [ ] Crear organización (si es primera vez)
- [ ] Configurar:
  - **Name:** `quetzal-platform`
  - **Database Password:** Copiar y guardar (¡importante!)
  - **Region:** `South America (São Paulo)`
  - **Plan:** `Free`
- [ ] Click **"Create new project"**
- [ ] Esperar 2-3 minutos ☕

### Paso 2: Obtener Connection String

- [ ] Dashboard Supabase → **Settings** (⚙️) → **Database**
- [ ] Scroll a **"Connection string"** → Seleccionar **"URI"**
- [ ] Copiar la URL completa:
  ```
  postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
  ```
- [ ] Guardar en un archivo temporal (lo necesitarás después)

### Paso 3: Crear las Tablas

**Opción 1: SQL Editor (recomendado)**
- [ ] Dashboard → **SQL Editor** (</> en sidebar)
- [ ] Click **"New query"**
- [ ] Abrir archivo local `quetzal-platform/backend/database.sql`
- [ ] Copiar TODO el contenido
- [ ] Pegar en SQL Editor
- [ ] Click **"Run"** (▶️ o Ctrl+Enter)
- [ ] Verificar: "Success. No rows returned"

**Opción 2: Desde terminal**
```bash
psql "postgresql://postgres:[TU_PASSWORD]@db.xxxxx.supabase.co:5432/postgres" < quetzal-platform/backend/database.sql
```

### Paso 4: Verificar Tablas

- [ ] Dashboard → **Table Editor** (📊 en sidebar)
- [ ] Verificar que existen estas tablas:
  - ✅ Users
  - ✅ Services
  - ✅ Wallets
  - ✅ Transactions (o WalletTx)
  - ✅ Escrows
  - ✅ Ratings
  - ✅ Messages

### Paso 5: Obtener API Keys (opcional)

- [ ] Dashboard → **Settings** → **API**
- [ ] Copiar:
  - **URL:** `https://xxxxx.supabase.co`
  - **anon public key:** `eyJhbG...` (empieza con eyJ)
- [ ] Guardar (útil para funciones avanzadas)

✅ **Base de datos lista!**

---

## 🌐 PARTE 2: Vercel - Deployment (10 min)

### Paso 6: Preparar Código Local

**Generar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
- [ ] Copiar el resultado (64 caracteres)

### Paso 7: Importar Proyecto en Vercel

- [ ] Ir a [vercel.com](https://vercel.com)
- [ ] Login con GitHub
- [ ] Click **"Add New..."** → **"Project"**
- [ ] Buscar: `andresbot/Red-Social-Quetzales`
- [ ] Click **"Import"**

### Paso 8: Configurar Proyecto

- [ ] **Framework Preset:** `Other`
- [ ] **Root Directory:** `quetzal-platform/fronted` ← **¡IMPORTANTE!**
- [ ] **Build Command:** (dejar vacío)
- [ ] **Output Directory:** `public`
- [ ] **Install Command:** (dejar vacío)

### Paso 9: Variables de Entorno

Click en **"Environment Variables"** y añadir **UNA POR UNA**:

```env
DATABASE_URL
```
**Value:** Pegar la connection string de Supabase del Paso 2

```env
JWT_SECRET
```
**Value:** Pegar el resultado del Paso 6

```env
JWT_EXPIRY
```
**Value:** `7d`

```env
NODE_ENV
```
**Value:** `production`

```env
DB_SSL
```
**Value:** `true`

```env
FRONTEND_URL
```
**Value:** `https://tu-app.vercel.app` (actualizar después)

```env
CORS_ORIGINS
```
**Value:** `https://tu-app.vercel.app,https://*.vercel.app` (actualizar después)

- [ ] Todas las variables añadidas

### Paso 10: Deploy Inicial

- [ ] Click **"Deploy"** (botón azul grande)
- [ ] Esperar 2-3 minutos
- [ ] Vercel mostrará: "Congratulations!"
- [ ] Copiar URL, ejemplo: `https://red-social-quetzales.vercel.app`
- [ ] Anotar URL aquí: `_______________________________`

### Paso 11: Actualizar Variables con URL Real

- [ ] Ir a Vercel → Tu proyecto → **Settings** → **Environment Variables**
- [ ] Editar `FRONTEND_URL`:
  - **Value:** La URL de Vercel del paso anterior
- [ ] Editar `CORS_ORIGINS`:
  - **Value:** `https://TU-APP.vercel.app,https://*.vercel.app`
- [ ] Click **"Save"**
- [ ] Vercel redeplegará automáticamente (~30 seg)

---

## ⚙️ PARTE 3: Configurar Backend Serverless (3 min)

### Paso 12: Crear API Wrapper

Necesitamos crear un archivo para que Vercel ejecute tu backend:

**Opción A: Desde el editor de GitHub (más fácil)**
- [ ] Ir a tu repo en GitHub
- [ ] Navegar a `quetzal-platform/fronted/`
- [ ] Click **"Add file"** → **"Create new file"**
- [ ] Nombre: `api/index.js`
- [ ] Contenido:
```javascript
// Vercel Serverless Handler
process.env.NODE_ENV = 'production';
const app = require('../../backend/src/app');
module.exports = app;
```
- [ ] Commit directo a `feature/frontend-deploy`
- [ ] Vercel redeplegará automáticamente

**Opción B: Desde tu editor local**
- [ ] Crear carpeta `quetzal-platform/fronted/api/`
- [ ] Crear archivo `index.js` con el código de arriba
- [ ] Commit y push:
```bash
git add quetzal-platform/fronted/api/
git commit -m "Add Vercel serverless handler"
git push origin feature/frontend-deploy
```

### Paso 13: Actualizar vercel.json

- [ ] Abrir `quetzal-platform/fronted/vercel.json`
- [ ] Reemplazar TODO con:
```json
{
  "version": 2,
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```
- [ ] Guardar, commit y push
- [ ] Esperar redeploy (~30 seg)

---

## ✅ PARTE 4: Testing (5 min)

### Paso 14: Verificar Backend

```bash
curl https://TU-APP.vercel.app/api/health
```

**Debe responder:**
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": 123
}
```

- [ ] Backend responde correctamente

Si da error, revisar:
- [ ] Logs en Vercel → Functions
- [ ] Variables de entorno correctas
- [ ] DATABASE_URL incluye password

### Paso 15: Test de Registro

- [ ] Ir a `https://tu-app.vercel.app/views/register.html`
- [ ] Registrar usuario:
  - Email: `test@quetzal.com`
  - Password: `Test123!`
  - Nombre: `Usuario Prueba`
- [ ] Click **"Registrarse"**
- [ ] Debe redirigir a `/views/dashboard.html`

**Verificar en Supabase:**
- [ ] Dashboard → **Table Editor** → `Users`
- [ ] Debe aparecer el nuevo usuario

### Paso 16: Test de Login

- [ ] Cerrar sesión (si aplica)
- [ ] Ir a `https://tu-app.vercel.app/views/login.html`
- [ ] Login con `test@quetzal.com` / `Test123!`
- [ ] Debe redirigir a dashboard
- [ ] F12 → Application → Local Storage
- [ ] Verificar `quetzal_token` existe

### Paso 17: Test de Servicio

- [ ] Dashboard → Click **"Crear Servicio"**
- [ ] Llenar:
  - Título: "Servicio de Prueba"
  - Descripción: "Este es un servicio de prueba del deployment"
  - Precio: 50000
  - Categoría: Diseño Gráfico
  - Tiempo: 3 días
- [ ] Click **"Guardar"**
- [ ] Debe aparecer en "Mis Servicios"

**Verificar en Supabase:**
- [ ] Table Editor → `Services`
- [ ] Debe aparecer el servicio creado

### Paso 18: Test Vista Pública

- [ ] Cerrar sesión
- [ ] Ir a `https://tu-app.vercel.app/views/services-public.html`
- [ ] Debe mostrar el servicio creado
- [ ] Click en el servicio → Ver detalle

---

## 🎉 DEPLOYMENT COMPLETADO

### ✅ Checklist Final

- [ ] Supabase proyecto creado
- [ ] Base de datos con tablas creadas
- [ ] Vercel proyecto deployado
- [ ] Variables de entorno configuradas
- [ ] Backend API funciona (`/api/health`)
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Crear servicio funciona
- [ ] Vista pública funciona
- [ ] SSL/HTTPS activo (automático)

---

## 📝 Tus URLs Importantes

```
✅ Frontend:    https://_________________________________.vercel.app
✅ API:         https://_________________________________.vercel.app/api
✅ Health:      https://_________________________________.vercel.app/api/health
✅ Supabase DB: https://app.supabase.com/project/_________
```

---

## 🚨 Si Algo Falla

### Error: "Failed to fetch"
**Solución:**
- Verificar F12 → Console → Ver URL que intenta llamar
- Debe ser `https://tu-app.vercel.app/api/...`
- Si dice `localhost`, actualizar `config.js`

### Error: "Database connection failed"
**Solución:**
- Vercel → Settings → Environment Variables
- Verificar `DATABASE_URL` tiene tu password correcto
- Debe terminar en `:5432/postgres`
- Redeploy: Deployments → ... → Redeploy

### Error: "CORS blocked"
**Solución:**
- Vercel → Settings → Environment Variables
- `CORS_ORIGINS` debe incluir tu dominio Vercel
- Redeploy

### Error 500 en cualquier endpoint
**Solución:**
- Vercel → Functions → Ver logs
- Revisar error específico
- Común: falta variable de entorno

### Página en blanco
**Solución:**
- F12 → Console → Ver errores
- Verificar Root Directory: `quetzal-platform/fronted`
- Verificar Output Directory: `public`
- Redeploy

---

## 🔄 Para Hacer Cambios Futuros

```bash
# En tu máquina local
git add .
git commit -m "Nuevo feature"
git push origin feature/frontend-deploy

# Vercel deplega automáticamente en ~30 segundos
```

---

## 📊 Monitoreo Diario

**Supabase:**
- [ ] Database → Uso: ____ MB / 500 MB

**Vercel:**
- [ ] Functions → Invocaciones del día
- [ ] Deployments → Último deploy exitoso

---

## 🎯 Próximos Pasos

1. [ ] Testing exhaustivo de todas las features
2. [ ] Invitar usuarios beta a probar
3. [ ] Recolectar feedback
4. [ ] Implementar Sprint 1 del `PLAN-ACCION-EPICAS.md`
5. [ ] Configurar dominio personalizado (opcional)

---

**¡Felicidades! 🎉 Tu plataforma está en producción.**

Para detalles técnicos avanzados, consulta: `GUIA-DESPLIEGUE-SUPABASE.md`

*Última actualización: 11 de noviembre de 2025*
