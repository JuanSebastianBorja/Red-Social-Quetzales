# 🔍 DIAGNÓSTICO DE INCONSISTENCIAS - Quetzal Platform

**Fecha:** 2025-01-14  
**Autor:** GitHub Copilot  
**Estado:** Revisión Completa Frontend + Backend

---

## 📋 RESUMEN EJECUTIVO

Se han identificado **múltiples inconsistencias críticas** entre:
- Esquema de base de datos (migraciones)
- Modelos Sequelize (backend)
- Relaciones entre modelos
- Controladores y servicios
- Frontend (API calls y estructuras de datos)

### Impacto General:
- ⚠️ **CRÍTICO:** Incompatibilidad de tipos de datos (UUID vs INTEGER)
- ⚠️ **ALTO:** Inconsistencias de nomenclatura (PascalCase vs snake_case)
- ⚠️ **MEDIO:** Referencias incorrectas en relaciones
- ⚠️ **BAJO:** Campos faltantes en algunos modelos

---

## 🚨 PROBLEMA 1: CONTRACT MODEL - INCOMPATIBILIDAD DE TIPOS

### 📍 Ubicación:
- **Modelo:** `backend/src/models/Contract.js`
- **Migración:** `backend/migrations/003_create_contracts_table.sql`

### ❌ Problema:

#### En Contract.js (línea 19-27):
```javascript
serviceId: {
  type: DataTypes.INTEGER,  // ❌ INCORRECTO
  allowNull: false,
  references: {
    model: 'Services',
    key: 'id'
  }
}
```

#### En 003_create_contracts_table.sql (línea 25):
```sql
"serviceId" UUID NOT NULL REFERENCES services(id)  -- ✅ CORRECTO
```

### 🔥 Impacto:
- Sequelize espera INTEGER pero la DB tiene UUID
- **Los contratos NO pueden crearse** correctamente
- Error en producción: `invalid input syntax for type integer: "uuid-string"`

### ✅ Solución Requerida:

```javascript
// Contract.js - Cambiar:
serviceId: {
  type: DataTypes.UUID,  // ✅ CORRECTO
  allowNull: false,
  references: {
    model: 'services',  // También cambiar a minúsculas
    key: 'id'
  }
}

// Aplicar el mismo cambio a:
// - escrowId (debe ser UUID, no INTEGER)
// - conversationId (debe ser UUID, no INTEGER)  
// - ratingId (debe ser UUID, no INTEGER)
```

**NOTA:** El controlador `contractController.js` ya intenta usar UUID al crear contratos, pero el modelo lo rechaza.

---

## 🚨 PROBLEMA 2: TRANSACTION MODEL - REFERENCIAS INCONSISTENTES

### 📍 Ubicación:
- **Modelo:** `backend/src/models/Transaction.js`
- **Migración:** `backend/migrations/002_create_transactions_table.sql`

### ❌ Problema:

#### En Transaction.js (línea 15-21):
```javascript
userId: {
  type: DataTypes.INTEGER,  // ❌ INCORRECTO
  allowNull: false,
  references: {
    model: 'Users',  // ❌ Nombre incorrecto
    key: 'id'
  }
}
```

#### En 002_create_transactions_table.sql (línea 38):
```sql
"userId" UUID NOT NULL REFERENCES users(id)  -- ✅ CORRECTO
```

### 🔥 Impacto:
- Modelo espera INTEGER pero DB tiene UUID
- Referencia a tabla "Users" cuando la tabla real es `users`
- PSE payments **no pueden guardarse** correctamente

### ✅ Solución:

```javascript
userId: {
  type: DataTypes.UUID,
  allowNull: false,
  references: {
    model: 'users',  // minúsculas
    key: 'id'
  }
}
```

---

## 🚨 PROBLEMA 3: MESSAGE & CONVERSATION - NOMENCLATURA MIXTA

### 📍 Ubicación:
- **Modelos:** `backend/src/models/Conversation.js`, `Message.js`
- **Migración:** `backend/migrations/004_create_messaging_tables.sql`
- **Controlador:** `backend/src/controllers/messageController.js`

### ❌ Problema:

#### Modelos usan snake_case en fields:
```javascript
// Conversation.js
{
  tableName: 'Conversations',  // ✅ PascalCase
  createdAt: 'created_at',     // snake_case
  updatedAt: 'updated_at'      // snake_case
}
```

