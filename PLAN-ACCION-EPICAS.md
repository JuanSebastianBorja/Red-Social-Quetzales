# 📋 Plan de Acción por Épicas - Quetzal Platform

**Fecha:** 12 de noviembre de 2025  
**Rama:** `main`  
**Priorización:** Según especificación del proyecto

---

## 🎯 Estado General del Proyecto

### Resumen Ejecutivo

| Épica | Estado Backend | Estado Frontend | Completitud | Prioridad |
|-------|---------------|-----------------|-------------|-----------|
| **1. Gestión de Usuarios** | 🟢 85% | 🟢 80% | **82%** | ⭐⭐⭐⭐⭐ |
| **2. Gestión de Servicios** | 🟢 90% | 🟢 86% | **88%** | ⭐⭐⭐⭐⭐ |
| **3. Contratación de Servicios** | � 85% | � 70% | **78%** | ⭐⭐⭐⭐ |
| **4. Sistema de Pagos (Quetzales/Escrow)** | 🟡 70% | 🟡 60% | **65%** | ⭐⭐⭐⭐⭐ |
| **5. Cartera Virtual** | 🟡 75% | 🟡 65% | **70%** | ⭐⭐⭐⭐⭐ |
| **6. Sistema de Reputación** | 🔴 40% | 🔴 30% | **35%** | ⭐⭐⭐ |
| **7. Notificaciones** | 🔴 20% | 🔴 15% | **17%** | ⭐⭐⭐ |
| **8. Panel de Administración** | 🟢 80% | 🟢 85% | **82%** | ⭐⭐⭐ |
| **9. Analytics y Reportes** | 🔴 40% | 🔴 35% | **37%** | ⭐⭐ |

**Leyenda:**  
🟢 Completo/Funcional | 🟡 Parcial/Necesita mejoras | 🔴 Incompleto/Pendiente

---

## 📊 Análisis Detallado por Épica

### ⭐ ÉPICA 1: Gestión de Usuarios (Completitud: 82%)

#### ✅ Backend Implementado
```javascript
// Rutas funcionales
POST   /api/auth/register        // ✅ Registro completo
POST   /api/auth/login           // ✅ Login completo  
GET    /api/auth/verify          // ✅ Verificación token
POST   /api/auth/logout          // ✅ Logout
POST   /api/auth/forgot-password // 🟡 Implementado sin email
POST   /api/auth/reset-password  // 🟡 Implementado sin email
GET    /api/users/:id            // 🔴 Stub
PUT    /api/users/:id            // 🔴 Stub parcial
```

**Validaciones Backend:**
- ✅ Email format y normalización
- ✅ Password strength (8+ chars, mayúscula, número)
- ✅ Nombre completo (3+ chars)
- ✅ Rate limiting en login/registro (5 intentos / 15 min)

#### ✅ Frontend Implementado
- ✅ Login completo con validación
- ✅ Registro completo con validación
- ✅ Almacenamiento token/usuario localStorage
- ✅ Función "Recordarme"
- ✅ Redirección automática si autenticado
- ✅ Logout funcional
- ✅ `auth.js` con helpers: `requireAuth()`, `hasRole()`, `isAdmin()`

#### ❌ Faltante

**Backend:**
1. Envío de emails (verificación, recuperación contraseña)
2. Endpoint completo `GET /users/:id` con permisos
3. Endpoint completo `PUT /users/:id` (actualizar perfil)
4. Upload de avatar funcional
5. 2FA / Autenticación dos factores
6. OAuth (Google login - botón presente pero sin implementar)

**Frontend:**
7. Integración recuperación de contraseña real
8. Vista de verificación de email
9. Configuración 2FA en perfil
10. Integración Google OAuth

**Estimación:** 3-4 días desarrollo

---

### ⭐ ÉPICA 2: Gestión de Servicios (Completitud: 87%)

#### ✅ Backend Implementado
```javascript
// Rutas funcionales
GET    /api/services              // ✅ Con filtros (category, price, search, sort)
GET    /api/services/:id          // ✅ Con incremento de vistas
POST   /api/services              // ✅ CRUD completo
PUT    /api/services/:id          // ✅ Validación ownership
DELETE /api/services/:id          // ✅ Validación ownership
GET    /api/services/my/services  // ✅ Servicios del usuario
GET    /api/services/category/:c  // ✅ Por categoría
```

**Validaciones Backend:**
- ✅ Título 10-255 chars
- ✅ Descripción 50-5000 chars
- ✅ Precio > 0
- ✅ Tiempo entrega 1-365 días
- ✅ Verificación userType (solo providers pueden crear)

