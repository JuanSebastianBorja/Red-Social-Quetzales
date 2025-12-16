import { API } from './api.js';
import { AppState } from './state.js';
import { CONFIG } from './config.js';

const tabs = document.querySelectorAll('.tab-btn');
const contents = {
  users: document.getElementById('tab-users'),
  services: document.getElementById('tab-services'),
  reports: document.getElementById('tab-reports'),
  disputes: document.getElementById('tab-disputes'),
  metrics: document.getElementById('tab-metrics')
};



const createAdminBtn = document.getElementById('createAdminBtn');
const newAdminEmail = document.getElementById('newAdminEmail');
const newAdminPassword = document.getElementById('newAdminPassword');
const newAdminName = document.getElementById('newAdminName');
const newAdminRole = document.getElementById('newAdminRole');
const createAdminMsg = document.getElementById('createAdminMsg');
const adminUsersList = document.getElementById('adminUsersList');
const adminMetrics = document.getElementById('adminMetrics');
const disputesContainer = document.getElementById('adminDisputesList');
const dispFilter = document.getElementById('dispFilter');
const dispReload = document.getElementById('dispReload');


if (typeof AppState === 'undefined') {
  console.warn('AppState no está definido. Asegúrate de importar state.js.');
}

function getAdminToken() {
  return localStorage.getItem('quetzal_token');
}


function showMsg(el, text, isError = false) {
  if (!el) return;
  el.textContent = text;
  el.style.display = 'block';
  el.style.color = isError ? 'var(--danger)' : 'var(--text-secondary)';
}

function hideMsg(el) {
  if (!el) return;
  el.style.display = 'none';
}

function updateAdminUI(role) {
  const isAdminSuper = role === 'superadmin';

  // Ocultar/mostrar pestaña "Métricas"
  const metricsTabBtn = document.querySelector('.tab-btn[data-tab="metrics"]');
  if (metricsTabBtn) {
    metricsTabBtn.style.display = isAdminSuper ? 'flex' : 'none';
  }

  // Mostrar botón de logout
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) logoutBtn.style.display = 'inline-flex';
}

function syncAdminToken() {
  const token = localStorage.getItem('quetzal_token');
  if (token && typeof AppState !== 'undefined' && AppState) {
    AppState.token = token;
  }
}

function translateDisputeStatus(status) {
  const translations = {
    'open': 'Abierta',
    'in_review': 'En revisión',
    'resolved': 'Resuelta',
    'dismissed': 'Desestimada'
  };
  return translations[status] || status;
}

function translateServiceStatus(status) {
  const translations = {
    'active': 'Activo',
    'inactive': 'Inactivo',
    'paused': 'Pausado',
    'removed_by_admin': 'Eliminado por admin'
  };
  return translations[status] || status;
}

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    console.log('[admin] Tab click:', btn.dataset.tab);
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    Object.entries(contents).forEach(([key, el]) => {
      el.style.display = key === tab ? 'block' : 'none';
    });
    if (tab === 'users') loadAdminUsers();
    if (tab === 'metrics') loadMetrics();
    if (tab === 'services') loadServices();
    if (tab === 'reports') loadReports('pending');
    if (tab === 'disputes') loadDisputes('open');
  });
});

createAdminBtn?.addEventListener('click', async () => {
  if (!getAdminToken()) return showMsg(createAdminMsg, 'Primero inicia sesión como admin', true);
  const email = newAdminEmail.value.trim();
  const password = newAdminPassword.value.trim();
  const full_name = newAdminName.value.trim();
  const role_name = newAdminRole.value;
  if (!email || !password || !full_name || !role_name) return showMsg(createAdminMsg, 'Todos los campos son obligatorios', true);
  if (password.length < 8) return showMsg(createAdminMsg, 'La contraseña debe tener mínimo 8 caracteres', true);
  try {
  const data = await API.post('/admin/users', { email, password, full_name, role_name });
  hideMsg(createAdminMsg);
  showMsg(createAdminMsg, 'Admin creado exitosamente');
  newAdminEmail.value = '';
  newAdminPassword.value = '';
  newAdminName.value = '';
  loadAdminUsers();
} catch (e) {
  showMsg(createAdminMsg, e.message || 'Error al crear admin', true);
}
});

