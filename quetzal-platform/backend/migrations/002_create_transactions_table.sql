-- ============================================
-- MIGRATION: CREATE TRANSACTIONS TABLE
-- ============================================
-- Tabla para manejar transacciones PSE y otros métodos de pago
-- Fecha: 2025-11-11
-- Autor: Quetzal Platform Team

-- Crear ENUM types si no existen
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('topup', 'withdraw', 'transfer', 'escrow_fund', 'escrow_release', 'escrow_refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('pse', 'credit_card', 'bank_transfer', 'wallet');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'approved', 'rejected', 'failed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE person_type AS ENUM ('natural', 'juridica');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla Transactions
CREATE TABLE IF NOT EXISTS "Transactions" (
    id SERIAL PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tipo y método de transacción
    type transaction_type NOT NULL DEFAULT 'topup',
    "paymentMethod" payment_method NOT NULL DEFAULT 'pse',
    status transaction_status NOT NULL DEFAULT 'pending',
    
    -- Montos
    "amountCOP" DECIMAL(12, 2) NOT NULL CHECK ("amountCOP" >= 0),
    "amountQZ" DECIMAL(12, 2) NOT NULL CHECK ("amountQZ" >= 0),
    "exchangeRate" DECIMAL(10, 2) NOT NULL,
    
    -- Datos PSE
    "pseTransactionId" VARCHAR(255) UNIQUE,
    "bankCode" VARCHAR(50),
    "bankName" VARCHAR(100),
    "personType" person_type,
    "documentType" VARCHAR(10),
    "documentNumber" VARCHAR(50),
    "bankUrl" TEXT,
    "authorizationCode" VARCHAR(100),
    "paymentReference" VARCHAR(100),
    
    -- Información adicional
    description TEXT,
    "errorMessage" TEXT,
    "ipAddress" VARCHAR(50),
    "userAgent" TEXT,
    
    -- Fechas
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "approvedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadata (JSON)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON "Transactions"("userId");
CREATE INDEX IF NOT EXISTS idx_transactions_status ON "Transactions"(status);
CREATE INDEX IF NOT EXISTS idx_transactions_pse_id ON "Transactions"("pseTransactionId");
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON "Transactions"("createdAt");
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON "Transactions"(type, status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON "Transactions"("paymentReference");

-- Crear función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updatedAt
DROP TRIGGER IF EXISTS update_transactions_updated_at ON "Transactions";
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON "Transactions"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de documentación
COMMENT ON TABLE "Transactions" IS 'Transacciones de pago PSE y otros métodos';
COMMENT ON COLUMN "Transactions"."userId" IS 'ID del usuario que realiza la transacción';
COMMENT ON COLUMN "Transactions".type IS 'Tipo de transacción: topup, withdraw, transfer, etc';
COMMENT ON COLUMN "Transactions"."paymentMethod" IS 'Método de pago: PSE, tarjeta, transferencia';
COMMENT ON COLUMN "Transactions".status IS 'Estado: pending, processing, approved, rejected, failed, expired';
COMMENT ON COLUMN "Transactions"."amountCOP" IS 'Monto en pesos colombianos';
COMMENT ON COLUMN "Transactions"."amountQZ" IS 'Monto en Quetzales';
COMMENT ON COLUMN "Transactions"."exchangeRate" IS 'Tasa de conversión COP/QZ al momento de la transacción';
COMMENT ON COLUMN "Transactions"."pseTransactionId" IS 'ID de transacción PSE (único)';
COMMENT ON COLUMN "Transactions"."paymentReference" IS 'Referencia de pago generada por el sistema';

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla Transactions creada exitosamente' AS resultado;
