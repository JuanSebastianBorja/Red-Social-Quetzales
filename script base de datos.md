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
-- TABLA: CATEGORIES
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    category VARCHAR(50),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    delivery_time VARCHAR(50),
    requirements TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused', 'rejected')),
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
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'transfer_in', 'transfer_out', 'withdrawal', 'payment', 'refund', 'deposit')),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    metadata JSONB DEFAULT '{}',
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
-- TABLA: SERVICE_REQUESTS 
-- ============================================
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    proposed_price DECIMAL(10, 2) CHECK (proposed_price > 0),
    negotiated_price DECIMAL(10, 2) CHECK (negotiated_price > 0),
    counter_offer_details TEXT,
    deadline TIMESTAMP,
    terms_agreed BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled', 'negotiating')),
    rejection_reason TEXT,
    negotiated_at TIMESTAMP,
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
    evidence_urls TEXT[],
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    -- Asegurar que user1_id siempre es el menor ID para evitar duplicados
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
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    action_url TEXT,
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
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================as
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
    file_url TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0
);

-- ============================================
-- TABLA: REPORT_TEMPLATES
-- ============================================
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('user', 'admin')),
    query TEXT NOT NULL,
    parameters JSONB,
    created_by UUID REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES 
-- ============================================

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Índices para wallets
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Índices para services
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_price ON services(price);
CREATE INDEX idx_services_created_at ON services(created_at DESC);

-- Índices para service_images
CREATE INDEX idx_service_images_service_id ON service_images(service_id);

-- Índices para transactions
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);

-- Índices para escrow_accounts
CREATE INDEX idx_escrow_service_id ON escrow_accounts(service_id);
CREATE INDEX idx_escrow_buyer_id ON escrow_accounts(buyer_id);
CREATE INDEX idx_escrow_seller_id ON escrow_accounts(seller_id);
CREATE INDEX idx_escrow_status ON escrow_accounts(status);

