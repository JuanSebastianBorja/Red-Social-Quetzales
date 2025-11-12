# 💳 Integración PSE (Pagos Seguros en Línea)

## 📋 Descripción

Este documento describe la implementación del sistema de pagos con PSE para la recarga de Quetzales en la plataforma.

## 🏗️ Arquitectura

### Backend

```
backend/
├── src/
│   ├── models/
│   │   └── Transaction.js          # Modelo de transacciones PSE
│   ├── services/
│   │   └── paymentService.js       # Lógica de integración PSE
│   ├── controllers/
│   │   └── walletController.js     # Endpoints PSE
│   └── routes/
│       └── walletRoutes.js         # Rutas PSE
└── migrations/
    └── 002_create_transactions_table.sql
```

### Frontend

```
fronted/
├── public/
│   └── js/
│       ├── wallet.js               # UI de compra con PSE
│       └── api.js                  # Cliente API con métodos PSE
└── views/
    └── pse-callback.html           # Página de confirmación
```

## 🔄 Flujo de Pago PSE

### 1. Inicio del Pago

```
Usuario → Wallet → Selecciona monto → Click "Comprar"
                ↓
        Modal PSE aparece
                ↓
Usuario completa formulario:
  - Banco
  - Tipo de persona
  - Documento
  - Email
                ↓
        POST /api/wallet/pse/init
                ↓
    Backend crea Transaction (status: pending)
                ↓
    Backend genera URL del banco
                ↓
    Redirección a banco PSE
```

### 2. Proceso en el Banco

```
Usuario → Página del Banco → Ingresa credenciales
                          ↓
                  Autoriza pago
                          ↓
              Banco procesa pago
                          ↓
        Redirección a /pse-callback.html
```

### 3. Confirmación

```
pse-callback.html carga
        ↓
Verifica referencia en URL
        ↓
POST /api/wallet/pse/callback
        ↓
Backend actualiza Transaction
        ↓
Si approved → Acredita Quetzales
        ↓
Muestra resultado al usuario
```

## 🔌 API Endpoints

### GET /api/wallet/pse/banks
Obtiene lista de bancos disponibles

**Response:**
```json
{
  "success": true,
  "banks": [
    { "code": "1007", "name": "BANCOLOMBIA" },
    { "code": "1013", "name": "BBVA COLOMBIA" },
    ...
  ]
}
```

### POST /api/wallet/pse/init
Inicia una transacción PSE

**Request:**
```json
{
  "amountCOP": 50000,
  "bankCode": "1007",
  "personType": "natural",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "email": "usuario@ejemplo.com"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 123,
    "reference": "QZ-1699999999-ABC123",
    "pseTransactionId": "PSE-xxx",
    "bankUrl": "https://banco.com/pay?ref=xxx",
    "amountCOP": 50000,
    "amountQZ": 5.0,
    "bankName": "BANCOLOMBIA",
    "expiresAt": "2025-11-11T12:30:00Z"
  }
}
```

