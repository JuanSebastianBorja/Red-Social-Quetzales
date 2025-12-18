import { Auth } from './auth.js';
import { Roles } from './roles.js';
import { Utils } from './utils.js';

function $(id) { return document.getElementById(id); }

async function handleSubmit(e) {
  e.preventDefault();
  const full_name = $('full_name').value.trim();
  const email = $('email').value.trim();
  const password = $('password').value;
  const confirm = $('confirm').value;
  const citySelect = $('city');
  const cityOther = $('cityOther');
  let city = citySelect.value.trim();
  if (citySelect.value === 'Otra') {
    city = cityOther.value.trim();
  }
  const user_type = 'both';
  const submitBtn = $('submitBtn');
  const emailError = $('emailError');
  const passwordError = $('passwordError');
  const formMessage = $('formMessage');

  emailError.style.display = 'none';
  passwordError.style.display = 'none';
  formMessage.textContent = '';

  if (!full_name || full_name.length < 3) {
    formMessage.className = 'error';
    formMessage.textContent = 'El nombre debe tener al menos 3 caracteres';
    return;
  }
  if (!city || city.length < 2) {
    formMessage.className = 'error';
    formMessage.textContent = citySelect.value === 'Otra' ? 'Ingresa tu ciudad' : 'La ciudad es obligatoria';
    return;
  }
  if (!Utils.isValidEmail(email)) {
    emailError.style.display = 'block';
    return;
  }
  if (password.length < 8 || password !== confirm) {
    passwordError.style.display = 'block';
    return;
  }

  const payload = { full_name, email, password, user_type, city };

  submitBtn.disabled = true;
  formMessage.textContent = 'Creando cuenta...';
  try {
    const response = await Auth.register(payload);
    
    // Nueva respuesta: el servidor ya no da token inmediatamente
    if (response && response.requiresVerification) {
      formMessage.className = 'success';
      formMessage.innerHTML = `
        <strong>✅ ¡Cuenta creada exitosamente!</strong><br><br>
        📧 Hemos enviado un correo de verificación a <strong>${email}</strong><br><br>
        Por favor revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.<br><br>
        <small>No podrás iniciar sesión hasta que verifiques tu correo.</small>
      `;
      
      // Limpiar formulario
      document.getElementById('registerForm').reset();
      
      // Opcional: redirigir a login después de 8 segundos
      setTimeout(() => {
        window.location.href = '/vistas/login.html';
      }, 8000);
    } else {
      formMessage.className = 'error';
      formMessage.textContent = 'No se pudo crear la cuenta.';
    }
  } catch (err) {
    console.error(err);
    formMessage.className = 'error';
    const msg = (err && err.message) ? err.message : 'Error del servidor. Intenta de nuevo.';
    const normalized = msg.includes('Email already registered') || msg.includes('Email exists') 
      ? 'El correo ya está registrado.' 
      : msg;
    formMessage.textContent = normalized;
  } finally {
    submitBtn.disabled = false;
  }
}

function init() {
  const form = document.getElementById('registerForm');
  form.addEventListener('submit', handleSubmit);

  const citySelect = $('city');
  const cityOtherWrapper = $('cityOtherWrapper');
  const cityOther = $('cityOther');

  if (citySelect) {
    citySelect.addEventListener('change', () => {
      if (citySelect.value === 'Otra') {
        cityOtherWrapper.style.display = 'block';
        cityOther.focus();
      } else {
        cityOtherWrapper.style.display = 'none';
        cityOther.value = '';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
