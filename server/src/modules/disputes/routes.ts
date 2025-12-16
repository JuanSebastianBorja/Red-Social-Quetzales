// src/modules/disputes/routes.ts
import { Router } from 'express';
import { pool } from '../../lib/db';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { notificationService } from '../notifications/service';


export const disputesRouter = Router();

// GET /disputes → lista mis disputas (como demandante o demandado)
disputesRouter.get('/', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query as { status?: string };

    let sql = `
      SELECT 
        d.*,
        buyer.full_name AS complainant_name,
        seller.full_name AS respondent_name,
        c.title AS contract_title
      FROM disputes d
      JOIN escrow_accounts e ON d.escrow_id = e.id
      JOIN contracts c ON e.id = c.escrow_id
      JOIN users buyer ON d.complainant_id = buyer.id
      JOIN users seller ON d.respondent_id = seller.id
      WHERE d.complainant_id = $1 OR d.respondent_id = $1
    `;
    const params: any[] = [userId];
    let index = 2;

    if (status && ['open', 'in_review', 'resolved', 'dismissed'].includes(status)) {
      sql += ` AND d.status = $${index}`;
      params.push(status);
      index++;
    }

    sql += ` ORDER BY d.created_at DESC`;

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error al listar disputas:', err);
    res.status(500).json({ error: 'Error al cargar disputas' });
  }
});


// GET /disputes/:id → ver detalle de una disputa
disputesRouter.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await pool.query(
      `
      SELECT 
        d.*,
        u1.full_name AS complainant_name,
        u2.full_name AS respondent_name,
        s.title AS service_title,
        e.amount_qz_halves,
        e.status AS escrow_status
      FROM disputes d
      JOIN users u1 ON d.complainant_id = u1.id
      JOIN users u2 ON d.respondent_id = u2.id
      JOIN escrow_accounts e ON d.escrow_id = e.id
      JOIN services s ON e.service_id = s.id
      WHERE d.id = $1 AND (d.complainant_id = $2 OR d.respondent_id = $2)
      `,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Disputa no encontrada o no autorizada' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error al obtener disputa:', err);
    res.status(500).json({ error: 'Error al cargar la disputa' });
  }
});

export default disputesRouter;

