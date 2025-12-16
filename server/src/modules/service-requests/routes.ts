import { Router } from 'express';
import { pool } from '../../lib/db';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { notificationService } from '../notifications/service';

export const serviceRequestsRouter = Router();

// Crear solicitud de servicio (buyer -> provider del servicio)
serviceRequestsRouter.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const buyerId = req.userId!;
    const { service_id, message, proposed_price_qz_halves, deadline, terms_agreed } = req.body;

    if (!service_id) return res.status(400).json({ error: 'service_id es requerido' });

    const s = await pool.query(
      `SELECT id, user_id, price_qz_halves, status, title, description FROM services WHERE id=$1`,
      [service_id]
    );
    if (s.rowCount === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    const service = s.rows[0];
    if (service.status !== 'active') return res.status(400).json({ error: 'Servicio no está activo' });

    const sellerId = service.user_id;
    if (sellerId === buyerId) return res.status(400).json({ error: 'No puedes solicitar tu propio servicio' });

    const priceHalves = proposed_price_qz_halves ? Number(proposed_price_qz_halves) : Number(service.price_qz_halves);
    if (!priceHalves || priceHalves <= 0) return res.status(400).json({ error: 'Precio propuesto inválido' });

    const r = await pool.query(
      `INSERT INTO service_requests (
        service_id, buyer_id, seller_id, message,
        proposed_price_qz_halves, deadline, terms_agreed, status
      ) VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,false),'pending')
      RETURNING *`,
      [service_id, buyerId, sellerId, message || null, priceHalves, deadline || null, terms_agreed]
    );

    res.status(201).json(r.rows[0]);
  } catch (e: any) {
    console.error('Create service request error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Listar solicitudes del usuario (según rol)
serviceRequestsRouter.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { role = 'client', status, limit = '20', offset = '0' } = req.query as any;

    let base = `SELECT sr.*, s.title, s.category, s.description,
                       buyer.full_name AS client_name, seller.full_name AS provider_name
                FROM service_requests sr
                JOIN services s ON sr.service_id = s.id
                JOIN users buyer ON sr.buyer_id = buyer.id
                JOIN users seller ON sr.seller_id = seller.id`;
    const conds: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (role === 'client') {
      conds.push(`sr.buyer_id = $${idx++}`); vals.push(userId);
    } else if (role === 'provider') {
      conds.push(`sr.seller_id = $${idx++}`); vals.push(userId);
    } else {
      conds.push(`(sr.buyer_id = $${idx} OR sr.seller_id = $${idx})`); vals.push(userId); idx++;
    }
    if (status) { conds.push(`sr.status = $${idx++}`); vals.push(String(status)); }

    base += ` WHERE ${conds.join(' AND ')} ORDER BY sr.updated_at DESC NULLS LAST, sr.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    vals.push(parseInt(String(limit)), parseInt(String(offset)));

    const r = await pool.query(base, vals);
    res.json(r.rows);
  } catch (e: any) {
    console.error('List service requests error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Actualizar estado / negociación
serviceRequestsRouter.patch('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    let { 
      status, 
      negotiated_price_qz_halves, 
      counter_offer_details, 
      rejection_reason, 
      deadline, 
      terms_agreed 
    } = req.body;

    const valid = ['pending','accepted','rejected','negotiating','completed','cancelled'];
    if (status && !valid.includes(status)) return res.status(400).json({ error: 'Estado inválido' });

    const q = await pool.query(`SELECT * FROM service_requests WHERE id=$1`, [id]);
    if (q.rowCount === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const sr = q.rows[0];

    const isClient = sr.buyer_id === userId;
    const isProvider = sr.seller_id === userId;
    if (!isClient && !isProvider) return res.status(403).json({ error: 'No perteneces a esta solicitud' });

    // 🔸 Validación de transiciones de estado más precisa
    if (isProvider) {
      if (status === 'negotiating') {
        if (!['pending', 'negotiating'].includes(sr.status)) {
          return res.status(400).json({ error: 'Solo puedes negociar desde estado pendiente o en negociación' });
        }
        if (!negotiated_price_qz_halves || Number(negotiated_price_qz_halves) <= 0) {
          return res.status(400).json({ error: 'Debes proporcionar un precio válido en la contraoferta' });
        }
      } else if (['accepted', 'rejected'].includes(status)) {
        if (!['pending', 'negotiating'].includes(sr.status)) {
          return res.status(400).json({ error: 'Solo puedes aceptar/rechazar solicitudes pendientes o en negociación' });
        }
      }
    } 
    else if (isClient) {
      if (status === 'negotiating') {
        if (sr.status !== 'negotiating') {
          return res.status(400).json({ error: 'Solo puedes hacer una contraoferta si el proveedor ya negoció' });
        }
        if (!negotiated_price_qz_halves || Number(negotiated_price_qz_halves) <= 0) {
          return res.status(400).json({ error: 'Debes proporcionar un precio válido en tu contraoferta' });
        }
      } else if (status === 'accepted') {
        if (sr.status !== 'negotiating') {
          return res.status(400).json({ error: 'Solo puedes aceptar una contraoferta en estado de negociación' });
        }
      } else if (status === 'cancelled') {
        if (['completed', 'accepted'].includes(sr.status)) {
          return res.status(400).json({ error: 'No se puede cancelar una solicitud completada o aceptada' });
        }
      }
    }

    // Construir UPDATE dinámico
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (status) { sets.push(`status = $${idx++}`); vals.push(status); }
    if (typeof negotiated_price_qz_halves !== 'undefined') { 
      const price = negotiated_price_qz_halves ? Number(negotiated_price_qz_halves) : null;
      sets.push(`negotiated_price_qz_halves = $${idx++}`); 
      vals.push(price); 
    }
    if (typeof counter_offer_details !== 'undefined') { 
      sets.push(`counter_offer_details = $${idx++}`); 
      vals.push(counter_offer_details || null); 
    }
    if (typeof rejection_reason !== 'undefined') { 
      sets.push(`rejection_reason = $${idx++}`); 
      vals.push(rejection_reason || null); 
    }
    if (typeof deadline !== 'undefined') { 
      sets.push(`deadline = $${idx++}`); 
      vals.push(deadline || null); 
    }
    if (typeof terms_agreed !== 'undefined') { 
      sets.push(`terms_agreed = $${idx++}`); 
      vals.push(Boolean(terms_agreed)); 
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
    sets.push(`updated_at = NOW()`);

    const up = await pool.query(
      `UPDATE service_requests SET ${sets.join(', ')} WHERE id=$${idx} RETURNING *`,
      [...vals, id]
    );
    const updated = up.rows[0];

    // 🔸 Obtener datos del servicio para notificaciones
    const serviceQ = await pool.query(`SELECT title FROM services WHERE id=$1`, [sr.service_id]);
    const serviceTitle = serviceQ.rows[0]?.title || 'el servicio';

    // 🔸 Notificaciones según acción
    if (isProvider && status === 'negotiating') {
      // Proveedor hizo contraoferta → notificar cliente
      await notificationService.createNotification({
        userId: sr.buyer_id,
        type: 'service_request_updated',
        title: '¡Contraoferta recibida!',
        message: `El proveedor respondió a tu solicitud para: "${serviceTitle}"`,
        referenceId: id,
        actionUrl: '/vistas/solicitudes.html?role=client'
      });
    } 
    else if (isClient && status === 'negotiating') {
      // Cliente hizo contraoferta → notificar proveedor
      await notificationService.createNotification({
        userId: sr.seller_id,
        type: 'service_request_updated',
        title: 'Nueva oferta de cliente',
        message: `El cliente propuso un nuevo precio para: "${serviceTitle}"`,
        referenceId: id,
        actionUrl: '/vistas/solicitudes.html?role=provider'
      });
    } 
    else if (status === 'accepted' && isProvider) {
      // Proveedor aceptó → crear contrato y notificar cliente
      const serviceQ = await pool.query(`SELECT * FROM services WHERE id=$1`, [sr.service_id]);
      const service = serviceQ.rows[0];
      const priceHalves = Number(
        updated.negotiated_price_qz_halves || 
        updated.proposed_price_qz_halves || 
        service.price_qz_halves
      );
      const contract_number = `CTR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const delivery_days = service.delivery_time ? parseInt(service.delivery_time) || 7 : 7;
      const ins = await pool.query(
        `INSERT INTO contracts (
          contract_number, buyer_id, seller_id, service_id,
          title, description, service_price_qz_halves, total_amount_qz_halves, delivery_days, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,'pending') RETURNING *`,
        [contract_number, sr.buyer_id, sr.seller_id, sr.service_id, service.title, service.description, priceHalves, delivery_days]
      );
      updated.metadata = { ...(updated.metadata || {}), contract_id: ins.rows[0].id };

      // Notificar cliente
      await notificationService.createNotification({
        userId: sr.buyer_id,
        type: 'contract_created',
        title: '¡Solicitud aceptada!',
        message: `Tu solicitud para "${serviceTitle}" fue aceptada. Puedes proceder a pagar.`,
        referenceId: ins.rows[0].id,
        actionUrl: '/vistas/contratos.html?role=client'
      });
    }
    else if (status === 'accepted' && isClient) {
      // Cliente aceptó contraoferta → crear contrato y notificar proveedor
      const serviceQ = await pool.query(`SELECT * FROM services WHERE id=$1`, [sr.service_id]);
      const service = serviceQ.rows[0];
      const priceHalves = Number(
      updated.negotiated_price_qz_halves || 
      updated.proposed_price_qz_halves || 
      service.price_qz_halves
      );
      const contract_number = `CTR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const delivery_days = service.delivery_time ? parseInt(service.delivery_time) || 7 : 7;
      const ins = await pool.query(
        `INSERT INTO contracts (
          contract_number, buyer_id, seller_id, service_id,
          title, description, service_price_qz_halves, total_amount_qz_halves, delivery_days, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,'pending') RETURNING *`,
        [contract_number, sr.buyer_id, sr.seller_id, sr.service_id, service.title, service.description, priceHalves, delivery_days]
      );
      updated.metadata = { ...(updated.metadata || {}), contract_id: ins.rows[0].id };

      // Notificar proveedor
      await notificationService.createNotification({
        userId: sr.seller_id,
        type: 'contract_created',
        title: '¡Solicitud aceptada!',
        message: `El cliente aceptó tu contraoferta para: "${serviceTitle}". Espera el pago.`,
        referenceId: ins.rows[0].id,
        actionUrl: '/vistas/contratos.html?role=provider'
      });
    }
    else if (status === 'rejected') {
      // Notificar a quien no rechazó
      const targetUserId = isClient ? sr.seller_id : sr.buyer_id;
      await notificationService.createNotification({
        userId: targetUserId,
        type: 'service_request_rejected',
        title: 'Solicitud rechazada',
        message: `Tu solicitud para "${serviceTitle}" fue rechazada.`,
        referenceId: id,
        actionUrl: '/vistas/solicitudes.html'
      });
    }

    res.json(updated);
  } catch (e: any) {
    console.error('Update service request error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});