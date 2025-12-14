// src/modules/disputes/routes.ts
import { Router } from 'express';
import { pool } from '../../lib/db';
import { authenticate } from '../../middleware/auth';

export const disputesRouter = Router();

// GET /disputes → lista mis disputas (como demandante o demandado)
disputesRouter.get('/', authenticate, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query as { status?: string };

    let sql = `
      SELECT 
        d.id,
        d.escrow_id,
        d.complainant_id,
        d.respondent_id,
        u1.full_name AS complainant_name,
        u2.full_name AS respondent_name,
        d.reason,
        d.evidence_urls,
        d.status,
        d.resolution,
        d.resolved_at,
        a.full_name AS resolved_by_name,
        d.created_at,
        d.updated_at
      FROM disputes d
      JOIN users u1 ON d.complainant_id = u1.id
      JOIN users u2 ON d.respondent_id = u2.id
      LEFT JOIN admin_users a ON d.resolved_by = a.id
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