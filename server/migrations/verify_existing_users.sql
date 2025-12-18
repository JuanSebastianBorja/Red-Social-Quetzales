-- =========================================
-- Script para marcar usuarios existentes 
-- como verificados (sin afectar a los nuevos)
-- =========================================
-- 
-- EJECUTA ESTE SCRIPT UNA SOLA VEZ antes de 
-- poner en producción la verificación de email
--
-- Esto asegura que los usuarios que se registraron
-- ANTES de implementar la verificación no se vean
-- afectados y puedan seguir iniciando sesión
-- =========================================

-- Ver usuarios actuales no verificados
SELECT 
    id, 
    email, 
    full_name, 
    is_verified, 
    created_at
FROM users 
WHERE is_verified = false
ORDER BY created_at;

-- Marcar todos los usuarios existentes como verificados
-- (Solo los que ya existen ahora, antes de implementar)
UPDATE users 
SET is_verified = true 
WHERE is_verified = false;

-- Verificar el resultado
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN is_verified THEN 1 END) as verificados,
    COUNT(CASE WHEN NOT is_verified THEN 1 END) as no_verificados
FROM users;

-- Mostrar usuarios actualizados
SELECT 
    id, 
    email, 
    full_name, 
    is_verified, 
    created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;
