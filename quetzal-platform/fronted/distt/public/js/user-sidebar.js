/**
 * User Sidebar Component
 * Funcionalidad para el sidebar desplegable de usuario
 */

// Inicializar sidebar
function initUserSidebar() {
    const sidebar = document.getElementById('userSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (!sidebar || !sidebarToggle) return;

    // Toggle Sidebar
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('open');
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('active');
        }
    });

    // Cerrar al hacer click en overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Responsive: Cerrar sidebar en móviles por defecto
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
    }

    // Cerrar sidebar al cambiar de pantalla grande a móvil
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        }
    });

    // Cargar datos del usuario en el sidebar
    loadUserSidebarData();
}

// Cargar datos del usuario
async function loadUserSidebarData() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        // Nombre del usuario
        const nameElements = document.querySelectorAll('#sidebar-user-name');
        nameElements.forEach(el => {
            el.textContent = user.name || user.email;
        });

        // Email del usuario
        const emailElement = document.getElementById('sidebar-user-email');
        if (emailElement) {
            emailElement.textContent = user.email;
        }

        // Avatar
        const avatarElements = document.querySelectorAll('#sidebar-avatar');
        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&size=128&background=8b5cf6&color=fff`;
        avatarElements.forEach(el => {
            el.src = avatarUrl;
        });

        // Balance
        await loadUserBalance();

        // Mensajes no leídos
        await loadUnreadMessages();

    } catch (error) {
        console.error('Error loading user sidebar data:', error);
    }
}

// Cargar balance del usuario
async function loadUserBalance() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/wallet/balance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const balanceElements = document.querySelectorAll('#sidebar-balance');
            balanceElements.forEach(el => {
                el.textContent = `Q ${data.balance.toFixed(2)}`;
            });
        }
    } catch (error) {
        console.error('Error loading balance:', error);
    }
}

// Cargar mensajes no leídos
async function loadUnreadMessages() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Simulado - reemplazar con API real
        const unreadCount = 3;
        const badge = document.getElementById('messages-badge');
        if (badge && unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading unread messages:', error);
    }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserSidebar);
} else {
    initUserSidebar();
}