// POST /disputes/:id/resolve → solo admin
disputesRouter.post('/:id/resolve', authenticate, async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { action, resolution } = req.body;
    const adminId = req.userId!;

    // Verificar que el usuario sea admin
    const adminCheck = await client.query(
      'SELECT 1 FROM admin_users WHERE id = $1 AND is_active = true',
      [adminId]
    );
    if (adminCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }

    // Validar acción
    const validActions = ['release_to_seller', 'refund_to_buyer', 'dismiss_no_action'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({ error: 'Acción inválida.' });
    }

    // Obtener disputa y datos relacionados
    const disputeRes = await client.query(
      `SELECT d.*, e.id AS escrow_id, e.amount_qz_halves, e.buyer_id, e.seller_id, e.service_id,
              c.id AS contract_id, c.title AS contract_title
       FROM disputes d
       JOIN escrow_accounts e ON d.escrow_id = e.id
       JOIN contracts c ON e.id = c.escrow_id
       WHERE d.id = $1 AND d.status = 'open'`,
      [id]
    );

    if (disputeRes.rowCount === 0) {
      return res.status(404).json({ error: 'Disputa no encontrada o ya resuelta.' });
    }

    const { escrow_id, amount_qz_halves, buyer_id, seller_id, service_id, contract_id, contract_title } = disputeRes.rows[0];

    await client.query('BEGIN');

    // Caso 1: Liberar al vendedor 
    if (action === 'release_to_seller') {
      // Reutilizar lógica de "completar contrato"
      const sellerAcc = await client.query(
        `INSERT INTO accounts (owner_type, owner_id, currency, name)
         SELECT 'user', $1, 'QZ', 'user_wallet_qz'
         WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE owner_type='user' AND owner_id=$1 AND currency='QZ')
         RETURNING id`,
        [seller_id]
      );
      const sellerAccId = sellerAcc.rowCount ? sellerAcc.rows[0].id : (await client.query(
        `SELECT id FROM accounts WHERE owner_type='user' AND owner_id=$1 AND currency='QZ'`, [seller_id]
      )).rows[0].id;

      const escrowAccId = (await client.query(
        `SELECT id FROM accounts WHERE owner_type='escrow' AND owner_id=$1 AND currency='QZ'`, [escrow_id]
      )).rows[0]?.id;

      const platformAccId = (await client.query(
        `SELECT id FROM accounts WHERE owner_type='platform' AND owner_id IS NULL AND currency='QZ'`
      )).rows[0]?.id;

      if (!escrowAccId) throw new Error('Cuenta de escrow no encontrada');

      const tx = await client.query(
        `INSERT INTO ledger_transactions (type, status, description, external_ref)
         VALUES ('payment', 'pending', 'Resolución de disputa: pago liberado', $1) RETURNING id`,
        [contract_id]
      );
      const ltx = tx.rows[0].id;

      // Suponiendo fee = 0 en disputas (o podrías calcularlo)
      const fee = 0;
      if (fee > 0) {
        await client.query(
          `INSERT INTO ledger_entries (transaction_id, account_id, direction, amount_units)
           VALUES ($1,$2,'debit',$5), ($1,$3,'credit',$6), ($1,$4,'credit',$7)`,
          [ltx, escrowAccId, sellerAccId, platformAccId, amount_qz_halves, amount_qz_halves - fee, fee]
        );
      } else {
        await client.query(
          `INSERT INTO ledger_entries (transaction_id, account_id, direction, amount_units)
           VALUES ($1,$2,'debit',$4), ($1,$3,'credit',$4)`,
          [ltx, escrowAccId, sellerAccId, amount_qz_halves]
        );
      }
      await client.query(`UPDATE ledger_transactions SET status='completed' WHERE id=$1`, [ltx]);

      await client.query(`UPDATE escrow_accounts SET status='released', released_at=NOW(), updated_at=NOW() WHERE id=$1`, [escrow_id]);
      await client.query(`UPDATE contracts SET status='completed', completed_at=NOW(), updated_at=NOW() WHERE id=$1`, [contract_id]);

      // Notificación al vendedor
      await notificationService.createNotification({
        userId: seller_id,
        type: 'dispute_resolved',
        title: 'Disputa resuelta a tu favor',
        message: `La disputa del contrato "${contract_title}" fue resuelta y el pago fue liberado.`,
        referenceId: id,
        actionUrl: '/vistas/cartera.html'
      });
    }

    // Caso 2: Reembolsar al cliente
    else if (action === 'refund_to_buyer') {
      const buyerAcc = await client.query(
        `INSERT INTO accounts (owner_type, owner_id, currency, name)
         SELECT 'user', $1, 'QZ', 'user_wallet_qz'
         WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE owner_type='user' AND owner_id=$1 AND currency='QZ')
         RETURNING id`,
        [buyer_id]
      );
      const buyerAccId = buyerAcc.rowCount ? buyerAcc.rows[0].id : (await client.query(
        `SELECT id FROM accounts WHERE owner_type='user' AND owner_id=$1 AND currency='QZ'`, [buyer_id]
      )).rows[0].id;

      const escrowAccId = (await client.query(
        `SELECT id FROM accounts WHERE owner_type='escrow' AND owner_id=$1 AND currency='QZ'`, [escrow_id]
      )).rows[0]?.id;

      if (!escrowAccId) throw new Error('Cuenta de escrow no encontrada');

      const tx = await client.query(
        `INSERT INTO ledger_transactions (type, status, description, external_ref)
         VALUES ('refund', 'pending', 'Reembolso por disputa resuelta', $1) RETURNING id`,
        [contract_id]
      );
      const ltx = tx.rows[0].id;

      await client.query(
        `INSERT INTO ledger_entries (transaction_id, account_id, direction, amount_units)
         VALUES ($1,$2,'debit',$3), ($1,$4,'credit',$3)`,
        [ltx, escrowAccId, buyerAccId, amount_qz_halves]
      );
      await client.query(`UPDATE ledger_transactions SET status='completed' WHERE id=$1`, [ltx]);

      await client.query(`UPDATE escrow_accounts SET status='refunded', updated_at=NOW() WHERE id=$1`, [escrow_id]);
      await client.query(`UPDATE contracts SET status='cancelled', updated_at=NOW() WHERE id=$1`, [contract_id]);

      // Transacción de reembolso para el cliente
      await client.query(
        `INSERT INTO transactions (user_id, type, payment_method, status, amount_qz_halves, description, reference_id)
         VALUES ($1, 'refund', 'wallet', 'completed', $2, $3, $4)`,
        [buyer_id, amount_qz_halves, `Reembolso por disputa: "${contract_title}"`, contract_id]
      );

      // Notificación al cliente
      await notificationService.createNotification({
        userId: buyer_id,
        type: 'dispute_resolved',
        title: 'Disputa resuelta a tu favor',
        message: `La disputa del contrato "${contract_title}" fue resuelta y tus Quetzales fueron reembolsados.`,
        referenceId: id,
        actionUrl: '/vistas/cartera.html'
      });
    }

    // Caso 3: Archivar sin acción 
    else if (action === 'dismiss_no_action') {
      // Solo cambiamos estado, sin mover dinero
    }

    // Actualizar disputa
    await client.query(
      `UPDATE disputes 
       SET status = 'resolved', 
           resolution = $1, 
           resolved_by = $2, 
           resolved_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $3`,
      [resolution || 'Resuelta por administrador', adminId, id]
    );

    await client.query('COMMIT');

    // Notificación a ambas partes
    const messageMap: Record<string, string> = {
      release_to_seller: `El administrador resolvió la disputa y liberó el pago al vendedor.`,
      refund_to_buyer: `El administrador resolvió la disputa y reembolsó los fondos al cliente.`,
      dismiss_no_action: `El administrador archivó la disputa sin acción adicional.`
    };

    const notifyMessage = messageMap[action] || 'La disputa ha sido resuelta por un administrador.';

    await notificationService.createNotification({
      userId: buyer_id,
      type: 'dispute_resolved',
      title: 'Disputa resuelta',
      message: notifyMessage,
      referenceId: id,
      actionUrl: '/vistas/disputas.html'
    });

    if (buyer_id !== seller_id) {
      await notificationService.createNotification({
        userId: seller_id,
        type: 'dispute_resolved',
        title: 'Disputa resuelta',
        message: notifyMessage,
        referenceId: id,
        actionUrl: '/vistas/disputas.html'
      });
    }

    res.json({ success: true, message: 'Disputa resuelta correctamente.' });

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error al resolver disputa:', err);
    res.status(500).json({ error: 'Error al resolver la disputa', details: err.message });
  } finally {
    client.release();
  }
});