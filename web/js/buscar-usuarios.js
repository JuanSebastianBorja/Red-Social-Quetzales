// Buscar Usuarios: obtiene proveedores y permite filtrar con paginación
import { CONFIG } from './config.js';

const searchInput = document.getElementById('searchInput');
const cityFilter = document.getElementById('cityFilter');
const ratingFilter = document.getElementById('ratingFilter');
const searchBtn = document.getElementById('searchBtn');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const resultsGrid = document.getElementById('resultsGrid');
const resultsMessage = document.getElementById('resultsMessage');
const resultsInfo = document.getElementById('resultsInfo');
const paginationControls = document.getElementById('paginationControls');

// Estado de búsqueda y paginación
let currentPage = 1;
const itemsPerPage = 20;
let totalResults = 0;
let searchTimeout = null;

function showMessage(text) {
  if (!resultsMessage) return;
  resultsMessage.textContent = text;
  resultsMessage.style.display = 'block';
}

function hideMessage() {
  if (resultsMessage) resultsMessage.style.display = 'none';
}

async function renderUserCard(user) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.cursor = 'pointer';
  card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-4px)';
    card.style.boxShadow = 'var(--shadow-md)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'var(--shadow-sm)';
  });

  // Avatar
  const avatarUrl = user.avatar 
    ? user.avatar 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'U')}&background=6366f1&color=fff`;

  // Rating display
    const avgRating = typeof user.average_rating === 'number' ? user.average_rating : 0;
    const totalRatings = user.total_ratings || 0;

    const ratingDisplay = avgRating > 0
        ? `<div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;">
        <i class="fas fa-star" style="color:#f59e0b;font-size:14px;"></i>
        <span style="font-size:13px;color:var(--text-secondary);">${avgRating.toFixed(1)} (${totalRatings})</span>
        </div>`
        : '';   

  card.innerHTML = `
    <div style="display:flex;gap:12px;padding:16px;">
      <img src="${avatarUrl}" alt="Avatar" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" />
      <div style="flex:1;min-width:0;">
        <h3 style="font-size:16px;font-weight:600;margin:0 0 4px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${user.full_name || 'Sin nombre'}
        </h3>
        <p style="font-size:13px;color:var(--text-tertiary);margin:0 0 6px 0;">
          ${user.city || 'Ubicación no disponible'}
        </p>
        ${ratingDisplay}
        <p style="font-size:13px;color:var(--text-secondary);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${user.bio || 'Sin descripción'}
        </p>
        <div style="margin-top:12px;">
          <button class="btn-primary" style="padding:6px 12px;font-size:13px;" data-user-id="${user.id}">
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  `;

  // Ver perfil al hacer clic en la tarjeta o en el botón
  const viewBtn = card.querySelector('button');
  const handleClick = () => {
    window.location.href = `/vistas/ver-perfil.html?id=${user.id}`;
  };
  card.addEventListener('click', handleClick);
  viewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleClick();
  });

  return card;
}

// Construir query params desde los filtros
function buildQueryParams(page = 1) {
  const params = new URLSearchParams();
  
  const search = searchInput.value.trim();
  if (search) params.append('search', search);
  
  const city = cityFilter.value.trim();
  if (city) params.append('city', city);
  
  const minRating = ratingFilter.value;
  if (minRating) params.append('minRating', minRating);
  
  params.append('limit', itemsPerPage.toString());
  params.append('offset', ((page - 1) * itemsPerPage).toString());
  
  return params.toString();
}

// Renderizar info de resultados
function renderResultsInfo() {
  if (!resultsInfo) return;
  
  if (totalResults === 0) {
    resultsInfo.textContent = 'No se encontraron proveedores';
    return;
  }
  
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalResults);
  resultsInfo.textContent = `Mostrando ${start}-${end} de ${totalResults} proveedores`;
}

// Renderizar controles de paginación
function renderPagination() {
  if (!paginationControls) return;
  
  paginationControls.innerHTML = '';
  
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  if (totalPages <= 1) return;
  
  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn-secondary';
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchUsers();
    }
  });
  paginationControls.appendChild(prevBtn);
  
  const pageInfo = document.createElement('span');
  pageInfo.style.fontSize = '14px';
  pageInfo.style.color = 'var(--text-secondary)';
  pageInfo.style.padding = '0 12px';
  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
  paginationControls.appendChild(pageInfo);
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-secondary';
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchUsers();
    }
  });
  paginationControls.appendChild(nextBtn);
}

// Limpiar filtros
function clearFilters() {
  searchInput.value = '';
  cityFilter.value = '';
  ratingFilter.value = '';
  currentPage = 1;
  fetchUsers();
}

// Buscar con los filtros actuales
function searchWithFilters() {
  currentPage = 1;
  fetchUsers();
}

// Debounce para inputs
function searchWithDebounce() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchWithFilters();
  }, 500);
}

// Obtener usuarios
async function fetchUsers() {
  try {
    const queryString = buildQueryParams(currentPage);
    const res = await fetch(`${CONFIG.API_BASE_URL}/users/search?${queryString}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) throw new Error('Error al obtener usuarios');
    const data = await res.json();
    
    const users = data.users || [];
    totalResults = data.total || 0;
    
    resultsGrid.innerHTML = '';
    hideMessage();
    
    if (users.length === 0) {
      showMessage('No se encontraron proveedores con esos criterios.');
      renderResultsInfo();
      renderPagination();
      return;
    }
    
    for (const user of users) {
      const card = await renderUserCard(user);
      resultsGrid.appendChild(card);
    }
    
    renderResultsInfo();
    renderPagination();
    
    if (currentPage > 1) {
      resultsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    showMessage('No se pudieron cargar los proveedores.');
    totalResults = 0;
    renderResultsInfo();
    renderPagination();
  }
}

// Inicializar
fetchUsers();

// Event listeners
if (searchBtn) searchBtn.addEventListener('click', searchWithFilters);
if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);

// Debounce en inputs
if (searchInput) {
  searchInput.addEventListener('input', searchWithDebounce);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchWithFilters();
  });
}
if (cityFilter) cityFilter.addEventListener('input', searchWithDebounce);

// Cambio inmediato en selects
if (ratingFilter) ratingFilter.addEventListener('change', searchWithFilters);