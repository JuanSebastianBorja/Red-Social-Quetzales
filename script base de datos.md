-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- FUNCIONES COMPARTIDAS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLA: USERS 
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    city VARCHAR(100),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('provider', 'consumer', 'both')),
    avatar TEXT,
    bio TEXT,
    website VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ADMIN_ROLES 
-- ============================================
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ADMIN_USERS 
-- ============================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES admin_roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: WALLETS 
-- ============================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(10) DEFAULT 'QUETZALES',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================
-- TABLA: SERVICES 
-- ============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,  -- Simple, como en Estructura 1
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    delivery_time VARCHAR(50),
    requirements TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: SERVICE_IMAGES 
-- ============================================
CREATE TABLE service_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: TRANSACTIONS 
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'transfer_in', 'transfer_out', 'withdrawal', 'payment', 'refund', 'deposit')), -- +deposit
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ESCROW_ACCOUNTS 
-- ============================================
CREATE TABLE escrow_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'released', 'refunded', 'disputed')),
    funded_at TIMESTAMP,
    release_date TIMESTAMP,
    released_at TIMESTAMP,
    dispute_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: SERVICE_REQUESTS 
-- ============================================
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    -- Campos de negociación agregados para HU7, HU8
    proposed_price DECIMAL(10, 2) CHECK (proposed_price > 0),
    negotiated_price DECIMAL(10, 2) CHECK (negotiated_price > 0),
    counter_offer_details TEXT,
    deadline TIMESTAMP,
    terms_agreed BOOLEAN DEFAULT FALSE,
    -- Status extendido para soportar negociación
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled', 'negotiating')),
    rejection_reason TEXT,
    negotiated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: RATINGS 
-- ============================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, user_id)
);

-- ============================================
-- TABLA: CONVERSATIONS 
-- ============================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_preview TEXT,
    unread_count_user1 INTEGER DEFAULT 0,
    unread_count_user2 INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id, service_id)
);

-- ============================================
-- TABLA: MESSAGES 
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'offer', 'file', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: NOTIFICATIONS 
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,  -- Mejora menor de Estructura 3
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: NOTIFICATION_PREFERENCES 
-- ============================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_transactions BOOLEAN DEFAULT TRUE,
    email_messages BOOLEAN DEFAULT TRUE,
    email_services BOOLEAN DEFAULT FALSE,
    email_marketing BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================
-- TABLA: USER_SKILLS 
-- ============================================
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: DISPUTES 
-- ============================================
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
    complainant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    evidence_urls TEXT[],
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
    resolution TEXT,
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: SERVICE_REPORTS 
-- ============================================
CREATE TABLE service_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ANALYTICS 
-- ============================================
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: USER_REPORTS 
-- ============================================
CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('transactions', 'earnings', 'tax', 'activity')),
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0
);

-- ============================================
-- ÍNDICES 
-- ============================================

-- Índices originales de Estructura 1
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_city ON users(city);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_price ON services(price);
CREATE INDEX idx_services_created_at ON services(created_at DESC);

CREATE INDEX idx_service_images_service_id ON service_images(service_id);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);

CREATE INDEX idx_escrow_service_id ON escrow_accounts(service_id);
CREATE INDEX idx_escrow_buyer_id ON escrow_accounts(buyer_id);
CREATE INDEX idx_escrow_seller_id ON escrow_accounts(seller_id);
CREATE INDEX idx_escrow_status ON escrow_accounts(status);

