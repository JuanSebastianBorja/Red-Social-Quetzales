import { API } from './api.js';
import { AppState } from './state.js';
import { CONFIG } from './config.js';

const disputesList = document.getElementById('disputesList');
const msgEl = document.getElementById('disputesMessage');

function showMessage(text, isError = false) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.display = 'block';
  msgEl.style.color = isError ? 'var(--danger)' : 'var(--text-secondary)';
}

function hideMessage() {
  if (msgEl) msgEl.style.display = 'none';
}

function formatStatus(status) {
  const labels = {
    'open': 'Abierta',
    'in_review': 'En revisión',
    'resolved': 'Resuelta',
    'dismissed': 'Desestimada'
  };
  return labels[status] || status;
}

function renderDispute(dispute) {
    console.log('Dispute data:', dispute);
    const userId = AppState.userId;
    const container = document.createElement('div');
    container.className = 'card';
    container.style.marginBottom = '16px';

  const statusClass = dispute.dispute_status === 'resolved' ? 'success' :
                      dispute.dispute_status === 'dismissed' ? 'secondary' :
                      dispute.dispute_status === 'open' ? 'warning' : 'info';

  container.innerHTML = `
    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
      <h3 class="card-title" style="margin: 0; font-size: 18px;">
        <i class="fas fa-file-contract"></i> ${dispute.contract_title || 'Sin título'}
      </h3>
      <span class="status-badge ${statusClass}">${formatStatus(dispute.dispute_status)}</span>
    </div>
    <div class="card-body">
      <div class="form-group">
        <label class="form-label"><i class="fas fa-user"></i> Contraparte</label>
        <div class="helper"> ${dispute.complainant_id === userId ? dispute.complainant_name : dispute.respondent_name} ↔ ${dispute.complainant_id === userId ? dispute.respondent_name : dispute.complainant_name}</div>
      </div>
      <div class="form-group">
        <label class="form-label"><i class="fas fa-exclamation-triangle"></i> Motivo</label>
        <div class="helper">${dispute.reason || '-'}</div>
      </div>
      ${dispute.resolution ? `
        <div class="form-group">
          <label class="form-label"><i class="fas fa-check-circle"></i> Resolución</label>
          <div class="helper">${dispute.resolution}</div>
        </div>
      ` : ''}
      <div class="form-group">
        <label class="form-label"><i class="fas fa-clock"></i> Fecha</label>
        <div class="helper">${new Date(dispute.created_at).toLocaleString()}</div>
      </div>
    </div>
  `;

  return container;
}

async function loadDisputes() {
  try {
    const data = await API.get('/disputes');
    const disputes = Array.isArray(data) ? data : [];

    if (disputes.length === 0) {
      disputesList.innerHTML = `
        <div class="admin-empty-state">
          <i class="fas fa-balance-scale"></i>
          <p>No tienes disputas abiertas ni resueltas.</p>
        </div>
      `;
      return;
    }

    const frag = document.createDocumentFragment();
    disputes.forEach(dispute => {
      frag.appendChild(renderDispute(dispute));
    });
    disputesList.innerHTML = '';
    disputesList.appendChild(frag);
  } catch (err) {
    console.error('Error al cargar disputas:', err);
    disputesList.innerHTML = '<p class="helper">No se pudieron cargar tus disputas.</p>';
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('quetzal_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  AppState.token = token;

  // Obtener el userId del token (si no está en AppState)
  fetch(`${CONFIG.API_BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(user => {
    AppState.userId = user.id;
    loadDisputes();
  })
  .catch(err => {
    console.error('Error al obtener datos del usuario:', err);
    window.location.href = '/login.html';
  });
});