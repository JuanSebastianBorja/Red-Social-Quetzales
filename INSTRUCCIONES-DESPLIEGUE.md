# 🚀 Pasos para Desplegar y Probar

## ✅ Cambios Realizados

1. **api.js actualizado** - Ahora usa Supabase directamente en lugar de buscar `/api`
2. **Backup creado** - `api.js.backup` con la versión anterior
3. **Supabase validado** - Todas las pruebas pasaron (6/6)

## 📋 Siguiente Paso: Desplegar a Netlify

### Opción 1: Despliegue automático (si tienes Git conectado)

```bash
# Hacer commit de los cambios
git add .
git commit -m "feat: Configurar api.js para usar Supabase directamente"
git push origin feature/frontend-deploy
```

Netlify detectará el push y desplegará automáticamente.

### Opción 2: Despliegue manual

1. Ve a https://app.netlify.com/
2. Accede a tu sitio "quetzale"
3. Ve a "Deploys" > "Trigger deploy" > "Deploy site"

## 🧪 Probar el Sitio Desplegado

Una vez desplegado, prueba:

1. **Registro de usuario**: https://quetzale.netlify.app/views/register.html
2. **Login**: https://quetzale.netlify.app/views/login.html
3. **Ver servicios**: https://quetzale.netlify.app/views/services-public.html

## ⚠️ Importante: Verificar que todas las vistas carguen Supabase

Cada archivo HTML debe incluir ANTES de `api.js`:

```html
<!-- Cargar Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../public/js/api.js"></script>
```

### Archivos que necesitan verificación:

- ✅ login.html (ya tiene Supabase)
- ✅ register.html (ya tiene Supabase)
- ❓ dashboard.html
- ❓ services.html
- ❓ profile.html
- ❓ create-service.html
- ❓ edit-service.html
- ❓ wallet.html
- ❓ admin-*.html

## 🔧 Si algo falla después del despliegue

1. Abre la consola del navegador (F12)
2. Busca errores relacionados con:
   - "Supabase no está inicializado"
   - "window.supabase is not defined"

3. Si ves esos errores, agrega al HTML ANTES de api.js:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

## 📝 Notas

- El archivo `api.js` ahora detecta automáticamente si está en producción
- En producción usa Supabase directamente
- En localhost aún puede usar el backend local (si lo necesitas)
- El backup del api.js original está en `api.js.backup`

## 🎯 Siguiente Fase: Sprint 1 - Integración PSE

Una vez que el sitio funcione correctamente con Supabase, comenzaremos con:
1. Integración de pasarela de pagos PSE
2. Sistema de contratación de servicios
3. Mensajería básica

