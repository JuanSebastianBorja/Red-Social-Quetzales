# Guía de Despliegue

## 🚀 Despliegue de la Aplicación

Esta guía explica cómo desplegar la aplicación usando Vercel (frontend) y Railway (backend + base de datos).

### 📋 Prerrequisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Railway](https://railway.app)
- Tu fork del repositorio en GitHub

### 🔄 Pasos para el Despliegue

#### 1️⃣ Base de Datos (Railway)

1. Crear proyecto en Railway
   - Ve a [Railway](https://railway.app)
   - New Project → Database → PostgreSQL

2. Obtener credenciales
   - En el proyecto, ve a Variables
   - Copia `DATABASE_URL`

#### 2️⃣ Backend (Railway)

1. Crear nuevo servicio
   - New Service → GitHub Repo
   - Selecciona tu fork
   - Selecciona la carpeta `quetzal-platform/backend`

2. Configurar variables de entorno
   ```env
   NODE_ENV=production
   DATABASE_URL=<url-de-postgresql>
   JWT_SECRET=<tu-secreto-jwt>
   FRONTEND_URL=<url-de-vercel-cuando-la-tengas>
   ```

3. Configurar comandos
   - Build Command: `npm ci`
   - Start Command: `npm start`

#### 3️⃣ Frontend (Vercel)

1. Importar proyecto
   - Ve a [Vercel](https://vercel.com)
   - New Project → Import tu fork
   - Selecciona la carpeta `quetzal-platform/fronted`

2. Configurar build
   - Framework Preset: Other
   - Root Directory: `quetzal-platform/fronted`
   - Build Command: (dejar vacío)
   - Output Directory: `.`

3. Variables de entorno
   ```env
   VITE_API_URL=<url-del-backend-railway>
   ```

### 🔍 Verificación Post-Despliegue

1. **Backend**
   - Visitar `<url-railway>/health`
   - Debe responder `{"status":"OK"}`

2. **Frontend**
   - Probar registro/login
   - Verificar conexión con API

### 📝 Mantenimiento

1. **Actualizaciones**
   - Railway y Vercel despliegan automáticamente al hacer push
   - Usar rama `main` para producción

2. **Monitoreo**
   - Revisar logs en Railway
   - Usar dashboard de Vercel

3. **Rollback**
   - Railway: usar botón "Redeploy"
   - Vercel: ir a deployments y revertir

### ❗ Solución de Problemas

1. **Error de conexión DB**
   - Verificar `DATABASE_URL`
   - Confirmar IP en allowlist

2. **Error CORS**
   - Verificar `FRONTEND_URL`
   - Confirmar protocolo (https)

3. **Error 500**
   - Revisar logs de Railway
   - Verificar variables de entorno

### 🔐 Seguridad

1. **Secretos**
   - No commitear `.env`
   - Usar variables de entorno
   - Rotar JWT_SECRET periódicamente

2. **SSL/HTTPS**
   - Vercel: automático
   - Railway: confirmar SSL en DB

¿Preguntas sobre el despliegue? Abre un issue.