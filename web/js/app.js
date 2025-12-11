/**
 * Quetzal Platform - Main Application Entry Point
 * Imports all modules and initializes the application
 */

import { CONFIG } from './config.js';
import { Roles, RoleLabels, hasPermission } from './roles.js';
import { AppState, updateState } from './state.js';
import { Utils } from './utils.js';
import { API } from './api.js';
import { Auth } from './auth.js';
import { Dashboard } from './dashboard.js';
import { NotificationUI } from './notifications-ui.js'; 

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Quetzal Platform iniciando...');
    
    // Verificar si el usuario está autenticado
    if (!Auth.isAuthenticated()) {
        console.log('👤 Usuario no autenticado, redirigiendo a landing...');
        window.location.href = '/vistas/visitante.html';
        return;
    }
    
    // 🌐 Inicializar WebSocket y notificaciones globales
    await initGlobalNotifications();
    
    // Inicializar dashboard
    Dashboard.init();
    
    // Listener para navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');
            const hasPage = item.hasAttribute('data-page');

            if (href && href.startsWith('/')) {
                return;
            }

            if (hasPage) {
                e.preventDefault();
            }
            
            if (item.classList.contains('hidden')) return;
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const page = item.getAttribute('data-page');
            if (page) {
                console.log('📄 Navegando a:', page);
            }
        });
    });
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
    
    console.log('✅ Aplicación lista');
    console.log('💡 Tip: Usa testRole("provider") para cambiar de rol en desarrollo');
});

// Sistema global de notificaciones
async function initGlobalNotifications() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    if (!token) return;

    try {
        const userRes = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!userRes.ok) return;

        const user = await userRes.json();
        const socket = io(CONFIG.API_BASE_URL, { auth: { token } });

        // Inicializar UI de notificaciones si el botón existe
        if (document.getElementById('notifications-btn')) {
            const notifUI = new NotificationUI();
            notifUI.init(socket);

            // Opcional: actualizar avatar y rol
            const avatarEl = document.getElementById('user-avatar');
            const roleBadge = document.getElementById('user-role-badge');
            if (avatarEl) {
                avatarEl.src = user.avatar || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=6366f1&color=fff`;
            }
            if (roleBadge) {
                const labels = { consumer: 'Cliente', provider: 'Proveedor', both: 'Ambos' };
                roleBadge.textContent = labels[user.user_type] || user.user_type;
            }
        }
    } catch (err) {
        console.error('Error initializing notifications:', err);
    }
}

// Exponer funciones de testing en desarrollo
if (CONFIG.API_BASE_URL.includes('localhost')) {
    window.testRole = (role) => {
        if (Auth.changeRole(role)) {
            Dashboard.init();
        }
    };
    
    window.testLogin = async (email = 'demo@quetzal.com', password = 'Demo123') => {
        const success = await Auth.login(email, password);
        if (success) {
            Dashboard.init();
        }
        return success;
    };
}

// Exportar para uso global
window.Quetzal = {
    CONFIG,
    Roles,
    RoleLabels,
    AppState,
    Utils,
    API,
    Auth,
    Dashboard,
    hasPermission
};