-- Índices para disputes
CREATE INDEX idx_disputes_escrow_id ON disputes(escrow_id);
CREATE INDEX idx_disputes_complainant_id ON disputes(complainant_id);
CREATE INDEX idx_disputes_respondent_id ON disputes(respondent_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_at ON disputes(created_at DESC);

-- Índices para service_requests
CREATE INDEX idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX idx_service_requests_buyer_id ON service_requests(buyer_id);
CREATE INDEX idx_service_requests_seller_id ON service_requests(seller_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

-- Índices para service_reports
CREATE INDEX idx_service_reports_service_id ON service_reports(service_id);
CREATE INDEX idx_service_reports_reporter_id ON service_reports(reporter_id);
CREATE INDEX idx_service_reports_status ON service_reports(status);
CREATE INDEX idx_service_reports_created_at ON service_reports(created_at DESC);

-- Índices para conversations
CREATE INDEX idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX idx_conversations_service_id ON conversations(service_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_user1_user2 ON conversations(user1_id, user2_id);

-- Índices para messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Índices para ratings
CREATE INDEX idx_ratings_service_id ON ratings(service_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Índices para user_skills
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);

-- Índices para analytics
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_action ON analytics(action);
CREATE INDEX idx_analytics_created_at ON analytics(created_at DESC);

-- Índices para categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- ============================================
-- FUNCIONES AUTOMÁTICAS (CORREGIDAS)
-- ============================================

-- Función: Crear cartera automáticamente
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance, currency)
    VALUES (NEW.id, 0.00, 'QUETZALES');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Crear preferencias de notificación
CREATE OR REPLACE FUNCTION create_notification_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar negotiated_at cuando hay negociación
CREATE OR REPLACE FUNCTION update_negotiated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.negotiated_price IS DISTINCT FROM OLD.negotiated_price THEN
        NEW.negotiated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar conversación cuando se envía mensaje (CORREGIDA)
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    conversation_record RECORD;
    other_user_id UUID;
BEGIN
    -- Obtener información de la conversación
    SELECT user1_id, user2_id INTO conversation_record 
    FROM conversations WHERE id = NEW.conversation_id;
    
    -- Determinar el otro usuario
    IF conversation_record.user1_id = NEW.sender_id THEN
        other_user_id := conversation_record.user2_id;
    ELSE
        other_user_id := conversation_record.user1_id;
    END IF;
    
    -- Actualizar la conversación
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

-- Función: Marcar mensajes como leídos (FUNCIÓN SEPARADA)
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Marcar todos los mensajes no leídos enviados por el otro usuario como leídos
    UPDATE messages
    SET 
        is_read = TRUE,
        read_at = CURRENT_TIMESTAMP
    WHERE 
        conversation_id = p_conversation_id
        AND sender_id <> p_user_id
        AND is_read = FALSE;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    -- Actualizar contadores de conversación
    UPDATE conversations
    SET 
        unread_count_user1 = CASE 
            WHEN user1_id = p_user_id THEN 0 ELSE unread_count_user1 END,
        unread_count_user2 = CASE 
            WHEN user2_id = p_user_id THEN 0 ELSE unread_count_user2 END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_conversation_id;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener o crear conversación
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user1_id UUID,
    p_user2_id UUID,
    p_service_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_user1_id UUID := LEAST(p_user1_id, p_user2_id);
    v_user2_id UUID := GREATEST(p_user1_id, p_user2_id);
BEGIN
    -- Buscar conversación existente
    SELECT id INTO v_conversation_id
    FROM conversations 
    WHERE user1_id = v_user1_id 
      AND user2_id = v_user2_id 
      AND (service_id = p_service_id OR (service_id IS NULL AND p_service_id IS NULL))
    LIMIT 1;
    
    -- Si no existe, crear nueva
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (user1_id, user2_id, service_id)
        VALUES (v_user1_id, v_user2_id, p_service_id)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIONES NUEVAS PARA MENSAGERÍA
-- ============================================

-- Función: Obtener mensajes y marcarlos como leídos automáticamente
CREATE OR REPLACE FUNCTION get_conversation_messages(
    p_conversation_id UUID,
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
    message_id UUID,
    sender_id UUID,
    sender_name VARCHAR,
    sender_avatar TEXT,
    message TEXT,
    message_type VARCHAR,
    is_read BOOLEAN,
    read_at TIMESTAMP,
    created_at TIMESTAMP
) AS $$
BEGIN
    -- Primero marcar mensajes como leídos
    PERFORM mark_messages_as_read(p_conversation_id, p_user_id);
    
    -- Luego retornar los mensajes
    RETURN QUERY
    SELECT 
        m.id AS message_id,
        m.sender_id,
        u.full_name AS sender_name,
        u.avatar AS sender_avatar,
        m.message,
        m.message_type,
        m.is_read,
        m.read_at,
        m.created_at
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener conversaciones de usuario con información completa
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE(
    conversation_id UUID,
    other_user_id UUID,
    other_user_name VARCHAR,
    other_user_avatar TEXT,
    service_title VARCHAR,
    last_message_preview TEXT,
    last_message_at TIMESTAMP,
    unread_count INTEGER,
    conversation_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS conversation_id,
        CASE 
            WHEN c.user1_id = p_user_id THEN c.user2_id
            ELSE c.user1_id
        END AS other_user_id,
        CASE 
            WHEN c.user1_id = p_user_id THEN u2.full_name
            ELSE u1.full_name
        END AS other_user_name,
        CASE 
            WHEN c.user1_id = p_user_id THEN u2.avatar
            ELSE u1.avatar
        END AS other_user_avatar,
        s.title AS service_title,
        c.last_message_preview,
        c.last_message_at,
        CASE 
            WHEN c.user1_id = p_user_id THEN c.unread_count_user1
            ELSE c.unread_count_user2
        END AS unread_count,
        c.status AS conversation_status
    FROM conversations c
    JOIN users u1 ON c.user1_id = u1.id
    JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN services s ON c.service_id = s.id
    WHERE (c.user1_id = p_user_id OR c.user2_id = p_user_id)
      AND c.status = 'active'
    ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función: Enviar mensaje (maneja automáticamente la conversación)
CREATE OR REPLACE FUNCTION send_message(
    p_sender_id UUID,
    p_receiver_id UUID,
    p_message TEXT,
    p_service_id UUID DEFAULT NULL,
    p_message_type VARCHAR DEFAULT 'text'
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_message_id UUID;
BEGIN
    -- Obtener o crear conversación
    v_conversation_id := get_or_create_conversation(p_sender_id, p_receiver_id, p_service_id);
    
    -- Insertar mensaje
    INSERT INTO messages (conversation_id, sender_id, message, message_type)
    VALUES (v_conversation_id, p_sender_id, p_message, p_message_type)
    RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS AUTOMÁTICOS 
-- ============================================

-- Triggers para actualizar updated_at
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

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers automáticos
CREATE TRIGGER trigger_create_wallet
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_user();

CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_notification_preferences_for_user();

CREATE TRIGGER trigger_update_negotiated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION update_negotiated_at();

CREATE TRIGGER trigger_update_conversation
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- VISTAS 
-- ============================================

-- Vista: Estadísticas de servicios por usuario
CREATE OR REPLACE VIEW user_service_stats AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.email,
    u.user_type,
    COUNT(s.id) AS total_services,
    SUM(s.views_count) AS total_views,
    AVG(r.rating) AS average_rating,
    COUNT(DISTINCT r.id) AS total_ratings,
    COALESCE(SUM(CASE WHEN ea.status = 'released' THEN ea.amount ELSE 0 END), 0) AS total_earnings
FROM users u
LEFT JOIN services s ON u.id = s.user_id
LEFT JOIN ratings r ON s.id = r.service_id
LEFT JOIN escrow_accounts ea ON s.id = ea.service_id AND ea.seller_id = u.id
GROUP BY u.id, u.full_name, u.email, u.user_type;

-- Vista: Transacciones recientes por usuario
CREATE OR REPLACE VIEW recent_user_transactions AS
SELECT 
    t.id,
    t.wallet_id,
    w.user_id,
    u.full_name AS user_name,
    t.type,
    t.amount,
    t.description,
    t.status,
    t.created_at,
    t.metadata
FROM transactions t
JOIN wallets w ON t.wallet_id = w.id
JOIN users u ON w.user_id = u.id
ORDER BY t.created_at DESC;

-- Vista: Conversaciones por usuario
CREATE OR REPLACE VIEW user_conversations AS
SELECT 
    c.id AS conversation_id,
    c.user1_id,
    c.user2_id,
    u1.full_name AS user1_name,
    u2.full_name AS user2_name,
    u1.avatar AS user1_avatar,
    u2.avatar AS user2_avatar,
    s.title AS service_title,
    c.last_message_at,
    c.last_message_preview,
    c.unread_count_user1,
    c.unread_count_user2,
    c.status AS conversation_status,
    c.created_at AS conversation_created
FROM conversations c
JOIN users u1 ON c.user1_id = u1.id
JOIN users u2 ON c.user2_id = u2.id
LEFT JOIN services s ON c.service_id = s.id;

-- Vista: Métricas de la plataforma
CREATE OR REPLACE VIEW platform_metrics AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE is_active = true) AS active_users,
    (SELECT COUNT(*) FROM services WHERE status = 'active') AS active_services,
    (SELECT COUNT(*) FROM transactions WHERE status = 'completed') AS completed_transactions,
    (SELECT SUM(amount) FROM transactions WHERE status = 'completed' AND type IN ('purchase', 'deposit')) AS total_volume,
    (SELECT COUNT(*) FROM disputes WHERE status = 'open') AS open_disputes,
    (SELECT COUNT(*) FROM service_reports WHERE status = 'pending') AS pending_reports,
    (SELECT AVG(rating) FROM ratings) AS platform_rating,
    (SELECT COUNT(*) FROM service_requests WHERE status = 'completed') AS completed_requests,
    (SELECT COUNT(*) FROM conversations) AS total_conversations,
    CURRENT_TIMESTAMP AS calculated_at;

-- Vista: Resumen de disputas
CREATE OR REPLACE VIEW dispute_overview AS
SELECT 
    d.id,
    d.status,
    u1.full_name AS complainant,
    u2.full_name AS respondent,
    e.amount,
    s.title AS service_title,
    d.created_at,
    d.resolved_at,
    au.full_name AS resolved_by_admin
FROM disputes d
JOIN users u1 ON d.complainant_id = u1.id
JOIN users u2 ON d.respondent_id = u2.id
JOIN escrow_accounts e ON d.escrow_id = e.id
JOIN services s ON e.service_id = s.id
LEFT JOIN admin_users au ON d.resolved_by = au.id;

-- ============================================
-- DATOS INICIALES (SEED)
-- ============================================

-- Insertar roles administrativos
INSERT INTO admin_roles (role_name, description, permissions) VALUES
('superadmin', 'Acceso total al sistema', '{"all": true, "users": true, "services": true, "transactions": true, "disputes": true, "reports": true, "analytics": true}'::jsonb),
('moderator', 'Moderación de contenido y disputas', '{"users": true, "services": true, "disputes": true, "reports": true}'::jsonb),
('analyst', 'Acceso a reportes y analytics', '{"analytics": true, "reports": true}'::jsonb);

-- Insertar categorías de ejemplo
INSERT INTO categories (name, description, sort_order) VALUES
('Tecnología', 'Servicios relacionados con tecnología y desarrollo', 1),
('Diseño', 'Servicios de diseño gráfico y UX/UI', 2),
('Marketing', 'Servicios de marketing digital y redes sociales', 3),
('Educación', 'Servicios educativos y tutorías', 4);

INSERT INTO categories (name, description, parent_id, sort_order) VALUES
('Desarrollo Web', 'Desarrollo de sitios y aplicaciones web', (SELECT id FROM categories WHERE name = 'Tecnología'), 1),
('Desarrollo Móvil', 'Desarrollo de aplicaciones móviles', (SELECT id FROM categories WHERE name = 'Tecnología'), 2),
('Diseño Gráfico', 'Diseño de logos, branding y material gráfico', (SELECT id FROM categories WHERE name = 'Diseño'), 1),
('UX/UI Design', 'Diseño de experiencia e interfaz de usuario', (SELECT id FROM categories WHERE name = 'Diseño'), 2);

-- Usuario de prueba 1
INSERT INTO users (email, password, full_name, phone, city, user_type, bio)
VALUES (
    'demo@quetzal.com',
    crypt('Demo123', gen_salt('bf')),
    'Usuario Demo',
    '+57 300 123 4567',
    'bogota',
    'both',
    'Usuario de demostración de la plataforma Quetzal'
);

-- Usuario de prueba 2
INSERT INTO users (email, password, full_name, phone, city, user_type, bio)
VALUES (
    'proveedor@quetzal.com',
    crypt('Demo123', gen_salt('bf')),
    'Proveedor Demo',
    '+57 310 234 5678',
    'medellin',
    'provider',
    'Proveedor profesional de servicios de desarrollo'
);

-- Servicios de prueba con categorías normalizadas
INSERT INTO services (user_id, title, description, category_id, price, delivery_time, status)
SELECT 
    id,
    'Desarrollo de Sitio Web Profesional',
    'Creo sitios web profesionales y modernos con las últimas tecnologías',
    (SELECT id FROM categories WHERE name = 'Desarrollo Web'),
    15.5,
    '7 días',
    'active'
FROM users WHERE email = 'proveedor@quetzal.com';

-- Admin user de ejemplo
INSERT INTO admin_users (email, password, full_name, role_id)
VALUES (
    'admin@quetzal.com',
    crypt('Admin123', gen_salt('bf')),
    'Administrador Principal',
    (SELECT id FROM admin_roles WHERE role_name = 'superadmin')
);

-- ============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON DATABASE current_database() IS 'Base de datos de la plataforma Quetzal - Sistema de servicios con pagos virtuales';

COMMENT ON TABLE users IS 'Usuarios de la plataforma (proveedores, consumidores o ambos)';
COMMENT ON TABLE admin_users IS 'Usuarios administrativos del sistema';
COMMENT ON TABLE admin_roles IS 'Roles y permisos para administradores';
COMMENT ON TABLE categories IS 'Categorías y subcategorías de servicios organizadas jerárquicamente';
COMMENT ON TABLE services IS 'Servicios publicados por los usuarios proveedores';
COMMENT ON TABLE escrow_accounts IS 'Cuentas de garantía para transacciones seguras';
COMMENT ON TABLE disputes IS 'Sistema de disputas entre usuarios por transacciones';
COMMENT ON TABLE service_reports IS 'Reportes de usuarios sobre servicios inapropiados';
COMMENT ON TABLE conversations IS 'Conversaciones entre usuarios para mensajería';
COMMENT ON TABLE messages IS 'Mensajes individuales dentro de las conversaciones';
COMMENT ON TABLE analytics IS 'Registro de analytics y comportamiento de usuarios';
COMMENT ON TABLE user_reports IS 'Reportes generados para usuarios (fiscales, transacciones)';

COMMENT ON FUNCTION get_conversation_messages IS 'Obtiene mensajes de conversación y los marca automáticamente como leídos';
COMMENT ON FUNCTION get_user_conversations IS 'Obtiene todas las conversaciones de un usuario con información completa';
COMMENT ON FUNCTION send_message IS 'Envía un mensaje creando automáticamente la conversación si no existe';

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ver todas las tablas creadas
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Estadísticas completas
SELECT 
    'Usuarios' AS tabla, COUNT(*) AS registros FROM users
UNION ALL
SELECT 'Servicios', COUNT(*) FROM services
UNION ALL
SELECT 'Carteras', COUNT(*) FROM wallets
UNION ALL
SELECT 'Transacciones', COUNT(*) FROM transactions
UNION ALL
SELECT 'Calificaciones', COUNT(*) FROM ratings
UNION ALL
SELECT 'Categorías', COUNT(*) FROM categories
UNION ALL
SELECT 'Administradores', COUNT(*) FROM admin_users
UNION ALL
SELECT 'Disputas', COUNT(*) FROM disputes
UNION ALL
SELECT 'Reportes', COUNT(*) FROM service_reports
UNION ALL
SELECT 'Conversaciones', COUNT(*) FROM conversations
UNION ALL
SELECT 'Mensajes', COUNT(*) FROM messages;

-- Mostrar métricas iniciales
SELECT * FROM platform_metrics;