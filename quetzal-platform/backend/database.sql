-- ============================================
-- CREAR BASE DE DATOS QUETZAL
-- ============================================

-- Conectar a la base de datos
\c quetzal_db;

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- LIMPIAR TABLAS EXISTENTES
-- ============================================

DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS escrow_accounts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS service_images CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Resto del script SQL que enviaste...
-- (El contenido es el mismo, solo cambié el inicio para asegurar una creación limpia)