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
        // Llamada a la API
        // const response = await API.login(formData);
        
        // Simulación de login exitoso
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Guardar datos de sesión
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20ifQ.mock';
        const mockUser = {
        id: '1',
        name: 'Usuario Demo',
        email: formData.email,
        userType: 'both',
        avatar: `https://ui-avatars.com/api/?name=Usuario+Demo&size=120&background=6366f1&color=fff`
        };
        
        localStorage.setItem('quetzal_token', mockToken);
        localStorage.setItem('quetzal_user', JSON.stringify(mockUser));
        
        showAlert('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
        
        setTimeout(() => {
        window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        showAlert('Email o contraseña incorrectos', 'error');
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