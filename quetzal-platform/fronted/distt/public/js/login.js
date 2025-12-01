    // ============================================
    // LOGIN.JS - Lógica de Inicio de Sesión
    // ============================================

    // Redireccionar si ya está autenticado
    redirectIfAuthenticated();

    // Elementos del DOM
    const loginForm = document.getElementById('login-form');
    const submitBtn = document.getElementById('submit-btn');

    // Event Listeners
    loginForm.addEventListener('submit', handleSubmit);

    // Validación en tiempo real
    document.getElementById('email').addEventListener('blur', validateEmail);

    /**
     * Maneja el envío del formulario
     */
    async function handleSubmit(e) {
  e.preventDefault();

  clearFormErrors();

  if (!validateForm()) {
    return;
  }

  const formData = {
    email: document.getElementById('email').value.trim().toLowerCase(),
    password: document.getElementById('password').value,
    remember: document.getElementById('remember').checked
  };

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span> Ingresando...';

  try {
    // 1. Llamar a la API del backend (JWT)
    const result = await API.login({ email: formData.email, password: formData.password });

    // 2. El helper API.login ya guarda token y user en localStorage
    const user = (result?.data?.user) || (result?.user) || API.getCurrentUser();

    showAlert('¡Inicio de sesión exitoso! Redirigiendo...', 'success');

    setTimeout(() => {
      // Redirigir según el rol o tipo de usuario
      const role = user?.role || user?.userType;
      if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    }, 1500);

  } catch (error) {
    showAlert(error.message || 'Email o contraseña incorrectos', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Iniciar Sesión';
  }
}

    /**
     * Valida todo el formulario
     */
    function validateForm() {
    let isValid = true;

    // Validar email
    if (!validateEmail()) {
        isValid = false;
    }

    // Validar contraseña
    const password = document.getElementById('password').value;
    if (!password) {
        showFieldError('password', 'La contraseña es requerida');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    }

    return isValid;
    }

    /**
     * Valida el email
     */
    function validateEmail() {
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showFieldError('email', 'El email es requerido');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showFieldError('email', 'Ingresa un correo electrónico válido');
        return false;
    }
    
    return true;
    }
