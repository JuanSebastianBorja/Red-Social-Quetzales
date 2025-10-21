    // ============================================
    // API.JS - Cliente HTTP para comunicación con Backend
    // ============================================

    const API_BASE_URL = 'http://localhost:3000/api'; // Cambiar en producción

    /**
     * Cliente HTTP configurado
     */
    const API = {
    /**
     * Realiza una petición HTTP
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de la petición
     * @returns {Promise<any>}
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = getAuthToken();
        
        const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
        };
        
        // Agregar token si existe
        if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Agregar body si existe
        if (options.body && config.headers['Content-Type'] === 'application/json') {
        config.body = JSON.stringify(options.body);
        }
        
        try {
        const response = await fetch(url, config);
        
        // Manejar respuestas no exitosas
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Error ${response.status}`);
        }
        
        // Manejar respuestas sin contenido
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
        } catch (error) {
        console.error('API Error:', error);
        throw error;
        }
    },
    
    // ========================================
    // AUTENTICACIÓN
    // ========================================
    
    /**
     * Registra un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>}
     */
    async register(userData) {
        return this.request('/auth/register', {
        method: 'POST',
        body: userData
        });
    },
    
    /**
     * Inicia sesión
     * @param {Object} credentials - Email y contraseña
     * @returns {Promise<Object>}
     */
    async login(credentials) {
        return this.request('/auth/login', {
        method: 'POST',
        body: credentials
        });
    },
    
    /**
     * Cierra sesión
     * @returns {Promise<void>}
     */
    async logout() {
        return this.request('/auth/logout', {
        method: 'POST'
        });
    },
    
    /**
     * Verifica el token actual
     * @returns {Promise<Object>}
     */
    async verifyToken() {
        return this.request('/auth/verify');
    },
    
    /**
     * Solicita cambio de contraseña
     * @param {string} email - Email del usuario
     * @returns {Promise<void>}
     */
    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
        method: 'POST',
        body: { email }
        });
    },
    
    /**
     * Resetea la contraseña
     * @param {string} token - Token de reset
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<void>}
     */
    async resetPassword(token, newPassword) {
        return this.request('/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword }
        });
    },
    
    // ========================================
    // USUARIOS
    // ========================================
    
    /**
     * Obtiene el perfil del usuario actual
     * @returns {Promise<Object>}
     */
    async getProfile() {
        return this.request('/users/profile');
    },
    
    /**
     * Actualiza el perfil del usuario
     * @param {Object} profileData - Datos del perfil
     * @returns {Promise<Object>}
     */
    async updateProfile(profileData) {
        return this.request('/users/profile', {
        method: 'PUT',
        body: profileData
        });
    },
    
    /**
     * Cambia la contraseña del usuario
     * @param {Object} passwords - Contraseña actual y nueva
     * @returns {Promise<void>}
     */
    async changePassword(passwords) {
        return this.request('/users/change-password', {
        method: 'POST',
        body: passwords
        });
    },
    
    /**
     * Sube un avatar
     * @param {File} file - Archivo de imagen
     * @returns {Promise<Object>}
     */
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        
        return this.request('/users/avatar', {
        method: 'POST',
        headers: {},
        body: formData
        });
    },
    
    /**
     * Obtiene un usuario por ID
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async getUser(userId) {
        return this.request(`/users/${userId}`);
    },
    
    // ========================================
    // SERVICIOS
    // ========================================
    
    /**
     * Obtiene todos los servicios
     * @param {Object} filters - Filtros de búsqueda
     * @returns {Promise<Array>}
     */
    async getServices(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return this.request(`/services?${queryParams}`);
    },
    
    /**
     * Obtiene un servicio por ID
     * @param {string} serviceId - ID del servicio
     * @returns {Promise<Object>}
     */
    async getService(serviceId) {
        return this.request(`/services/${serviceId}`);
    },
    
    /**
     * Crea un nuevo servicio
     * @param {Object} serviceData - Datos del servicio
     * @returns {Promise<Object>}
     */
    async createService(serviceData) {
        return this.request('/services', {
        method: 'POST',
        body: serviceData
        });
    },
    
    /**
     * Actualiza un servicio
     * @param {string} serviceId - ID del servicio
     * @param {Object} serviceData - Datos actualizados
     * @returns {Promise<Object>}
     */
    async updateService(serviceId, serviceData) {
        return this.request(`/services/${serviceId}`, {
        method: 'PUT',
        body: serviceData
        });
    },
    
    /**
     * Elimina un servicio
     * @param {string} serviceId - ID del servicio
     * @returns {Promise<void>}
     */
    async deleteService(serviceId) {
        return this.request(`/services/${serviceId}`, {
        method: 'DELETE'
        });
    },
    
    /**
     * Sube imágenes del servicio
     * @param {string} serviceId - ID del servicio
     * @param {Array<File>} files - Archivos de imágenes
     * @returns {Promise<Object>}
     */
    async uploadServiceImages(serviceId, files) {
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        
        return this.request(`/services/${serviceId}/images`, {
        method: 'POST',
        headers: {},
        body: formData
        });
    },
    
    /**
     * Obtiene servicios del usuario actual
     * @returns {Promise<Array>}
     */
    async getMyServices() {
        return this.request('/services/my-services');
    },
    
    // ========================================
    // CARTERA (WALLET)
    // ========================================
    
    /**
     * Obtiene el balance de la cartera
     * @returns {Promise<Object>}
     */
    async getWalletBalance() {
        return this.request('/wallet/balance');
    },
    
    /**
     * Obtiene el historial de transacciones
     * @param {Object} params - Parámetros de paginación
     * @returns {Promise<Object>}
     */
    async getTransactions(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/wallet/transactions?${queryParams}`);
    },
    
    /**
     * Compra Quetzales
     * @param {Object} purchaseData - Datos de la compra
     * @returns {Promise<Object>}
     */
    async purchaseQuetzales(purchaseData) {
        return this.request('/wallet/purchase', {
        method: 'POST',
        body: purchaseData
        });
    },
    
    /**
     * Retira fondos
     * @param {Object} withdrawData - Datos del retiro
     * @returns {Promise<Object>}
     */
    async withdrawFunds(withdrawData) {
        return this.request('/wallet/withdraw', {
        method: 'POST',
        body: withdrawData
        });
    },
    
    /**
     * Transfiere Quetzales a otro usuario
     * @param {Object} transferData - Datos de la transferencia
     * @returns {Promise<Object>}
     */
    async transferQuetzales(transferData) {
        return this.request('/wallet/transfer', {
        method: 'POST',
        body: transferData
        });
    },
    
    // ========================================
    // ESCROW
    // ========================================
    
    /**
     * Crea una transacción en Escrow
     * @param {Object} escrowData - Datos del escrow
     * @returns {Promise<Object>}
     */
    async createEscrow(escrowData) {
        return this.request('/escrow', {
        method: 'POST',
        body: escrowData
        });
    },
    
    /**
     * Libera fondos del Escrow
     * @param {string} escrowId - ID del escrow
     * @returns {Promise<Object>}
     */
    async releaseEscrow(escrowId) {
        return this.request(`/escrow/${escrowId}/release`, {
        method: 'POST'
        });
    },
    
    /**
     * Crea una disputa en Escrow
     * @param {string} escrowId - ID del escrow
     * @param {Object} disputeData - Datos de la disputa
     * @returns {Promise<Object>}
     */
    async createDispute(escrowId, disputeData) {
        return this.request(`/escrow/${escrowId}/dispute`, {
        method: 'POST',
        body: disputeData
        });
    },
    
    /**
     * Obtiene el estado de un Escrow
     * @param {string} escrowId - ID del escrow
     * @returns {Promise<Object>}
     */
    async getEscrowStatus(escrowId) {
        return this.request(`/escrow/${escrowId}`);
    },
    
    // ========================================
    // CALIFICACIONES
    // ========================================
    
    /**
     * Crea una calificación
     * @param {Object} ratingData - Datos de la calificación
     * @returns {Promise<Object>}
     */
    async createRating(ratingData) {
        return this.request('/ratings', {
        method: 'POST',
        body: ratingData
        });
    },
    
    /**
     * Obtiene calificaciones de un servicio
     * @param {string} serviceId - ID del servicio
     * @returns {Promise<Array>}
     */
    async getServiceRatings(serviceId) {
        return this.request(`/ratings/service/${serviceId}`);
    },
    
    /**
     * Obtiene calificaciones de un usuario
     * @param {string} userId - ID del usuario
     * @returns {Promise<Array>}
     */
    async getUserRatings(userId) {
        return this.request(`/ratings/user/${userId}`);
    },
    
    // ========================================
    // MENSAJERÍA
    // ========================================
    
    /**
     * Obtiene conversaciones del usuario
     * @returns {Promise<Array>}
     */
    async getConversations() {
        return this.request('/messages/conversations');
    },
    
    /**
     * Obtiene mensajes de una conversación
     * @param {string} conversationId - ID de la conversación
     * @returns {Promise<Array>}
     */
    async getMessages(conversationId) {
        return this.request(`/messages/conversations/${conversationId}`);
    },
    
    /**
     * Envía un mensaje
     * @param {Object} messageData - Datos del mensaje
     * @returns {Promise<Object>}
     */
    async sendMessage(messageData) {
        return this.request('/messages', {
        method: 'POST',
        body: messageData
        });
    },
    
    /**
     * Marca mensajes como leídos
     * @param {string} conversationId - ID de la conversación
     * @returns {Promise<void>}
     */
    async markAsRead(conversationId) {
        return this.request(`/messages/conversations/${conversationId}/read`, {
        method: 'PUT'
        });
    },
    
    // ========================================
    // NOTIFICACIONES
    // ========================================
    
    /**
     * Obtiene notificaciones del usuario
     * @returns {Promise<Array>}
     */
    async getNotifications() {
        return this.request('/notifications');
    },
    
    /**
     * Marca notificación como leída
     * @param {string} notificationId - ID de la notificación
     * @returns {Promise<void>}
     */
    async markNotificationAsRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, {
        method: 'PUT'
        });
    },
    
    /**
     * Marca todas las notificaciones como leídas
     * @returns {Promise<void>}
     */
    async markAllNotificationsAsRead() {
        return this.request('/notifications/read-all', {
        method: 'PUT'
        });
    },
    
    /**
     * Actualiza preferencias de notificaciones
     * @param {Object} preferences - Preferencias
     * @returns {Promise<Object>}
     */
    async updateNotificationPreferences(preferences) {
        return this.request('/notifications/preferences', {
        method: 'PUT',
        body: preferences
        });
    },
    
    // ========================================
    // SOLICITUDES DE SERVICIO
    // ========================================
    
    /**
     * Crea una solicitud de servicio
     * @param {Object} requestData - Datos de la solicitud
     * @returns {Promise<Object>}
     */
    async createServiceRequest(requestData) {
        return this.request('/service-requests', {
        method: 'POST',
        body: requestData
        });
    },
    
    /**
     * Obtiene solicitudes de servicio
     * @param {string} status - Estado de las solicitudes
     * @returns {Promise<Array>}
     */
    async getServiceRequests(status = null) {
        const query = status ? `?status=${status}` : '';
        return this.request(`/service-requests${query}`);
    },
    
    /**
     * Acepta una solicitud de servicio
     * @param {string} requestId - ID de la solicitud
     * @returns {Promise<Object>}
     */
    async acceptServiceRequest(requestId) {
        return this.request(`/service-requests/${requestId}/accept`, {
        method: 'PUT'
        });
    },
    
    /**
     * Rechaza una solicitud de servicio
     * @param {string} requestId - ID de la solicitud
     * @param {string} reason - Razón del rechazo
     * @returns {Promise<Object>}
     */
    async rejectServiceRequest(requestId, reason) {
        return this.request(`/service-requests/${requestId}/reject`, {
        method: 'PUT',
        body: { reason }
        });
    },
    
    /**
     * Completa una solicitud de servicio
     * @param {string} requestId - ID de la solicitud
     * @returns {Promise<Object>}
     */
    async completeServiceRequest(requestId) {
        return this.request(`/service-requests/${requestId}/complete`, {
        method: 'PUT'
        });
    },
    
    // ========================================
    // ADMINISTRACIÓN
    // ========================================
    
    /**
     * Obtiene métricas de la plataforma (solo admin)
     * @returns {Promise<Object>}
     */
    async getPlatformMetrics() {
        return this.request('/admin/metrics');
    },
    
    /**
     * Obtiene usuarios pendientes de verificación (solo admin)
     * @returns {Promise<Array>}
     */
    async getPendingVerifications() {
        return this.request('/admin/verifications/pending');
    },
    
    /**
     * Aprueba un usuario (solo admin)
     * @param {string} userId - ID del usuario
     * @returns {Promise<void>}
     */
    async approveUser(userId) {
        return this.request(`/admin/users/${userId}/approve`, {
        method: 'PUT'
        });
    },
    
    /**
     * Suspende un usuario (solo admin)
     * @param {string} userId - ID del usuario
     * @param {string} reason - Razón de la suspensión
     * @returns {Promise<void>}
     */
    async suspendUser(userId, reason) {
        return this.request(`/admin/users/${userId}/suspend`, {
        method: 'PUT',
        body: { reason }
        });
    },
    
    /**
     * Obtiene disputas activas (solo admin)
     * @returns {Promise<Array>}
     */
    async getActiveDisputes() {
        return this.request('/admin/disputes');
    },
    
    /**
     * Resuelve una disputa (solo admin)
     * @param {string} disputeId - ID de la disputa
     * @param {Object} resolution - Resolución de la disputa
     * @returns {Promise<Object>}
     */
    async resolveDispute(disputeId, resolution) {
        return this.request(`/admin/disputes/${disputeId}/resolve`, {
        method: 'PUT',
        body: resolution
        });
    }
    };

    // Exportar para uso en módulos
    if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
    }