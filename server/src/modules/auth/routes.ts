import { Router } from 'express';
import { pool } from '../../lib/db';
import { hashPassword, verifyPassword, signAccessToken, signVerificationToken, verifyEmailToken } from '../../lib/auth';
import { sendVerificationEmail, sendWelcomeEmail } from '../../lib/email';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, city } = req.body;
    const user_type = 'both';
    
    // Validación de campos
    if (!email || !password || !full_name || !city) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    // user_type por defecto 'both'
    
    // Hash de contraseña
    const hash = await hashPassword(password);
    
    // Insertar usuario (is_verified = false por defecto)
    const r = await pool.query(
      'INSERT INTO users (email, password, full_name, user_type, city) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, user_type',
      [email, hash, full_name, user_type, city]
    );
    
    const userId = r.rows[0].id;
    
    // Generar token de verificación (expira en 24h)
    const verificationToken = signVerificationToken(userId);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    // Enviar email de verificación
    await sendVerificationEmail(email, verificationUrl);
    
    // NO dar token de acceso hasta que verifique
    res.status(201).json({ 
      message: 'Registro exitoso. Por favor verifica tu correo electrónico para activar tu cuenta.',
      email: r.rows[0].email,
      requiresVerification: true
    });
  } catch (e: any) {
    console.error('Register error:', e);
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // 1) Intentar como admin primero (tabla admin_users con crypt)
    const ar = await pool.query(
      'SELECT au.id, au.password, ar.role_name FROM admin_users au JOIN admin_roles ar ON au.role_id=ar.id WHERE au.email=$1 AND au.is_active=true',
      [email]
    );
    // Si existe un admin con ese email, validar el password (crypt)
    if (ar.rowCount && ar.rowCount > 0) {
      const admin = ar.rows[0];
      const cmp = await pool.query('SELECT crypt($1, $2) = $2 AS ok',[password, admin.password]);
    if (!cmp.rows[0]?.ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signAccessToken({sub: admin.id,role: admin.role_name,scope: 'admin'});
    return res.json({ token, scope: 'admin', role: admin.role_name });
}

    // 2) Usuario normal (tabla users con argon2)
    const r = await pool.query('SELECT id, password, user_type, is_verified FROM users WHERE email=$1 AND is_active=true', [email]);
    if (r.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = r.rows[0];
    const ok = await verifyPassword(user.password, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Verificar que el email esté verificado
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Por favor verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
      });
    }
    
    const token = signAccessToken({ userId: user.id, role: user.user_type, scope: 'user' });
    return res.json({ token, scope: 'user', role: user.user_type });
  } catch (e: any) {
    console.error('Unified login error:', e);
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Verificar email con token
authRouter.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token requerido' });
    }
    
    // Decodificar y validar JWT
    const payload = verifyEmailToken(token);
    
    if (!payload) {
      return res.status(400).json({ 
        error: 'Token inválido o expirado',
        message: 'El link de verificación ha expirado. Por favor solicita uno nuevo.'
      });
    }
    
    // Verificar estado actual del usuario
    const userResult = await pool.query(
      'SELECT is_verified, email, full_name FROM users WHERE id=$1',
      [payload.userId]
    );
    
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const user = userResult.rows[0];
    
    // Si ya está verificado, retornar mensaje pero no error
    if (user.is_verified) {
      return res.status(200).json({ 
        message: 'Tu email ya está verificado. Puedes iniciar sesión.',
        alreadyVerified: true
      });
    }
    
    // Actualizar is_verified a true
    await pool.query(
      'UPDATE users SET is_verified=true WHERE id=$1',
      [payload.userId]
    );
    
    // Enviar email de bienvenida (opcional, no bloquea si falla)
    sendWelcomeEmail(user.email, user.full_name).catch(err => 
      console.error('Error sending welcome email:', err)
    );
    
    res.json({ 
      message: 'Email verificado exitosamente. ¡Ya puedes iniciar sesión!',
      verified: true
    });
  } catch (e: any) {
    console.error('Verify email error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});

// Reenviar email de verificación
authRouter.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }
    
    // Buscar usuario
    const userResult = await pool.query(
      'SELECT id, is_verified, email FROM users WHERE email=$1',
      [email]
    );
    
    // Por seguridad, no revelar si el email existe o no
    if (userResult.rowCount === 0) {
      return res.json({ 
        message: 'Si el email está registrado, recibirás un correo de verificación.'
      });
    }
    
    const user = userResult.rows[0];
    
    // Si ya está verificado
    if (user.is_verified) {
      return res.status(400).json({ 
        error: 'Email already verified',
        message: 'Tu correo ya está verificado. Puedes iniciar sesión.'
      });
    }
    
    // Generar nuevo token
    const verificationToken = signVerificationToken(user.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    // Reenviar email
    await sendVerificationEmail(user.email, verificationUrl);
    
    res.json({ 
      message: 'Correo de verificación reenviado. Revisa tu bandeja de entrada.'
    });
  } catch (e: any) {
    console.error('Resend verification error:', e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
});
