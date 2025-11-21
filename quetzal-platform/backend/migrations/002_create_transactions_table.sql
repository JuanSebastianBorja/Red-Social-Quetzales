-- ============================================
-- MIGRATION: CREATE TRANSACTIONS TABLE
-- ============================================

-- ===============================
-- ENUM TYPES
-- ===============================

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'topup', 'withdraw', 'transfer',
        'escrow_fund', 'escrow_release', 'escrow_refund',
        'purchase', 'payment', 'refund', 'deposit'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'wallet', 'pse', 'credit_card', 'bank_transfer'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM (
        'pending', 'processing', 'approved',
        'completed', 'failed', 'rejected', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE person_type AS ENUM ('natural', 'juridica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ===============================
-- TABLE: TRANSACTIONS
-- ===============================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,

    -- Tipos
    type transaction_type NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'wallet',
    status transaction_status NOT NULL DEFAULT 'pending',

    -- Montos
    amount DECIMAL(12, 2) NOT NULL,
    amount_cop DECIMAL(12, 2),
    amount_qz DECIMAL(12, 2),
    exchange_rate DECIMAL(10, 2),

    description TEXT,
    reference_id UUID,

    -- Datos PSE
    pse_transaction_id VARCHAR(255) UNIQUE,
    bank_code VARCHAR(50),
    bank_name VARCHAR(100),
    person_type person_type,
    document_type VARCHAR(10),
    document_number VARCHAR(50),
    bank_url TEXT,
    authorization_code VARCHAR(100),
    payment_reference VARCHAR(100),

    -- Tracking
    error_message TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Fechas
    expires_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'::jsonb
);


-- ===============================
-- INDEXES
-- ===============================

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);

CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);

-- PSE
CREATE INDEX idx_transactions_pse_transaction_id ON transactions(pse_transaction_id);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX idx_transactions_payment_reference ON transactions(payment_reference);
CREATE INDEX idx_transactions_expires_at ON transactions(expires_at);
CREATE INDEX idx_transactions_approved_at ON transactions(approved_at);


-- ===============================
-- TRIGGER FOR UPDATED_AT
-- ===============================

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ===============================
-- VALIDATION MESSAGE
-- ===============================

SELECT 'Tabla transactions creada correctamente.' AS resultado;