#### ✅ Frontend Implementado
- ✅ `services.html` - Listado con filtros avanzados
- ✅ `create-service.html` - Crear servicio completo
- ✅ `edit-service.html` - Editar servicio completo
- ✅ `services-public.html` - Vista pública para visitantes
- ✅ `service-detail-public.html` - Detalle sin login (mejorado: badges, animaciones, alertas)
- ✅ Búsqueda, filtros por categoría, ordenamiento, paginación

#### ❌ Faltante

**Backend:**
1. Upload de imágenes del servicio (endpoint existe en `api.js` pero no en backend)
2. Sistema de categorías dinámicas (actualmente hardcoded)
3. Moderación de contenido (aprobar/rechazar servicios)
4. Guardar borradores
5. Programar publicación

**Frontend:**
6. Upload de imágenes funcional
7. Preview de imágenes antes de subir
8. Vista previa del servicio antes de publicar
9. Estadísticas del servicio (vistas, contrataciones)
10. Duplicar servicio
11. Pausar/Reanudar servicio

**Estimación:** 2-3 días desarrollo

---

### ⭐⭐⭐⭐⭐ ÉPICA 4: Sistema de Pagos - Quetzales y Escrow (Completitud: 65%)

#### ✅ Backend Implementado
```javascript
// Wallet
POST   /wallet/topup       // ✅ Recargar Quetzales
POST   /wallet/withdraw    // ✅ Retirar fondos
POST   /wallet/transfer    // ✅ Transferir entre usuarios
GET    /wallet/summary     // ✅ Balance y transacciones

// Escrow
POST   /escrow             // ✅ Crear escrow
POST   /escrow/:id/fund    // ✅ Fondear desde balance
POST   /escrow/:id/release // ✅ Liberar a vendedor
POST   /escrow/:id/cancel  // ✅ Cancelar y reembolsar
POST   /escrow/:id/dispute // 🟡 Crear disputa (stub)
```

**Lógica Implementada:**
- ✅ Conversión Quetzales ↔ COP (1 QZ = 10,000 COP)
- ✅ Transacciones atómicas con `sequelize.transaction()`
- ✅ Lock optimista para prevenir race conditions
- ✅ Historial de transacciones en `WalletTx`
- ✅ Estados escrow: created, funded, released, cancelled, disputed

#### ✅ Frontend Implementado
- ✅ `wallet.html` - Vista de cartera completa
- ✅ `wallet.js` - Comprar/Retirar fondos
- ✅ Formularios de compra y retiro
- ✅ Lista de transacciones recientes
- ✅ Conversión automática QZ ↔ COP
- ✅ API client con métodos escrow

#### ❌ Faltante (CRÍTICO)

**Backend:**
1. **Integración pasarela de pagos real** (PSE, Mercado Pago, Stripe)
2. Webhooks para confirmación de pagos
3. Manejo de estados de transacción (pending, confirmed, failed)
4. Sistema de resolución de disputas (admin panel)
5. Comisiones de plataforma (actualmente no se cobran)
6. Logs de auditoría de transacciones
7. Límites de transacción y verificación KYC

**Frontend:**
8. **Integración UI con pasarela** (redirect/iframe)
9. Callbacks de confirmación/error
10. Estados visuales (pending, processing, success, failed)
11. Comprobantes de transacción (descargar PDF)
12. Gráficos de ingresos/gastos
13. Filtros de transacciones (fecha, tipo, estado)
14. Exportar historial (CSV/PDF)
15. Modal de confirmación para retiros > cierto monto
16. Vista detallada de escrow activos
17. Panel de disputas

**Estimación:** 5-7 días desarrollo (pasarela + integración)

---

### ⭐⭐⭐⭐⭐ ÉPICA 5: Cartera Virtual y Transferencias (Completitud: 70%)

#### ✅ Implementado (ver Épica 4)
- Comparte implementación con Épica 4
- Transferencias P2P funcionales
- Balance en tiempo real

#### ❌ Faltante
1. Programar retiros automáticos
2. Alertas de saldo bajo
3. Límites personalizados de gasto
4. Wallet multi-moneda (si se expande a otros países)
5. Recibos/comprobantes automáticos
6. Historial de transferencias filtrable
7. Códigos QR para recibir pagos

**Estimación:** 2-3 días desarrollo

---

### ⭐ ÉPICA 3: Contratación de Servicios (Completitud: 78%)

Actualizado (12/11/2025): flujo principal de contratación implementado en backend y frontend. Falta pulir acciones, adjuntos y coherencia de comisiones.

