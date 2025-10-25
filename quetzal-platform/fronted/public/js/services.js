    // ============================================
    // SERVICES.JS - Lógica para Visualizar Servicios
    // ============================================

    // Proteger la página
    requireAuth();

    // Elementos del DOM
    const searchInput = document.getElementById('search');
    const categorySelect = document.getElementById('category');
    const sortSelect = document.getElementById('sort');
    const servicesGrid = document.getElementById('services-grid');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const filterButtons = document.querySelectorAll('[data-filter]');
    const logoutBtn = document.getElementById('logout-btn');
    const serviceModal = document.getElementById('service-modal');

    // Variables globales
    let allServices = [];
    let filteredServices = [];
    let currentPage = 1;
    const servicesPerPage = 9;
    let currentFilters = {
    search: '',
    category: '',
    sort: 'recent',
    priceFilter: 'all'
    };

    // Event Listeners
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    categorySelect.addEventListener('change', handleCategoryChange);
    sortSelect.addEventListener('change', handleSortChange);
    clearFiltersBtn.addEventListener('click', clearFilters);
    logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    });

    // Filtros rápidos
    filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remover active de todos
        filterButtons.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
        b.style.backgroundColor = '';
        b.style.color = '';
        });
        
        // Activar el seleccionado
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        btn.style.backgroundColor = 'var(--gray-100)';
        btn.style.color = 'var(--gray-700)';
        
        currentFilters.priceFilter = btn.dataset.filter;
        applyFilters();
    });
    });

    // Cargar servicios al iniciar
    loadServices();

    /**
     * Carga los servicios desde la API
     */
    async function loadServices() {
    try {
        loadingState.style.display = 'flex';
        servicesGrid.style.display = 'none';
        emptyState.style.display = 'none';
        
        // Llamada a la API
        // const response = await API.getServices();
        
        // Simulación con datos de ejemplo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        allServices = [
        {
            id: '1',
            title: 'Desarrollo de Sitio Web Profesional',
            category: 'desarrollo',
            description: 'Creo sitios web profesionales y modernos con las últimas tecnologías. Diseño responsivo, optimización SEO, panel de administración.',
            price: 15.5,
            deliveryTime: '7 días',
            rating: 4.9,
            reviews: 127,
            image: 'https://via.placeholder.com/400x300/6366f1/ffffff?text=Web+Dev',
            provider: { name: 'Carlos Méndez', avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendez' },
            status: 'active'
        },
        {
            id: '2',
            title: 'Diseño de Logotipo y Marca',
            category: 'diseno',
            description: 'Diseño profesional de logotipos y marca completa. Incluye manual de marca, papelería y archivos en todos los formatos.',
            price: 8.0,
            deliveryTime: '3 días',
            rating: 4.8,
            reviews: 89,
            image: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Logo+Design',
            provider: { name: 'Ana García', avatar: 'https://ui-avatars.com/api/?name=Ana+Garcia' },
            status: 'active'
        },
        {
            id: '3',
            title: 'Consultoría en Marketing Digital',
            category: 'marketing',
            description: 'Estrategias de marketing digital personalizadas para tu negocio. Análisis, planificación y ejecución de campañas.',
            price: 25.0,
            deliveryTime: '14 días',
            rating: 4.7,
            reviews: 56,
            image: 'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Marketing',
            provider: { name: 'Luis Rodríguez', avatar: 'https://ui-avatars.com/api/?name=Luis+Rodriguez' },
            status: 'active'
        },
        {
            id: '4',
            title: 'Edición de Video Profesional',
            category: 'video',
            description: 'Edición de videos para YouTube, redes sociales o eventos. Incluye corrección de color, efectos y música.',
            price: 12.0,
            deliveryTime: '5 días',
            rating: 4.9,
            reviews: 103,
            image: 'https://via.placeholder.com/400x300/ef4444/ffffff?text=Video+Edit',
            provider: { name: 'María Torres', avatar: 'https://ui-avatars.com/api/?name=Maria+Torres' },
            status: 'active'
        },
        {
            id: '5',
            title: 'Traducción Español-Inglés',
            category: 'escritura',
            description: 'Traducciones profesionales de documentos, sitios web y contenido. Nativo bilingüe con experiencia.',
            price: 4.5,
            deliveryTime: '2 días',
            rating: 4.6,
            reviews: 78,
            image: 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=Translation',
            provider: { name: 'Jorge Silva', avatar: 'https://ui-avatars.com/api/?name=Jorge+Silva' },
            status: 'active'
        },
        {
            id: '6',
            title: 'Desarrollo de App Móvil',
            category: 'desarrollo',
            description: 'Desarrollo de aplicaciones móviles nativas para iOS y Android. UI/UX moderno y funcional.',
            price: 45.0,
            deliveryTime: '30 días',
            rating: 4.8,
            reviews: 34,
            image: 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Mobile+App',
            provider: { name: 'Roberto Castro', avatar: 'https://ui-avatars.com/api/?name=Roberto+Castro' },
            status: 'active'
        },
        {
            id: '7',
            title: 'Ilustraciones Digitales',
            category: 'diseno',
            description: 'Ilustraciones digitales personalizadas para libros, proyectos o redes sociales. Estilo único.',
            price: 10.0,
            deliveryTime: '5 días',
            rating: 5.0,
            reviews: 91,
            image: 'https://via.placeholder.com/400x300/ec4899/ffffff?text=Illustration',
            provider: { name: 'Laura Ramírez', avatar: 'https://ui-avatars.com/api/?name=Laura+Ramirez' },
            status: 'active'
        },
        {
            id: '8',
            title: 'Tutorías de Programación',
            category: 'educacion',
            description: 'Clases personalizadas de programación en JavaScript, Python, React. Aprende a tu ritmo.',
            price: 6.0,
            deliveryTime: '1 día',
            rating: 4.7,
            reviews: 67,
            image: 'https://via.placeholder.com/400x300/14b8a6/ffffff?text=Tutoring',
            provider: { name: 'Pedro Hernández', avatar: 'https://ui-avatars.com/api/?name=Pedro+Hernandez' },
            status: 'active'
        },
        {
            id: '9',
            title: 'Composición Musical Original',
            category: 'musica',
            description: 'Composición de música original para videos, podcasts o proyectos. Diferentes géneros disponibles.',
            price: 18.0,
            deliveryTime: '7 días',
            rating: 4.9,
            reviews: 45,
            image: 'https://via.placeholder.com/400x300/f97316/ffffff?text=Music',
            provider: { name: 'Andrea Morales', avatar: 'https://ui-avatars.com/api/?name=Andrea+Morales' },
            status: 'active'
        }
        ];
        
        filteredServices = [...allServices];
        displayServices();
        
    } catch (error) {
        showAlert('Error al cargar los servicios', 'error');
    }
    }

    /**
     * Muestra los servicios en el grid
     */
    function displayServices() {
    loadingState.style.display = 'none';
    
    if (filteredServices.length === 0) {
        servicesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    servicesGrid.style.display = 'grid';
    servicesGrid.innerHTML = '';
    
    // Calcular paginación
    const startIndex = (currentPage - 1) * servicesPerPage;
    const endIndex = startIndex + servicesPerPage;
    const paginatedServices = filteredServices.slice(startIndex, endIndex);
    
    paginatedServices.forEach(service => {
        const serviceCard = createServiceCard(service);
        servicesGrid.appendChild(serviceCard);
    });
    
    // Actualizar paginación
    updatePagination();
    }

    /**
     * Crea una tarjeta de servicio
     */
    function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'card service-card';
    card.innerHTML = `
        <img 
        src="${service.image}" 
        alt="${service.title}"
        class="service-card-image">
        
        <span class="badge badge-info" style="margin-bottom: 0.5rem;">
        ${getCategoryName(service.category)}
        </span>
        
        <h3 class="service-card-title">${service.title}</h3>
        <p class="service-card-description">${truncateText(service.description, 120)}</p>
        
        <div class="flex-between" style="margin-top: 1rem;">
        <div>
            <div style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.25rem;">
            <span style="color: var(--warning);">⭐</span>
            <span style="font-weight: 600;">${service.rating}</span>
            <span style="color: var(--gray-500); font-size: 0.875rem;">(${service.reviews})</span>
            </div>
            <div style="font-size: 0.875rem; color: var(--gray-600);">
            📦 ${service.deliveryTime}
            </div>
        </div>
        <div class="service-card-price">
            ${formatQuetzales(service.price)}
        </div>
        </div>
        
        <div class="service-card-footer">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <img src="${service.provider.avatar}" alt="${service.provider.name}" class="avatar" style="width: 32px; height: 32px;">
            <span style="font-size: 0.875rem; color: var(--gray-600);">${service.provider.name}</span>
        </div>
        <button class="btn btn-sm btn-primary">Ver Más</button>
        </div>
    `;
    
    // Event listener para abrir modal
    card.addEventListener('click', () => openServiceModal(service));
    
    return card;
    }

    /**
     * Abre el modal con los detalles del servicio
     */
    function openServiceModal(service) {
    const modalContent = serviceModal.querySelector('.modal-content');
    const user = getAuthUser();
    const isOwner = user && service.provider.name === user.name;
    
    modalContent.innerHTML = `
        <div style="padding: 2rem;">
        <div class="flex-between mb-3">
            <span class="badge badge-info">${getCategoryName(service.category)}</span>
            <button class="btn btn-sm btn-secondary" onclick="closeModal()">✕</button>
        </div>
        
        <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem;">
            ${service.title}
        </h2>
        
        <div class="flex gap-2 mb-3">
            <div style="display: flex; align-items: center; gap: 0.25rem;">
            <span style="color: var(--warning);">⭐</span>
            <span style="font-weight: 600;">${service.rating}</span>
            <span style="color: var(--gray-500);">(${service.reviews} reseñas)</span>
            </div>
            <span style="color: var(--gray-300);">•</span>
            <span style="color: var(--gray-600);">📦 ${service.deliveryTime}</span>
        </div>
        
        <img 
            src="${service.image}" 
            alt="${service.title}"
            style="width: 100%; height: 300px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
        
        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">
            Descripción
        </h3>
        <p style="color: var(--gray-600); line-height: 1.6; margin-bottom: 1.5rem;">
            ${service.description}
        </p>
        
        <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--gray-200);">
        
        <div class="flex-between" style="align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${service.provider.avatar}" alt="${service.provider.name}" class="avatar avatar-lg">
            <div>
                <div style="font-weight: 600;">${service.provider.name}</div>
                <div style="font-size: 0.875rem; color: var(--gray-600);">Proveedor</div>
            </div>
            </div>
            
            <div style="text-align: right;">
            <div style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.25rem;">Precio</div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">
                ${formatQuetzales(service.price)}
            </div>
            <div style="font-size: 0.875rem; color: var(--gray-500);">
                ≈ ${formatCOP(quetzalesToCOP(service.price))}
            </div>
            </div>
        </div>
        
        <div class="flex gap-2 mt-3">
            ${isOwner ? 
            `<a href="edit-service.html?id=${service.id}" class="btn btn-primary btn-block">Editar Servicio</a>` :
            `<button class="btn btn-primary btn-block" onclick="contactProvider('${service.id}')">Contactar Proveedor</button>`
            }
        </div>
        </div>
    `;
    
    serviceModal.style.display = 'flex';
    
    // Cerrar al hacer click en el overlay
    const overlay = serviceModal.querySelector('.modal-overlay');
    overlay.onclick = closeModal;
    }

    /**
     * Cierra el modal
     */
    function closeModal() {
    serviceModal.style.display = 'none';
    }

    /**
     * Contactar proveedor
     */
    function contactProvider(serviceId) {
    showAlert('Función de mensajería en desarrollo', 'info');
    closeModal();
    }

    /**
     * Maneja la búsqueda
     */
    function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase();
    currentPage = 1;
    applyFilters();
    }

    /**
     * Maneja el cambio de categoría
     */
    function handleCategoryChange(e) {
    currentFilters.category = e.target.value;
    currentPage = 1;
    applyFilters();
    }

    /**
     * Maneja el cambio de ordenamiento
     */
    function handleSortChange(e) {
    currentFilters.sort = e.target.value;
    applyFilters();
    }

    /**
     * Aplica todos los filtros
     */
    function applyFilters() {
    filteredServices = allServices.filter(service => {
        // Filtro de búsqueda
        if (currentFilters.search) {
        const searchMatch = service.title.toLowerCase().includes(currentFilters.search) ||
                            service.description.toLowerCase().includes(currentFilters.search);
        if (!searchMatch) return false;
        }
        
        // Filtro de categoría
        if (currentFilters.category && service.category !== currentFilters.category) {
        return false;
        }
        
        // Filtro de precio
        if (currentFilters.priceFilter !== 'all') {
        if (currentFilters.priceFilter === 'price-low' && service.price >= 5) return false;
        if (currentFilters.priceFilter === 'price-medium' && (service.price < 5 || service.price > 20)) return false;
        if (currentFilters.priceFilter === 'price-high' && service.price <= 20) return false;
        if (currentFilters.priceFilter === 'rating' && service.rating < 4.5) return false;
        }
        
        return true;
    });
    
    // Aplicar ordenamiento
    sortServices();
    
    displayServices();
    }

    /**
     * Ordena los servicios
     */
    function sortServices() {
    switch (currentFilters.sort) {
        case 'price-low':
        filteredServices.sort((a, b) => a.price - b.price);
        break;
        case 'price-high':
        filteredServices.sort((a, b) => b.price - a.price);
        break;
        case 'rating':
        filteredServices.sort((a, b) => b.rating - a.rating);
        break;
        case 'popular':
        filteredServices.sort((a, b) => b.reviews - a.reviews);
        break;
        case 'recent':
        default:
        // Ya están en orden reciente
        break;
    }
    }

    /**
     * Limpia todos los filtros
     */
    function clearFilters() {
    searchInput.value = '';
    categorySelect.value = '';
    sortSelect.value = 'recent';
    
    currentFilters = {
        search: '',
        category: '',
        sort: 'recent',
        priceFilter: 'all'
    };
    
    // Reset botones de filtro
    filterButtons.forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
        btn.style.backgroundColor = '';
        btn.style.color = '';
        if (btn.dataset.filter === 'all') {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        btn.style.backgroundColor = 'var(--gray-100)';
        btn.style.color = 'var(--gray-700)';
        }
    });
    
    currentPage = 1;
    applyFilters();
    }

    /**
     * Actualiza la paginación
     */
    function updatePagination() {
    const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
    
    if (totalPages <= 1) {
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    document.getElementById('pagination').style.display = 'flex';
    
    // Aquí podrías implementar la lógica completa de paginación
    // Por simplicidad, solo mostramos los botones básicos
    }

    /**
     * Obtiene el nombre de la categoría
     */
    function getCategoryName(category) {
    const categories = {
        desarrollo: 'Desarrollo',
        diseno: 'Diseño',
        marketing: 'Marketing',
        escritura: 'Escritura',
        video: 'Video',
        musica: 'Música',
        negocios: 'Negocios',
        educacion: 'Educación',
        lifestyle: 'Lifestyle',
        otros: 'Otros'
    };
    return categories[category] || category;
    }

    // Hacer disponible globalmente para el modal
    window.closeModal = closeModal;
    window.contactProvider = contactProvider;