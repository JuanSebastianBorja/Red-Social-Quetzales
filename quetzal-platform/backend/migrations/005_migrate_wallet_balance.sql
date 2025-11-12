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
       COALESCE(
         CASE 
           WHEN EXISTS (
             SELECT 1 FROM information_schema.columns 
             WHERE table_name='users' AND column_name='qz_balance'
           ) THEN u.qz_balance 
           ELSE 0 
         END, 0
       ) AS balance,
       'QUETZALES',
       NOW(),
       NOW()
FROM users u
LEFT JOIN wallets w ON w.user_id = u.id
WHERE w.user_id IS NULL;

-- 2. Si existía columna qz_balance, opcionalmente dejarla en cero (para histórica) 
DO $$
DECLARE col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='qz_balance'
  ) INTO col_exists;
  IF col_exists THEN
    UPDATE users SET qz_balance = 0;
  END IF;
END $$;

-- 3. (Opcional) Eliminar columna qz_balance si ya migrada
-- Comentado por seguridad; descomentar cuando se confirme que no se usa en código.
-- ALTER TABLE users DROP COLUMN IF EXISTS qz_balance;

COMMIT;

SELECT 'Migration 005 (wallet balance) applied successfully' AS result;
