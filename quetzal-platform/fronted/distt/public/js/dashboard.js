// ============================================
// DASHBOARD.JS - Feed social
// ============================================

const DashboardController = {
    async init() {
        try {
            await this.loadUserProfile();
            await Promise.all([
                this.loadFeed(),
                this.loadNotifications()
            ]);

            // Composer
            const postBtn = document.getElementById('composer-post');
            if (postBtn) postBtn.addEventListener('click', () => this.handleCompose());

            const loadMore = document.getElementById('load-more');
            if (loadMore) loadMore.addEventListener('click', () => this.loadFeed(true));

            // Logout
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            showError && showError('Error al cargar el inicio');
        }
    },

    async loadUserProfile() {
        try {
            const profile = await API.getProfile();
            document.getElementById('sidebar-user-name').textContent = profile.name || profile.username || 'Usuario';
            document.getElementById('sidebar-bio').textContent = profile.bio || '';
            const avatar = document.getElementById('small-avatar');
            if (avatar && profile.avatar) avatar.src = profile.avatar;
            this.currentUserId = profile.id || profile.userId || profile._id;
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    },

    // feed paging state
    feedPage: 1,
    feedPageSize: 10,

    async loadFeed(loadMore = false) {
        try {
            if (!loadMore) {
                this.feedPage = 1;
                document.getElementById('feed-list').innerHTML = '';
            } else {
                this.feedPage++;
            }

            const params = { page: this.feedPage, limit: this.feedPageSize };
            const services = await API.getServices(params) || [];

            // Filtrar publicaciones del propio usuario para el feed
            const feedItems = services.filter(s => {
                const ownerId = s.userId || s.user || s.authorId || s.userId;
                return !this.currentUserId || ownerId !== this.currentUserId;
            });

            const container = document.getElementById('feed-list');
            feedItems.forEach(service => {
                const el = document.createElement('div');
                el.className = 'post-card card mb-4';
                const authorName = (service.user && (service.user.name || service.user.username)) || service.authorName || 'Proveedor';
                const img = (service.images && service.images[0]) || '/public/img/placeholder.jpg';
                const avatarUrl = (service.user && service.user.avatar) ? service.user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=48&background=6366f1&color=fff`;
                el.innerHTML = `
                    <div class="card-body">
                        <div class="post-header flex items-center gap-3">
                            <img src="${avatarUrl}" class="avatar avatar-sm" />
                            <div>
                                <strong>${authorName}</strong>
                                <div class="muted">${timeAgo(new Date(service.createdAt || service.created_at || Date.now()))}</div>
                            </div>
                        </div>
                        <h4 class="post-title mt-3">${service.title || service.name}</h4>
                        <p class="post-text">${(service.description || service.summary || '').slice(0, 300)}</p>
                        <div class="flex items-center justify-between mt-3">
                            <div class="price">Q${(service.price || 0).toFixed(2)}</div>
                            <div>
                                <a href="profile.html?id=${service.user && service.user.id ? service.user.id : service.userId || ''}" class="btn btn-sm btn-outline">Ver perfil</a>
                                <a href="services.html?id=${service.id}" class="btn btn-sm btn-primary">Solicitar</a>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(el);
            });
        } catch (error) {
            console.error('Error loading feed:', error);
        }
    },

    async handleCompose() {
        const text = document.getElementById('composer-text').value.trim();
        if (!text) return showError ? showError('Escribe algo para publicar') : alert('Escribe algo para publicar');

        // Try to parse a simple title/price from composer (very simple approach)
        const title = text.split('\n')[0].slice(0, 80);
        const description = text;
        const priceMatch = text.match(/Q\s*(\d+\.?\d*)/i);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

        try {
            await API.createService({ title, description, price });
            document.getElementById('composer-text').value = '';
            // recargar feed
            this.loadFeed(false);
        } catch (err) {
            console.error(err);
            showError ? showError('Error al publicar') : alert('Error al publicar');
        }
    },

    async loadNotifications() {
        try {
            const notifications = await API.getNotifications();
            const container = document.getElementById('notifications-list');
            container.innerHTML = notifications.map(n => `<div class="notification-item ${n.read ? '' : 'unread'}"><div>${n.message}</div><small class="muted">${timeAgo(new Date(n.createdAt || n.created_at))}</small></div>`).join('');
        } catch (err) {
            console.error(err);
        }
    }
};

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
    if (seconds < 10) return 'ahora mismo';
    return Math.floor(seconds) + ' segundos atrás';
}

document.addEventListener('DOMContentLoaded', () => {
    DashboardController.init();
});
