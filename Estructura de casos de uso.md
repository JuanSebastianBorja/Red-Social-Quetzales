# 📘 Resumen de Diagramas de Casos de Uso

Este documento presenta los **diagramas de casos de uso** del sistema, organizados por actor.  
Cada actor cuenta con su propio diagrama, destacando sus interacciones, dependencias y sistemas externos involucrados.

---

## 🧩 Estructura de la Documentación

Se han creado **4 diagramas independientes** de casos de uso, cada uno enfocado en un actor específico del sistema:

1. Usuario General  
2. Proveedor  
3. Consumidor  
4. Administrador  

---

## 👤 1. Diagrama de Casos de Uso — Usuario General

**Actor:** `Usuario` (base para todos los demás actores)  
**Color del Actor:** Azul `#4A90E2`

**Descripción:**  
Este diagrama muestra las funcionalidades básicas disponibles para cualquier usuario registrado en la plataforma, independientemente de su rol.

### 🗂️ Casos de Uso Principales
- **CU1:** Registrarse en plataforma  
- **CU2:** Verificar identidad  
- **CU3:** Personalizar perfil  
- **CU4:** Buscar perfiles de usuarios  
- **CU10:** Enviar / Recibir mensajes  
- **CU12:** Gestionar cuenta Quetzales *(sub-casos: recargar, consultar saldo, ver historial)*  
- **CU17:** Actualizar información personal  
- **CU18:** Cambiar contraseña  
- **CU19:** Configurar notificaciones  

### 🔗 Sistemas Externos
- Sistema de Email *(verificación de cuenta)*  
- Pasarela de Pagos *(recarga de Quetzales)*

---

## 🧰 2. Diagrama de Casos de Uso — Proveedor

**Actor:** `Proveedor` *(hereda de Usuario)*  
**Color del Actor:** Verde `#27AE60`

**Descripción:**  
Este diagrama representa las funcionalidades específicas para usuarios que ofrecen servicios en la plataforma.

### 🧱 Gestión de Servicios
- **CU5:** Publicar servicio  
- **CU6:** Gestionar servicios  
  - CU6A: Editar servicio  
  - CU6B: Activar / Desactivar servicio  
  - CU6C: Eliminar servicio  
  - CU6D: Ver estadísticas del servicio  

### 📨 Gestión de Solicitudes
- **CU9:** Gestionar solicitudes  
  - CU9A: Ver solicitudes recibidas  
  - CU9B: Aceptar solicitud  
  - CU9C: Rechazar solicitud  
  - CU9D: Enviar contrapropuesta  

### 💰 Finalización y Pagos
- **CU14:** Marcar servicio completado  
  - CU14A: Solicitar liberación de fondos  
  - CU14B: Recibir pago  

### ⭐ Reputación y Finanzas
- **CU20:** Ver valoraciones recibidas  
- **CU21:** Responder valoraciones  
- **CU22:** Ver mis ganancias  
- **CU23:** Retirar Quetzales  

### 🔗 Interacciones
- Con **Consumidor** (aceptación / rechazo de solicitudes)  
- Con **Sistema Escrow** (liberación de fondos)  
- Con **Sistema de Notificaciones**

---

## 💼 3. Diagrama de Casos de Uso — Consumidor

**Actor:** `Consumidor` *(hereda de Usuario)*  
**Color del Actor:** Rojo `#E74C3C`

**Descripción:**  
Este diagrama muestra las funcionalidades para usuarios que buscan y contratan servicios.

### 🔍 Búsqueda y Descubrimiento
- **CU7:** Buscar servicios  
  - CU7A: Aplicar filtros  
  - CU7B: Ver detalles  
  - CU7C: Guardar favoritos  
  - CU7D: Comparar servicios  

### 📝 Contratación
- **CU8:** Solicitar cotización  
  - CU8A: Enviar requerimientos  
  - CU8B: Negociar condiciones  
  - CU8C: Aceptar propuesta  

### 💳 Pagos
- **CU11:** Realizar pago  
  - CU11A: Confirmar monto  
  - CU11B: Autorizar pago  
  - CU11C: Ver comprobante  

### 🔄 Seguimiento
- **CU13:** Seguimiento de servicio  
  - CU13A: Ver estado  
  - CU13B: Comunicarse con proveedor  
  - CU13C: Confirmar recepción  

### 🌟 Valoración y Disputas
- **CU15:** Valorar servicio  
  - CU15A: Calificar con estrellas  
  - CU15B: Escribir reseña  
  - CU15C: Publicar valoración  
- **CU16:** Abrir disputa  
  - CU16A: Describir problema  
  - CU16B: Adjuntar evidencias  
  - CU16C: Solicitar reembolso  

### 🕓 Historial
- **CU24:** Ver historial de servicios  
- **CU25:** Solicitar reembolso  

### 🔗 Interacciones
- Con **Proveedor** (solicitudes, valoraciones)  
- Con **Sistema Escrow** (pagos, confirmaciones)  
- Con **Sistema de Pagos** (transacciones)  
- Con **Administrador** (disputas)

---

## 🛠️ 4. Diagrama de Casos de Uso — Administrador

**Actor:** `Administrador`  
**Color del Actor:** Morado `#9B59B6`

**Descripción:**  
Presenta las funcionalidades administrativas y de soporte de la plataforma.

### ⚖️ Gestión de Disputas
- **CU16:** Gestionar disputas  
  - CU16A: Revisar disputa  
  - CU16B: Solicitar evidencias  
  - CU16C: Mediar entre partes  
  - CU16D: Emitir resolución  
  - CU16E: Ejecutar reembolso / liberación  

### 🔍 Moderación de Contenido
- **CU26:** Moderar contenido  
  - CU26A: Revisar publicaciones  
  - CU26B: Suspender contenido inapropiado  
  - CU26C: Revisar valoraciones  

### 👥 Gestión de Usuarios
- **CU27:** Gestionar usuarios  
  - CU27A: Ver lista  
  - CU27B: Suspender usuario  
  - CU27C: Activar usuario  
  - CU27D: Ver historial  

### ✅ Verificaciones
- **CU28:** Verificar identidades  
  - CU28A: Revisar documentos  
  - CU28B: Aprobar verificación  
  - CU28C: Rechazar verificación  

### ⚙️ Gestión del Sistema
- **CU29:** Gestionar categorías  
  - CU29A: Crear  
  - CU29B: Editar  
  - CU29C: Eliminar  
- **CU30:** Ver reportes del sistema  
  - CU30A: Transacciones  
  - CU30B: Comisiones  
  - CU30C: Usuarios activos  
  - CU30D: Servicios populares  
- **CU31:** Configurar parámetros  
  - CU31A: Configurar comisiones  
  - CU31B: Tiempos Escrow  
  - CU31C: Límites del sistema  

### 🔗 Interacciones
- Con **Consumidor** y **Proveedor** (resolución de disputas)  
- Con **Sistema Escrow** (ejecución de resoluciones)  
- Con **Sistema de Notificaciones** (comunicación con usuarios)  
- Con **Base de Datos** (reportes y estadísticas)

---

## 👥 Relaciones entre Actores

```text
Usuario (Base)
    ↓
    ├── Proveedor (ofrece servicios)
    └── Consumidor (contrata servicios)

Administrador (independiente, gestiona la plataforma)
