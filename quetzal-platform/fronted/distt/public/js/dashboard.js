// ============================================
// DASHBOARD.JS - Feed social
// ============================================

import API from './api.js';

// Variables globales para manejar el estado de la vista
let allServices = [];
let currentCategory = 'all';

// Cargar servicios usando la API
async function loadServices() {
    try {
        // Llama a la API para obtener servicios
        const response = await API.getServices({ category: currentCategory }); // O sin filtros: API.getServices()
        console.log("Servicios recibidos:", response);

        if (response.success) {
            allServices = response.data || response.services || [];
            renderServices(allServices);
        } else {
            throw new Error(response.message || 'Error desconocido al cargar servicios');
        }

    } catch (error) {
        console.error('Error en loadServices:', error);
        renderError(error.message);
    }
}

// Renderizar servicios 
function renderServices(services) {
    const grid = document.getElementById('servicesGrid');
    
    if (!services || services.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 2rem; grid-column: 1/-1;">No se encontraron servicios</p>';
        return;
    }

    grid.innerHTML = services.map(service => `
        <div class="service-card" onclick="viewService('${service.id}')"> <!-- viewService debe ser global o definida en este módulo y expuesta -->
            <div class="service-image">${getCategoryIcon(service.category)}</div>
            <div class="service-content">
                <span class="service-category">${service.category || 'General'}</span>
                <h3 class="service-title">${service.title}</h3>
                <p>${(service.description || '').substring(0, 100)}...</p>
                <div class="service-provider">
                    <span>👤</span>
                    <span>${service.User?.fullName || 'Proveedor'}</span>
                </div>
                <div class="service-rating">
                    <span>⭐</span>
                    <span>${service.averageRating || '5.0'} (${service.totalReviews || 0} reviews)</span>
                </div>
                <div class="service-price">Q${service.price}</div>
            </div>
        </div>
    `).join('');
}

// Renderizar error
function renderError(message = 'No se pudieron cargar los servicios') {
    const grid = document.getElementById('servicesGrid');
    grid.innerHTML = `
        <div style="text-align: center; padding: 2rem; grid-column: 1/-1;">
            <p>⚠️ ${message}</p>
            <button onclick="loadServicesWrapper()" class="btn btn-primary">Reintentar</button> <!-- Llama a un wrapper si loadServices es privado -->
        </div>
    `;
}

// Ver detalle de servicio
function viewService(serviceId) {
    window.location.href = `service-detail-public.html?id=${serviceId}`;
}

// Iconos por categoría 
function getCategoryIcon(category) {
    const icons = {
        'diseño': '🎨',
        'programación': '💻',
        'marketing': '📱',
        'escritura': '✍️',
        'traducción': '🌐',
        'educación': '📚',
        'hogar': '🏠',
        'otro': '⚡'
    };
    return icons[category?.toLowerCase()] || '⚡';
}

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentCategory = btn.dataset.category;
        filterServices();
    });
});

// Búsqueda 
document.getElementById('searchInput').addEventListener('input', (e) => {
    filterServices(e.target.value);
});

// Filtrar servicios 
function filterServices(searchTerm = '') {
    let filtered = allServices;

    // Filtrar por categoría
    if (currentCategory !== 'all') {
        filtered = filtered.filter(s => 
            s.category?.toLowerCase() === currentCategory.toLowerCase()
        );
    }

    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(s => 
            s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    renderServices(filtered);
}


// Cargar al iniciar (mismo código)
document.addEventListener('DOMContentLoaded', loadServices);

function loadServicesWrapper() {
    loadServices();
}

window.loadServices = loadServicesWrapper; // Hacerla global
window.viewService = viewService;         // Hacerla global
