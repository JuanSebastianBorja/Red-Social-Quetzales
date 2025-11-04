// ============================================
// DASHBOARD.JS - Controlador del Dashboard
// ============================================

const DashboardController = {
    async init() {
        try {
            await this.loadUserProfile();
            await Promise.all([
                this.loadWalletInfo(),
                this.loadActiveServices(),
                this.loadRecentTransactions(),
                this.loadNotifications()
            ]);
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showError('Error al cargar el dashboard');
        }
    },

    async loadUserProfile() {
        try {
            const profile = await API.getProfile();
            document.getElementById('user-name').textContent = profile.name;
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    },

    async loadWalletInfo() {
        try {
            const balance = await API.getWalletBalance();
            document.getElementById('balance-quetzales').textContent = `Q${balance.balance.toFixed(2)}`;
            document.getElementById('balance-cop').textContent = `$${(balance.balance * 10000).toLocaleString()} COP`;
            document.getElementById('pending-escrow').textContent = `Q${balance.escrowBalance.toFixed(2)}`;
        } catch (error) {
            console.error('Error loading wallet:', error);
        }
    },

    async loadActiveServices() {
        try {
            const services = await API.getMyServices();
            const activeServices = services.filter(s => s.status === 'active').slice(0, 4);
            
            const container = document.getElementById('active-services');
            container.innerHTML = activeServices.map(service => `
                <div class="service-card">
                    <div class="service-card-image">
                        <img src="${service.images[0] || '../public/img/placeholder.jpg'}" alt="${service.title}">
                    </div>
                    <div class="service-card-content">
                        <h4>${service.title}</h4>
                        <p class="price">Q${service.price.toFixed(2)}</p>
                        <div class="flex justify-between items-center mt-2">
                            <span class="status status-${service.status}">${service.status}</span>
                            <a href="edit-service.html?id=${service.id}" class="btn btn-sm btn-secondary">Editar</a>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading services:', error);
        }
    },

    async loadRecentTransactions() {
        try {
            const transactions = await API.getTransactions({ limit: 5 });
            const container = document.getElementById('recent-transactions');
            
            container.innerHTML = transactions.map(tx => `
                <div class="transaction-item">
                    <div class="transaction-icon ${tx.type}">
                        ${this.getTransactionIcon(tx.type)}
                    </div>
                    <div class="transaction-info">
                        <div class="transaction-title">${tx.description}</div>
                        <div class="transaction-date">${new Date(tx.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div class="transaction-amount ${tx.amount > 0 ? 'positive' : 'negative'}">
                        ${tx.amount > 0 ? '+' : ''}Q${tx.amount.toFixed(2)}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    },

    async loadNotifications() {
        try {
            const notifications = await API.getNotifications();
            const container = document.getElementById('notifications-list');
            
            container.innerHTML = notifications.map(notification => `
                <div class="notification-item ${notification.read ? '' : 'unread'}">
                    <div class="notification-icon">
                        ${this.getNotificationIcon(notification.type)}
                    </div>
                    <div class="notification-content">
                        <p>${notification.message}</p>
                        <small>${timeAgo(new Date(notification.createdAt))}</small>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    },

    getTransactionIcon(type) {
        const icons = {
            'deposit': '💰',
            'withdrawal': '💸',
            'transfer': '↔️',
            'escrow': '🔒',
            'release': '🔓',
            'refund': '↩️'
        };
        return icons[type] || '💱';
    },

    getNotificationIcon(type) {
        const icons = {
            'service': '✨',
            'payment': '💰',
            'message': '💬',
            'system': '⚙️',
            'alert': '⚠️'
        };
        return icons[type] || 'ℹ️';
    }
};

// Helper function para tiempo relativo
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + ' años atrás';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + ' meses atrás';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + ' días atrás';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + ' horas atrás';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + ' minutos atrás';
    
    if(seconds < 10) return 'ahora mismo';
    
    return Math.floor(seconds) + ' segundos atrás';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    DashboardController.init();
});