CREATE INDEX idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX idx_service_requests_buyer_id ON service_requests(buyer_id);
CREATE INDEX idx_service_requests_seller_id ON service_requests(seller_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

CREATE INDEX idx_ratings_service_id ON ratings(service_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);

-- Índices esenciales nuevos
CREATE INDEX idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX idx_conversations_service_id ON conversations(service_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX idx_disputes_escrow_id ON disputes(escrow_id);
CREATE INDEX idx_disputes_status ON disputes(status);

CREATE INDEX idx_service_reports_service_id ON service_reports(service_id);
CREATE INDEX idx_service_reports_status ON service_reports(status);

CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_action ON analytics(action);

-- ============================================
-- FUNCIONES ESENCIALES
-- ============================================

-- Funciones automáticas de Estructura 1
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance, currency)
    VALUES (NEW.id, 0.00, 'QUETZALES');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_notification_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función esencial de mensajería
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    conversation_record RECORD;
    other_user_id UUID;
BEGIN
    SELECT user1_id, user2_id INTO conversation_record 
    FROM conversations WHERE id = NEW.conversation_id;
    
    IF conversation_record.user1_id = NEW.sender_id THEN
        other_user_id := conversation_record.user2_id;
    ELSE
        other_user_id := conversation_record.user1_id;
    END IF;
    
    UPDATE conversations 
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = CASE 
            WHEN LENGTH(NEW.message) > 50 THEN SUBSTRING(NEW.message FROM 1 FOR 50) || '...' 
            ELSE NEW.message 
        END,
        unread_count_user1 = CASE 
            WHEN conversation_record.user1_id = other_user_id THEN unread_count_user1 + 1 
            ELSE unread_count_user1 
        END,
        unread_count_user2 = CASE 
            WHEN conversation_record.user2_id = other_user_id THEN unread_count_user2 + 1 
            ELSE unread_count_user2 
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para negociación
CREATE OR REPLACE FUNCTION update_negotiated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.negotiated_price IS DISTINCT FROM OLD.negotiated_price THEN
        NEW.negotiated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Triggers de Estructura 1 (mantenidos)
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_updated_at BEFORE UPDATE ON escrow_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers automáticos de Estructura 1
CREATE TRIGGER trigger_create_wallet
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_user();

CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_notification_preferences_for_user();

-- Triggers esenciales nuevos
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_negotiated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION update_negotiated_at();

CREATE TRIGGER trigger_update_conversation
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- VISTAS (de Estructura 1 - Mantenidas + esenciales)
-- ============================================

-- Vistas originales de Estructura 1
CREATE VIEW user_service_stats AS
SELECT 
    u.id AS user_id,
    u.full_name,
    COUNT(s.id) AS total_services,
    AVG(r.rating) AS average_rating,
    COUNT(DISTINCT r.id) AS total_ratings
FROM users u
LEFT JOIN services s ON u.id = s.user_id
LEFT JOIN ratings r ON s.id = r.service_id
GROUP BY u.id, u.full_name;

CREATE VIEW recent_user_transactions AS
SELECT 
    t.id,
    t.wallet_id,
    w.user_id,
    u.full_name AS user_name,
    t.type,
    t.amount,
    t.description,
    t.status,
    t.created_at
FROM transactions t
JOIN wallets w ON t.wallet_id = w.id
JOIN users u ON w.user_id = u.id
ORDER BY t.created_at DESC;

-- Vista esencial nueva para administración
CREATE VIEW platform_metrics AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = true) AS active_users,
    (SELECT COUNT(*) FROM services WHERE status = 'active') AS active_services,
    (SELECT COUNT(*) FROM transactions WHERE status = 'completed') AS completed_transactions,
    (SELECT SUM(amount) FROM transactions WHERE status = 'completed' AND type IN ('purchase', 'deposit')) AS total_volume,
    (SELECT COUNT(*) FROM disputes WHERE status = 'open') AS open_disputes,
    (SELECT COUNT(*) FROM service_reports WHERE status = 'pending') AS pending_reports,
    (SELECT AVG(rating) FROM ratings) AS platform_rating,
    CURRENT_TIMESTAMP AS calculated_at;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Roles administrativos
INSERT INTO admin_roles (role_name, description, permissions) VALUES
('superadmin', 'Acceso total al sistema', '{"all": true}'::jsonb),
('moderator', 'Moderación de contenido', '{"users": true, "services": true, "disputes": true, "reports": true}'::jsonb);

-- Usuarios de prueba (con encriptación mejorada)
INSERT INTO users (email, password, full_name, phone, city, user_type, bio)
VALUES (
    'demo@quetzal.com',
    crypt('Demo123', gen_salt('bf')),
    'Usuario Demo',
    '+57 300 123 4567',
    'bogota',
    'both',
    'Usuario de demostración'
);

INSERT INTO users (email, password, full_name, phone, city, user_type, bio)
VALUES (
    'proveedor@quetzal.com',
    crypt('Demo123', gen_salt('bf')),
    'Proveedor Demo',
    '+57 310 234 5678',
    'medellin',
    'provider',
    'Proveedor profesional'
);

-- Servicios de prueba (simple como Estructura 1)
INSERT INTO services (user_id, title, description, category, price, delivery_time, status)
SELECT 
    id,
    'Desarrollo de Sitio Web Profesional',
    'Creo sitios web profesionales y modernos con las últimas tecnologías',
    'desarrollo',
    15.5,
    '7 días',
    'active'
FROM users WHERE email = 'proveedor@quetzal.com';

-- Admin user
INSERT INTO admin_users (email, password, full_name, role_id)
VALUES (
    'admin@quetzal.com',
    crypt('Admin123', gen_salt('bf')),
    'Administrador Principal',
    (SELECT id FROM admin_roles WHERE role_name = 'superadmin')
);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ver tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Estadísticas
SELECT 'Usuarios' AS tabla, COUNT(*) AS registros FROM users
UNION ALL SELECT 'Servicios', COUNT(*) FROM services
UNION ALL SELECT 'Administradores', COUNT(*) FROM admin_users
UNION ALL SELECT 'Disputas', COUNT(*) FROM disputes
UNION ALL SELECT 'Conversaciones', COUNT(*) FROM conversations;

-- Mostrar métricas
SELECT * FROM platform_metrics;

COMMENT ON DATABASE quetzal_db IS 'Estructura Quetzal Platform';