import { Router } from 'express';
import { pool } from '../../lib/db';
import { notificationService } from '../notifications/service';
import { authenticate, AuthRequest } from '../../middleware/auth';

export const walletRouter = Router();

// Obtener balance de la cartera del usuario autenticado
walletRouter.get('/balance', authenticate, async (req: AuthRequest, res) => {
  try {
    const r = await pool.query(
      `SELECT balance_qz_halves, balance_cop_cents FROM wallets WHERE user_id=$1`,
      [req.userId]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Wallet not found' });
    const { balance_qz_halves, balance_cop_cents } = r.rows[0];
    res.json({
      balance_qz_halves: Number(balance_qz_halves) || 0,
      balance_qz: ((Number(balance_qz_halves) || 0) / 2),
      balance_cop_cents: Number(balance_cop_cents) || 0,
      balance_cop: ((Number(balance_cop_cents) || 0) / 100)
    });
  } catch (e: any) {
    console.error('Wallet balance error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Listar transacciones recientes del usuario
walletRouter.get('/transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query as any;
    const r = await pool.query(
      `SELECT id, type, payment_method, status, amount_cop_cents, amount_qz_halves, description, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, Number(limit), Number(offset)]
    );
    res.json(r.rows);
  } catch (e: any) {
    console.error('Wallet transactions error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Dev: Top-up QZ balance for testing payments
walletRouter.post('/dev/topup', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount_qz } = req.body as any;
    const userId = req.userId!;
    const halves = Math.round(Number(amount_qz) * 2);
    if (!halves || halves <= 0) {
      return res.status(400).json({ error: 'amount_qz debe ser > 0' });
    }

    // Obtener nombre del remitente (fuera de la transacción)
    const senderRes = await pool.query(
    'SELECT full_name FROM users WHERE id = $1',
    [req.userId!]
    );
const senderName = senderRes.rows[0]?.full_name || 'un usuario';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Ensure accounts: user QZ and platform QZ
      const userAcc = await client.query(
        `INSERT INTO accounts (owner_type, owner_id, currency, name)
         SELECT 'user', $1, 'QZ', 'user_wallet_qz'
         WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE owner_type='user' AND owner_id=$1 AND currency='QZ')
         RETURNING id`,
        [userId]
      );
      const userAccId = userAcc.rowCount ? userAcc.rows[0].id : (await client.query(
        `SELECT id FROM accounts WHERE owner_type='user' AND owner_id=$1 AND currency='QZ'`, [userId]
      )).rows[0].id;

      const platformAcc = await client.query(
        `INSERT INTO accounts (owner_type, owner_id, currency, name)
         SELECT 'platform', NULL, 'QZ', 'platform_qz'
         WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE owner_type='platform' AND owner_id IS NULL AND currency='QZ')
         RETURNING id`
      );
      const platformAccId = platformAcc.rowCount ? platformAcc.rows[0].id : (await client.query(
        `SELECT id FROM accounts WHERE owner_type='platform' AND owner_id IS NULL AND currency='QZ'`
      )).rows[0].id;

      // Ledger transaction: platform -> user credit
      const txIns = await client.query(
        `INSERT INTO ledger_transactions (type, status, description)
         VALUES ('topup','pending','Dev top-up') RETURNING id`
      );
      const ltx = txIns.rows[0].id;
      await client.query(
        `INSERT INTO ledger_entries (transaction_id, account_id, direction, amount_units)
         VALUES ($1,$2,'debit',$4), ($1,$3,'credit',$4)`,
        [ltx, platformAccId, userAccId, halves]
      );
      await client.query(`UPDATE ledger_transactions SET status='completed' WHERE id=$1`, [ltx]);
      await client.query('COMMIT');
      client.release();
      return res.json({ ok: true, credited_qz: halves / 2 });
    } catch (err) {
      await (client.query('ROLLBACK').catch(() => {}));
      client.release();
      console.error('Dev topup error:', err);
      return res.status(500).json({ error: 'Failed to top-up' });
    }
  } catch (e: any) {
    console.error('Wallet topup error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Validar rate limit de transferencias (10 por hora)
async function checkTransferRateLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const r = await pool.query(
    `SELECT COUNT(*) FROM transactions 
     WHERE user_id = $1 
       AND type = 'transfer' 
       AND status = 'completed' 
       AND created_at > $2`,
    [userId, oneHourAgo]
  );
  const count = parseInt(r.rows[0].count);
  return count < 10;
}

// Verificar saldo suficiente
async function hasSufficientBalance(userId: string, amountHalves: number): Promise<boolean> {
  const r = await pool.query(
    'SELECT balance_qz_halves FROM wallets WHERE user_id = $1',
    [userId]
  );
  if (r.rowCount === 0) return false;
  const balance = parseInt(r.rows[0].balance_qz_halves);
  return balance >= amountHalves;
}

// Transferir Quetzales a otro usuario
walletRouter.post('/transfer', authenticate, async (req: AuthRequest, res) => {
  const { recipient_id, amount_qz_halves, description = 'Transferencia de Quetzales' } = req.body;

  // Validaciones básicas
  if (!recipient_id || typeof recipient_id !== 'string') {
    return res.status(400).json({ error: 'ID del destinatario requerido' });
  }
  if (!amount_qz_halves || typeof amount_qz_halves !== 'number' || amount_qz_halves !== Math.floor(amount_qz_halves)) {
    return res.status(400).json({ error: 'Monto debe ser un número entero (halves)' });
  }
  if (amount_qz_halves < 1) {
    return res.status(400).json({ error: 'Monto mínimo: 0.5 QZ (1 half)' });
  }
  if (amount_qz_halves > 200) {
    return res.status(400).json({ error: 'Monto máximo: 100 QZ (200 halves) por transacción' });
  }
  if (recipient_id === req.userId) {
    return res.status(400).json({ error: 'No puedes transferirte a ti mismo' });
  }

  // Verificar que el destinatario exista y esté activo (solo por UUID)
    const recipientRes = await pool.query(
    ` SELECT id FROM users WHERE id = $1 AND is_active = true`,
    [recipient_id]
    );

  // Verificar rate limit
  const withinLimit = await checkTransferRateLimit(req.userId!);
  if (!withinLimit) {
    return res.status(429).json({ error: 'Límite de transferencias alcanzado (máx. 10 por hora)' });
  }

  // Verificar saldo suficiente
  const hasBalance = await hasSufficientBalance(req.userId!, amount_qz_halves); 
  if (!hasBalance) {
    return res.status(400).json({ error: 'Saldo insuficiente' });
  }

  // 👇 Obtener nombre del remitente (fuera de la transacción)
  const senderRes = await pool.query(
    'SELECT full_name FROM users WHERE id = $1',
    [req.userId!]
  );
  const senderName = senderRes.rows[0]?.full_name || 'un usuario';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const senderAccRes = await client.query(
      `SELECT id FROM accounts WHERE owner_type = 'user' AND owner_id = $1 AND currency = 'QZ'`,
      [req.userId!]
    );
    if (senderAccRes.rowCount === 0) {
      throw new Error('Cuenta QZ del remitente no encontrada');
    }
    const senderAccountId = senderAccRes.rows[0].id;

    const recipientAccRes = await client.query(
      `SELECT id FROM accounts WHERE owner_type = 'user' AND owner_id = $1 AND currency = 'QZ'`,
      [recipient_id]
    );
    if (recipientAccRes.rowCount === 0) {
      throw new Error('Cuenta QZ del destinatario no encontrada');
    }
    const recipientAccountId = recipientAccRes.rows[0].id;

    const ledgerTxRes = await client.query(
      `INSERT INTO ledger_transactions (type, status, description, external_ref)
       VALUES ('transfer', 'pending', $1, gen_random_uuid())
       RETURNING id`,
      [description]
    );
    const ledgerTxId = ledgerTxRes.rows[0].id;

    await client.query(
      `INSERT INTO ledger_entries (transaction_id, account_id, direction, amount_units)
       VALUES ($1, $2, 'debit', $4), ($1, $3, 'credit', $4)`,
      [ledgerTxId, senderAccountId, recipientAccountId, amount_qz_halves]
    );

    await client.query(
      `UPDATE ledger_transactions SET status = 'completed' WHERE id = $1`,
      [ledgerTxId]
    );

    await client.query(
      `INSERT INTO transactions (
        user_id, type, payment_method, status, amount_qz_halves, description, reference_id
      ) VALUES ($1, 'transfer', 'wallet', 'completed', $2, $3, $4)`,
      [req.userId, amount_qz_halves, description, ledgerTxId]
    );

    await client.query(
      `INSERT INTO transactions (
        user_id, type, payment_method, status, amount_qz_halves, description, reference_id
      ) VALUES ($1, 'transfer_in', 'wallet', 'completed', $2, 'Recibiste Quetzales', $3)`,
      [recipient_id, amount_qz_halves, ledgerTxId]
    );

    await client.query('COMMIT');

    // Notificación con nombre del remitente
    await notificationService.createNotification({
      userId: recipient_id,
      type: 'transaction_completed',
      title: '¡Recibiste Quetzales!',
      message: `Recibiste ${amount_qz_halves / 2} QZ de ${senderName}`,
      referenceId: ledgerTxId,
      actionUrl: '/vistas/cartera.html'
    });

    client.release();

    res.status(201).json({
      message: 'Transferencia completada',
      amount_qz: amount_qz_halves / 2,
      recipient_id
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('Transfer error:', err);
    res.status(500).json({ error: 'Error al procesar la transferencia' });
  }
});

// Generar reporte fiscal de transacciones
walletRouter.get('/reports', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Validar fechas
    const start = startDate ? new Date(startDate as string) : oneYearAgo;
    const end = endDate ? new Date(endDate as string) : today;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Fechas inválidas' });
    }
    if (start > end) {
      return res.status(400).json({ error: 'La fecha de inicio no puede ser mayor que la de fin' });
    }

    // Construir consulta
    const conditions: string[] = [
    'user_id = $1',
    'status = \'completed\'',
    'created_at >= ($2 AT TIME ZONE \'UTC\' AT TIME ZONE \'America/Bogota\')',
    'created_at < (($3 AT TIME ZONE \'UTC\' AT TIME ZONE \'America/Bogota\') + INTERVAL \'1 day\')'
    ];
    const values: any[] = [req.userId, start, end];
    let paramIndex = 4;

    if (type && typeof type === 'string') {
      conditions.push(`type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    const query = `
      SELECT 
        id,
        type,
        amount_qz_halves,
        description,
        created_at,
        CASE
          WHEN type IN ('transfer_in', 'refund', 'payment_received') THEN 'income'
          ELSE 'expense'
        END AS category
      FROM transactions
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, values);

    // Calcular totales
    let totalIncome = 0;
    let totalExpense = 0;

    const report = result.rows.map(row => {
      const amountQZ = (row.amount_qz_halves || 0) / 2;
      if (row.category === 'income') {
        totalIncome += amountQZ;
      } else {
        totalExpense += amountQZ;
      }
      return {
        id: row.id,
        type: row.type,
        amount_qz: amountQZ,
        description: row.description,
        date: row.created_at,
        category: row.category
      };
    });

    res.json({
      report,
      summary: {
        total_income_qz: Number(totalIncome.toFixed(2)),
        total_expense_qz: Number(totalExpense.toFixed(2)),
        net_balance_qz: Number((totalIncome - totalExpense).toFixed(2)),
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        count: report.length
      },
      generated_at: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});
