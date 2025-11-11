// ============================================    // ============================================

// API.JS - Cliente adaptado para Supabase    // API.JS - Cliente HTTP para comunicación con Backend

// ============================================    // ============================================



// Detectar si estamos en producción    import config from './config.js';

const isProduction = window.location.hostname !== 'localhost' &&     const API_BASE_URL = config.api.baseUrl;

                     window.location.hostname !== '127.0.0.1' &&

                     !window.location.hostname.includes('192.168');    /**

     * Cliente HTTP configurado

// Configuración de Supabase     */

const SUPABASE_URL = 'https://sgttyuuvuakaybzrzwdx.supabase.co';    const API = {

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndHR5dXV2dWFrYXlienJ6d2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODIyMDEsImV4cCI6MjA3ODQ1ODIwMX0.V_kM1LuWgYkavW1x53OE3Cb2Axa9oLfDr80I9SQCRYg';    /**

     * Realiza una petición HTTP

// Inicializar cliente de Supabase solo si window.supabase existe     * @param {string} endpoint - Endpoint de la API

let supabase = null;     * @param {Object} options - Opciones de la petición

if (typeof window !== 'undefined' && window.supabase) {     * @returns {Promise<any>}

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);     */

}    async request(endpoint, options = {}) {

        const url = `${API_BASE_URL}${endpoint}`;

// Helper functions        const token = getAuthToken();

function getAuthToken() {        

    return localStorage.getItem('token');        const config = {

}        method: options.method || 'GET',

        headers: {

function setAuthToken(token) {            'Content-Type': 'application/json',

    if (token) {            ...options.headers

        localStorage.setItem('token', token);        },

    } else {        ...options

        localStorage.removeItem('token');        };

    }        

}        // Agregar token si existe

        if (token) {

function getCurrentUser() {        config.headers['Authorization'] = `Bearer ${token}`;

    const userStr = localStorage.getItem('user');        }

    return userStr ? JSON.parse(userStr) : null;        

}        // Agregar body si existe

        if (options.body && config.headers['Content-Type'] === 'application/json') {

function setCurrentUser(user) {        config.body = JSON.stringify(options.body);

    if (user) {        }

        localStorage.setItem('user', JSON.stringify(user));        

    } else {        try {

        localStorage.removeItem('user');        const response = await fetch(url, config);

    }        

}        // Manejar respuestas no exitosas

        if (!response.ok) {

/**            const error = await response.json();

 * Cliente API que usa Supabase en producción            throw new Error(error.message || `Error ${response.status}`);

 */        }

const API = {        

    // ========================================        // Manejar respuestas sin contenido

    // AUTENTICACIÓN        if (response.status === 204) {

    // ========================================            return null;

            }

    async register(userData) {        

        if (!supabase) throw new Error('Supabase no está inicializado');        return await response.json();

                } catch (error) {

        const { data, error } = await supabase.auth.signUp({        console.error('API Error:', error);

            email: userData.email,        throw error;

            password: userData.password,        }

            options: {    },

                data: {    

                    full_name: userData.fullName,    // ========================================

                    phone: userData.phone,    // AUTENTICACIÓN

                    city: userData.city,    // ========================================

                    user_type: userData.userType || 'both',    

                    bio: userData.bio || ''    /**

                }     * Registra un nuevo usuario

            }     * @param {Object} userData - Datos del usuario

        });     * @returns {Promise<Object>}

             */

        if (error) throw new Error(error.message);    async register(userData) {

                return this.request('/auth/register', {

        // Guardar token y usuario        method: 'POST',

        if (data.session) {        body: userData

            setAuthToken(data.session.access_token);        });

            setCurrentUser(data.user);    },

        }    

            /**

        return {     * Inicia sesión

            success: true,     * @param {Object} credentials - Email y contraseña

            message: 'Registro exitoso',     * @returns {Promise<Object>}

            token: data.session?.access_token,     */

            user: data.user    async login(credentials) {

        };        return this.request('/auth/login', {

    },        method: 'POST',

            body: credentials

    async login(credentials) {        });

        if (!supabase) throw new Error('Supabase no está inicializado');    },

            

        const { data, error } = await supabase.auth.signInWithPassword({    /**

            email: credentials.email,     * Cierra sesión

            password: credentials.password     * @returns {Promise<void>}

        });     */

            async logout() {

        if (error) throw new Error(error.message);        return this.request('/auth/logout', {

                method: 'POST'

        // Guardar token y usuario        });

        if (data.session) {    },

            setAuthToken(data.session.access_token);    

            setCurrentUser(data.user);    /**

        }     * Verifica el token actual

             * @returns {Promise<Object>}

        return {     */

            success: true,    async verifyToken() {

            message: 'Login exitoso',        return this.request('/auth/verify');

            token: data.session?.access_token,    },

            user: data.user    

        };    /**

    },     * Solicita cambio de contraseña

         * @param {string} email - Email del usuario

    async logout() {     * @returns {Promise<void>}

        if (!supabase) throw new Error('Supabase no está inicializado');     */

            async forgotPassword(email) {

        const { error } = await supabase.auth.signOut();        return this.request('/auth/forgot-password', {

        if (error) throw new Error(error.message);        method: 'POST',

                body: { email }

        // Limpiar localStorage        });

        setAuthToken(null);    },

        setCurrentUser(null);    

            /**

        return { success: true, message: 'Sesión cerrada' };     * Resetea la contraseña

    },     * @param {string} token - Token de reset

         * @param {string} newPassword - Nueva contraseña

    async verifyToken() {     * @returns {Promise<void>}

        if (!supabase) throw new Error('Supabase no está inicializado');     */

            async resetPassword(token, newPassword) {

        const { data: { user }, error } = await supabase.auth.getUser();        return this.request('/auth/reset-password', {

        if (error) throw new Error(error.message);        method: 'POST',

                body: { token, newPassword }

        return {        });

            success: true,    },

            user: user    

        };    // ========================================

    },    // USUARIOS

        // ========================================

    async forgotPassword(email) {    

        if (!supabase) throw new Error('Supabase no está inicializado');    /**

             * Obtiene el perfil del usuario actual

        const { error } = await supabase.auth.resetPasswordForEmail(email);     * @returns {Promise<Object>}

        if (error) throw new Error(error.message);     */

            async getProfile() {

        return { success: true, message: 'Email de recuperación enviado' };        return this.request('/users/profile');

    },    },

        

    async resetPassword(token, newPassword) {    /**

        if (!supabase) throw new Error('Supabase no está inicializado');     * Actualiza el perfil del usuario

             * @param {Object} profileData - Datos del perfil

        const { error } = await supabase.auth.updateUser({ password: newPassword });     * @returns {Promise<Object>}

        if (error) throw new Error(error.message);     */

            async updateProfile(profileData) {

        return { success: true, message: 'Contraseña actualizada' };        return this.request('/users/profile', {

    },        method: 'PUT',

            body: profileData

    // ========================================        });

    // USUARIOS    },

    // ========================================    

        /**

    async getProfile() {     * Cambia la contraseña del usuario

        if (!supabase) throw new Error('Supabase no está inicializado');     * @param {Object} passwords - Contraseña actual y nueva

             * @returns {Promise<void>}

        const { data: { user }, error } = await supabase.auth.getUser();     */

        if (error) throw new Error(error.message);    async changePassword(passwords) {

                return this.request('/users/change-password', {

        // Obtener datos adicionales del usuario de la tabla users        method: 'POST',

        const { data: userData, error: userError } = await supabase        body: passwords

            .from('users')        });

            .select('*')    },

            .eq('id', user.id)    

            .single();    /**

             * Sube un avatar

        if (userError && userError.code !== 'PGRST116') {     * @param {File} file - Archivo de imagen

            throw new Error(userError.message);     * @returns {Promise<Object>}

        }     */

            async uploadAvatar(file) {

        return {        const formData = new FormData();

            success: true,        formData.append('avatar', file);

            data: userData || user        

        };        return this.request('/users/avatar', {

    },        method: 'POST',

            headers: {},

    async updateProfile(profileData) {        body: formData

        if (!supabase) throw new Error('Supabase no está inicializado');        });

            },

        const user = getCurrentUser();    

        if (!user) throw new Error('Usuario no autenticado');    /**

             * Obtiene un usuario por ID

        const { data, error } = await supabase     * @param {string} userId - ID del usuario

            .from('users')     * @returns {Promise<Object>}

            .update({     */

                full_name: profileData.fullName,    async getUser(userId) {

                phone: profileData.phone,        return this.request(`/users/${userId}`);

                city: profileData.city,    },

                bio: profileData.bio,    

                website: profileData.website,    // ========================================

                updated_at: new Date().toISOString()    // SERVICIOS

            })    // ========================================

            .eq('id', user.id)    

            .select()    /**

            .single();     * Obtiene todos los servicios

             * @param {Object} filters - Filtros de búsqueda

        if (error) throw new Error(error.message);     * @returns {Promise<Array>}

             */

        return {    async getServices(filters = {}) {

            success: true,        const queryParams = new URLSearchParams(filters).toString();

            message: 'Perfil actualizado',        return this.request(`/services?${queryParams}`);

            data: data    },

        };    

    },    /**

         * Obtiene un servicio por ID

    async changePassword(passwords) {     * @param {string} serviceId - ID del servicio

        if (!supabase) throw new Error('Supabase no está inicializado');     * @returns {Promise<Object>}

             */

        const { error } = await supabase.auth.updateUser({    async getService(serviceId) {

            password: passwords.newPassword        return this.request(`/services/${serviceId}`);

        });    },

            

        if (error) throw new Error(error.message);    /**

             * Crea un nuevo servicio

        return { success: true, message: 'Contraseña actualizada' };     * @param {Object} serviceData - Datos del servicio

    },     * @returns {Promise<Object>}

         */

    async uploadAvatar(file) {    async createService(serviceData) {

        if (!supabase) throw new Error('Supabase no está inicializado');        return this.request('/services', {

                method: 'POST',

        const user = getCurrentUser();        body: serviceData

        if (!user) throw new Error('Usuario no autenticado');        });

            },

        const fileExt = file.name.split('.').pop();    

        const fileName = `${user.id}-${Date.now()}.${fileExt}`;    /**

             * Actualiza un servicio

        const { data, error } = await supabase.storage     * @param {string} serviceId - ID del servicio

            .from('avatars')     * @param {Object} serviceData - Datos actualizados

            .upload(fileName, file);     * @returns {Promise<Object>}

             */

        if (error) throw new Error(error.message);    async updateService(serviceId, serviceData) {

                return this.request(`/services/${serviceId}`, {

        const { data: { publicUrl } } = supabase.storage        method: 'PUT',

            .from('avatars')        body: serviceData

            .getPublicUrl(fileName);        });

            },

        // Actualizar avatar en la tabla users    

        await supabase    /**

            .from('users')     * Elimina un servicio

            .update({ avatar: publicUrl })     * @param {string} serviceId - ID del servicio

            .eq('id', user.id);     * @returns {Promise<void>}

             */

        return {    async deleteService(serviceId) {

            success: true,        return this.request(`/services/${serviceId}`, {

            data: { avatarUrl: publicUrl }        method: 'DELETE'

        };        });

    },    },

        

    async getUser(userId) {    /**

        if (!supabase) throw new Error('Supabase no está inicializado');     * Sube imágenes del servicio

             * @param {string} serviceId - ID del servicio

        const { data, error } = await supabase     * @param {Array<File>} files - Archivos de imágenes

            .from('users')     * @returns {Promise<Object>}

            .select('id, email, full_name, phone, city, user_type, avatar, bio, website, is_verified, created_at')     */

            .eq('id', userId)    async uploadServiceImages(serviceId, files) {

            .single();        const formData = new FormData();

                files.forEach(file => formData.append('images', file));

        if (error) throw new Error(error.message);        

                return this.request(`/services/${serviceId}/images`, {

        return {        method: 'POST',

            success: true,        headers: {},

            data: data        body: formData

        };        });

    },    },

        

    // ========================================    /**

    // SERVICIOS     * Obtiene servicios del usuario actual

    // ========================================     * @returns {Promise<Array>}

         */

    async getServices(filters = {}) {    async getMyServices() {

        if (!supabase) throw new Error('Supabase no está inicializado');        return this.request('/services/my-services');

            },

        let query = supabase    

            .from('services')    // ========================================

            .select(`    // CARTERA (WALLET)

                *,    // ========================================

                provider:users!services_user_id_fkey(id, full_name, avatar)    

            `)    /**

            .eq('status', 'active');     * Obtiene el balance de la cartera

             * @returns {Promise<Object>}

        if (filters.category) {     */

            query = query.eq('category', filters.category);    async getWalletBalance() {

        }        return this.request('/wallet/balance');

            },

        if (filters.minPrice) {    

            query = query.gte('price', filters.minPrice);    /**

        }     * Obtiene el historial de transacciones

             * @param {Object} params - Parámetros de paginación

        if (filters.maxPrice) {     * @returns {Promise<Object>}

            query = query.lte('price', filters.maxPrice);     */

        }    async getTransactions(params = {}) {

                const queryParams = new URLSearchParams(params).toString();

        if (filters.search) {        return this.request(`/wallet/transactions?${queryParams}`);

            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);    },

        }    

            /**

        if (filters.sort === 'price-asc') {     * Compra Quetzales

            query = query.order('price', { ascending: true });     * @param {Object} purchaseData - Datos de la compra

        } else if (filters.sort === 'price-desc') {     * @returns {Promise<Object>}

            query = query.order('price', { ascending: false });     */

        } else if (filters.sort === 'popular') {    async purchaseQuetzales(purchaseData) {

            query = query.order('views_count', { ascending: false });        return this.request('/wallet/purchase', {

        } else {        method: 'POST',

            query = query.order('created_at', { ascending: false });        body: purchaseData

        }        });

            },

        const { data, error } = await query;    

            /**

        if (error) throw new Error(error.message);     * Retira fondos

             * @param {Object} withdrawData - Datos del retiro

        return {     * @returns {Promise<Object>}

            success: true,     */

            count: data.length,    async withdrawFunds(withdrawData) {

            data: data        return this.request('/wallet/withdraw', {

        };        method: 'POST',

    },        body: withdrawData

            });

    async getService(serviceId) {    },

        if (!supabase) throw new Error('Supabase no está inicializado');    

            /**

        const { data, error } = await supabase     * Transfiere Quetzales a otro usuario

            .from('services')     * @param {Object} transferData - Datos de la transferencia

            .select(`     * @returns {Promise<Object>}

                *,     */

                provider:users!services_user_id_fkey(id, full_name, avatar, bio, is_verified)    async transferQuetzales(transferData) {

            `)        return this.request('/wallet/transfer', {

            .eq('id', serviceId)        method: 'POST',

            .single();        body: transferData

                });

        if (error) throw new Error(error.message);    },

            

        // Incrementar contador de vistas    // ========================================

        await supabase    // ESCROW

            .from('services')    // ========================================

            .update({ views_count: (data.views_count || 0) + 1 })    

            .eq('id', serviceId);    /**

             * Crea una transacción en Escrow

        return {     * @param {Object} escrowData - Datos del escrow

            success: true,     * @returns {Promise<Object>}

            data: data     */

        };    async createEscrow(escrowData) {

    },        return this.request('/escrow', {

            method: 'POST',

    async createService(serviceData) {        body: escrowData

        if (!supabase) throw new Error('Supabase no está inicializado');        });

            },

        const user = getCurrentUser();    

        if (!user) throw new Error('Usuario no autenticado');    /**

             * Libera fondos del Escrow

        const { data, error } = await supabase     * @param {string} escrowId - ID del escrow

            .from('services')     * @returns {Promise<Object>}

            .insert([{     */

                user_id: user.id,    async releaseEscrow(escrowId) {

                title: serviceData.title,        return this.request(`/escrow/${escrowId}/release`, {

                description: serviceData.description,        method: 'POST'

                category: serviceData.category,        });

                price: parseFloat(serviceData.price),    },

                delivery_time: serviceData.deliveryTime,    

                requirements: serviceData.requirements,    /**

                status: 'active'     * Crea una disputa en Escrow

            }])     * @param {string} escrowId - ID del escrow

            .select()     * @param {Object} disputeData - Datos de la disputa

            .single();     * @returns {Promise<Object>}

             */

        if (error) throw new Error(error.message);    async createDispute(escrowId, disputeData) {

                return this.request(`/escrow/${escrowId}/dispute`, {

        return {        method: 'POST',

            success: true,        body: disputeData

            message: 'Servicio creado exitosamente',        });

            data: data    },

        };    

    },    /**

         * Obtiene el estado de un Escrow

    async updateService(serviceId, serviceData) {     * @param {string} escrowId - ID del escrow

        if (!supabase) throw new Error('Supabase no está inicializado');     * @returns {Promise<Object>}

             */

        const { data, error } = await supabase    async getEscrowStatus(escrowId) {

            .from('services')        return this.request(`/escrow/${escrowId}`);

            .update({    },

                title: serviceData.title,    

                description: serviceData.description,    // ========================================

                category: serviceData.category,    // CALIFICACIONES

                price: parseFloat(serviceData.price),    // ========================================

                delivery_time: serviceData.deliveryTime,    

                requirements: serviceData.requirements,    /**

                status: serviceData.status || 'active',     * Crea una calificación

                updated_at: new Date().toISOString()     * @param {Object} ratingData - Datos de la calificación

            })     * @returns {Promise<Object>}

            .eq('id', serviceId)     */

            .select()    async createRating(ratingData) {

            .single();        return this.request('/ratings', {

                method: 'POST',

        if (error) throw new Error(error.message);        body: ratingData

                });

        return {    },

            success: true,    

            message: 'Servicio actualizado',    /**

            data: data     * Obtiene calificaciones de un servicio

        };     * @param {string} serviceId - ID del servicio

    },     * @returns {Promise<Array>}

         */

    async deleteService(serviceId) {    async getServiceRatings(serviceId) {

        if (!supabase) throw new Error('Supabase no está inicializado');        return this.request(`/ratings/service/${serviceId}`);

            },

        const { error } = await supabase    

            .from('services')    /**

            .delete()     * Obtiene calificaciones de un usuario

            .eq('id', serviceId);     * @param {string} userId - ID del usuario

             * @returns {Promise<Array>}

        if (error) throw new Error(error.message);     */

            async getUserRatings(userId) {

        return {        return this.request(`/ratings/user/${userId}`);

            success: true,    },

            message: 'Servicio eliminado'    

        };    // ========================================

    },    // MENSAJERÍA

        // ========================================

    async getMyServices() {    

        if (!supabase) throw new Error('Supabase no está inicializado');    /**

             * Obtiene conversaciones del usuario

        const user = getCurrentUser();     * @returns {Promise<Array>}

        if (!user) throw new Error('Usuario no autenticado');     */

            async getConversations() {

        const { data, error } = await supabase        return this.request('/messages/conversations');

            .from('services')    },

            .select('*')    

            .eq('user_id', user.id)    /**

            .order('created_at', { ascending: false });     * Obtiene mensajes de una conversación

             * @param {string} conversationId - ID de la conversación

        if (error) throw new Error(error.message);     * @returns {Promise<Array>}

             */

        return {    async getMessages(conversationId) {

            success: true,        return this.request(`/messages/conversations/${conversationId}`);

            count: data.length,    },

            data: data    

        };    /**

    },     * Envía un mensaje

         * @param {Object} messageData - Datos del mensaje

    // ========================================     * @returns {Promise<Object>}

    // WALLET     */

    // ========================================    async sendMessage(messageData) {

            return this.request('/messages', {

    async getWalletBalance() {        method: 'POST',

        if (!supabase) throw new Error('Supabase no está inicializado');        body: messageData

                });

        const user = getCurrentUser();    },

        if (!user) throw new Error('Usuario no autenticado');    

            /**

        const { data, error } = await supabase     * Marca mensajes como leídos

            .from('wallets')     * @param {string} conversationId - ID de la conversación

            .select('*')     * @returns {Promise<void>}

            .eq('user_id', user.id)     */

            .single();    async markAsRead(conversationId) {

                return this.request(`/messages/conversations/${conversationId}/read`, {

        if (error && error.code !== 'PGRST116') {        method: 'PUT'

            throw new Error(error.message);        });

        }    },

            

        // Si no existe wallet, crearlo    // ========================================

        if (!data) {    // NOTIFICACIONES

            const { data: newWallet, error: createError } = await supabase    // ========================================

                .from('wallets')    

                .insert([{ user_id: user.id, balance: 0, currency: 'QUETZALES' }])    /**

                .select()     * Obtiene notificaciones del usuario

                .single();     * @returns {Promise<Array>}

                 */

            if (createError) throw new Error(createError.message);    async getNotifications() {

                    return this.request('/notifications');

            return {    },

                success: true,    

                data: newWallet    /**

            };     * Marca notificación como leída

        }     * @param {string} notificationId - ID de la notificación

             * @returns {Promise<void>}

        return {     */

            success: true,    async markNotificationAsRead(notificationId) {

            data: data        return this.request(`/notifications/${notificationId}/read`, {

        };        method: 'PUT'

    },        });

        },

    async getWalletTransactions() {    

        if (!supabase) throw new Error('Supabase no está inicializado');    /**

             * Marca todas las notificaciones como leídas

        const user = getCurrentUser();     * @returns {Promise<void>}

        if (!user) throw new Error('Usuario no autenticado');     */

            async markAllNotificationsAsRead() {

        const { data, error } = await supabase        return this.request('/notifications/read-all', {

            .from('transactions')        method: 'PUT'

            .select('*')        });

            .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)    },

            .order('created_at', { ascending: false })    

            .limit(20);    /**

             * Actualiza preferencias de notificaciones

        if (error) throw new Error(error.message);     * @param {Object} preferences - Preferencias

             * @returns {Promise<Object>}

        return {     */

            success: true,    async updateNotificationPreferences(preferences) {

            count: data.length,        return this.request('/notifications/preferences', {

            data: data        method: 'PUT',

        };        body: preferences

    },        });

        },

    async topUpWallet(amount) {    

        if (!supabase) throw new Error('Supabase no está inicializado');    // ========================================

            // SOLICITUDES DE SERVICIO

        const user = getCurrentUser();    // ========================================

        if (!user) throw new Error('Usuario no autenticado');    

            /**

        // TODO: Integrar pasarela de pagos real     * Crea una solicitud de servicio

        // Por ahora, simular recarga (solo para desarrollo)     * @param {Object} requestData - Datos de la solicitud

        console.warn('⚠️ Recarga simulada - Integrar pasarela de pagos real');     * @returns {Promise<Object>}

             */

        return {    async createServiceRequest(requestData) {

            success: true,        return this.request('/service-requests', {

            message: 'Función de recarga pendiente - integrar PSE/Mercado Pago',        method: 'POST',

            data: { amount, status: 'pending' }        body: requestData

        };        });

    },    },

        

    async withdrawWallet(amount) {    /**

        if (!supabase) throw new Error('Supabase no está inicializado');     * Obtiene solicitudes de servicio

             * @param {string} status - Estado de las solicitudes

        const user = getCurrentUser();     * @returns {Promise<Array>}

        if (!user) throw new Error('Usuario no autenticado');     */

            async getServiceRequests(status = null) {

        // TODO: Implementar retiro real        const query = status ? `?status=${status}` : '';

        console.warn('⚠️ Retiro simulado - Implementar lógica de retiro');        return this.request(`/service-requests${query}`);

            },

        return {    

            success: true,    /**

            message: 'Función de retiro pendiente',     * Acepta una solicitud de servicio

            data: { amount, status: 'pending' }     * @param {string} requestId - ID de la solicitud

        };     * @returns {Promise<Object>}

    },     */

        async acceptServiceRequest(requestId) {

    // ========================================        return this.request(`/service-requests/${requestId}/accept`, {

    // ADMIN (requiere permisos)        method: 'PUT'

    // ========================================        });

        },

    async getAllUsers() {    

        if (!supabase) throw new Error('Supabase no está inicializado');    /**

             * Rechaza una solicitud de servicio

        const { data, error } = await supabase     * @param {string} requestId - ID de la solicitud

            .from('users')     * @param {string} reason - Razón del rechazo

            .select('id, email, full_name, phone, city, user_type, is_verified, is_active, created_at')     * @returns {Promise<Object>}

            .order('created_at', { ascending: false });     */

            async rejectServiceRequest(requestId, reason) {

        if (error) throw new Error(error.message);        return this.request(`/service-requests/${requestId}/reject`, {

                method: 'PUT',

        return {        body: { reason }

            success: true,        });

            count: data.length,    },

            data: data    

        };    /**

    },     * Completa una solicitud de servicio

         * @param {string} requestId - ID de la solicitud

    async getAllServices() {     * @returns {Promise<Object>}

        if (!supabase) throw new Error('Supabase no está inicializado');     */

            async completeServiceRequest(requestId) {

        const { data, error } = await supabase        return this.request(`/service-requests/${requestId}/complete`, {

            .from('services')        method: 'PUT'

            .select(`        });

                *,    },

                provider:users!services_user_id_fkey(id, full_name, email)    

            `)    // ========================================

            .order('created_at', { ascending: false });    // ADMINISTRACIÓN

            // ========================================

        if (error) throw new Error(error.message);    

            /**

        return {     * Obtiene métricas de la plataforma (solo admin)

            success: true,     * @returns {Promise<Object>}

            count: data.length,     */

            data: data    async getPlatformMetrics() {

        };        return this.request('/admin/metrics');

    },    },

        

    async getStats() {    /**

        if (!supabase) throw new Error('Supabase no está inicializado');     * Obtiene usuarios pendientes de verificación (solo admin)

             * @returns {Promise<Array>}

        const { count: usersCount } = await supabase     */

            .from('users')    async getPendingVerifications() {

            .select('*', { count: 'exact', head: true });        return this.request('/admin/verifications/pending');

            },

        const { count: servicesCount } = await supabase    

            .from('services')    /**

            .select('*', { count: 'exact', head: true });     * Aprueba un usuario (solo admin)

             * @param {string} userId - ID del usuario

        const { count: transactionsCount } = await supabase     * @returns {Promise<void>}

            .from('transactions')     */

            .select('*', { count: 'exact', head: true });    async approveUser(userId) {

                return this.request(`/admin/users/${userId}/approve`, {

        return {        method: 'PUT'

            success: true,        });

            data: {    },

                totalUsers: usersCount || 0,    

                totalServices: servicesCount || 0,    /**

                totalTransactions: transactionsCount || 0,     * Suspende un usuario (solo admin)

                activeUsers: usersCount || 0 // TODO: filtrar por is_active     * @param {string} userId - ID del usuario

            }     * @param {string} reason - Razón de la suspensión

        };     * @returns {Promise<void>}

    }     */

};    async suspendUser(userId, reason) {

        return this.request(`/admin/users/${userId}/suspend`, {

// Exportar para uso global        method: 'PUT',

window.API = API;        body: { reason }

        });

// También exportar como módulo si se usa import    },

if (typeof module !== 'undefined' && module.exports) {    

    module.exports = API;    /**

}     * Obtiene disputas activas (solo admin)

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
