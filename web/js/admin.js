import { API } from './api.js';

const tabs = document.querySelectorAll('.tab-btn');
const contents = {
  users: document.getElementById('tab-users'),
  services: document.getElementById('tab-services'),
  reports: document.getElementById('tab-reports'),
  disputes: document.getElementById('tab-disputes'),
  metrics: document.getElementById('tab-metrics')
};

const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const adminLoginMsg = document.getElementById('adminLoginMsg');

const createAdminBtn = document.getElementById('createAdminBtn');
const newAdminEmail = document.getElementById('newAdminEmail');
const newAdminPassword = document.getElementById('newAdminPassword');
const newAdminName = document.getElementById('newAdminName');
const newAdminRole = document.getElementById('newAdminRole');
const createAdminMsg = document.getElementById('createAdminMsg');
const adminUsersList = document.getElementById('adminUsersList');
const adminMetrics = document.getElementById('adminMetrics');

const savedRole = localStorage.getItem('admin_role') || null;

function getAdminToken() {
  return localStorage.getItem('admin_token');
}

if (getAdminToken() && savedRole) {
  updateAdminUI(savedRole); 
  loadAdminUsers();
  try { loadServices(); } catch (e) {}
  try { loadReports('pending'); } catch (e) {}
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
  });
});

adminLoginBtn?.addEventListener('click', async () => {
  const email = adminEmail.value.trim();
  const password = adminPassword.value.trim();
  if (!email || !password) return showMsg(adminLoginMsg, 'Email y contraseña requeridos', true);
  if (password.length < 8) return showMsg(adminLoginMsg, 'La contraseña debe tener mínimo 8 caracteres', true);
  try {
    const res = await API.post('/admin/login', { email, password });
    const adminToken = res?.token || null; 
    const adminRole = res?.role || null;

if (!adminToken || !adminRole) {
  return showMsg(adminLoginMsg, 'Credenciales inválidas o sin rol', true);
}

try {
  localStorage.setItem('admin_token', adminToken);
  localStorage.setItem('admin_role', adminRole);
} catch (e) {
  console.warn('No se pudo guardar en localStorage', e);
}

hideMsg(adminLoginMsg);
showMsg(adminLoginMsg, `Sesión iniciada como ${adminRole}`);
loadAdminUsers();
updateAdminUI(adminRole);
  } catch (e) {  // 👈 cierra el try del login
    showMsg(adminLoginMsg, e.message || 'Error al iniciar sesión', true);
  }
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
    const res = await fetch('/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify({ email, password, full_name, role_name })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error' }));
      return showMsg(createAdminMsg, err.error || 'Error al crear admin', true);
    }
    hideMsg(createAdminMsg);
    showMsg(createAdminMsg, 'Admin creado exitosamente');
    newAdminEmail.value = '';
    newAdminPassword.value = '';
    newAdminName.value = '';
    loadAdminUsers();
  } catch (e) {
    showMsg(createAdminMsg, e.message || 'Error de red', true);
  }
});

async function loadAdminUsers() {
  if (!getAdminToken()) return;
  try {
    const res = await fetch('/admin/users', { headers: { 'Authorization': `Bearer ${getAdminToken()}` } });
    const data = await res.json();
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
    const res = await fetch('/admin/metrics', { headers: { 'Authorization': `Bearer ${getAdminToken()}` } });
    if (!res.ok) throw new Error('No autorizado');
    const data = await res.json();
    adminMetrics.innerHTML = `
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
      <div class="admin-metric-card">
        <div class="admin-metric-icon purple">
          <i class="fas fa-file-contract"></i>
        </div>
        <div class="admin-metric-label">Contratos Activos</div>
        <div class="admin-metric-value">${data.active_contracts || 0}</div>
      </div>
      <div class="admin-metric-card">
        <div class="admin-metric-icon orange">
          <i class="fas fa-handshake"></i>
        </div>
        <div class="admin-metric-label">Contratos Completados</div>
        <div class="admin-metric-value">${data.completed_contracts || 0}</div>
      </div>
      <div class="admin-metric-card">
        <div class="admin-metric-icon red">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="admin-metric-label">Disputas Abiertas</div>
        <div class="admin-metric-value">${data.open_disputes || 0}</div>
      </div>
      <div class="admin-metric-card">
        <div class="admin-metric-icon green">
          <i class="fas fa-coins"></i>
        </div>
        <div class="admin-metric-label">QZ en Circulación</div>
        <div class="admin-metric-value">${((data.total_qz_balance || 0) / 100).toFixed(0)}</div>
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
  localStorage.removeItem('admin_token');
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

// Estado inicial: pestaña usuarios
loadAdminUsers();
// Cargar servicios y reportes si ya hay token almacenado
if (getAdminToken()) {
  try { loadServices(); } catch {}
  try { loadReports('pending'); } catch {}
}

// Servicios: listar y actualizar estado
const servicesContainer = document.getElementById('adminServicesList');
const svcFilter = document.getElementById('svcFilter');
const svcReload = document.getElementById('svcReload');
async function loadServices(status) {
  if (!getAdminToken())return;
  const filter = status ?? (svcFilter ? svcFilter.value : '');
  const url = filter ? `/admin/services?status=${encodeURIComponent(filter)}` : '/admin/services';
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${getAdminToken()}` } });
    if (!res.ok) throw new Error('Error al cargar servicios');
    const services = await res.json();
    renderServices(services);
  } catch (e) {
    if (servicesContainer) servicesContainer.innerHTML = '<p class="helper">No se pudo cargar servicios.</p>';
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
            <td><span class="status-badge ${s.status}">${s.status}</span></td>
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
  const t = e.target;
  if (t && t.classList && t.classList.contains('svc-save')) {
    const id = t.getAttribute('data-id');
    const select = document.querySelector(`select.svc-status[data-id="${id}"]`);
    const status = select ? select.value : null;
    if (!status) return;
    const res = await fetch(`/admin/services/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAdminToken()}` },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      loadServices();
    } else {
      alert('No se pudo actualizar el estado del servicio');
    }
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
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${getAdminToken()}` } });
    if (!res.ok) throw new Error('Error al cargar reports');
    const reports = await res.json();
    renderReports(reports);
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
            <td>${r.service_id}</td>
            <td>${r.reason}</td>
            <td><span class="status-badge ${r.status}">${r.status}</span></td>
            <td class="table-action-cell">
              <select data-id="${r.id}" class="rep-status input">
                <option value="reviewed">Revisado</option>
                <option value="dismissed">Desestimado</option>
                <option value="action_taken">Acción Tomada</option>
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
document.addEventListener('click', async (e) => {
  const t = e.target;
  if (t && t.classList && t.classList.contains('rep-save')) {
    const id = t.getAttribute('data-id');
    const select = document.querySelector(`select.rep-status[data-id="${id}"]`);
    const notesInput = document.querySelector(`input.rep-notes[data-id="${id}"]`);
    const status = select ? select.value : null;
    const admin_notes = notesInput ? notesInput.value : undefined;
    if (!status) return;
    const res = await fetch(`/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAdminToken()}` },
      body: JSON.stringify({ status, admin_notes })
    });
    if (res.ok) {
      loadReports();
    } else {
      alert('No se pudo actualizar el reporte');
    }
  }
});
repReload?.addEventListener('click', () => loadReports());
repFilter?.addEventListener('change', () => loadReports());
