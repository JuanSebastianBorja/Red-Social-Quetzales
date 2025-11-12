-- ============================================
-- MIGRATION: CREATE CONTRACTS TABLE
-- ============================================
-- Tabla para manejar la contratación de servicios
-- Fecha: 2025-11-11
-- Autor: Quetzal Platform Team

-- Crear ENUM types
DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM (
        'pending',      -- Creado, esperando pago
        'paid',         -- Pagado, escrow activo
        'in_progress',  -- Vendedor trabajando
        'delivered',    -- Vendedor entregó trabajo
        'completed',    -- Comprador confirmó y liberó fondos
        'disputed',     -- En disputa
        'cancelled'     -- Cancelado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla Contracts
CREATE TABLE IF NOT EXISTS "Contracts" (
    id SERIAL PRIMARY KEY,
    "contractNumber" VARCHAR(50) NOT NULL UNIQUE,
    
    -- Relaciones
    "serviceId" UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    "buyerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "escrowId" UUID REFERENCES escrow_accounts(id) ON DELETE SET NULL,
    
    -- Estado
    status contract_status NOT NULL DEFAULT 'pending',
    
    -- Detalles
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    
    -- Precios
    "servicePrice" DECIMAL(10, 2) NOT NULL CHECK ("servicePrice" >= 0),
    "platformFee" DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK ("platformFee" >= 0),
    "totalAmount" DECIMAL(10, 2) NOT NULL CHECK ("totalAmount" >= 0),
    
    -- Tiempos
    "deliveryDays" INTEGER NOT NULL CHECK ("deliveryDays" > 0),
    "startedAt" TIMESTAMP WITH TIME ZONE,
    "deliveredAt" TIMESTAMP WITH TIME ZONE,
    "completedAt" TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    
    -- Archivos
    "deliveryFiles" JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Revisiones
    revisions INTEGER NOT NULL DEFAULT 0,
    "maxRevisions" INTEGER NOT NULL DEFAULT 2,
    
    -- Comunicación
    "conversationId" UUID REFERENCES conversations(id) ON DELETE SET NULL,
    "ratingId" UUID REFERENCES ratings(id) ON DELETE SET NULL,
    
    -- Notas
    "buyerNotes" TEXT,
    "sellerNotes" TEXT,
    "adminNotes" TEXT,
    
    -- Razones
    "cancellationReason" TEXT,
    "disputeReason" TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON "Contracts"("contractNumber");
CREATE INDEX IF NOT EXISTS idx_contracts_service_id ON "Contracts"("serviceId");
CREATE INDEX IF NOT EXISTS idx_contracts_buyer_id ON "Contracts"("buyerId");
CREATE INDEX IF NOT EXISTS idx_contracts_seller_id ON "Contracts"("sellerId");
CREATE INDEX IF NOT EXISTS idx_contracts_status ON "Contracts"(status);
CREATE INDEX IF NOT EXISTS idx_contracts_escrow_id ON "Contracts"("escrowId");
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON "Contracts"("createdAt");
CREATE INDEX IF NOT EXISTS idx_contracts_buyer_status ON "Contracts"("buyerId", status);
CREATE INDEX IF NOT EXISTS idx_contracts_seller_status ON "Contracts"("sellerId", status);

-- Trigger para updatedAt
DROP TRIGGER IF EXISTS update_contracts_updated_at ON "Contracts";
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON "Contracts"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE "Contracts" IS 'Contratos de contratación de servicios';
COMMENT ON COLUMN "Contracts"."contractNumber" IS 'Número único del contrato';
COMMENT ON COLUMN "Contracts".status IS 'Estado: pending, paid, in_progress, delivered, completed, disputed, cancelled';
COMMENT ON COLUMN "Contracts"."servicePrice" IS 'Precio del servicio en Quetzales';
COMMENT ON COLUMN "Contracts"."platformFee" IS 'Comisión de la plataforma';
COMMENT ON COLUMN "Contracts"."totalAmount" IS 'Monto total (servicio + comisión)';
COMMENT ON COLUMN "Contracts"."deliveryDays" IS 'Días de entrega acordados';
COMMENT ON COLUMN "Contracts"."deliveryFiles" IS 'Archivos entregados por el vendedor (JSON array)';
COMMENT ON COLUMN "Contracts".attachments IS 'Archivos adjuntos del comprador (JSON array)';
COMMENT ON COLUMN "Contracts".revisions IS 'Número de revisiones solicitadas';
COMMENT ON COLUMN "Contracts"."maxRevisions" IS 'Máximo de revisiones permitidas';

SELECT 'Tabla Contracts creada exitosamente' AS resultado;