#### ✅ Backend Implementado
```javascript
POST   /contracts               // Crear contrato y fondear escrow (wallet debit + fee)
GET    /contracts/:id           // Detalle del contrato
PUT    /contracts/:id/status    // Transiciones: paid → in_progress → delivered → completed | cancel/dispute
GET    /contracts/my/buyer      // Mis contrataciones (comprador)
GET    /contracts/my/seller     // Mis ventas (vendedor)
```

Lógica y validaciones clave:
- Transacciones atómicas con Wallet, Escrow y Transaction
- Prevención de contratar tu propio servicio
- Cálculo de comisión de plataforma (10%) y fecha límite de entrega

#### ✅ Frontend Implementado
- `service-detail.html`: modal de contratación con desglose y verificación de fondos
- `my-contracts.html`: listado del comprador con filtros, paginación y acciones básicas
- `my-sales.html`: listado del vendedor con filtros, paginación y acciones básicas
- Unificación de layout con menú lateral y subtítulos de alto contraste

#### 🟡 Faltante
1. UI para transiciones de estado (in_progress, delivered con adjuntos, completed, cancel, dispute)
2. Alinear comisión al 10% en toda la UI (algunas vistas muestran 5%)
3. Highlight del contrato recién creado y deep link a su detalle
4. Adjuntos en entregas y revisiones, y previsualización
5. Skeleton loaders/estados vacíos consistentes en listados
6. Botón “Ir al chat” ligado al contrato

**Estimación restante:** 2-3 días (acciones + coherencia de comisiones + QA)

---

### 🔴 ÉPICA 6: Sistema de Reputación (Completitud: 35%)

#### 🟡 Backend Parcialmente Implementado
```javascript
// Ratings implementados
POST   /ratings        // ✅ Crear rating
GET    /ratings/:id    // ✅ Obtener rating
// Models existen: Rating, averageRating en Service
```

#### ❌ Backend Faltante
```javascript
PUT    /ratings/:id           // Editar rating
DELETE /ratings/:id           // Eliminar rating (propio)
GET    /services/:id/ratings  // Todos los ratings del servicio
GET    /users/:id/ratings     // Ratings recibidos por usuario
POST   /ratings/:id/report    // Reportar rating inapropiado
```

#### ❌ Frontend Faltante
1. Modal/formulario para dejar rating después de contrato
2. Vista de ratings del servicio
3. Vista de ratings del proveedor (perfil)
4. Sistema de estrellas interactivo
5. Validación (solo puedes calificar si contrataste)
6. Ordenar servicios por rating
7. Badges de "Top Rated", "Verified Provider"
8. Respuestas del proveedor a ratings
9. Reportar ratings abusivos

**Estimación:** 3-4 días desarrollo

---

### 🔴 ÉPICA 7: Sistema de Notificaciones (Completitud: 17%)

#### ❌ Backend Faltante (COMPLETO)
```javascript
// Notificaciones
POST   /notifications                    // Crear notificación (sistema)
GET    /notifications                    // Mis notificaciones
PUT    /notifications/:id/read           // Marcar como leída
PUT    /notifications/read-all           // Marcar todas como leídas
DELETE /notifications/:id                // Eliminar notificación
GET    /notifications/preferences        // Preferencias
PUT    /notifications/preferences        // Actualizar preferencias

// Tipos sugeridos:
// - new_message
// - service_hired
// - payment_received
// - escrow_released
// - rating_received
// - service_approved
// - dispute_created
```

#### ❌ Frontend Faltante
1. **Toast system global** para notificaciones en tiempo real
2. Dropdown de notificaciones en topbar
3. Badge con contador de no leídas (actualmente hardcoded "5")
4. Vista de todas las notificaciones
5. Filtros (leídas/no leídas, tipo)
6. Configuración de preferencias en perfil
7. WebSocket para notificaciones en tiempo real (opcional)
8. Push notifications del navegador (opcional)

**Estimación:** 3-4 días desarrollo

---

### 🟢 ÉPICA 8: Panel de Administración (Completitud: 82%)

#### ✅ Backend Implementado
```javascript
// Admin Routes
GET    /admin/users                  // ✅ Todos los usuarios
PUT    /admin/users/:id/status       // ✅ Activar/desactivar
PUT    /admin/users/:id/role         // ✅ Cambiar rol
DELETE /admin/users/:id              // ✅ Eliminar usuario
PUT    /admin/services/:id/status    // ✅ Activar/desactivar servicio
DELETE /admin/services/:id           // ✅ Eliminar servicio
GET    /admin/transactions           // ✅ Todas las transacciones
GET    /admin/stats                  // ✅ Estadísticas
GET    /admin/activity               // ✅ Actividad reciente
```