#### Message.js referencia conversaciones incorrectamente:
```javascript
// Message.js línea 18
conversationId: {
  type: DataTypes.UUID,
  field: 'conversation_id',
  references: {
    model: 'conversations',  // ❌ INCORRECTO - tabla es "Conversations"
    key: 'id'
  }
}
```

#### Migración usa PascalCase con comillas:
```sql
CREATE TABLE IF NOT EXISTS "Conversations" (...)
CREATE TABLE IF NOT EXISTS "Messages" (...)
```

### 🔥 Impacto:
- Sequelize busca tabla `conversations` (minúsculas) pero existe `"Conversations"` (PascalCase)
- Pueden existir **DUPLICADOS** de tablas en la DB
- Queries fallan en producción

### ✅ Solución:

**Opción A (Recomendada): Usar snake_case en migraciones**
```sql
-- Cambiar en 004_create_messaging_tables.sql:
CREATE TABLE IF NOT EXISTS conversations (...)
CREATE TABLE IF NOT EXISTS messages (...)
```

**Opción B: Actualizar modelos para usar PascalCase con comillas**
```javascript
// Conversation.js
references: {
  model: '"Conversations"',  // Con comillas para PostgreSQL
  key: 'id'
}
```

---

## 🚨 PROBLEMA 4: RELACIONES EN INDEX.JS - FOREIGN KEYS INCONSISTENTES

### 📍 Ubicación:
- `backend/src/models/index.js`

### ❌ Problemas encontrados:

```javascript
// Línea 44 - Rating usa snake_case
Service.hasMany(Rating, { foreignKey: 'service_id', as: 'ratings' });

// Línea 45 - ServiceImage usa camelCase
Service.hasMany(ServiceImage, { foreignKey: 'serviceId', as: 'images' });

// Línea 85 - Conversation usa snake_case
Conversation.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });

// Línea 90 - Message usa snake_case
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Línea 119 - Contract usa camelCase
Contract.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
```

### 🔥 Impacto:
- **Inconsistencia total** en nomenclatura de foreign keys
- Joins en queries pueden fallar
- Dificulta mantenimiento del código

### ✅ Solución:

**Estandarizar TODO a snake_case (recomendado por PostgreSQL):**
```javascript
// TODOS los foreign keys deben usar snake_case
Service.hasMany(Rating, { foreignKey: 'service_id', as: 'ratings' });
Service.hasMany(ServiceImage, { foreignKey: 'service_id', as: 'images' });
Contract.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
Contract.belongsTo(EscrowAccount, { foreignKey: 'escrow_id', as: 'escrow' });
Contract.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
Contract.belongsTo(Rating, { foreignKey: 'rating_id', as: 'rating' });
```

---

## 🚨 PROBLEMA 5: CONTRACT CONTROLLER - REFERENCIAS INCORRECTAS

### 📍 Ubicación:
- `backend/src/controllers/contractController.js`

### ❌ Problema:

#### Línea 1:
```javascript
const { sequelize, Contract, Service, User, EscrowAccount, Conversation, WalletTx, QZ_TO_FIAT } = require('../models');
```

### 🔥 Impacto:
- `WalletTx` no existe en models/index.js
- Debería ser `Transaction`
- Causará error: `Cannot destructure property 'WalletTx' of 'require(...)' as it is undefined`

### ✅ Solución:

```javascript
const { sequelize, Contract, Service, User, EscrowAccount, Conversation, Transaction } = require('../models');

// Cambiar todas las referencias:
// WalletTx.create(...) → Transaction.create(...)
```

---

## 🚨 PROBLEMA 6: WALLET CONTROLLER - MODELO WALLET NO USADO

### 📍 Ubicación:
- `backend/src/controllers/walletController.js`

### ❌ Problema:

El controller importa modelos que no existen o no se usan correctamente:
```javascript
const { sequelize, QZ_TO_FIAT, User, WalletTx } = require('../models');
```

Pero en el schema base:
- Existe tabla `wallets` (saldo por usuario)
- `WalletTx` no existe (debería ser `Transaction`)
- User tiene campo `qzBalance` (DEPRECADO - ahora debe estar en wallets)

