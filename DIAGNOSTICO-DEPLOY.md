## 🔍 Diagnóstico de Deploy - Quetzal Platform

### ✅ Commits Recientes
```
9f154a4 - fix(deploy): move netlify.toml to root and set correct publish path
59e5187 - feat(frontend): add contracts system, PSE payment flow, messaging UI improvements
b1eca35 - feat(backend): add health endpoints, complete models (Rating/Wallet)
56337fa - chore(db): align messaging schema to PascalCase tables
```

### 📁 Estructura de Archivos
```
Red-Social-Quetzales/
├── netlify.toml (✅ En raíz, publish: "quetzal-platform/fronted")
└── quetzal-platform/
    └── fronted/
        ├── index.html
        ├── views/
        │   ├── landing-page.html
        │   ├── login.html
        │   ├── register.html
        │   ├── services-public.html
        │   ├── contracts.html (NUEVO ✨)
        │   ├── messages.html
        │   ├── wallet.html
        │   ├── pse-callback.html (NUEVO ✨)
        │   └── pse-bank-simulator.html (NUEVO ✨)
        └── public/
            ├── js/
            │   ├── api.js (actualizado)
            │   ├── contracts.js (NUEVO ✨)
            │   ├── messages.js (actualizado)
            │   └── wallet.js (actualizado)
            └── css/
                └── messages.css (NUEVO ✨)
```

### 🔧 Configuración Netlify
**Archivo:** `netlify.toml` en raíz
**Publish directory:** `quetzal-platform/fronted`
**Build command:** `echo 'No build needed for static site'`

### 🌐 URLs Esperadas
- Landing: https://quetzal-platform.netlify.app/
- Login: https://quetzal-platform.netlify.app/views/login.html
- Contratos: https://quetzal-platform.netlify.app/views/contracts.html

### ⏱️ Estado del Deploy
- **Último push:** Hace ~2 minutos
- **Estado esperado:** Desplegando... (puede tardar 2-3 minutos)

### 🧪 Verificación Manual
1. Ir a: https://app.netlify.com
2. Seleccionar sitio "quetzal-platform" (o similar)
3. Ver "Deploys" → Debe aparecer el commit `9f154a4`
4. Esperar a que el estado sea "Published"

### 📝 Notas
- Si el deploy falla, revisar logs en Netlify dashboard
- Puede ser que el sitio tenga otro nombre en Netlify
- Verificar que la URL del proyecto sea correcta en CREDENCIALES-DEPLOYMENT.txt
