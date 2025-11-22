// ============================================
// AUTH.JS - Funciones de Autenticación y Autorización
// ============================================

// Verificar si el usuario está autenticado
function isAuthenticated() {
    const token = localStorage.getItem('quetzal_token');
    return !!token;
}

// Obtener usuario actual
function getCurrentUser() {
    const userStr = localStorage.getItem('quetzal_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Verificar si el usuario tiene un rol específico
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// Verificar si es administrador
function isAdmin() {
    return hasRole('admin');
}

// Verificar si es usuario registrado
function isUser() {
    return hasRole('user') || hasRole('admin');
}

// Redirigir según el rol del usuario
function redirectByRole() {
    if (!isAuthenticated()) {
        window.location.href = 'landing-page.html';
        return;
    }

    const user = getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();

    // Si es admin y está en una página de admin, permitir
    if (user.role === 'admin' && currentPage.startsWith('admin-')) {
        return;
    }

    // Si es admin pero no está en página de admin, redirigir a admin dashboard
    if (user.role === 'admin' && !currentPage.startsWith('admin-')) {
        // Permitir acceso a páginas de usuario también
        return;
    }

    // Si es usuario normal e intenta acceder a admin, bloquear
    if (user.role !== 'admin' && currentPage.startsWith('admin-')) {
        alert('No tienes permisos de administrador');
        window.location.href = 'dashboard.html';
        return;
    }
}

// Proteger página - requiere autenticación
function requireAuth() {
    if (!isAuthenticated()) {
        alert('Debes iniciar sesión para acceder a esta página');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Proteger página - requiere rol de administrador
function requireAdmin() {
    if (!requireAuth()) return false;
    
    if (!isAdmin()) {
        alert('No tienes permisos de administrador');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// Guardar sesión después del login
function saveSession(token, user) {
    localStorage.setItem('quetzal_token', token);
    localStorage.setItem('quetzal_user', JSON.stringify(user));
}

// Cerrar sesión
function logout() {
    if (confirm('¿Cerrar sesión?')) {
        localStorage.removeItem('quetzal_token');
        localStorage.removeItem('quetzal_user');
        window.location.href = 'landing-page.html';
    }
}

// Redirigir después del login según el rol
function redirectAfterLogin() {
    const user = getCurrentUser();
    
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Verificar sesión activa
async function verifySession() {
    if (!isAuthenticated()) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('quetzal_token')}`
            }
        });

        if (!response.ok) {
            // Token inválido o expirado
            localStorage.removeItem('quetzal_token');
            localStorage.removeItem('quetzal_user');
            return false;
        }

        const data = await response.json();
        if (data.success) {
            // Actualizar datos del usuario
            localStorage.setItem('quetzal_user', JSON.stringify(data.data.user));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return false;
    }
}

// Auto-ejecutar verificación de roles en páginas protegidas
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Páginas de admin
    if (currentPage.startsWith('admin-')) {
        requireAdmin();
    }
    
    // Páginas que requieren autenticación
    const protectedPages = [
        'dashboard.html',
        'profile.html',
        'wallet.html',
        'messages.html',
        'create-service.html',
        'edit-service.html'
    ];
    
    if (protectedPages.includes(currentPage)) {
        requireAuth();
    }

    // Redirigir si ya está logueado y está en login/register
    const publicPages = ['login.html', 'register.html', 'index.html'];
    if (publicPages.includes(currentPage) && isAuthenticated()) {
        redirectAfterLogin();
    }
});
