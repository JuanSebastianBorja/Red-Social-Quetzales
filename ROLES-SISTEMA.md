# Sistema de Roles - Quetzal Platform

## 📋 Descripción

Se han implementado tres tipos de roles para la plataforma Quetzal:

### 🔓 Visitante (No autenticado)
Usuarios que no han iniciado sesión en la plataforma.

**Vistas disponibles:**
- `landing-page.html` - Página de inicio con información de la plataforma
- `services-public.html` - Exploración pública de servicios
- `service-detail-public.html` - Detalle de servicios (sin poder contratar)
- `login.html` - Inicio de sesión
- `register.html` - Registro de nuevos usuarios

**Funcionalidades:**
- Ver servicios disponibles
- Filtrar por categorías
- Buscar servicios
- Ver perfiles de proveedores
- Registrarse o iniciar sesión

### 👤 Usuario Registrado (role: 'user')
Usuarios autenticados con cuenta en la plataforma.

**Vistas disponibles:**
- `dashboard.html` - Panel principal del usuario
- `profile.html` - Perfil y configuración
- `wallet.html` - Gestión de billetera virtual
- `messages.html` - Mensajería con otros usuarios
- `services.html` - Exploración completa de servicios
- `create-service.html` - Crear nuevos servicios
- `edit-service.html` - Editar servicios propios

**Funcionalidades:**
- Todas las de visitante +
- Contratar servicios
- Ofrecer servicios
- Gestionar billetera
- Realizar transacciones
- Enviar mensajes
- Calificar servicios

### 👑 Administrador (role: 'admin')
Usuarios con permisos administrativos completos.

**Vistas disponibles:**
- Todas las vistas de usuario +
- `admin-dashboard.html` - Dashboard administrativo
- `admin-users.html` - Gestión de usuarios
- `admin-services.html` - Gestión de servicios
- `admin-reports.html` - Reportes y analíticas
- `admin-transactions.html` - Gestión de transacciones

**Funcionalidades:**
- Todas las de usuario registrado +
- Ver todos los usuarios del sistema
- Activar/desactivar usuarios
- Cambiar roles de usuarios
- Ver todos los servicios
- Activar/desactivar servicios
- Eliminar servicios
- Ver todas las transacciones
- Generar reportes
- Ver estadísticas generales
- Acceder a analíticas

## 🚀 Instalación y Configuración

### 1. Actualizar la base de datos

Ejecutar la migración para agregar el campo `role`:

```bash
cd backend
node migrate-add-role.js
```

Esto creará:
- Campo `role` en la tabla `users`
- Usuario administrador por defecto:
  - Email: `admin@quetzal.com`
  - Password: `admin123`

### 2. Iniciar el servidor

```bash
cd backend
npm start
```

### 3. Probar el sistema

#### Como Visitante:
1. Abrir `views/landing-page.html`
2. Explorar servicios sin necesidad de login
3. Ver detalles pero no contratar

#### Como Usuario:
1. Registrarse en `views/register.html`
2. O iniciar sesión con cualquier email (se asignará rol 'user')
3. Acceder al dashboard de usuario

#### Como Administrador:
1. Iniciar sesión con:
   - Email: `admin@quetzal.com`
   - Password: `admin123`
2. Automáticamente se redirigirá al panel de administración

## 🔒 Seguridad

### Frontend
El archivo `auth.js` incluye funciones de validación:

```javascript
// Verificar autenticación
requireAuth()

// Verificar rol de admin
requireAdmin()

// Redirigir según rol
redirectAfterLogin()

// Verificar si es admin
isAdmin()
```

### Backend
Las rutas de administrador están protegidas:

```javascript
// Middleware de autenticación
router.use(protect);

// Middleware de autorización (solo admin)
router.use(authorize('admin'));
```

## 📡 Endpoints de API

### Rutas de Administrador

```
GET    /api/admin/users                    - Obtener todos los usuarios
PUT    /api/admin/users/:id/status         - Activar/desactivar usuario
PUT    /api/admin/users/:id/role           - Cambiar rol de usuario
DELETE /api/admin/users/:id                - Eliminar usuario

PUT    /api/admin/services/:id/status      - Activar/desactivar servicio
DELETE /api/admin/services/:id             - Eliminar servicio

GET    /api/admin/transactions             - Obtener todas las transacciones
GET    /api/admin/stats                    - Obtener estadísticas
GET    /api/admin/activity                 - Obtener actividad reciente
```

## 🎨 Estructura de Archivos