#### ✅ Frontend Implementado
- ✅ `admin-dashboard.html` - Dashboard con stats
- ✅ `admin-users.html` - Gestión de usuarios
- ✅ `admin-services.html` - Gestión de servicios
- ✅ `admin-transactions.html` - Transacciones
- ✅ `admin-reports.html` - Reportes básicos
- ✅ Filtros, búsqueda, acciones CRUD

#### ❌ Faltante
1. `admin-settings.html` (en nav pero no existe)
2. **Gráficos/charts** (canvas presente pero sin Chart.js)
3. Exportar reportes (PDF, Excel, CSV) - actualmente solo alerts
4. Moderación de contenido (aprobar/rechazar servicios pendientes)
5. Sistema de resolución de disputas
6. Logs de auditoría de acciones admin
7. Gestión de categorías de servicios
8. Configuración de comisiones
9. Gestión de métodos de pago
10. Vista de usuarios reportados/suspendidos

**Estimación:** 2-3 días desarrollo

---

### 🔴 ÉPICA 9: Analytics y Reportes (Completitud: 37%)

#### 🟡 Backend Parcialmente Implementado
```javascript
GET /admin/stats // ✅ Stats básicos (count users, services, transactions)
```

#### ❌ Backend Faltante
```javascript
GET /admin/analytics/revenue        // Ingresos por período
GET /admin/analytics/users-growth   // Crecimiento de usuarios
GET /admin/analytics/top-services   // Servicios más contratados
GET /admin/analytics/top-providers  // Proveedores destacados
GET /admin/analytics/conversion     // Tasa de conversión
GET /analytics/my-performance       // Analytics para proveedores
```

#### ❌ Frontend Faltante
1. **Integrar Chart.js o similar** para gráficos
2. Dashboard de analytics con métricas clave:
   - Usuarios activos (día/semana/mes)
   - Transacciones y volumen
   - Servicios creados
   - Tasa de conversión
3. Gráficos de líneas (ingresos, crecimiento)
4. Gráficos de torta (categorías populares)
5. Exportar datos a CSV/Excel
6. Filtros por fecha personalizada
7. Comparación de períodos
8. Analytics personalizados para proveedores:
   - Vistas de mis servicios
   - Tasa de contratación
   - Ingresos mensuales
   - Rating promedio

**Estimación:** 4-5 días desarrollo

---

## 🚀 Plan de Acción Priorizado

### 🔴 CRÍTICO - Sprint 1 (4-6 días) — Actualizado

**Objetivo:** Consolidar flujo de contratación end-to-end con estados y coherencia de comisiones**

1. **Integración pasarela de pagos** (2-3 días)
   - Integrar Mercado Pago o PSE
   - Webhooks de confirmación
   - Manejo de estados pending/success/failed

2. **Sistema de Contratación (UI/UX y acciones)** (1-2 días)
   - Unificar comisión al 10% en UI (service-detail + modal + resúmenes)
   - Agregar acciones: Iniciar trabajo, Entregar (con archivos), Completar, Cancelar, Disputar
   - Señalización visual por estado (badges/timeline ligero)

3. **Mensajería ligada a contrato** (1 día)
   - Completar `messages.js` en frontend
   - Backend de mensajes (si no existe)
   - Botón “Ir al chat” desde cada contrato

### 🟡 ALTA - Sprint 2 (5-7 días)

**Objetivo:** Sistema de reputación y notificaciones

4. **Sistema de Ratings completo** (2-3 días)
   - Endpoints faltantes
   - Frontend: modal rating, vista de ratings
   - Validar que solo clientes puedan calificar

5. **Sistema de Notificaciones** (2-3 días)
   - Backend completo de notificaciones
   - Toast system global en frontend
   - Dropdown de notificaciones
   - Actualizar badge dinámicamente

6. **Mejoras UX/UI** (1-2 días)
   - Skeleton loaders
   - Estados de carga en formularios
   - Validaciones inline
   - Modal de confirmación reutilizable

### 🟢 MEDIA - Sprint 3 (4-5 días)

**Objetivo:** Panel admin y analytics

7. **Completar Panel Admin** (2 días)
   - Crear `admin-settings.html`
   - Sistema de resolución de disputas
   - Moderación de servicios
   - Logs de auditoría

8. **Analytics y Reportes** (2-3 días)
   - Integrar Chart.js
   - Endpoints de analytics
   - Dashboard con gráficos
   - Exportar a CSV/PDF

### 🔵 BAJA - Sprint 4 (3-4 días)