### 🔥 Impacto:
- El sistema guarda saldo en `users.qzBalance` (INCORRECTO)
- Debería guardar en `wallets.balance`
- Inconsistencia con diseño de DB

### ✅ Solución:

```javascript
const { sequelize, User, Wallet, Transaction } = require('../models');

// Cambiar lógica para usar Wallet:
async function summary(req, res) {
  const wallet = await Wallet.findOne({ 
    where: { user_id: req.userId },
    include: [{
      model: Transaction,
      as: 'transactions',
      limit: 50,
      order: [['createdAt', 'DESC']]
    }]
  });
  
  res.json({ 
    success: true, 
    balanceQz: parseFloat(wallet.balance),
    txs: wallet.transactions
  });
}
```

**IMPORTANTE:** Migrar `users.qzBalance` → `wallets.balance`

---

## 🚨 PROBLEMA 7: FRONTEND API.JS - ENDPOINTS INCORRECTOS

### 📍 Ubicación:
- `fronted/public/js/api.js`

### ❌ Problema:

```javascript
// Línea 73 - Wallet & PSE
async getWalletBalance() { 
  return request('/wallet/balance'); 
}
```

Pero en `walletController.js` no existe endpoint `/wallet/balance`, existe `/wallet` que retorna summary.

### 🔥 Impacto:
- Llamadas frontend fallan con 404
- UI no puede mostrar saldo correctamente

### ✅ Solución:

```javascript
// En api.js cambiar:
async getWalletSummary() { 
  return request('/wallet'); 
}

// En frontend cambiar todas las llamadas:
// API.getWalletBalance() → API.getWalletSummary()
```

---

## 🚨 PROBLEMA 8: MESSAGE CONTROLLER - INCOMPATIBILIDAD SERVICE_ID

### 📍 Ubicación:
- `backend/src/controllers/messageController.js`
- Línea 104, 231

### ❌ Problema:

```javascript
body('serviceId').optional().isInt().withMessage('ID de servicio inválido')
```

Pero `services.id` es UUID, no INTEGER.

### ✅ Solución:

```javascript
body('serviceId').optional().isUUID().withMessage('ID de servicio inválido')
```

---

## 📊 TABLA RESUMEN DE INCONSISTENCIAS

| # | Componente | Problema | Severidad | Estado |
|---|-----------|----------|-----------|--------|
| 1 | Contract.js | serviceId INTEGER → debe ser UUID | 🔴 CRÍTICO | Pendiente |
| 2 | Contract.js | escrowId INTEGER → debe ser UUID | 🔴 CRÍTICO | Pendiente |
| 3 | Contract.js | conversationId INTEGER → debe ser UUID | 🔴 CRÍTICO | Pendiente |
| 4 | Contract.js | ratingId INTEGER → debe ser UUID | 🔴 CRÍTICO | Pendiente |
| 5 | Transaction.js | userId INTEGER → debe ser UUID | 🔴 CRÍTICO | Pendiente |
| 6 | Transaction.js | Referencia a 'Users' → debe ser 'users' | 🟡 ALTO | Pendiente |
| 7 | Message.js | Referencia a 'conversations' → debe ser '"Conversations"' | 🟡 ALTO | Pendiente |
| 8 | index.js | Foreign keys mixtos (camelCase/snake_case) | 🟡 ALTO | Pendiente |
| 9 | contractController.js | WalletTx no existe → debe ser Transaction | 🔴 CRÍTICO | Pendiente |
| 10 | walletController.js | Usa users.qzBalance → debe usar wallets.balance | 🟡 ALTO | Pendiente |
| 11 | api.js | getWalletBalance endpoint incorrecto | 🟢 MEDIO | Pendiente |
| 12 | messageController.js | serviceId validado como Int → debe ser UUID | 🟢 MEDIO | Pendiente |

---

## 🛠️ PLAN DE CORRECCIÓN PRIORIZADO

### Fase 1: CRÍTICO (Bloquea funcionalidad)

**1.1 Corregir Contract.js**
```javascript
// backend/src/models/Contract.js
serviceId: { type: DataTypes.UUID, ... }
escrowId: { type: DataTypes.UUID, ... }
conversationId: { type: DataTypes.UUID, ... }
ratingId: { type: DataTypes.UUID, ... }
```

