// ============================================
// SUPABASE CLIENT - Configuración y Cliente
// ============================================

const SUPABASE_URL = 'https://sgttyuuvuakaybzrzwdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndHR5dXV2dWFrYXlienJ6d2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODIyMDEsImV4cCI6MjA3ODQ1ODIwMX0.V_kM1LuWgYkavW1x53OE3Cb2Axa9oLfDr80I9SQCRYg';

// Crear cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Registra un nuevo usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>}
 */
async function signUp(userData) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.fullName,
                    phone: userData.phone,
                    city: userData.city,
                    user_type: userData.userType
                }
            }
        });

        if (error) throw error;

        return {
            success: true,
            user: data.user,
            session: data.session
        };
    } catch (error) {
        console.error('Error en registro:', error);
        throw error;
    }
}

/**
 * Inicia sesión
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>}
 */
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        return {
            success: true,
            user: data.user,
            session: data.session
        };
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

/**
 * Cierra sesión
 * @returns {Promise<void>}
 */
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Limpiar localStorage
        localStorage.removeItem('quetzal_token');
        localStorage.removeItem('quetzal_user');
        
        return { success: true };
    } catch (error) {
        console.error('Error en logout:', error);
        throw error;
    }
}

/**
 * Obtiene el usuario actual
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
    }
}

/**
 * Obtiene la sesión actual
 * @returns {Promise<Object|null>}
 */
async function getSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error obteniendo sesión:', error);
        return null;
    }
}

/**
 * Listener de cambios en auth
 * @param {Function} callback - Función a ejecutar cuando cambie el estado de auth
 */
function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// ============================================
// FUNCIONES DE BASE DE DATOS
// ============================================

/**
 * Obtiene todos los servicios
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>}
 */
async function getServices(filters = {}) {
    try {
        let query = supabase
            .from('services')
            .select('*, provider:users!user_id(id, full_name, avatar)')
            .eq('status', 'active');

        // Aplicar filtros
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.minPrice) {
            query = query.gte('price', filters.minPrice);
        }
        if (filters.maxPrice) {
            query = query.lte('price', filters.maxPrice);
        }
        if (filters.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        // Ordenamiento
        if (filters.sort === 'price-asc') {
            query = query.order('price', { ascending: true });
        } else if (filters.sort === 'price-desc') {
            query = query.order('price', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;

        return {
            success: true,
            count: data.length,
            data: data
        };
    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        throw error;
    }
}

/**
 * Obtiene un servicio por ID
 * @param {string} serviceId - ID del servicio
 * @returns {Promise<Object>}
 */
async function getServiceById(serviceId) {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*, provider:users!user_id(id, full_name, avatar, bio, email)')
            .eq('id', serviceId)
            .single();

        if (error) throw error;

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('Error obteniendo servicio:', error);
        throw error;
    }
}

/**
 * Crea un nuevo servicio
 * @param {Object} serviceData - Datos del servicio
 * @returns {Promise<Object>}
 */
async function createService(serviceData) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await supabase
            .from('services')
            .insert([{
                user_id: user.id,
                title: serviceData.title,
                description: serviceData.description,
                category: serviceData.category,
                price: serviceData.price,
                delivery_time: serviceData.deliveryTime,
                requirements: serviceData.requirements,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: 'Servicio creado exitosamente',
            data: data
        };
    } catch (error) {
        console.error('Error creando servicio:', error);
        throw error;
    }
}

/**
 * Actualiza un servicio
 * @param {string} serviceId - ID del servicio
 * @param {Object} serviceData - Datos actualizados
 * @returns {Promise<Object>}
 */
async function updateService(serviceId, serviceData) {
    try {
        const { data, error } = await supabase
            .from('services')
            .update(serviceData)
            .eq('id', serviceId)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: 'Servicio actualizado exitosamente',
            data: data
        };
    } catch (error) {
        console.error('Error actualizando servicio:', error);
        throw error;
    }
}

/**
 * Elimina un servicio
 * @param {string} serviceId - ID del servicio
 * @returns {Promise<Object>}
 */
async function deleteService(serviceId) {
    try {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', serviceId);

        if (error) throw error;

        return {
            success: true,
            message: 'Servicio eliminado exitosamente'
        };
    } catch (error) {
        console.error('Error eliminando servicio:', error);
        throw error;
    }
}

/**
 * Obtiene los servicios del usuario actual
 * @returns {Promise<Array>}
 */
async function getMyServices() {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return {
            success: true,
            count: data.length,
            data: data
        };
    } catch (error) {
        console.error('Error obteniendo mis servicios:', error);
        throw error;
    }
}

// Exportar funciones
window.SupabaseAuth = {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getSession,
    onAuthStateChange
};

window.SupabaseDB = {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    getMyServices
};

// Exportar cliente para uso directo
window.supabaseClient = supabase;

console.log('✅ Supabase client initialized');
