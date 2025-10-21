### 🧩 Diagrama General del Sistema de Casos de Uso

El siguiente diagrama muestra la relación general entre los **actores principales** y los **casos de uso** más relevantes del sistema, incluyendo las dependencias con sistemas externos como pagos y notificaciones.

```mermaid
graph TB 
    subgraph Sistema["Sistema de Plataforma de Servicios"]
        CU1[Registrarse en plataforma]
        CU2[Verificar identidad]
        CU3[Personalizar perfil]
        CU4[Buscar perfiles]
        CU5[Publicar servicio]
        CU6[Gestionar servicios]
        CU7[Buscar servicios]
        CU8[Solicitar cotización]
        CU9[Gestionar solicitudes]
        CU10[Enviar mensajes]
        CU11[Realizar pago con Quetzales]
        CU12[Gestionar cuenta Quetzales]
        CU13[Activar garantía Escrow]
        CU14[Liberar fondos Escrow]
        CU15[Valorar servicio]
        CU16[Gestionar disputas]
    end
    
    Usuario((Usuario))
    Proveedor((Proveedor))
    Consumidor((Consumidor))
    Admin((Administrador))
    SistemaPago[Sistema de Pagos]
    SistemaNotif[Sistema de Notificaciones]
    
    Usuario --> CU1
    Usuario --> CU2
    Usuario --> CU3
    Usuario --> CU4
    Usuario --> CU10
    Usuario --> CU12
    
    Proveedor --> CU5
    Proveedor --> CU6
    Proveedor --> CU9
    Proveedor --> CU14
    
    Consumidor --> CU7
    Consumidor --> CU8
    Consumidor --> CU11
    Consumidor --> CU13
    Consumidor --> CU15
    
    Admin --> CU16
    
    CU11 -.-> SistemaPago
    CU13 -.-> SistemaPago
    CU14 -.-> SistemaPago
    CU2 -.-> SistemaNotif
    CU9 -.-> SistemaNotif
    
    Proveedor -.->|es un| Usuario
    Consumidor -.->|es un| Usuario

# Especificación de Casos de Uso

## CU1: Registrarse en la plataforma

**Actor Principal:** Usuario (nuevo)

**Precondiciones:** 
- El usuario no tiene cuenta en el sistema
- El usuario tiene acceso a internet y un correo electrónico válido

**Flujo Principal:**
1. El usuario accede a la página de registro
2. El sistema muestra el formulario de registro
3. El usuario ingresa: nombre completo, correo electrónico, contraseña, teléfono, ubicación
4. El usuario acepta términos y condiciones
5. El sistema valida los datos ingresados
6. El sistema envía un correo de verificación
7. El usuario confirma su correo electrónico
8. El sistema activa la cuenta y redirige al perfil

**Flujos Alternativos:**
- 5a. Datos inválidos: El sistema muestra mensaje de error y solicita corrección
- 5b. Correo ya registrado: El sistema informa y sugiere recuperación de contraseña
- 7a. El usuario no confirma en 24 horas: El sistema envía recordatorio

**Postcondiciones:** Usuario registrado con cuenta activa en el sistema

---

## CU2: Verificar identidad

**Actor Principal:** Usuario registrado

**Precondiciones:** 
- El usuario tiene cuenta activa
- El usuario está autenticado en el sistema

**Flujo Principal:**
1. El usuario accede a la sección de verificación de identidad
2. El sistema solicita documento de identidad (fotografía o escaneo)
3. El usuario sube el documento
4. El sistema valida el formato y calidad de la imagen
5. El sistema envía el documento para verificación (puede ser manual o automática)
6. El sistema notifica al usuario sobre el estado de la verificación
7. El sistema actualiza el perfil con insignia de "Verificado"

**Flujos Alternativos:**
- 4a. Documento ilegible: El sistema solicita nueva imagen
- 6a. Verificación rechazada: El sistema indica motivo y permite reintentar

**Postcondiciones:** Perfil marcado como verificado

---

## CU3: Personalizar perfil

**Actor Principal:** Usuario

**Precondiciones:** Usuario autenticado

**Flujo Principal:**
1. El usuario accede a su perfil
2. El sistema muestra opciones de edición
3. El usuario modifica: foto de perfil, descripción personal, habilidades, experiencia, portafolio
4. El usuario selecciona categorías de servicios de interés
5. El sistema valida los datos
6. El usuario guarda los cambios
7. El sistema actualiza el perfil

**Flujos Alternativos:**
- 5a. Imagen muy grande: El sistema redimensiona automáticamente
- 5b. Contenido inapropiado: El sistema rechaza y notifica

**Postcondiciones:** Perfil actualizado y visible públicamente

---

## CU5: Publicar servicio

**Actor Principal:** Proveedor

**Precondiciones:** 
- Usuario autenticado y con rol de proveedor
- Perfil completado mínimamente

**Flujo Principal:**
1. El proveedor accede a "Publicar Servicio"
2. El sistema muestra formulario de publicación
3. El proveedor ingresa: título, descripción detallada, categoría, precio en Quetzales, imágenes
4. El proveedor define disponibilidad (horarios, días)
5. El proveedor agrega términos y condiciones del servicio
6. El sistema valida la información
7. El proveedor publica el servicio
8. El sistema activa la publicación y la hace visible

**Flujos Alternativos:**
- 6a. Datos incompletos: El sistema indica campos faltantes
- 6b. Precio inválido: El sistema solicita corrección

**Postcondiciones:** Servicio publicado y visible en búsquedas

---

## CU7: Buscar servicios

**Actor Principal:** Consumidor

**Precondiciones:** Usuario autenticado

**Flujo Principal:**
1. El consumidor accede al buscador de servicios
2. El sistema muestra barra de búsqueda y filtros
3. El consumidor ingresa términos de búsqueda
4. El consumidor aplica filtros (categoría, rango de precio, ubicación, valoración)
5. El sistema ejecuta búsqueda
6. El sistema muestra resultados ordenados por relevancia
7. El consumidor visualiza detalles de servicios de interés

**Flujos Alternativos:**
- 6a. Sin resultados: El sistema sugiere búsquedas relacionadas
- 6b. El consumidor guarda servicios favoritos

**Postcondiciones:** Consumidor visualiza servicios disponibles

---

## CU8: Solicitar cotización

**Actor Principal:** Consumidor

**Precondiciones:** 
- Usuario autenticado
- Servicio seleccionado

**Flujo Principal:**
1. El consumidor selecciona "Solicitar cotización" en un servicio
2. El sistema muestra formulario de solicitud
3. El consumidor detalla: requerimientos específicos, fecha deseada, presupuesto
4. El sistema valida los datos
5. El sistema envía solicitud al proveedor
6. El sistema notifica al proveedor
7. El sistema confirma envío al consumidor

**Flujos Alternativos:**
- 5a. Proveedor no disponible: El sistema informa y sugiere alternativas

**Postcondiciones:** Solicitud registrada y notificada al proveedor

---

## CU9: Gestionar solicitudes

**Actor Principal:** Proveedor

**Precondiciones:** 
- Proveedor autenticado
- Solicitudes recibidas

**Flujo Principal:**
1. El proveedor accede a "Mis Solicitudes"
2. El sistema muestra lista de solicitudes pendientes
3. El proveedor selecciona una solicitud
4. El sistema muestra detalles completos
5. El proveedor decide: Aceptar, Rechazar o Enviar contrapropuesta
6. Si acepta, el proveedor confirma precio y condiciones
7. El sistema notifica al consumidor
8. El sistema actualiza estado de la solicitud

**Flujos Alternativos:**
- 5a. Contrapropuesta: El proveedor modifica precio/condiciones y envía
- 5b. Rechazo: El proveedor indica motivo opcional

**Postcondiciones:** Solicitud procesada y ambas partes notificadas

---

## CU11: Realizar pago con Quetzales

**Actor Principal:** Consumidor

**Precondiciones:** 
- Servicio acordado con proveedor
- Cuenta de Quetzales con saldo suficiente

**Flujo Principal:**
1. El consumidor confirma contratación del servicio
2. El sistema calcula monto total (servicio + comisión)
3. El sistema muestra desglose de pago
4. El consumidor confirma el pago
5. El sistema verifica saldo de Quetzales
6. El sistema debita los Quetzales de la cuenta del consumidor
7. El sistema activa el sistema Escrow (fondos retenidos)
8. El sistema notifica a ambas partes
9. El sistema actualiza estado del servicio a "En proceso"

**Flujos Alternativos:**
- 5a. Saldo insuficiente: El sistema ofrece recargar Quetzales
- 7a. Error en Escrow: El sistema revierte operación y notifica

**Postcondiciones:** Pago realizado y fondos en Escrow hasta completar servicio

---

## CU13: Activar garantía Escrow

**Actor Principal:** Sistema (automático al confirmar pago)

**Precondiciones:** Pago confirmado por el consumidor

**Flujo Principal:**
1. El sistema recibe confirmación de pago
2. El sistema crea registro de transacción Escrow
3. El sistema retiene los Quetzales en cuenta de garantía
4. El sistema establece plazo de entrega acordado
5. El sistema notifica al proveedor sobre fondos asegurados
6. El sistema activa seguimiento de hitos del servicio

**Postcondiciones:** Fondos protegidos hasta finalización o disputa

---

## CU14: Liberar fondos Escrow

**Actor Principal:** Proveedor / Sistema

**Precondiciones:** 
- Servicio completado
- Fondos en Escrow

**Flujo Principal:**
1. El proveedor marca servicio como completado
2. El sistema notifica al consumidor
3. El consumidor confirma satisfacción del servicio
4. El sistema valida confirmación
5. El sistema libera fondos del Escrow
6. El sistema transfiere Quetzales al proveedor (menos comisión)
7. El sistema actualiza balances
8. El sistema solicita valoración del servicio

**Flujos Alternativos:**
- 3a. Consumidor no responde en plazo: El sistema libera automáticamente tras X días
- 3b. Consumidor rechaza: El sistema inicia proceso de disputa (CU16)

**Postcondiciones:** Fondos liberados y servicio finalizado

---

## CU15: Valorar servicio

**Actor Principal:** Consumidor

**Precondiciones:** Servicio completado

**Flujo Principal:**
1. El sistema solicita valoración al consumidor
2. El consumidor accede a valoración
3. El sistema muestra formulario (estrellas 1-5, comentario)
4. El consumidor califica y escribe reseña
5. El sistema valida contenido
6. El consumidor envía valoración
7. El sistema publica reseña en perfil del proveedor
8. El sistema actualiza promedio de calificaciones

**Flujos Alternativos:**
- 5a. Contenido inapropiado: El sistema rechaza y solicita modificación

**Postcondiciones:** Valoración publicada y visible

---

## CU16: Gestionar disputas

**Actor Principal:** Administrador

**Precondiciones:** 
- Disputa iniciada por consumidor o proveedor
- Fondos en Escrow

**Flujo Principal:**
1. El administrador recibe notificación de disputa
2. El sistema muestra detalles: partes involucradas, monto, evidencias
3. El administrador revisa mensajes y documentación
4. El administrador contacta a ambas partes
5. El administrador solicita evidencias adicionales si es necesario
6. El administrador evalúa caso
7. El administrador emite resolución (a favor del consumidor o proveedor)
8. El sistema ejecuta resolución (reembolso o liberación de fondos)
9. El sistema notifica a ambas partes

**Flujos Alternativos:**
- 7a. Resolución parcial: El sistema divide fondos según porcentaje determinado

**Postcondiciones:** Disputa resuelta y fondos distribuidos