**1.2 Corregir Transaction.js**
```javascript
// backend/src/models/Transaction.js
userId: { type: DataTypes.UUID, references: { model: 'users', key: 'id' } }
```

**1.3 Corregir contractController.js**
```javascript
// Cambiar WalletTx → Transaction
const { ..., Transaction } = require('../models');
await Transaction.create({ ... });
```

### Fase 2: ALTO (Causa errores intermitentes)

**2.1 Estandarizar nomenclatura en index.js**
```javascript
// Cambiar TODOS los foreignKey a snake_case
Contract.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });
Contract.belongsTo(EscrowAccount, { foreignKey: 'escrow_id', as: 'escrow' });
// ... etc
```

**2.2 Decidir estrategia para Conversations/Messages**
- Opción A: Renombrar tablas a snake_case (recomendado)
- Opción B: Actualizar modelos para usar '"Conversations"' con comillas

**2.3 Migrar qzBalance a wallets**
- Crear migración para mover datos
- Actualizar User model (remover qzBalance)
- Actualizar walletController para usar Wallet model

### Fase 3: MEDIO (Mejoras de calidad)

**3.1 Actualizar api.js frontend**
```javascript
async getWalletSummary() { return request('/wallet'); }
```

**3.2 Corregir validadores**
```javascript
body('serviceId').optional().isUUID()
```

---

## 🧪 TESTS NECESARIOS POST-CORRECCIÓN

### Backend Tests:
```javascript
// tests/contract.test.js
describe('Contract Creation', () => {
  test('Should create contract with UUID serviceId', async () => {
    const contract = await Contract.create({
      serviceId: 'uuid-here',  // No debe fallar
      buyerId: 'uuid',
      sellerId: 'uuid',
      // ...
    });
    expect(contract.serviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
  });
});

// tests/transaction.test.js
describe('PSE Transactions', () => {
  test('Should create transaction with UUID userId', async () => {
    const tx = await Transaction.create({
      userId: 'uuid-here',
      amountCOP: 50000,
      // ...
    });
    expect(tx.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
  });
});
```

### Frontend Integration Tests:
```javascript
// tests/contracts.integration.js
describe('Contract Flow', () => {
  test('Should create contract from service', async () => {
    const service = await API.getService(serviceId);
    const contract = await API.createContract({
      serviceId: service.id,  // UUID
      requirements: 'Test requirements'
    });
    expect(contract.success).toBe(true);
  });
});
```

---

## 📝 RECOMENDACIONES ADICIONALES

### 1. Estandarización de Nombres
- **Tablas:** Siempre snake_case sin comillas (`users`, `services`, `contracts`)
- **Columnas:** Siempre snake_case (`user_id`, `service_id`, `created_at`)
- **Modelos:** PascalCase (`User`, `Service`, `Contract`)
- **Foreign Keys:** snake_case en Sequelize (`foreignKey: 'user_id'`)

### 2. Tipos de Datos
- **IDs principales:** UUID (users.id, services.id)
- **IDs secundarios:** SERIAL para tablas sin UUID (messages.id)
- **Foreign Keys:** Siempre coincidir tipo con tabla referenciada

### 3. Migraciones
- Crear migración de corrección:
  - `005_fix_data_types_consistency.sql`
  - Incluir ALTER TABLE para cambios
  - Incluir backfill de datos si necesario

### 4. Documentación
- Actualizar `script base de datos.md` con decisiones finales
- Crear guía de convenciones en `CODING-STANDARDS.md`
- Documentar relaciones en diagrama ER actualizado

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de desplegar a producción:

- [ ] Todos los modelos usan tipos de datos correctos
- [ ] Todas las foreign keys coinciden con tablas referenciadas
- [ ] index.js tiene nomenclatura consistente
- [ ] Controladores no referencian modelos inexistentes
- [ ] Frontend usa endpoints correctos
- [ ] Validadores usan tipos correctos (UUID vs Int)
- [ ] Tests de integración pasan
- [ ] Migraciones aplicadas en Supabase
- [ ] Datos existentes migrados correctamente
- [ ] Rollback plan documentado

---

**FIN DEL DIAGNÓSTICO**

_Documento generado por análisis exhaustivo de código_
_Siguiente paso: Aplicar correcciones en orden de prioridad_
