

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_city ON users(city);

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

-- Índices para wallets
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- ============================================
-- TABLA: SERVICES
-- ============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    delivery_time VARCHAR(50),
    requirements TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para services
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_price ON services(price);
CREATE INDEX idx_services_created_at ON services(created_at DESC);

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

-- Índices para service_images
CREATE INDEX idx_service_images_service_id ON service_images(service_id);

-- ============================================
-- TABLA: TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'transfer_in', 'transfer_out', 'withdrawal', 'payment', 'refund')),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    reference_id UUID,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para transactions
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);

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

-- Índices para escrow_accounts
CREATE INDEX idx_escrow_service_id ON escrow_accounts(service_id);
CREATE INDEX idx_escrow_buyer_id ON escrow_accounts(buyer_id);
CREATE INDEX idx_escrow_seller_id ON escrow_accounts(seller_id);
CREATE INDEX idx_escrow_status ON escrow_accounts(status);

-- ============================================
-- TABLA: SERVICE_REQUESTS
-- ============================================
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para service_requests
CREATE INDEX idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX idx_service_requests_buyer_id ON service_requests(buyer_id);
CREATE INDEX idx_service_requests_seller_id ON service_requests(seller_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);

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

-- Índices para ratings
CREATE INDEX idx_ratings_service_id ON ratings(service_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);

-- ============================================
-- TABLA: MESSAGES
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para messages
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

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

-- Índices para user_skills
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- ============================================
-- FUNCIÓN: Crear cartera automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, balance, currency)
    VALUES (NEW.id, 0.00, 'QUETZALES');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear cartera automática
CREATE TRIGGER trigger_create_wallet
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_user();

-- ============================================
-- FUNCIÓN: Crear preferencias de notificación
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear preferencias automáticas
CREATE TRIGGER trigger_create_notification_preferences
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_notification_preferences_for_user();

-- ============================================
-- VISTAS
-- ============================================

-- Vista: Estadísticas de servicios por usuario
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

-- Vista: Transacciones recientes por usuario
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

-- ============================================
-- DATOS DE PRUEBA (SEED)
-- ============================================

-- Usuario de prueba 1
INSERT INTO users (email, password, full_name, phone, city, user_type, bio)
VALUES (
    'demo@quetzal.com',
    '$2b$10$rQ8K5O.6W8qZ9K7WZ7y8U.Xr8xwO7d0yC5H5K7Z8R9W0Y1X2V3U4', -- password: Demo123
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
    '$2b$10$rQ8K5O.6W8qZ9K7WZ7y8U.Xr8xwO7d0yC5H5K7Z8R9W0Y1X2V3U4', -- password: Demo123
    'Proveedor Demo',
    '+57 310 234 5678',
    'medellin',
    'provider',
    'Proveedor profesional de servicios de desarrollo'
);

-- Servicios de prueba
INSERT INTO services (user_id, title, description, category, price, delivery_time, status)
SELECT 
    id,
    'Desarrollo de Sitio Web Profesional',
    'Creo sitios web profesionales y modernos con las últimas tecnologías',
    'desarrollo',
    15.5,
    '7',
    'active'
FROM users WHERE email = 'proveedor@quetzal.com';

-- ============================================
-- PERMISOS Y ROLES
-- ============================================

-- Crear rol para la aplicación
-- CREATE ROLE quetzal_app WITH LOGIN PASSWORD 'tu_password_seguro';
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quetzal_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quetzal_app;

-- ============================================
-- INFORMACIÓN DE LA BASE DE DATOS
-- ============================================

-- Ver todas las tablas
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Estadísticas
SELECT 
    'Usuarios' AS tabla, COUNT(*) AS registros FROM users
UNION ALL
SELECT 'Servicios', COUNT(*) FROM services
UNION ALL
SELECT 'Carteras', COUNT(*) FROM wallets
UNION ALL
SELECT 'Transacciones', COUNT(*) FROM transactions
UNION ALL
SELECT 'Calificaciones', COUNT(*) FROM ratings;

COMMENT ON DATABASE quetzal_db IS 'Base de datos de la plataforma Quetzal - Sistema de servicios con pagos virtuales';