```
quetzal-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── adminController.js       ← Nuevo
│   │   ├── middleware/
│   │   │   └── authMiddleware.js        ← Actualizado
│   │   ├── models/
│   │   │   └── User.js                  ← Actualizado (campo role)
│   │   └── routes/
│   │       └── adminRoutes.js           ← Nuevo
│   └── migrate-add-role.js              ← Nuevo
│
├── fronted/
│   ├── public/
│   │   ├── css/
│   │   │   ├── main.css                 ← Sistema de colores
│   │   │   ├── components.css           ← Componentes reutilizables
│   │   │   ├── visitor.css              ← Nuevo (estilos visitantes)
│   │   │   └── admin.css                ← Nuevo (estilos admin)
│   │   └── js/
│   │       └── auth.js                  ← Actualizado
│   └── views/
│       ├── landing-page.html            ← Nuevo (visitantes)
│       ├── services-public.html         ← Nuevo (visitantes)
│       ├── service-detail-public.html   ← Nuevo (visitantes)
│       ├── admin-dashboard.html         ← Nuevo (admin)
│       ├── admin-users.html             ← Nuevo (admin)
│       ├── admin-services.html          ← Nuevo (admin)
│       ├── admin-reports.html           ← Nuevo (admin)
│       └── admin-transactions.html      ← Nuevo (admin)
```

## 🎨 Sistema de Colores

La plataforma utiliza un esquema de colores oscuro consistente:

### Colores Principales
- **Primary**: `#8b5cf6` (Púrpura)
- **Primary Dark**: `#7c3aed`
- **Primary Light**: `#a78bfa`
- **Gradiente**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Colores de Estado
- **Success**: `#10b981` (Verde)
- **Warning**: `#f59e0b` (Naranja)
- **Error**: `#ef4444` (Rojo)
- **Info**: `#3b82f6` (Azul)

### Colores de Fondo
- **BG Primary**: `#0f172a` (Oscuro principal)
- **BG Secondary**: `#1e293b` (Oscuro secundario)
- **BG Tertiary**: `#334155` (Oscuro terciario)

### Colores de Texto
- **Text Primary**: `#f1f5f9` (Blanco/Gris claro)
- **Text Secondary**: `#cbd5e1` (Gris medio)
- **Text Tertiary**: `#94a3b8` (Gris)
- **Text Muted**: `#64748b` (Gris oscuro)

## 📁 Organización de CSS

### main.css
Contiene todos los estilos base, variables CSS, componentes comunes y utilidades.
- Variables de color, espaciado, tipografía
- Reset y estilos base
- Sistema de layout (grid, flexbox)
- Componentes comunes (botones, formularios, cards, navbar)
- Utilidades (spacing, display, colors)

### components.css
Componentes reutilizables específicos de la plataforma:
- Stat cards
- Transaction lists
- Notifications
- Quick actions
- Loading skeletons

### visitor.css
Estilos específicos para vistas públicas (sin autenticación):
- Hero sections
- Features grid
- Stats sections
- Service cards públicos
- Landing page
- CTA sections

### admin.css
Estilos específicos para el panel de administración:
- Admin layout (sidebar + main)
- Admin navigation
- Tables de gestión
- Badges de estado
- Reportes y estadísticas
- Action buttons

## 🧪 Casos de Prueba

### Visitante
- [ ] Acceder a landing-page.html sin login
- [ ] Ver servicios en services-public.html
- [ ] Ver detalle de servicio pero no contratar
- [ ] Intentar acceder a dashboard.html → Debe redirigir a login

### Usuario
- [ ] Registrarse correctamente
- [ ] Login exitoso → Redirige a dashboard.html
- [ ] Crear un servicio
- [ ] Intentar acceder a admin-dashboard.html → Debe bloquear

### Administrador
- [ ] Login con admin@quetzal.com
- [ ] Redirige automáticamente a admin-dashboard.html
- [ ] Ver lista de usuarios
- [ ] Activar/desactivar usuarios
- [ ] Cambiar rol de usuario a admin
- [ ] Ver y gestionar servicios
- [ ] Ver transacciones
- [ ] Generar reportes

## 📝 Notas Importantes

1. **Migración de Datos**: Si ya tienes usuarios en la BD, ejecuta la migración para agregar el campo `role` con valor por defecto 'user'.

2. **Usuario Admin**: El primer admin se crea automáticamente con la migración. Cambia la contraseña en producción.

3. **Protección de Rutas**: Las vistas de admin verifican el rol en JavaScript, pero esto es solo para UX. La seguridad real está en el backend.

4. **Roles vs UserType**:
   - `role`: Define permisos de acceso (visitor, user, admin)
   - `userType`: Define tipo de participación (provider, consumer, both)

5. **Redirecciones**: El sistema redirige automáticamente según el rol al hacer login.

## 🐛 Troubleshooting

**Problema**: No puedo acceder al panel de admin
- Verificar que el usuario tenga `role: 'admin'` en la BD
- Limpiar localStorage y volver a iniciar sesión
- Verificar que la migración se haya ejecutado

**Problema**: Las vistas públicas requieren login
- Verificar que no estés usando rutas con `requireAuth()`
- Revisar que los archivos estén en la ruta correcta

**Problema**: Error al crear usuario admin
- Verificar que la migración se ejecute correctamente
- Verificar credenciales de base de datos

## 📚 Recursos Adicionales

- Ver `CONTRIBUTING.md` para guías de desarrollo
- Ver `deploy.md` para instrucciones de despliegue
- Ver documentación de API en `/api-docs` (cuando esté disponible)

---

**Desarrollado para Quetzal Platform** 🦜