### GET /api/wallet/pse/status/:reference
Verifica el estado de una transacción

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 123,
    "reference": "QZ-xxx",
    "status": "approved",
    "amountCOP": 50000,
    "amountQZ": 5.0,
    "bankName": "BANCOLOMBIA",
    "authorizationCode": "AUTH123",
    "createdAt": "2025-11-11T12:00:00Z",
    "approvedAt": "2025-11-11T12:05:00Z"
  }
}
```

### POST /api/wallet/pse/callback
Procesa el callback del banco PSE

**Request:**
```json
{
  "reference": "QZ-xxx",
  "status": "APPROVED",
  "authorizationCode": "AUTH123"
}
```

## 💾 Base de Datos

### Tabla: Transactions

```sql
CREATE TABLE "Transactions" (
  id SERIAL PRIMARY KEY,
  "userId" UUID NOT NULL,
  type ENUM('topup', 'withdraw', 'transfer', ...),
  "paymentMethod" ENUM('pse', 'credit_card', ...),
  status ENUM('pending', 'processing', 'approved', 'rejected', 'failed', 'expired'),
  "amountCOP" DECIMAL(12, 2),
  "amountQZ" DECIMAL(12, 2),
  "exchangeRate" DECIMAL(10, 2),
  "pseTransactionId" VARCHAR(255) UNIQUE,
  "bankCode" VARCHAR(50),
  "bankName" VARCHAR(100),
  "paymentReference" VARCHAR(100),
  "authorizationCode" VARCHAR(100),
  ...
);
```

### Estados de Transacción

- **pending**: Transacción creada, esperando inicio de pago
- **processing**: Usuario redirigido al banco, pago en proceso
- **approved**: Pago aprobado, Quetzales acreditados
- **rejected**: Pago rechazado por el banco
- **failed**: Error técnico en el proceso
- **expired**: Transacción expiró (30 minutos sin completar)

## ⚙️ Configuración

### Variables de Entorno

```bash
# PSE Configuration
PSE_MERCHANT_ID=your_merchant_id
PSE_API_KEY=your_api_key
PSE_SECRET_KEY=your_secret_key
PSE_API_URL=https://api.pse.com  # o sandbox
PSE_RETURN_URL=https://yoursite.com/views/pse-callback.html
PSE_ENVIRONMENT=production  # o sandbox
```

### Tasa de Conversión

Actualmente: **1 Quetzal = 10,000 COP**

Definido en: `backend/src/models/index.js`

```javascript
const QZ_TO_FIAT = 10000;
```

## 🧪 Testing

### Modo Sandbox

La implementación actual incluye un mock de PSE para desarrollo:

```javascript
// paymentService.js
async function mockPseApiCall(data) {
  // Simula respuesta de PSE
  return {
    transactionId: 'PSE-xxx',
    bankUrl: 'https://sandbox.pse.com/payment',
    status: 'PENDING'
  };
}
```

### Testing Manual

1. **Iniciar Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Iniciar Frontend:**
   ```bash
   cd fronted
   npm run dev
   ```

3. **Flujo de Prueba:**
   - Ir a http://localhost:3000/views/wallet.html
   - Click en "Comprar Quetzales"
   - Ingresar monto (ej: 5 Quetzales)
   - Llenar formulario PSE
   - Verificar redirección
   - Simular callback con:
     ```bash
     curl -X POST http://localhost:3001/api/wallet/pse/callback \
       -H "Content-Type: application/json" \
       -d '{
         "reference": "QZ-xxx",
         "status": "APPROVED",
         "authorizationCode": "TEST123"
       }'
     ```

## 🔒 Seguridad

### Implementado

- ✅ Validación de datos del formulario
- ✅ Transacciones atómicas en DB
- ✅ Lock optimista para prevenir race conditions
- ✅ Expiración de transacciones (30 minutos)
- ✅ Registro de IP y User-Agent
- ✅ Referencias únicas de pago

### Pendiente

- ⚠️ Firma de webhooks (HMAC)
- ⚠️ Whitelist de IPs para callbacks
- ⚠️ Rate limiting específico para PSE
- ⚠️ Logs de auditoría detallados
- ⚠️ Encriptación de datos sensibles

## 🚀 Producción

### Checklist antes de Deploy

- [ ] Configurar variables de entorno reales de PSE
- [ ] Reemplazar `mockPseApiCall` con API real
- [ ] Configurar webhook URL en panel de PSE
- [ ] Probar en ambiente de staging
- [ ] Configurar SSL/HTTPS
- [ ] Implementar firma de webhooks
- [ ] Configurar monitoreo de transacciones
- [ ] Documentar procedimiento de soporte
- [ ] Configurar alertas de transacciones fallidas

### Proveedores PSE en Colombia

Opciones recomendadas:

1. **ePayco** - https://epayco.com
2. **PayU** - https://payu.com.co
3. **PlaceToPay** - https://placetopay.com
4. **MercadoPago** - https://mercadopago.com.co

## 📝 Notas

- La implementación actual es un **mock** para desarrollo
- En producción, integrar con un proveedor PSE real
- Los bancos listados son los principales de Colombia
- El flujo está diseñado para ser compatible con cualquier proveedor PSE estándar

## 🐛 Troubleshooting

### Error: "Transaction not found"
- Verificar que la referencia en la URL sea correcta
- Verificar que la transacción existe en la BD

### Error: "Transaction already processed"
- La transacción ya fue confirmada/rechazada
- No se puede procesar dos veces

### Transacción queda en "pending"
- Ejecutar manualmente el callback
- Verificar logs del backend
- Verificar conectividad con API de PSE

### Quetzales no se acreditan
- Verificar que el status sea "approved"
- Verificar logs de `processPseCallback`
- Verificar balance del usuario en BD

## 📞 Soporte

Para problemas con la integración PSE, contactar:
- Backend Team: backend@quetzal.com
- DevOps: devops@quetzal.com

---

**Última actualización:** 11 de noviembre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado (Mock) - Pendiente integración real
