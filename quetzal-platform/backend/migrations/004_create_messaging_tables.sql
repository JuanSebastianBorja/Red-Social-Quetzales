-- ============================================
-- MIGRATION 004: CONVERSATIONS & MESSAGES (PascalCase + comillas)
-- Sistema de Mensajería alineado con modelos actuales
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla: "Conversations"
CREATE TABLE IF NOT EXISTS "Conversations" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP,
    last_message_preview TEXT,
    unread_count_user1 INTEGER DEFAULT 0,
    unread_count_user2 INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_different_users CHECK (user1_id <> user2_id)
);

CREATE INDEX IF NOT EXISTS idx_Conversations_user1 ON "Conversations"(user1_id);
CREATE INDEX IF NOT EXISTS idx_Conversations_user2 ON "Conversations"(user2_id);
CREATE INDEX IF NOT EXISTS idx_Conversations_service ON "Conversations"(service_id);
CREATE INDEX IF NOT EXISTS idx_Conversations_last_message ON "Conversations"(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_Conversations_status ON "Conversations"(status);
CREATE INDEX IF NOT EXISTS idx_Conversations_users ON "Conversations"(user1_id, user2_id);

-- Tabla: "Messages"
CREATE TABLE IF NOT EXISTS "Messages" (
    id SERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES "Conversations"(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_Messages_conversation ON "Messages"(conversation_id);
CREATE INDEX IF NOT EXISTS idx_Messages_sender ON "Messages"(sender_id);
CREATE INDEX IF NOT EXISTS idx_Messages_created_at ON "Messages"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_Messages_is_read ON "Messages"(is_read);
CREATE INDEX IF NOT EXISTS idx_Messages_is_deleted ON "Messages"(is_deleted);
CREATE INDEX IF NOT EXISTS idx_Messages_unread ON "Messages"(conversation_id, is_read) WHERE is_deleted = FALSE;

-- Función y triggers updated_at
CREATE OR REPLACE FUNCTION update_timestamp_snake()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON "Conversations";
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON "Conversations"
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_snake();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON "Messages";
CREATE TRIGGER trg_messages_updated_at
BEFORE UPDATE ON "Messages"
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_snake();

-- Comentarios
COMMENT ON TABLE "Conversations" IS 'Conversaciones entre usuarios';
COMMENT ON COLUMN "Conversations".user1_id IS 'Primer usuario de la conversación';
COMMENT ON COLUMN "Conversations".user2_id IS 'Segundo usuario de la conversación';
COMMENT ON COLUMN "Conversations".service_id IS 'Servicio relacionado (opcional)';
COMMENT ON COLUMN "Conversations".last_message_at IS 'Timestamp del último mensaje';
COMMENT ON COLUMN "Conversations".last_message_preview IS 'Preview del último mensaje (primeros 100 chars)';
COMMENT ON COLUMN "Conversations".unread_count_user1 IS 'Mensajes no leídos del usuario 1';
COMMENT ON COLUMN "Conversations".unread_count_user2 IS 'Mensajes no leídos del usuario 2';

COMMENT ON TABLE "Messages" IS 'Mensajes de las conversaciones';
COMMENT ON COLUMN "Messages".conversation_id IS 'ID de la conversación';
COMMENT ON COLUMN "Messages".sender_id IS 'Usuario que envió el mensaje';
COMMENT ON COLUMN "Messages".content IS 'Contenido del mensaje (1-5000 caracteres)';
COMMENT ON COLUMN "Messages".message_type IS 'Tipo: text, image, file, system';
COMMENT ON COLUMN "Messages".attachments IS 'Array JSON de archivos adjuntos';
COMMENT ON COLUMN "Messages".is_read IS 'Indica si fue leído';
COMMENT ON COLUMN "Messages".read_at IS 'Timestamp de lectura';
COMMENT ON COLUMN "Messages".is_edited IS 'Indica si fue editado';
COMMENT ON COLUMN "Messages".edited_at IS 'Timestamp de edición';
COMMENT ON COLUMN "Messages".is_deleted IS 'Soft delete';
COMMENT ON COLUMN "Messages".metadata IS 'Datos adicionales en JSON';
