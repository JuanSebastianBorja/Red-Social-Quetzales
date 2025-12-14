import { Router } from 'express';
import { pool } from '../../lib/db';
import { notificationService } from '../notifications/service';
import { authenticateAdmin, requireAdminRole } from '../../middleware/admin';
import jwt from 'jsonwebtoken';

export const adminRouter = Router();

// Admin login
adminRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const r = await pool.query(
      'SELECT au.id, au.password, ar.role_name FROM admin_users au JOIN admin_roles ar ON au.role_id=ar.id WHERE au.email=$1',
      [email]
    );
    if (r.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const admin = r.rows[0];
    // Compare bcrypt/pgcrypto hash via crypt
    const cmp = await pool.query('SELECT crypt($1, $2) = $2 AS ok', [password, admin.password]);
    if (!cmp.rows[0]?.ok) return res.status(401).json({ error: 'Invalid credentials' });
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const token = jwt.sign({ sub: admin.id, role: admin.role_name, scope: 'admin' }, secret, { expiresIn: '8h' });
    res.json({ token, role: admin.role_name });
  } catch (e: any) {
    console.error('Admin login error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// List admin users (superadmin only)
adminRouter.get('/users', authenticateAdmin, requireAdminRole(['superadmin']), async (_req, res) => {
  try {
    const r = await pool.query(
      'SELECT au.id, au.email, au.full_name, au.is_active, ar.role_name, au.last_login, au.created_at FROM admin_users au JOIN admin_roles ar ON au.role_id=ar.id ORDER BY au.created_at DESC'
    );
    res.json(r.rows);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Create admin user (superadmin only)
adminRouter.post('/users', authenticateAdmin, requireAdminRole(['superadmin']), async (req, res) => {
  try {
    const { email, password, full_name, role_name } = req.body;
    if (!email || !password || !full_name || !role_name) return res.status(400).json({ error: 'Missing fields' });
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const role = await pool.query('SELECT id FROM admin_roles WHERE role_name=$1', [role_name]);
    if (role.rowCount === 0) return res.status(400).json({ error: 'Invalid role_name' });
    const r = await pool.query(
      `INSERT INTO admin_users (email, password, full_name, role_id, is_active) 
       VALUES ($1, crypt($2, gen_salt('bf')), $3, $4, true)
       RETURNING id, email, full_name`,
      [email, password, full_name, role.rows[0].id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Moderation: list services (moderator or superadmin)
adminRouter.get('/services', authenticateAdmin, requireAdminRole(['moderator','superadmin']), async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    let sql = `SELECT id, user_id, title, status, category, price_qz_halves, created_at, updated_at FROM services`;
    const params: any[] = [];
    if (status && ['active','inactive','paused',].includes(status)) {
      sql += ` WHERE status=$1`; params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;

    console.log('[ADMIN] Ejecutando consulta:', sql, params);

    const r = await pool.query(sql, params);
    console.log('[ADMIN] Servicios encontrados:', r.rowCount);

    res.json(r.rows);
  } catch (e: any) {
    console.error('[ADMIN] Error al cargar servicios:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Moderation: update service status (moderator or superadmin)
adminRouter.patch('/services/:id/status', authenticateAdmin, requireAdminRole(['moderator','superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    if (!['active','inactive','paused'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const r = await pool.query(
      `UPDATE services SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING id, title, status, updated_at`,
      [id, status]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Service not found' });
    // Optional: log admin action
    if (admin_notes) {
      await pool.query(
        `INSERT INTO analytics (user_id, action, entity_type, entity_id, metadata) VALUES (NULL, 'admin_service_status', 'service', $1, $2)`,
        [id, { status, admin_notes } as any]
      ).catch(() => {});
    }
    res.json(r.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Servicios reportados: listar y moderar (superadmin o moderador)
adminRouter.get('/reports', authenticateAdmin, requireAdminRole(['moderator','superadmin']), async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    let sql = `
      SELECT sr.id,sr.reporter_id,sr.service_id,s.title AS service_title,sr.reason,sr.status,sr.reviewed_by,sr.reviewed_at,sr.admin_notes,sr.created_at FROM service_reports sr LEFT JOIN services s ON sr.service_id = s.id`;
    const params: any[] = [];
    let paramIndex = 1;
   
    if (status && ['pending','reviewed','dismissed','action_taken'].includes(status)) {
      sql += ` WHERE sr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY sr.created_at DESC`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});
adminRouter.patch('/reports/:id', authenticateAdmin, requireAdminRole(['moderator','superadmin']), async (req: import('../../middleware/admin').AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    
    if (!['reviewed', 'dismissed', 'action_taken'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Actualizar reporte
    const r = await pool.query(
      `UPDATE service_reports 
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4 AND status = 'pending'
       RETURNING service_id`,
      [status, admin_notes, req.adminId, id]
    );

    if (r.rowCount === 0) {
      return res.status(200).json({ 
        id, 
        status: 'already_moderated',
        message: 'Reporte ya fue moderado o no encontrado' 
      });
    }

    const serviceId = r.rows[0].service_id;

    // Si el admin elige "Eliminar Servicio", usa "action_taken" para marcar el servicio como eliminado
    if (status === 'action_taken') {
      // 1. Obtener al proveedor (user_id del servicio)
      const svc = await pool.query(
        'SELECT user_id FROM services WHERE id = $1',
        [serviceId]
      ) as { rows: Array<{ user_id: string }> }; 

      if (svc.rows.length > 0) {
        const providerId = svc.rows[0].user_id;

        // 2. Marcar como "removed_by_admin" (no se elimina físicamente)
        await pool.query(
          `UPDATE services SET status = 'removed_by_admin', updated_at = NOW() WHERE id = $1`,
          [serviceId]
        );

        // 3. Notificar al proveedor
        await notificationService.createNotification({
        userId: providerId,
        type: 'service_removed',
        title: 'Servicio eliminado',
        message: 'Uno de tus servicios fue eliminado por violar las políticas de la plataforma.',
        actionUrl: '/vistas/mis-servicios.html', // ← URL a la que el usuario puede ir al hacer clic
    });
      }
    }

    res.status(200).json({ id, status, message: 'Reporte moderado exitosamente' });
  } catch (e: any) {
    console.error('Error al moderar reporte:', e);
    res.status(500).json({ error: 'Error al moderar reporte' });
  }
});

// Metrics: expose platform_metrics view (superadmin)
adminRouter.get('/metrics', authenticateAdmin, requireAdminRole(['superadmin']), async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM platform_metrics');
    res.json(r.rows[0] || {});
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Disputas: listar (moderator or superadmin)
adminRouter.get('/disputes', authenticateAdmin, requireAdminRole(['moderator','superadmin']), async (req, res) => {
  try {
    const { status } = req.query as { status?: string };
    let sql = `
      SELECT 
        d.id,
        d.escrow_id,
        d.complainant_id,
        d.respondent_id,
        d.reason,
        d.evidence_urls,
        d.status AS dispute_status,
        d.resolution,
        d.resolved_at,
        d.created_at,
        c.title AS contract_title,
        buyer.full_name AS buyer_name,
        seller.full_name AS seller_name,
        s.title AS service_title
      FROM disputes d
      JOIN escrow_accounts e ON d.escrow_id = e.id
      JOIN contracts c ON e.id = c.escrow_id
      JOIN services s ON c.service_id = s.id
      JOIN users buyer ON c.buyer_id = buyer.id
      JOIN users seller ON c.seller_id = seller.id
    `;
    const params: any[] = [];
    if (status && ['open','in_review','resolved','dismissed'].includes(status)) {
      sql += ` WHERE d.status = $1`;
      params.push(status);
    }
    sql += ` ORDER BY d.created_at DESC`;
    
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e: any) {
    console.error('Error al cargar disputas:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Disputas: resolver (moderator or superadmin)
adminRouter.patch('/disputes/:id/status', authenticateAdmin, requireAdminRole(['moderator','superadmin']), async (req: import('../../middleware/admin').AdminRequest, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    // Validar estado
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Estado de disputa inválido' });
    }

    // Obtener disputa y escrow
    const disputeRes = await pool.query(
      `SELECT d.*, e.amount_qz_halves, e.status AS escrow_status, c.buyer_id, c.seller_id
       FROM disputes d
       JOIN escrow_accounts e ON d.escrow_id = e.id
       JOIN contracts c ON e.id = c.escrow_id
       WHERE d.id = $1`,
      [id]
    );

    if (disputeRes.rowCount === 0) {
      return res.status(404).json({ error: 'Disputa no encontrada' });
    }

    const dispute = disputeRes.rows[0];

    // No permitir resolver si ya está resuelta
    if (['resolved', 'dismissed'].includes(dispute.status)) {
      return res.status(400).json({ error: 'La disputa ya fue resuelta' });
    }

    // Solo permitir resolver si el escrow está en estado 'disputed'
    if (dispute.escrow_status !== 'disputed') {
      return res.status(400).json({ error: 'El escrow no está en estado disputed' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Actualizar la disputa
      await client.query(
        `UPDATE disputes 
         SET status = $1, resolution = $2, resolved_by = $3, resolved_at = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [status, resolution || '', req.adminId, id]
      );

      // 2. Actualizar el escrow según la resolución
      if (status === 'resolved') {
        // Aquí debes decidir: ¿liberar al vendedor o reembolsar al comprador?
        // Como no tenemos ese campo en el body, asumimos que "resolved" = liberar al vendedor
        // (En una versión avanzada, podrías recibir una acción específica)
        await client.query(
          `UPDATE escrow_accounts SET status = 'released', released_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [dispute.escrow_id]
        );

        // Actualizar contrato a 'completed'
        await client.query(
          `UPDATE contracts SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE escrow_id = $1`,
          [dispute.escrow_id]
        );

        // Notificar al vendedor (liberación de fondos)
        await notificationService.createNotification({
          userId: dispute.seller_id,
          type: 'transaction_completed',
          title: 'Disputa resuelta a tu favor',
          message: `La disputa fue resuelta. El pago por "${dispute.contract_title}" ha sido liberado.`,
          referenceId: id,
          actionUrl: '/vistas/cartera.html'
        });

        // Notificar al comprador
        await notificationService.createNotification({
          userId: dispute.buyer_id,
          type: 'dispute_created',
          title: 'Disputa resuelta',
          message: `La disputa por "${dispute.contract_title}" fue resuelta a favor del vendedor.`,
          referenceId: id,
          actionUrl: '/vistas/disputas.html'
        });
      } else if (status === 'dismissed') {
        // Si se desestima, el escrow permanece en 'disputed' (sin acción financiera)
        // Pero podrías querer permitir que el flujo continúe manualmente después
        // Notificación a ambas partes
        await notificationService.createNotification({
          userId: dispute.buyer_id,
          type: 'dispute_created',
          title: 'Disputa desestimada',
          message: `La disputa por "${dispute.contract_title}" fue desestimada por el equipo de soporte.`,
          referenceId: id,
          actionUrl: '/vistas/disputas.html'
        });

        await notificationService.createNotification({
          userId: dispute.seller_id,
          type: 'dispute_created',
          title: 'Disputa desestimada',
          message: `La disputa por "${dispute.contract_title}" fue desestimada por el equipo de soporte.`,
          actionUrl: '/vistas/disputas.html'
        });
      }

      await client.query('COMMIT');
      client.release();

      res.json({ id, status, message: 'Disputa actualizada exitosamente' });
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      console.error('Error al resolver disputa:', err);
      res.status(500).json({ error: 'Error al resolver la disputa' });
    }
  } catch (e: any) {
    console.error('Error al resolver disputa:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Update admin user (superadmin only)
adminRouter.patch('/users/:id', authenticateAdmin, requireAdminRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, is_active, role_name } = req.body;
    const fields: string[] = []; const values: any[] = []; let idx = 1;
    if (full_name) { fields.push(`full_name=$${idx++}`); values.push(full_name); }
    if (typeof is_active === 'boolean') { fields.push(`is_active=$${idx++}`); values.push(is_active); }
    if (role_name) {
      const role = await pool.query('SELECT id FROM admin_roles WHERE role_name=$1', [role_name]);
      if (role.rowCount === 0) return res.status(400).json({ error: 'Invalid role_name' });
      fields.push(`role_id=$${idx++}`); values.push(role.rows[0].id);
    }
    if (!fields.length) return res.status(400).json({ error: 'No changes provided' });
    values.push(id);
    const sql = `UPDATE admin_users SET ${fields.join(', ')}, updated_at=NOW() WHERE id=$${idx} RETURNING id, email, full_name, is_active`;
    const r = await pool.query(sql, values);
    res.json(r.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

export default adminRouter;