async function loadAdminUsers() {
  if (!getAdminToken()) return;
  try {
    const data = await API.get('/admin/users'); 
    const rows = Array.isArray(data) ? data : [];
    adminUsersList.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Activo</th>
            <th>Creado</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${r.email}</td>
              <td>${r.full_name}</td>
              <td>${r.role_name}</td>
              <td>${r.is_active ? 'Sí' : 'No'}</td>
              <td>${new Date(r.created_at).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    adminUsersList.innerHTML = '<p class="helper">No se pudo cargar la lista de admins.</p>';
  }
}

async function loadMetrics() {
  if (!getAdminToken()) {
    adminMetrics.innerHTML = `
      <div class="admin-empty-state">
        <i class="fas fa-chart-line"></i>
        <p>Inicia sesión para ver las métricas</p>
      </div>
    `;
    return;
  }
  try {
    const data = await API.get('/admin/metrics');
    adminMetrics.innerHTML = `
      <!-- Usuarios y servicios -->
      <div class="admin-metric-card">
        <div class="admin-metric-icon blue">
          <i class="fas fa-users"></i>
        </div>
        <div class="admin-metric-label">Usuarios Activos</div>
        <div class="admin-metric-value">${data.active_users || 0}</div>
      </div>
      <div class="admin-metric-card">
        <div class="admin-metric-icon green">
          <i class="fas fa-briefcase"></i>
        </div>
        <div class="admin-metric-label">Servicios Activos</div>
        <div class="admin-metric-value">${data.active_services || 0}</div>
      </div>

      <!-- Transacciones y volumen -->
      <div class="admin-metric-card">
        <div class="admin-metric-icon orange">
          <i class="fas fa-handshake"></i>
        </div>
        <div class="admin-metric-label">Transacciones Completadas</div>
        <div class="admin-metric-value">${data.completed_transactions || 0}</div>
      </div>
      <div class="admin-metric-card">
        <div class="admin-metric-icon gold">
          <i class="fas fa-coins"></i>
        </div>
        <div class="admin-metric-label">Volumen en QZ</div>
        <div class="admin-metric-value">${Number(data.total_volume_qz || 0).toFixed(2)}</div>
      </div>

      <!-- Calidad y moderación -->
      <div class="admin-metric-card">
        <div class="admin-metric-icon red">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="admin-metric-label">Disputas Abiertas</div>
        <div class="admin-metric-value">${data.open_disputes || 0}</div>
      </div>
      <div class="admin-metric-card">
        <div class="admin-metric-icon purple">
          <i class="fas fa-star"></i>
        </div>
        <div class="admin-metric-label">Calificación Promedio</div>
        <div class="admin-metric-value">${Number(data.platform_rating || 0).toFixed(1)}</div>>
      </div>
    `;
  } catch (e) {
    adminMetrics.innerHTML = `
      <div class="admin-empty-state">
        <i class="fas fa-chart-line"></i>
        <p>No se pudieron cargar las métricas</p>
        <small class="helper">${e.message}</small>
      </div>
    `;
  }
}


document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('admin_role'); 

  // Ocultar botón de logout
  document.getElementById('adminLogoutBtn').style.display = 'none';

  // Ocultar pestaña sensible (por seguridad visual)
  const metricsTabBtn = document.querySelector('.tab-btn[data-tab="metrics"]');
  if (metricsTabBtn) metricsTabBtn.style.display = 'none';

  // Volver a la vista de login: ocultar contenido, mostrar solo login
  Object.values(contents).forEach(el => {
    if (el) el.style.display = 'none';
  });
  // Opcional: resetear mensajes
  hideMsg(adminLoginMsg);

  // Activar visualmente la pestaña "Usuarios" (aunque no se muestre sin login)
  tabs.forEach(btn => btn.classList.remove('active'));
  const usersTab = document.querySelector('.tab-btn[data-tab="users"]');
  if (usersTab) usersTab.classList.add('active');
});


//Inicialización segura: sincroniza AppState y carga contenido
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('quetzal_token');
  const role = localStorage.getItem('admin_role');

  if (token && role) {
    // Sincroniza con AppState para que API incluya el token en las peticiones
    AppState.token = token;
    AppState.userRole = role;

    // Actualiza UI según rol
    updateAdminUI(role);

    // Carga datos iniciales
    loadAdminUsers();
    try { loadServices(); } catch (e) { console.error('Error loading services:', e); }
    try { loadReports('pending'); } catch (e) { console.error('Error loading reports:', e); }
  } else {
    // Opcional: redirigir o mostrar mensaje si no hay sesión
    console.warn('No hay sesión de admin válida');
  }
});

// Servicios: listar y actualizar estado
const servicesContainer = document.getElementById('adminServicesList');
const svcFilter = document.getElementById('svcFilter');
const svcReload = document.getElementById('svcReload');

