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
    // 1. Llamada a Supabase Auth (esto solo autentica en Supabase)
    const result = await SupabaseAuth.signIn(formData.email, formData.password);

    // 2. Llamar a la API del backend para sincronizar el usuario y verificar el token de Supabase
    // Esta ruta debería recibir el token de Supabase, verificarlo, buscar/crear el usuario en la DB local,
    // y devolver los datos del usuario local y posiblemente un token de sesión (aunque en tu caso, el token de Supabase es suficiente si está bien verificado por el backend).
    // Por ejemplo, una ruta como POST /api/auth/sync-with-supabase o POST /api/auth/verify-and-sync
    const syncResult = await API.syncUserWithSupabase(result.session.access_token); // Asumiendo que creas esta función en api.js

    // 3. Guardar datos de sesión (ahora desde la API del backend)
    // Asumiendo que syncResult devuelve { success: true, user: { id, name, email, ... }, token: '...' }
    // Si tu backend no devuelve un token adicional (porque usa el de Supabase), solo guarda el user local.
    // const userData = syncResult.user; // Datos del usuario desde tu tabla 'users' local
    // localStorage.setItem('quetzal_token', syncResult.token || result.session.access_token); // Usar token del backend o mantener el de Supabase
    // localStorage.setItem('quetzal_user', JSON.stringify(userData));

    // O, si decides que el backend no devuelve un token nuevo, pero sí los datos del usuario local:
    const backendUserData = syncResult.user; // Datos del usuario desde tu tabla 'users' local
    // El token de Supabase ya está en result.session.access_token
    localStorage.setItem('quetzal_token', result.session.access_token); // Mantener el token de Supabase
    localStorage.setItem('quetzal_user', JSON.stringify(backendUserData)); // <-- Guardar los datos del usuario LOCAL

    showAlert('¡Inicio de sesión exitoso! Redirigiendo...', 'success');

    setTimeout(() => {
      // Redirigir según el rol (ahora usando el rol del usuario local)
      if (backendUserData.role === 'admin') { // <-- Asumiendo que 'role' viene de tu tabla local
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
