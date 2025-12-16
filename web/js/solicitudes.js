import { API } from './api.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  const requestsList = document.getElementById('requestsList');
  const requestsMessage = document.getElementById('requestsMessage');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // Modal elements
  const negotiateModal = document.getElementById('negotiateModal');
  const negotiateTitle = document.getElementById('negotiateTitle');
  const negotiatePrice = document.getElementById('negotiatePrice');
  const negotiateMessage = document.getElementById('negotiateMessage');
  const negotiateSubmit = document.getElementById('negotiateSubmit');
  const negotiateCancel = document.getElementById('negotiateCancel');

  const userAvatar = document.getElementById('user-avatar');
  const userRoleBadge = document.getElementById('user-role-badge');

  async function loadUserInfo() {
    try {
      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
      if (!token) return;

      const res = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('No autorizado');
      const user = await res.json();

      // Mostrar avatar
      if (userAvatar) {
        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=      ${encodeURIComponent(user.full_name || 'Usuario')}&background=6366f1&color=fff`;
        userAvatar.src = avatarUrl;
        userAvatar.alt = user.full_name || 'Usuario';
      }

      // Mostrar rol
      if (userRoleBadge) {
        const roleMap = {
          provider: 'Proveedor',
          consumer: 'Cliente',
          both: 'Proveedor y Cliente'
        };
        userRoleBadge.textContent = roleMap[user.user_type] || user.user_type;
      }
    } catch (err) {
      console.error('Error cargando info del usuario:', err);
    }
  }

  // Llamar a loadUserInfo al iniciar
  loadUserInfo();

  let currentRole = 'client';
  let currentRequestId = null;

  function showMessage(text) {
    if (!requestsMessage) return;
    requestsMessage.textContent = text;
    requestsMessage.style.display = 'block';
  }
  function hideMessage() { 
    if (requestsMessage) requestsMessage.style.display = 'none'; 
  }

  function renderRequestCard(sr) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '16px';
    card.dataset.requestId = String(sr.id);
    const priceQZ = ((sr.negotiated_price_qz_halves || sr.proposed_price_qz_halves || 0) / 2).toFixed(1);
    const statusLabel = {
      pending: 'Pendiente', 
      accepted: 'Aceptada', 
      rejected: 'Rechazada', 
      negotiating: 'En negociación', 
      completed: 'Completada', 
      cancelled: 'Cancelada'
    }[sr.status] || sr.status;

    const otherParty = currentRole === 'client' ? { name: sr.provider_name } : { name: sr.client_name };
    // Mostrar mensaje de negociación si existe
    const messageContent = sr.counter_offer_details ? 
      `<div class="helper" style="margin-top:4px;font-style:italic;">"${sr.counter_offer_details}"</div>` : '';
    
    card.innerHTML = `
      <div class="card-body">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <div>
            <h3 style="font-size:16px;font-weight:600;margin-bottom:4px;">${sr.title || 'Solicitud'}</h3>
            <div class="helper">${otherParty.name || ''} • ${statusLabel}</div>
            ${messageContent}
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:700;color:var(--primary);">${priceQZ} QZ</div>
            <div class="helper">${new Date(sr.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          ${getActionButtons(sr)}
        </div>
      </div>
    `;
    return card;
  }

  function getActionButtons(sr) {
    const s = sr.status;
    let btns = '';
    
    if (currentRole === 'provider') {
      if (s === 'pending') {
        btns = `
          <button class="btn-primary" data-action="accept">Aceptar</button>
          <button class="btn-danger" data-action="reject">Rechazar</button>
          <button class="btn-secondary" data-action="counter">Negociar</button>
        `;
      } else if (s === 'negotiating') {
        btns = `
          <button class="btn-primary" data-action="accept">Aceptar Oferta</button>
          <button class="btn-danger" data-action="reject">Rechazar</button>
          <button class="btn-secondary" data-action="counter">Contraofertar</button>
        `;
      }
    }
    
    if (currentRole === 'client') {
      if (s === 'pending') {
        btns = `<button class="btn-danger" data-action="cancel">Cancelar</button>`;
      } else if (s === 'negotiating') {
        btns = `
          <button class="btn-primary" data-action="accept">Aceptar</button>
          <button class="btn-secondary" data-action="counter">Contraofertar</button>
          <button class="btn-danger" data-action="cancel">Cancelar</button>
        `;
      }
    }
    
    return btns || '<span class="helper">Sin acciones disponibles</span>';
  }

  async function fetchRequests() {
    if (!requestsList) return;
    requestsList.innerHTML = '';
    hideMessage();
    try {
      const list = await API.get(`/service-requests?role=${currentRole}`);
      if (!list.length) { 
        showMessage(`No tienes solicitudes como ${currentRole === 'client' ? 'cliente' : 'proveedor'}.`); 
        return; 
      }
      const frag = document.createDocumentFragment();
      list.forEach(sr => frag.appendChild(renderRequestCard(sr)));
      requestsList.appendChild(frag);
    } catch (e) {
      showMessage('No se pudieron cargar las solicitudes.');
    }
  }

  // Funciones del modal
  function openNegotiateModal(requestId) {
    currentRequestId = requestId;
    negotiateTitle.textContent = currentRole === 'provider' ? 'Hacer contraoferta' : 'Hacer oferta';
    negotiatePrice.value = '';
    negotiateMessage.value = '';
    negotiateModal.style.display = 'flex';
  }

  function closeNegotiateModal() {
    negotiateModal.style.display = 'none';
  }

  // Delegación de eventos
  if (requestsList) {
    requestsList.addEventListener('click', async (e) => {
      const target = e.target.closest('button');
      if (!target) return;
      const card = target.closest('.card');
      const id = card?.dataset.requestId;
      if (!id) return;

      const action = target.getAttribute('data-action');
      try {
        if (action === 'accept') {
          await API.patch(`/service-requests/${id}`, { status: 'accepted' });
          showMessage('Solicitud aceptada.');
          fetchRequests();
        } else if (action === 'reject') {
          const reason = prompt('Motivo de rechazo (opcional):') || '';
          await API.patch(`/service-requests/${id}`, { status: 'rejected', rejection_reason: reason });
          showMessage('Solicitud rechazada.');
          fetchRequests();
        } else if (action === 'counter') {
          // ABRIR MODAL EN LUGAR DE PROMPT
          openNegotiateModal(id);
          return;
        } else if (action === 'cancel') {
          if (confirm('¿Confirmar cancelación de la solicitud?')) {
            await API.patch(`/service-requests/${id}`, { status: 'cancelled' });
            showMessage('Solicitud cancelada.');
            fetchRequests();
          }
        }
      } catch (err) {
        alert(err.message || 'Acción no disponible');
      }
    });
  }

  // Eventos del modal
  if (negotiateSubmit) {
    negotiateSubmit.addEventListener('click', async () => {
      const price = parseFloat(negotiatePrice.value);
      const message = negotiateMessage.value.trim();
      
      if (!price || price < 0.5) {
        showMessage('Ingresa un precio válido (mínimo 0.5 QZ)');
        return;
      }
      
      const data = {
        status: 'negotiating',
        negotiated_price_qz_halves: Math.round(price * 2)
      };
      if (message) data.counter_offer_details = message;
      
      try {
        await API.patch(`/service-requests/${currentRequestId}`, data);
        showMessage('Oferta enviada correctamente.');
        closeNegotiateModal();
        fetchRequests();
      } catch (err) {
        alert(err.message || 'Error al enviar la oferta');
      }
    });
  }

  if (negotiateCancel) {
    negotiateCancel.addEventListener('click', closeNegotiateModal);
  }

  // Cerrar modal al hacer clic fuera
  if (negotiateModal) {
    negotiateModal.addEventListener('click', (e) => {
      if (e.target === negotiateModal) closeNegotiateModal();
    });
  }

  // Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRole = btn.dataset.role === 'provider' ? 'provider' : 'client';
      fetchRequests();
    });
  });

  // Inicializar solicitudes
  fetchRequests();
});