async function loadServices(status) {
  if (!getAdminToken()) return;
  const filter = status ?? (svcFilter ? svcFilter.value : '');
  const url = filter ? `/admin/services?status=${encodeURIComponent(filter)}` : '/admin/services';
  try {
    // Usar API.get en lugar de fetch manual
    const services = await API.get(url);
    renderServices(services);
  } catch (e) {
    console.error('[FRONTEND] Error al cargar servicios:', e);
    if (servicesContainer) {
      servicesContainer.innerHTML = `<p class="helper">Error: ${e.message || 'No se pudo cargar servicios.'}</p>`;
    }
  }
}

function renderServices(services) {
  if (!servicesContainer) return;
  const rows = Array.isArray(services) ? services : [];
  if (rows.length === 0) {
    servicesContainer.innerHTML = `
      <div class="admin-empty-state">
        <i class="fas fa-briefcase"></i>
        <p>No hay servicios para mostrar</p>
      </div>
    `;
    return;
  }
  servicesContainer.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Título</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(s => `
          <tr>
            <td>${s.id}</td>
            <td>${s.title}</td>
            <td>${s.category || '-'}</td>
            <td><span class="status-badge ${s.status}">${translateServiceStatus(s.status)}</span></td>
            <td class="table-action-cell">
              <select data-id="${s.id}" class="svc-status input">
                <option value="active" ${s.status==='active'?'selected':''}>Activo</option>
                <option value="paused" ${s.status==='paused'?'selected':''}>Pausado</option>
                <option value="inactive" ${s.status==='inactive'?'selected':''}>Inactivo</option>
              </select>
              <button data-id="${s.id}" class="svc-save btn-primary">
                <i class="fas fa-save"></i> Guardar
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

document.addEventListener('click', async (e) => {
  // Manejar reportes
  if (e.target.classList.contains('rep-save')) {
    const id = e.target.getAttribute('data-id');
    const select = document.querySelector(`select.rep-status[data-id="${id}"]`);
    const notesInput = document.querySelector(`input.rep-notes[data-id="${id}"]`);
    const status = select ? select.value : null;
    const admin_notes = notesInput ? notesInput.value : undefined;
    if (!status) return;

    try {
      await API.patch(`/admin/reports/${id}`, { status, admin_notes });
      loadReports(); 
      showReportsMsg('Reporte actualizado correctamente');
    } catch (error) {
      showReportsMsg('No se pudo actualizar el reporte', true);
    }
  }

   // Manejar disputas → Resolver con acciones específicas
if (e.target.classList.contains('disp-resolve')) {
  const disputeId = e.target.dataset.id;
  const modal = document.getElementById('resolveDisputeModal');
  const actionSelect = document.getElementById('resolveAction');
  const resolutionInput = document.getElementById('resolveResolution');
  const confirmBtn = document.getElementById('resolveConfirmBtn');
  const cancelBtn = document.getElementById('resolveCancelBtn');

  modal.style.display = 'flex';
  resolutionInput.value = '';

  const closeModal = () => {
    modal.style.display = 'none';
  };

  const handleConfirm = async () => {
    const action = actionSelect.value; // ← 'release_to_seller', 'refund_to_buyer', o 'dismiss_no_action'
    const resolution = resolutionInput.value.trim() || null;

    try {
      // Llamar al nuevo endpoint: POST /disputes/:id/resolve
    // Mapear acción → estado
      const statusMap = {
      release_to_seller: 'resolved',
      refund_to_buyer: 'resolved',  // ← ¡OJO! Ambas son 'resolved', pero necesitas distinguirlas
    dismiss_no_action: 'dismissed'
    };

// Pero necesitas indicar qué tipo de 'resolved' es → Usa un campo adicional
await API.patch(`/admin/disputes/${disputeId}/status`, { 
  status: statusMap[action], 
  resolution: resolution || 'Resuelta por admin',
  resolution_type: action  // ← Nuevo campo para diferenciar
});
      loadDisputes(); // Recargar lista
      closeModal();
      // Opcional: mostrar mensaje de éxito
      const msgEl = document.createElement('div');
      msgEl.className = 'toast';
      msgEl.textContent = 'Disputa resuelta correctamente';
      msgEl.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--success);color:white;padding:12px;border-radius:8px;z-index:10000;';
      document.body.appendChild(msgEl);
      setTimeout(() => msgEl.remove(), 3000);
    } catch (err) {
      alert('Error al resolver la disputa: ' + (err.message || 'Inténtalo de nuevo.'));
    }
  };

  confirmBtn.onclick = handleConfirm;
  cancelBtn.onclick = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}
});


svcReload?.addEventListener('click', () => loadServices());
svcFilter?.addEventListener('change', () => loadServices());

// Reports: listar y moderar
const reportsContainer = document.getElementById('adminReportsList');
const repFilter = document.getElementById('repFilter');
const repReload = document.getElementById('repReload');
async function loadReports(status) {
  if (!getAdminToken()) return;
  const filter = status ?? (repFilter ? repFilter.value : 'pending');
  const url = filter ? `/admin/reports?status=${encodeURIComponent(filter)}` : '/admin/reports';
  try {
    const res = await API.get(url);
    renderReports(res);
  } catch (e) {
    if (reportsContainer) reportsContainer.innerHTML = '<p class="helper">No se pudo cargar reports.</p>';
  }
}
function renderReports(reports) {
  if (!reportsContainer) return;
  const rows = Array.isArray(reports) ? reports : [];
  if (rows.length === 0) {
    reportsContainer.innerHTML = `
      <div class="admin-empty-state">
        <i class="fas fa-flag"></i>
        <p>No hay reportes para mostrar</p>
      </div>
    `;
    return;
  }
  reportsContainer.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Servicio</th>
          <th>Razón</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.id}</td>
            <td>${r.service_title || r.service_id}</td>
            <td>${r.reason}</td>
            <td><span class="status-badge ${r.status}">${r.status}</span></td>
            <td class="table-action-cell">
              <select data-id="${r.id}" class="rep-status input">
                <option value="reviewed">Revisado</option>
                <option value="dismissed">Desestimado</option>
                <option value="action_taken">Eliminar Servicio</option>
              </select>
              <input type="text" class="rep-notes input" data-id="${r.id}" placeholder="Notas admin" style="min-width:150px;" />
              <button data-id="${r.id}" class="rep-save btn-primary">
                <i class="fas fa-check"></i> Guardar
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

const reportsMsg = document.getElementById('reportsMessage'); 

function showReportsMsg(text, isError = false) {
  if (!reportsMsg) return;
  reportsMsg.textContent = text;
  reportsMsg.style.display = 'block';
  reportsMsg.style.color = isError ? 'var(--danger)' : 'var(--success)';
  setTimeout(() => {
    reportsMsg.style.display = 'none';
  }, 3000);
}


repReload?.addEventListener('click', () => loadReports());
repFilter?.addEventListener('change', () => loadReports());

//Función para cargar disputas
async function loadDisputes(status = 'open') {
  if (!getAdminToken()) return;
  const url = status ? `/admin/disputes?status=${encodeURIComponent(status)}` : '/admin/disputes';
  try {
    const disputes = await API.get(url);
    renderDisputes(disputes);
  } catch (e) {
    if (disputesContainer) {
      disputesContainer.innerHTML = '<p class="helper">No se pudieron cargar las disputas.</p>';
    }
  }
}

//Función para renderizar disputas
function renderDisputes(disputes) {
  if (!disputesContainer) return;
  const rows = Array.isArray(disputes) ? disputes : [];
  if (rows.length === 0) {
    disputesContainer.innerHTML = `
      <div class="admin-empty-state">
        <i class="fas fa-balance-scale"></i>
        <p>No hay disputas para mostrar</p>
      </div>
    `;
    return;
  }
  disputesContainer.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Contrato</th>
          <th>Partes</th>
          <th>Motivo y Pruebas</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(d => `
          <tr>
            <td>${d.id.substring(0, 8)}...</td>
            <td>${d.contract_title || '-'}</td>
            <td>${d.buyer_name} → ${d.seller_name}</td>
            <td>
              <div>${d.reason.substring(0, 50)}${d.reason.length > 50 ? '...' : ''}</div>
              ${d.evidence_urls && d.evidence_urls.length > 0 ? `
                <div class="evidence-preview" style="margin-top:6px;">
                  ${d.evidence_urls.map(url => 
                    `<a href="${url}" target="_blank" style="display:inline-block;margin-right:6px;">🖼️</a>`
                  ).join('')}
                </div>
              ` : `
                <div class="helper" style="font-size:0.85em;color:var(--text-tertiary);">Sin pruebas adjuntas</div>
              `}
            </td>
            <td><span class="status-badge ${d.dispute_status}">${translateDisputeStatus(d.dispute_status)}</span></td>
            <td class="table-action-cell">
              ${d.dispute_status === 'open' ? `
                <button data-id="${d.id}" class="disp-resolve btn-primary">Resolver</button>
              ` : '<span>Resuelta</span>'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

//Eventos para recargar y filtrar disputas
dispReload?.addEventListener('click', () => loadDisputes());
dispFilter?.addEventListener('change', (e) => loadDisputes(e.target.value));