import nodemailer from 'nodemailer';

/**
 * Configuración del transporte de email
 * En desarrollo usa Gmail u otro SMTP
 * En producción usa un servicio como Resend, SendGrid, etc.
 */
function createTransporter() {
  // Verificar que las variables de entorno estén configuradas
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  Email configuration missing. Emails will NOT be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Enviar email de verificación
 */
export async function sendVerificationEmail(
  to: string,
  verificationUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('Email transporter not configured. Skipping email send.');
    console.log(`📧 [DEV] Verification URL: ${verificationUrl}`);
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Verifica tu correo electrónico - Quetzales',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            margin: 20px 0;
          }
          .header {
            text-align: center;
            color: #4CAF50;
            margin-bottom: 30px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            background-color: #4CAF50;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .button:hover {
            background-color: #45a049;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🦜 Quetzales</h1>
          </div>
          
          <div class="content">
            <h2>¡Bienvenido a Quetzales! 🎉</h2>
            
            <p>Gracias por registrarte. Para completar tu registro y poder acceder a tu cuenta, necesitamos verificar tu correo electrónico.</p>
            
            <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verificar mi correo</a>
            </div>
            
            <p style="margin-top: 20px;">O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${verificationUrl}
            </p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Este enlace expirará en 24 horas por seguridad.
            </div>
            
            <p>Si no creaste una cuenta en Quetzales, puedes ignorar este correo.</p>
          </div>
          
          <div class="footer">
            <p>© 2025 Quetzales - Red Social de Servicios</p>
            <p>Este correo fue enviado automáticamente, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ¡Bienvenido a Quetzales!
      
      Gracias por registrarte. Para completar tu registro, verifica tu correo electrónico haciendo clic en el siguiente enlace:
      
      ${verificationUrl}
      
      Este enlace expirará en 24 horas.
      
      Si no creaste una cuenta en Quetzales, puedes ignorar este correo.
      
      © 2025 Quetzales - Red Social de Servicios
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return false;
  }
}

/**
 * Enviar email de bienvenida después de verificar
 */
export async function sendWelcomeEmail(to: string, fullName: string): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('📧 [DEV] Welcome email would be sent to:', to);
    return false;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: '¡Cuenta verificada! - Quetzales',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>¡Hola ${fullName}! 👋</h2>
            
            <div class="success">
              <h3>✅ Tu cuenta ha sido verificada exitosamente</h3>
            </div>
            
            <p>Ya puedes iniciar sesión y empezar a:</p>
            <ul>
              <li>🔍 Explorar servicios disponibles</li>
              <li>💼 Publicar tus propios servicios</li>
              <li>💬 Conectar con otros usuarios</li>
              <li>💰 Gestionar tus transacciones</li>
            </ul>
            
            <p>¡Bienvenido a la comunidad Quetzales!</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ¡Hola ${fullName}!
      
      Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión en Quetzales.
      
      ¡Bienvenido a la comunidad!
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
}
