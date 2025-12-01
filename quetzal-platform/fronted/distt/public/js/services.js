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
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    } else {
        console.warn("Elemento '#search' no encontrado en services.html");
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange); // <-- Línea 37 aprox
    } else {
        console.warn("Elemento '#category' no encontrado en services.html");
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange); // <-- Otra línea susceptible
    } else {
        console.warn("Elemento '#sort' no encontrado en services.html");
    }
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    } else {
        console.warn("Elemento '#clear-filters-btn' no encontrado en services.html");
    }

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
        console.log("services.js: Iniciando carga de servicios...");
        loadingState.style.display = 'flex';
        servicesGrid.style.display = 'none';
        emptyState.style.display = 'none';
        
        // Llamada a la API
        const response = await API.getServices();
        console.log("services.js: Respuesta de API.getServices recibida:", response);
        
        if (!response.success) {
            throw new Error(response.message || 'Error al cargar servicios');
        }

        allServices = response.data || []; 
        filteredServices = [...allServices];

        console.log("services.js: Servicios cargados (allServices):", allServices);
        console.log("services.js: Servicios filtrados (filteredServices):", filteredServices);

        displayServices();
        
    } catch (error) {
        console.error("services.js: Error en loadServices:", error);
        showAlert('Error al cargar los servicios', 'error');
        
    }
    }

    /**
     * Muestra los servicios en el grid
     */
    function displayServices() {
        console.log("services.js: Iniciando displayServices...");
        console.log("services.js: filteredServices.length:", filteredServices.length);

        loadingState.style.display = 'none';
    
        if (filteredServices.length === 0) {
            console.log("services.js: No hay servicios para mostrar, mostrando empty state.");

            servicesGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        console.log("services.js: Hay servicios para mostrar, ocultando empty state y renderizando.");
        emptyState.style.display = 'none';
        servicesGrid.style.display = 'grid';
        servicesGrid.innerHTML = '';
    
        // Calcular paginación
        const startIndex = (currentPage - 1) * servicesPerPage;
        const endIndex = startIndex + servicesPerPage;
        const paginatedServices = filteredServices.slice(startIndex, endIndex);

        console.log("services.js: Servicios paginados a renderizar:", paginatedServices);
    
    paginatedServices.forEach(service => {
        console.log("services.js: Renderizando servicio:", service);

        const serviceCard = createServiceCard(service);
        servicesGrid.appendChild(serviceCard);
    });
    
    // Actualizar paginación
    updatePagination();

    console.log("services.js: Display completado.");
    }

    
      /**
     * Crea una tarjeta de servicio
     */
    function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'card service-card';
    card.innerHTML = `
        <img 
        src="${service.images?.[0]?.imageUrl || '/public/images/service-placeholder.png'}"
        alt="${service.title}"
        class="service-card-image">
        
        <span class="badge badge-info mb-2">
        ${getCategoryName(service.category)}
        </span>
        
        <h3 class="service-card-title">${service.title}</h3>
        <p class="service-card-description">${truncateText(service.description, 120)}</p>
        
        <div class="flex-between mt-3">
        <div>
            <div class="flex items-center gap-1 mb-1">
            <span style="color: var(--warning);">⭐</span>
            <span class="font-semibold">${service.rating}</span>
            <span class="text-sm text-muted">(${service.reviews})</span>
            </div>
            <div class="text-sm text-secondary">
            📦 ${service.deliveryTime}
            </div>
        </div>
        <div class="service-card-price">
            <!-- CORREGIDO: Convertir service.price a número antes de llamar a formatQuetzales -->
            ${formatQuetzales(parseFloat(service.price))}
        </div>
        </div>
        
        <div class="service-card-footer">
        <div class="flex items-center gap-2">
            <img src="${service.provider.avatar}" alt="${service.provider.name}" class="avatar avatar-sm">
            <span class="text-sm text-secondary">${service.provider.name}</span>
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
    // Redirigir directamente a la página de detalle del servicio
    // Para usuarios autenticados: service-detail.html
    window.location.href = `service-detail.html?id=${service.id}`;
    }

    /**
    * Cierra el modal
    */
    function closeModal() {
    serviceModal.classList.remove('active');
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