**Objetivo:** Pulido y funcionalidades secundarias

9. **Perfil de Usuario completo** (1-2 días)
   - Upload de avatar funcional
   - Actualizar perfil completo
   - Gestión de habilidades

10. **Servicios - Features avanzadas** (1-2 días)
    - Upload de imágenes del servicio
    - Borradores
    - Duplicar servicio
    - Estadísticas de servicio

11. **Testing y Validación** (1 día)
    - Validar flujos críticos
    - Sanitización XSS
    - Accesibilidad básica (aria-labels)
    - Cross-browser testing

---

## 📋 Checklist de Implementación

### Antes de cada Sprint
- [ ] Crear branch desde `feature/frontend-deploy`
- [ ] Revisar dependencias entre tareas
- [ ] Coordinar con equipo (si aplica)

### Durante Desarrollo
- [ ] Escribir código siguiendo convenciones del proyecto
- [ ] Añadir validaciones backend y frontend
- [ ] Manejar errores apropiadamente
- [ ] Actualizar `api.js` con nuevos endpoints
- [ ] Probar en local antes de commit

### Después de cada Feature
- [ ] Testing manual del flujo completo
- [ ] Verificar estados de error
- [ ] Commit con mensaje descriptivo
- [ ] Push a rama de feature
- [ ] Crear PR para review (si aplica)

### Antes de Merge a Main
- [ ] Revisar todos los checkpoints
- [ ] Ejecutar backend y frontend juntos
- [ ] Probar flujo end-to-end
- [ ] Actualizar documentación si es necesario
- [ ] Merge y deploy a staging

---

## 🎯 Métricas de Éxito

### Sprint 1 (Crítico)
- ✅ Usuario puede comprar Quetzales con pasarela real
- ✅ Usuario puede contratar un servicio
- ✅ Fondos van a escrow automáticamente
- ✅ Proveedor y cliente pueden comunicarse

### Sprint 2 (Alta)
- ✅ Cliente puede calificar al proveedor
- ✅ Notificaciones funcionan en tiempo real
- ✅ UX fluida sin estados de carga vacíos

### Sprint 3 (Media)
- ✅ Admin puede moderar y resolver disputas
- ✅ Analytics con gráficos visuales
- ✅ Reportes exportables

### Sprint 4 (Baja)
- ✅ Usuarios pueden personalizar perfil completo
- ✅ Servicios con imágenes y estadísticas
- ✅ Proyecto pasa validación de calidad

---

## 📝 Notas Importantes

1. **Pasarela de Pagos:** Considerar sandbox para testing antes de producción
2. **Seguridad:** Implementar CSP, sanitización XSS, rate limiting adicional
3. **Performance:** Lazy loading, code splitting, optimización de queries
4. **Escalabilidad:** Considerar WebSockets para mensajes y notificaciones en tiempo real
5. **Documentación:** Actualizar README con instrucciones de setup completo

---

## ✨ Cambios recientes (12/11/2025)

- Unificación de menú lateral y layout en: `service-detail.html`, `my-sales.html`, `my-contracts.html`
- Mejora de visibilidad: subtítulos blancos (text-primary) y badges coherentes
- Inclusión de `components.css` y animaciones (`animate-fadeIn`, `animate-slideInUp`, `animate-pulse`)
- `service-detail-public.html`: badges de disponibilidad, alerta de error estilizada y spinner
- `messages.html` y `wallet.html`: animaciones y consistencia visual

---

## 🔜 Recomendación inmediata — ¿Con qué seguimos?

1. Alinear comisión al 10% en toda la UI (service-detail + modal + breakdowns) para coincidir con backend.
2. Agregar acciones de contrato en UI (in_progress, delivered con adjuntos, completed, cancel, dispute) y sus validaciones.
3. Menú lateral: resaltar activo automáticamente y, si aplica, extraer a partial reutilizable.
4. Vínculo directo “Ir al chat” desde cada contrato y crear conversación si no existe.
5. QA responsive y estados vacíos/skeletons en `my-sales` y `my-contracts`.
6. Pasarela de pagos (sandbox) + webhooks y estados pending/success/failed.

---

## 🔄 Próximos Pasos Inmediatos

1. **Revisar este plan con el equipo**
2. **Priorizar Sprint 1 - Pasarela de pagos + Contratación**
3. **Crear issues/tareas en el repo**
4. **Estimar tiempos realistas**
5. **Comenzar desarrollo**

---

**Última actualización:** 12 de noviembre de 2025  
**Revisado por:** GitHub Copilot  
**Estado:** Listo para implementación
