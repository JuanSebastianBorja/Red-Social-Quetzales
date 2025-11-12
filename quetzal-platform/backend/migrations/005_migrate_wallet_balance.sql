-- ============================================
-- MIGRATION 005: Ensure wallets exist & migrate legacy balances
-- Fecha: 2025-11-11
-- Propósito: Crear wallets faltantes para usuarios y migrar saldo legado
-- Nota: La columna users.qz_balance ya no está en el modelo actual; este script
--       intenta migrarla solo si existiera de versiones anteriores.
-- ============================================

BEGIN;

-- 1. Crear wallets para usuarios que no tengan
INSERT INTO wallets (user_id, balance, currency, created_at, updated_at)
SELECT u.id,
       0 AS balance,
       'QUETZALES',
       NOW(),
       NOW()
FROM users u
LEFT JOIN wallets w ON w.user_id = u.id
WHERE w.user_id IS NULL;

-- 2. Si existía columna qz_balance, opcionalmente dejarla en cero (para histórica) 
-- (Legacy column qz_balance no existe en entorno actual; bloque omitido)

-- 3. (Opcional) Eliminar columna qz_balance si ya migrada
-- Comentado por seguridad; descomentar cuando se confirme que no se usa en código.
-- ALTER TABLE users DROP COLUMN IF EXISTS qz_balance;

COMMIT;

SELECT 'Migration 005 (wallet balance) applied successfully' AS result;
