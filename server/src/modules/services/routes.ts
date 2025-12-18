import { Router, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { pool } from '../../lib/db';
import { authenticate, optionalAuth, AuthRequest } from '../../middleware/auth';
import { createClient } from '@supabase/supabase-js';
const readFile = promisify(fs.readFile);
const isProduction = process.env.NODE_ENV === 'production';
let supabase: any = null;
if (isProduction) {
  supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
export const servicesRouter = Router();

// Configuración de subida de imágenes
const uploadDir = isProduction ? '/tmp' // Render permite escritura aquí
  : path.join(process.cwd(), '..', 'web', 'uploads');

if (!isProduction && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = isProduction
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, uploadDir);
      },
      filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
        cb(null, `${Date.now()}_${base}${ext}`);
      }
    });

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

servicesRouter.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { 
      user_id, 
      search,
      category,
      priceMin, 
      priceMax, 
      minRating,
      city,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = '20',
      offset = '0'
    } = req.query;
    
    // Si se solicita servicios de un usuario específico
    if (user_id) {
      const r = await pool.query(
        'SELECT id, user_id, title, category, description, price_qz_halves, delivery_time, requirements, image_url, status FROM services WHERE user_id=$1 AND status=$2 ORDER BY created_at DESC',
        [user_id, 'active']
      );
      return res.json(r.rows);
    }
    
    // Si el usuario está autenticado y no hay otros filtros
    if (req.userId && !search && !category && !priceMin && !priceMax && !minRating && !city) {
      const r = await pool.query(
        'SELECT id, user_id, title, category, description, price_qz_halves, delivery_time, requirements, image_url, status FROM services WHERE user_id=$1 AND status != $2 ORDER BY created_at DESC',
        [req.userId, 'removed_by_admin']
      );
      return res.json(r.rows);
    }
    
    // Búsqueda avanzada con filtros
    const conditions: string[] = ['status = $1'];
    const values: any[] = ['active'];
    let paramIndex = 2;

    if (search && typeof search === 'string') {
      conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category && typeof category === 'string') {
      conditions.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (priceMin && typeof priceMin === 'string') {
      const minHalves = parseFloat(priceMin) * 2;
      conditions.push(`price_qz_halves >= $${paramIndex}`);
      values.push(minHalves);
      paramIndex++;
    }

    if (priceMax && typeof priceMax === 'string') {
      const maxHalves = parseFloat(priceMax) * 2;
      conditions.push(`price_qz_halves <= $${paramIndex}`);
      values.push(maxHalves);
      paramIndex++;
    }

    let joinRatings = false;
    if (minRating && typeof minRating === 'string') {
      joinRatings = true;
    }

    if (city && typeof city === 'string') {
      // Normalizar búsqueda de ciudad para ignorar tildes y espacios
      const normalizedCity = city.trim();
      conditions.push(`
        (
          u.city ILIKE $${paramIndex} OR
          unaccent(u.city) ILIKE unaccent($${paramIndex})
        )
      `);
      values.push(`%${normalizedCity}%`);
      paramIndex++;
    }

    const validSortFields = ['created_at', 'price_qz_halves', 'title', 'rating'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'created_at';
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const joinUsers = !!city;
    
    // Si se ordena por rating, activar el JOIN con ratings
    if (sortField === 'rating') {
      joinRatings = true;
    }

    let query: string;
    if (joinUsers || joinRatings) {
      const selectFields = `
        s.id, s.user_id, s.title, s.category, s.description, s.price_qz_halves,
        s.delivery_time, s.requirements, s.image_url, s.status, s.created_at,
        COALESCE(ratings_summary.avg_rating, 0) AS service_rating`;

      let fromClause = `FROM services s`;
      if (joinUsers) fromClause += ` JOIN users u ON s.user_id = u.id`;
      
      // Siempre incluir JOIN con ratings cuando estamos en este bloque
      // ya que el SELECT siempre incluye service_rating
      fromClause += `
        LEFT JOIN (
          SELECT service_id, AVG(rating) AS avg_rating
          FROM ratings
          GROUP BY service_id
        ) ratings_summary ON ratings_summary.service_id = s.id`;

      if (minRating && typeof minRating === 'string') {
        conditions.push(`COALESCE(ratings_summary.avg_rating, 0) >= $${paramIndex}`);
        values.push(parseFloat(minRating));
        paramIndex++;
      }

      const orderByClause = sortField === 'rating' 
        ? `COALESCE(ratings_summary.avg_rating, 0)` 
        : `s.${sortField}`;

      query = `
        SELECT ${selectFields}
        ${fromClause}
        WHERE ${conditions.join(' AND ')}
        ORDER BY ${orderByClause} ${sortDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
    } else {
      query = `
        SELECT id, user_id, title, category, description, price_qz_halves,
               delivery_time, requirements, image_url, status, created_at
        FROM services
        WHERE ${conditions.join(' AND ')}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
    }
    const mainValues = [...values, parseInt(limit as string), parseInt(offset as string)];
    const r = await pool.query(query, mainValues);

    // Obtener total de resultados
    let countQuery: string;
    if (joinUsers || joinRatings) {
      let fromCount = `FROM services s`;
      if (joinUsers) fromCount += ` JOIN users u ON s.user_id = u.id`;
      
      // Siempre incluir JOIN con ratings cuando estamos en este bloque
      fromCount += `
        LEFT JOIN (
          SELECT service_id, AVG(rating) AS avg_rating
          FROM ratings
          GROUP BY service_id
        ) ratings_summary ON ratings_summary.service_id = s.id`;

      countQuery = `SELECT COUNT(*) ${fromCount} WHERE ${conditions.join(' AND ')}`;
    } else {
      countQuery = `SELECT COUNT(*) FROM services WHERE ${conditions.join(' AND ')}`;
    }

    const countValues = [...values];
    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);
    res.json({
      services: r.rows,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

servicesRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const r = await pool.query('SELECT * FROM services WHERE id=$1', [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

servicesRouter.post('/', authenticate, upload.single('image'), async (req: AuthRequest & { file?: any }, res) => {
  try {
    const { title, category, description, price_qz_halves, delivery_time, requirements } = req.body;
    
    // Validaciones
    if (!title || !category || !description || !price_qz_halves || !delivery_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (title.length < 10 || title.length > 255) {
      return res.status(400).json({ error: 'Title must be between 10 and 255 characters' });
    }
    if (description.length < 50 || description.length > 5000) {
      return res.status(400).json({ error: 'Description must be between 50 and 5000 characters' });
    }
    if (price_qz_halves < 1) {
      return res.status(400).json({ error: 'Price must be at least 0.5 QZ (1 half)' });
    }
    
    

    let image_url = null;

    // Subir imagen según entorno
    if (req.file) {
  if (isProduction) {
    // ✅ memoryStorage → el archivo ya está en memoria
    const fileBuffer = req.file.buffer; 

    const safeName = req.file.originalname.replace(/\s+/g, '_').replace(/[^\w\-.()]/g, '');
    const fileName = `services/${Date.now()}_${safeName}`;
    
    const { data, error } = await supabase
      .storage
      .from('service-images')
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'No se pudo subir la imagen' });
    }

    const { data: urlData } = supabase
      .storage
      .from('service-images')
      .getPublicUrl(fileName);

    image_url = urlData.publicUrl.trim();
    // ✅ No hay archivo temporal que borrar
  } else {
    image_url = `/uploads/${req.file.filename}`;
  }
}

    // Insertar servicio
    const user_id = req.userId!;
    const result = await pool.query(
      `INSERT INTO services (user_id, title, category, description, price_qz_halves, delivery_time, requirements, image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING id, user_id, title, category, description, price_qz_halves, delivery_time, requirements, image_url, status, created_at`,
      [user_id, title, category, description, price_qz_halves, delivery_time, requirements, image_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (e: any) {
    console.error('Create service error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Editar servicio
servicesRouter.patch('/:id', authenticate, upload.single('image'), async (req: AuthRequest & { file?: any }, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, price_qz_halves, delivery_time, requirements } = req.body;
    let image_url = undefined;

    if (req.file) {
  if (isProduction) {
    const fileBuffer = req.file.buffer; // ✅

    const safeName = req.file.originalname.replace(/\s+/g, '_').replace(/[^\w\-.()]/g, '');
    const fileName = `services/${Date.now()}_${safeName}`;
    
    const { data, error } = await supabase
      .storage
      .from('service-images')
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'No se pudo subir la imagen' });
    }

    const { data: urlData } = supabase
      .storage
      .from('service-images')
      .getPublicUrl(fileName);

    image_url = urlData.publicUrl.trim();
  } else {
    image_url = `/uploads/${req.file.filename}`;
  }
}
    
    // Verificar que el servicio pertenece al usuario y obtener la imagen actual
    const ownerCheck = await pool.query('SELECT user_id, image_url FROM services WHERE id=$1', [id]);
    if (ownerCheck.rowCount === 0) return res.status(404).json({ error: 'Service not found' });
    if (ownerCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'You do not own this service' });
    }
    
    if (!req.file) {
      // Si no se envió una nueva imagen, conservar la actual
      image_url = ownerCheck.rows[0].image_url;
    }
    // Validaciones básicas (si vienen)
    if (title && (title.length < 10 || title.length > 255)) {
      return res.status(400).json({ error: 'Title must be between 10 and 255 characters' });
    }
    if (description && (description.length < 50 || description.length > 5000)) {
      return res.status(400).json({ error: 'Description must be between 50 and 5000 characters' });
    }
    if (typeof price_qz_halves === 'number' && price_qz_halves < 1) {
      return res.status(400).json({ error: 'Price must be at least 0.5 QZ (1 half)' });
    }

    // Construir SET dinámico
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, value] of Object.entries({ title, category, description, price_qz_halves, delivery_time, requirements, image_url })) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);

    console.log('Image URL to save:', image_url);
    const sql = `UPDATE services SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const r = await pool.query(sql, values);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e: any) {
    console.error('Update service error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Activar/Desactivar servicio (toggle)
servicesRouter.patch('/:id/toggle', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    // Verificar ownership
    const cur = await pool.query('SELECT user_id, status FROM services WHERE id=$1', [id]);
    if (cur.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    if (cur.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'You do not own this service' });
    }
    // Toggle estado actual
    const next = cur.rows[0].status === 'active' ? 'inactive' : 'active';
    const r = await pool.query('UPDATE services SET status=$1 WHERE id=$2 RETURNING id, status', [next, id]);
    res.json(r.rows[0]);
  } catch (e: any) {
    console.error('Toggle service error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Reportar un servicio
servicesRouter.post('/:id/report', authenticate, async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const serviceId = req.params.id;
    const userId = req.userId!;

    // Validar razón
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'La razón debe tener al menos 10 caracteres' });
    }

    // Verificar que el servicio exista y sea activo
    const service = await pool.query(
      'SELECT user_id FROM services WHERE id = $1 AND status = $2',
      [serviceId, 'active']
    );
    if (service.rowCount === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Verificar que no sea el propio servicio
    if (service.rows[0].user_id === userId) {
      return res.status(400).json({ error: 'No puedes reportar tu propio servicio' });
    }

    // Crear reporte
    const r = await pool.query(
      `INSERT INTO service_reports (reporter_id, service_id, reason, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [userId, serviceId, reason.trim()]
    );

    // Opcional: aquí podrías llamar a createNotification (si lo implementas después)

    res.status(201).json({ message: 'Servicio reportado exitosamente' });
  } catch (e: any) {
    console.error('Error al reportar servicio:', e);
    res.status(500).json({ error: 'Error al reportar servicio' });
  }
});
