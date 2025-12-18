import { Auth } from './auth.js';
import { Utils } from './utils.js';

function $(id) { return document.getElementById(id); }

async function handleSubmit(e) {
  e.preventDefault();
  const email = $('email').value.trim();
  const password = $('password').value;
  const submitBtn = $('submitBtn');
  const emailError = $('emailError');
  const formMessage = $('formMessage');

  emailError.style.display = 'none';
  formMessage.textContent = '';

  if (!Utils.isValidEmail(email)) {
    emailError.style.display = 'block';
    return;
  }
  if (!password || password.length < 8) {
    formMessage.className = 'error';
    formMessage.textContent = 'La contraseña debe tener al menos 8 caracteres';
    return;
  }

  submitBtn.disabled = true;
  formMessage.textContent = 'Ingresando...';
  try {
    const ok = await Auth.login(email, password);
    if (ok) {
      Utils.showToast('Bienvenido', 'success');
      formMessage.className = 'success';
      formMessage.textContent = 'Redirigiendo al panel...';
      setTimeout(() => { window.location.href = '../vistas/index.html'; }, 600);
    } else {
      formMessage.className = 'error';
      formMessage.textContent = 'Credenciales inválidas.';
    }
  } catch (err) {
    console.error(err);
    formMessage.className = 'error';
    
    // Detectar error de email no verificado
    if (err.code === 'EMAIL_NOT_VERIFIED' || (err.message && err.message.includes('Email not verified'))) {
      formMessage.innerHTML = `
        <strong>⚠️ Email no verificado</strong><br><br>
        Debes verificar tu correo electrónico antes de iniciar sesión.<br>
        Revisa tu bandeja de entrada (y spam).<br><br>
        <button id="resendVerificationBtn" style="
          padding: 10px 20px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 10px;
        ">
          📧 Reenviar correo de verificación
        </button>
        <div id="resendMessage" style="margin-top: 10px; font-size: 14px;"></div>
      `;
      
      // Manejar click en botón de reenviar
      setTimeout(() => {
        const resendBtn = document.getElementById('resendVerificationBtn');
        const resendMsg = document.getElementById('resendMessage');
        
        if (resendBtn) {
          resendBtn.addEventListener('click', async () => {
            resendBtn.disabled = true;
            resendBtn.textContent = 'Enviando...';
            resendMsg.textContent = '';
            
            try {
              const response = await fetch(`${window.location.origin}/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                resendMsg.style.color = '#4CAF50';
                resendMsg.textContent = '✅ ' + data.message;
                resendBtn.style.display = 'none';
              } else {
                resendMsg.style.color = '#f44336';
                resendMsg.textContent = '❌ ' + (data.message || data.error);
                resendBtn.disabled = false;
                resendBtn.textContent = '📧 Reenviar correo de verificación';
              }
            } catch (error) {
              resendMsg.style.color = '#f44336';
              resendMsg.textContent = '❌ Error de conexión. Intenta de nuevo.';
              resendBtn.disabled = false;
              resendBtn.textContent = '📧 Reenviar correo de verificación';
            }
          });
        }
      }, 100);
    } else {
      // Otros errores
      const msg = (err && err.message) ? err.message : 'Error del servidor. Intenta de nuevo.';
      const normalized = msg.includes('Invalid credentials') ? 'Credenciales inválidas.' : msg;
      formMessage.textContent = normalized;
    }
  } finally {
    submitBtn.disabled = false;
  }
}

function init() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', handleSubmit);
}

document.addEventListener('DOMContentLoaded', init);
