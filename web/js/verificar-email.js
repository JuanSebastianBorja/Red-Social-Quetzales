// verificar-email.js - Manejo de verificación de email

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : '';

// Obtener token de la URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Estados de la UI
const loadingState = document.getElementById('loading-state');
const successState = document.getElementById('success-state');
const alreadyVerifiedState = document.getElementById('already-verified-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const resendBtn = document.getElementById('resend-btn');
const resendForm = document.getElementById('resend-form');
const resendSubmit = document.getElementById('resend-submit');
const resendEmailInput = document.getElementById('resend-email');
const resendMessage = document.getElementById('resend-message');

// Función para mostrar un estado específico
function showState(state) {
  loadingState.style.display = 'none';
  successState.style.display = 'none';
  alreadyVerifiedState.style.display = 'none';
  errorState.style.display = 'none';
  
  if (state) {
    state.style.display = 'block';
  }
}

// Verificar email automáticamente al cargar
async function verifyEmail() {
  if (!token) {
    showState(errorState);
    errorMessage.textContent = 'No se proporcionó un token de verificación.';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      if (data.alreadyVerified) {
        showState(alreadyVerifiedState);
      } else {
        showState(successState);
        
        // Redirigir automáticamente después de 3 segundos
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } else {
      showState(errorState);
      errorMessage.textContent = data.message || 'Hubo un error al verificar tu email.';
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    showState(errorState);
    errorMessage.textContent = 'Error de conexión. Por favor intenta de nuevo.';
  }
}

// Manejar click en botón de reenviar
resendBtn.addEventListener('click', () => {
  resendForm.style.display = 'block';
  resendBtn.style.display = 'none';
});

// Manejar envío de formulario de reenvío
resendSubmit.addEventListener('click', async () => {
  const email = resendEmailInput.value.trim();
  
  if (!email) {
    resendMessage.textContent = 'Por favor ingresa tu email';
    resendMessage.style.color = '#f44336';
    return;
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    resendMessage.textContent = 'Por favor ingresa un email válido';
    resendMessage.style.color = '#f44336';
    return;
  }

  resendSubmit.disabled = true;
  resendSubmit.textContent = 'Enviando...';
  resendMessage.textContent = '';

  try {
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (response.ok) {
      resendMessage.textContent = '✅ ' + data.message;
      resendMessage.style.color = '#4CAF50';
      resendEmailInput.value = '';
      
      // Ocultar formulario después de 3 segundos
      setTimeout(() => {
        resendForm.style.display = 'none';
      }, 3000);
    } else {
      resendMessage.textContent = '❌ ' + (data.message || data.error);
      resendMessage.style.color = '#f44336';
    }
  } catch (error) {
    console.error('Error resending verification:', error);
    resendMessage.textContent = '❌ Error de conexión. Intenta de nuevo.';
    resendMessage.style.color = '#f44336';
  } finally {
    resendSubmit.disabled = false;
    resendSubmit.textContent = 'Enviar';
  }
});

// Permitir enviar con Enter
resendEmailInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    resendSubmit.click();
  }
});

// Iniciar verificación al cargar la página
verifyEmail();
