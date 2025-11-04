    // ============================================
    // QUETZAL PLATFORM - UTILIDADES
    // ============================================

    /**
     * Muestra un mensaje de alerta en el contenedor especificado
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de alerta: 'success', 'error', 'warning', 'info'
     * @param {string} containerId - ID del contenedor donde mostrar la alerta
     */
    function showAlert(message, type = 'info', containerId = 'alert-container') {
    const alertContainer = document.getElementById(containerId);
    if (!alertContainer) return;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const alertClass = `alert-${type}`;
    const icon = icons[type] || icons.info;

    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
        <span style="font-size: 1.25rem;">${icon}</span>
        <span>${message}</span>
        </div>
    `;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 300);
        }
    }, 5000);
    }

    /**
     * Muestra un error en un campo específico del formulario
     * @param {string} fieldId - ID del campo
     * @param {string} message - Mensaje de error
     */
    function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);

    if (errorElement) {
        errorElement.textContent = message;
    }

    if (inputElement) {
        inputElement.classList.add('error');
    }
    }

    /**
     * Limpia todos los errores de formulario
     */
    function clearFormErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    const inputElements = document.querySelectorAll('.form-input, .form-select, .form-textarea');

    errorElements.forEach(el => el.textContent = '');
    inputElements.forEach(el => el.classList.remove('error'));
    }

    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean}
     */
    function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
    }

    /**
     * Valida una contraseña (mínimo 8 caracteres, una mayúscula y un número)
     * @param {string} password - Contraseña a validar
     * @returns {boolean}
     */
    function isValidPassword(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
    }

    /**
     * Valida un teléfono (mínimo 10 dígitos)
     * @param {string} phone - Teléfono a validar
     * @returns {boolean}
     */
    function isValidPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
    }

    /**
     * Formatea un número como precio en Quetzales
     * @param {number} amount - Cantidad a formatear
     * @returns {string}
     */
    function formatQuetzales(amount) {
    return `${amount.toFixed(1)} Q`;
    }

    /**
     * Formatea un número como precio en pesos colombianos
     * @param {number} amount - Cantidad a formatear
     * @returns {string}
     */
    function formatCOP(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
    }

    /**
     * Convierte Quetzales a Pesos Colombianos
     * @param {number} quetzales - Cantidad en Quetzales
     * @returns {number}
     */
    function quetzalesToCOP(quetzales) {
    return quetzales * 10000;
    }

    /**
     * Convierte Pesos Colombianos a Quetzales
     * @param {number} cop - Cantidad en Pesos
     * @returns {number}
     */
    function copToQuetzales(cop) {
    return cop / 10000;
    }

    /**
     * Formatea una fecha en formato legible
     * @param {string|Date} date - Fecha a formatear
     * @returns {string}
     */
    function formatDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('es-CO', options);
    }

    /**
     * Formatea una fecha con hora
     * @param {string|Date} date - Fecha a formatear
     * @returns {string}
     */
    function formatDateTime(date) {
    const d = new Date(date);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return d.toLocaleDateString('es-CO', options);
    }

    /**
     * Obtiene el tiempo transcurrido desde una fecha
     * @param {string|Date} date - Fecha
     * @returns {string}
     */
    function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' años';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' meses';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' días';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' horas';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutos';

    return 'Hace un momento';
    }

    /**
     * Debounce function para optimizar búsquedas
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function}
     */
    function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
        clearTimeout(timeout);
        func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
    }

    /**
     * Obtiene el usuario autenticado del localStorage
     * @returns {Object|null}
     */
    function getAuthUser() {
    const userStr = localStorage.getItem('quetzal_user');
    return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Obtiene el token de autenticación
     * @returns {string|null}
     */
    function getAuthToken() {
    return localStorage.getItem('quetzal_token');
    }

    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean}
     */
    function isAuthenticated() {
    return !!getAuthToken();
    }

/**
 * Cierra sesión del usuario
 */
function logout() {
  localStorage.removeItem('quetzal_token');
  localStorage.removeItem('quetzal_user');
  window.location.href = '../public/index.html';
}

/**
 * Protege una página para usuarios autenticados
 */
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

/**
 * Redirecciona si el usuario ya está autenticado (para páginas de login/registro)
 */
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
  }
}

    /**
     * Trunca un texto a una longitud específica
     * @param {string} text - Texto a truncar
     * @param {number} length - Longitud máxima
     * @returns {string}
     */
    function truncateText(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
    }

    /**
     * Genera iniciales desde un nombre
     * @param {string} name - Nombre completo
     * @returns {string}
     */
    function getInitials(name) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    /**
     * Copia texto al portapapeles
     * @param {string} text - Texto a copiar
     */
    async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showAlert('Copiado al portapapeles', 'success');
    } catch (err) {
        showAlert('Error al copiar', 'error');
    }
    }

    /**
     * Valida un archivo de imagen
     * @param {File} file - Archivo a validar
     * @param {number} maxSizeMB - Tamaño máximo en MB
     * @returns {Object} {valid: boolean, error: string}
     */
    function validateImageFile(file, maxSizeMB = 5) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
        return {
        valid: false,
        error: 'El archivo debe ser una imagen (JPG, PNG, GIF o WebP)'
        };
    }

    if (file.size > maxSize) {
        return {
        valid: false,
        error: `La imagen no debe superar ${maxSizeMB}MB`
        };
    }

    return { valid: true };
    }

    /**
     * Lee un archivo como Data URL
     * @param {File} file - Archivo a leer
     * @returns {Promise<string>}
     */
    function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
    }

    /**
     * Sanitiza una cadena de texto para prevenir XSS
     * @param {string} str - Texto a sanitizar
     * @returns {string}
     */
    function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
    }

    /**
     * Genera un ID único
     * @returns {string}
     */
    function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Maneja errores de forma consistente
     * @param {Error} error - Error a manejar
     * @param {string} defaultMessage - Mensaje por defecto
     */
    function handleError(error, defaultMessage = 'Ha ocurrido un error') {
    console.error(error);
    const message = error.message || defaultMessage;
    showAlert(message, 'error');
    }

    // Hacer disponibles las funciones de formateo para otros módulos
    if (typeof window !== 'undefined') {
    window.utils = {
        showAlert,
        showFieldError,
        clearFormErrors,
        isValidEmail,
        isValidPassword,
        isValidPhone,
        formatQuetzales,
        formatCOP,
        quetzalesToCOP,
        copToQuetzales,
        formatDate,
        formatDateTime,
        getTimeAgo,
        debounce,
        getAuthUser,
        getAuthToken,
        isAuthenticated,
        logout,
        requireAuth,
        redirectIfAuthenticated,
        truncateText,
        getInitials,
        copyToClipboard,
        validateImageFile,
        readFileAsDataURL,
        sanitizeHTML,
        generateId,
        handleError
    };
    }
