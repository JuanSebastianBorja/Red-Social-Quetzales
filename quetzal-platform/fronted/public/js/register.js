    // ============================================
    // REGISTER.JS - Lógica de Registro de Usuario
    // ============================================

    // Redireccionar si ya está autenticado
    redirectIfAuthenticated();

    // Elementos del DOM
    const registerForm = document.getElementById('register-form');
    const submitBtn = document.getElementById('submit-btn');

    // Event Listeners
    registerForm.addEventListener('submit', handleSubmit);

    // Validación en tiempo real
    document.getElementById('email').addEventListener('blur', validateEmail);
    document.getElementById('password').addEventListener('input', validatePassword);
    document.getElementById('confirmPassword').addEventListener('input', validateConfirmPassword);
    document.getElementById('phone').addEventListener('blur', validatePhone);

    /**
     * Maneja el envío del formulario
     */
    async function handleSubmit(e) {
    e.preventDefault();
    
    // Limpiar errores previos
    clearFormErrors();
    
    // Validar formulario
    if (!validateForm()) {
        return;
    }

    // Obtener datos del formulario
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        phone: document.getElementById('phone').value.trim(),
        city: document.getElementById('city').value,
        userType: document.getElementById('userType').value,
        password: document.getElementById('password').value,
        terms: document.getElementById('terms').checked
    };

    // Deshabilitar botón y mostrar loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span> Creando cuenta...';

    try {
        // Llamada a la API
        // const response = await API.register(formData);
        
        // Simulación de respuesta exitosa
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showAlert('¡Cuenta creada exitosamente! Redirigiendo...', 'success');
        
        // Redireccionar después de 2 segundos
        setTimeout(() => {
        window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        showAlert(error.message || 'Error al crear la cuenta. Intenta de nuevo.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear Cuenta';
    }
    }

    /**
     * Valida todo el formulario
     */
    function validateForm() {
    let isValid = true;

    // Validar nombre completo
    const fullName = document.getElementById('fullName').value.trim();
    if (fullName.length < 3) {
        showFieldError('fullName', 'El nombre debe tener al menos 3 caracteres');
        isValid = false;
    }

    // Validar email
    if (!validateEmail()) {
        isValid = false;
    }

    // Validar teléfono
    if (!validatePhone()) {
        isValid = false;
    }

    // Validar ciudad
    const city = document.getElementById('city').value;
    if (!city) {
        showFieldError('city', 'Selecciona tu ciudad');
        isValid = false;
    }

    // Validar tipo de usuario
    const userType = document.getElementById('userType').value;
    if (!userType) {
        showFieldError('userType', 'Selecciona el tipo de cuenta');
        isValid = false;
    }

    // Validar contraseña
    if (!validatePassword()) {
        isValid = false;
    }

    // Validar confirmación de contraseña
    if (!validateConfirmPassword()) {
        isValid = false;
    }

    // Validar términos
    const terms = document.getElementById('terms').checked;
    if (!terms) {
        showFieldError('terms', 'Debes aceptar los términos y condiciones');
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

    /**
     * Valida el teléfono
     */
    function validatePhone() {
    const phone = document.getElementById('phone').value.trim();
    
    if (!phone) {
        showFieldError('phone', 'El teléfono es requerido');
        return false;
    }
    
    if (!isValidPhone(phone)) {
        showFieldError('phone', 'Ingresa un número de teléfono válido (mínimo 10 dígitos)');
        return false;
    }
    
    return true;
    }

    /**
     * Valida la contraseña
     */
    function validatePassword() {
    const password = document.getElementById('password').value;
    
    if (!password) {
        showFieldError('password', 'La contraseña es requerida');
        return false;
    }
    
    if (!isValidPassword(password)) {
        showFieldError('password', 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
        return false;
    }
    
    return true;
    }

    /**
     * Valida la confirmación de contraseña
     */
    function validateConfirmPassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!confirmPassword) {
        showFieldError('confirmPassword', 'Confirma tu contraseña');
        return false;
    }
    
    if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        return false;
    }
    
    return true;
    }
