// Contratos: listar y gestionar contratos del usuario
import { API } from './api.js';

const contractsList = document.getElementById('contractsList');
const contractsMessage = document.getElementById('contractsMessage');
const tabBtns = document.querySelectorAll('.tab-btn');

let currentRole = 'client';

function showMessage(text) {
  if (!contractsMessage) return;
  contractsMessage.textContent = text;
  contractsMessage.style.display = 'block';
}

function hideMessage() {
  if (contractsMessage) contractsMessage.style.display = 'none';
}

function getStatusInfo(status) {
  const statusMap = {
    pending: { label: 'Pendiente', color: 'var(--warning)', icon: 'fa-clock' },
    paid: { label: 'Pagado', color: 'var(--info)', icon: 'fa-credit-card' },
    accepted: { label: 'Aceptado', color: 'var(--info)', icon: 'fa-check-circle' },
    rejected: { label: 'Rechazado', color: 'var(--danger)', icon: 'fa-times-circle' },
    in_progress: { label: 'En Progreso', color: 'var(--primary)', icon: 'fa-spinner' },
    delivered: { label: 'Entregado', color: 'var(--success)', icon: 'fa-box' },
    completed: { label: 'Completado', color: 'var(--success)', icon: 'fa-check-double' },
    disputed: { label: 'En Disputa', color: 'var(--danger)', icon: 'fa-exclamation-triangle' },
    cancelled: { label: 'Cancelado', color: 'var(--text-tertiary)', icon: 'fa-ban' }
  };
  return statusMap[status] || { label: status, color: 'var(--text-secondary)', icon: 'fa-question' };
}

function renderContractCard(contract) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginBottom = '16px';
  card.dataset.contractId = String(contract.id);
  if (contract.contract_number) {
    card.dataset.contractNumber = String(contract.contract_number);
  }

  const statusInfo = getStatusInfo(contract.status);
  const priceQZ = ((contract.total_amount_qz_halves || contract.service_price_qz_halves || contract.price_qz_halves || 0) / 2).toFixed(1);

  const otherParty = currentRole === 'client' 
    ? { name: contract.provider_name || 'Proveedor', email: contract.provider_email }
    : { name: contract.client_name || 'Cliente', email: contract.client_email };

  const thumb = `
    <div style="width:64px;height:64px;position:relative;">
      ${contract.service_image ? `
        <img src="${contract.service_image}" alt="Servicio" style="width:64px;height:64px;border-radius:var(--radius-md);object-fit:cover;display:block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      ` : ''}
      <div class="fallback" style="width:64px;height:64px;background:var(--bg-tertiary);border-radius:var(--radius-md);display:${contract.service_image ? 'none' : 'flex'};align-items:center;justify-content:center;position:absolute;top:0;left:0;">
        <i class="fas fa-briefcase" style="color:var(--text-tertiary);"></i>
      </div>
    </div>
  `;

  // === Construir la sección de entregables (solo si aplica) ===
  let deliverablesSection = '';
  if (currentRole === 'client' && contract.status === 'delivered') {
    const files = Array.isArray(contract.delivery_files) ? contract.delivery_files : [];
    
    if (files.length > 0) {
      const fileList = files.map(url => {
        const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
        const isPdf = url.match(/\.pdf$/i);
        
        if (isImage) {
          return `
            <div style="margin-bottom:12px;">
              <img src="${url}" alt="Entregable" style="max-width:100%;border-radius:8px;max-height:300px;object-fit:contain;">
            </div>
          `;
        } else if (isPdf) {
          return `
            <div style="margin-bottom:12px;">
              <a href="${url}" target="_blank" class="btn-secondary" style="display:inline-flex;align-items:center;gap:6px;">
                <i class="fas fa-file-pdf"></i> Ver PDF
              </a>
            </div>
          `;
        } else {
          const filename = url.split('/').pop() || 'archivo';
          return `
            <div style="margin-bottom:12px;">
              <a href="${url}" target="_blank" class="btn-secondary" style="display:inline-flex;align-items:center;gap:6px;">
                <i class="fas fa-file"></i> ${filename}
              </a>
            </div>
          `;
        }
      }).join('');

      deliverablesSection = `
        <div style="margin:16px 0;padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-md);">
          <h4 style="margin:0 0 12px;font-weight:600;color:var(--text-primary);">
            <i class="fas fa-box-open"></i> Entregables del proveedor
          </h4>
          ${fileList}
        </div>
      `;
    } else {
      deliverablesSection = `
        <div style="margin:16px 0;padding:16px;background:var(--warning-bg);border-radius:var(--radius-md);">
          <p style="margin:0;color:var(--warning);">
            <i class="fas fa-exclamation-circle"></i> El proveedor marcó el contrato como entregado, pero no hay archivos adjuntos.
          </p>
        </div>
      `;
    }
  }

  card.innerHTML = `
    <div class="card-body">
      <div style="display:flex;gap:16px;align-items:start;margin-bottom:16px;">
        ${thumb}
        <div style="flex:1;">
          <h3 style="font-size:16px;font-weight:600;margin-bottom:4px;">${contract.service_title || 'Sin título'}</h3>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span class="helper" style="text-transform:capitalize;">
              <i class="fas fa-tag"></i> ${contract.service_category || '-'}
            </span>
            <span style="font-weight:600;color:${statusInfo.color};">
              <i class="fas ${statusInfo.icon}"></i> ${statusInfo.label}
            </span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px;font-weight:700;color:var(--primary);">${priceQZ} QZ</div>
          <div class="helper">${new Date(contract.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:12px;background:var(--bg-secondary);border-radius:var(--radius-md);">
        <i class="fas fa-user-circle" style="font-size:24px;color:var(--text-tertiary);"></i>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14px;">${otherParty.name}</div>
          <div class="helper" style="font-size:12px;">${otherParty.email || ''}</div>
        </div>
        <button class="btn-secondary" style="padding:6px 12px;font-size:13px;" data-view-profile="${currentRole === 'client' ? contract.provider_id : contract.client_id}">
          <i class="fas fa-user"></i> Ver Perfil
        </button>
      </div>

      ${deliverablesSection}

      <div class="form-actions" style="justify-content:flex-start;">
        ${getActionButtons(contract)}
      </div>
    </div>
  `;

  return card;
}

function getActionButtons(contract) {
  const { status, escrow_id } = contract;
  let buttons = '';

  // Disputa: visible para ambos roles si hay escrow y el estado es válido
  const canDispute = ['in_progress', 'delivered'].includes(status);
  if (canDispute) {
    buttons += `<button class="btn-secondary" data-action="dispute"><i class="fas fa-exclamation-triangle"></i> Abrir Disputa</button>`;
  }

  if (currentRole === 'provider') {
    if (status === 'pending' || status === 'paid') {
      buttons += `
        <button class="btn-primary" data-action="accept"><i class="fas fa-check"></i> Aceptar</button>
        <button class="btn-danger" data-action="reject"><i class="fas fa-times"></i> Rechazar</button>
      `;
    } else if (status === 'accepted') {
      buttons += `<button class="btn-primary" data-action="start"><i class="fas fa-play"></i> Iniciar Trabajo</button>`;
      if (escrow_id) {
        buttons += ` <button class="btn-success" data-action="deliver"><i class="fas fa-box"></i> Subir Entregables</button>`;
      }
    } else if (status === 'in_progress' && escrow_id) {
      buttons += `<button class="btn-success" data-action="deliver"><i class="fas fa-box"></i> Subir Entregables</button>`;
    }
  }

  if (currentRole === 'client') {
    if ((status === 'accepted' || status === 'in_progress') && !escrow_id) {
      buttons += `<button class="btn-primary" data-action="pay"><i class="fas fa-credit-card"></i> Pagar</button>`;
    }
    if (['pending', 'paid', 'accepted', 'in_progress'].includes(status)) {
      buttons += `<button class="btn-secondary" data-action="cancel"><i class="fas fa-ban"></i> Cancelar</button>`;
    }
    if (status === 'delivered') {
      buttons += `<button class="btn-success" data-action="complete"><i class="fas fa-check-circle"></i> Confirmar y Liberar Pago</button>`;
    }
    if (status === 'completed' && !contract.rating_id) {
      buttons += ` <button class="btn-primary" data-action="rate"><i class="fas fa-star"></i> Calificar</button>`;
    }
  }

  return buttons || '<span class="helper">Sin acciones disponibles</span>';
}

async function updateStatus(contractId, newStatus) {
  try {
    const updated = await API.patch(`/contracts/${contractId}/status`, { status: newStatus });
    if (!updated || !updated.id) throw new Error('Respuesta inválida del servidor');
    showMessage('Estado actualizado correctamente.');
    fetchContracts();
  } catch (err) {
    const msg = err && err.message ? err.message : 'No se pudo actualizar el contrato.';
    if (/Insufficient balance/i.test(msg)) {
      alert('Saldo insuficiente. Ve a Cartera para recargar y luego intenta pagar.');
      // Opcional: redirigir a cartera
      // window.location.href = '/cartera';
    } else if (/debe estar pagado/i.test(msg)) {
      alert('Debes pagar el contrato antes de continuar.');
    } else {
      alert(msg);
    }
  }
}

// Render modal para calificar
function renderRatingModal(contract) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.4)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';

  const modal = document.createElement('div');
  modal.className = 'card';
  modal.style.width = '420px';
  modal.innerHTML = `
    <div class="card-body">
      <h3 style="margin-bottom:12px;">Calificar al proveedor</h3>
      <p class="helper" style="margin-bottom:12px;">Contrato: ${contract.contract_number}</p>
      <div id="stars" style="display:flex;gap:8px;margin-bottom:12px;"></div>
      <textarea id="ratingComment" class="input" placeholder="Comentario (opcional, máx 500)" style="width:100%;height:90px;"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
        <button id="cancelRate" class="btn-secondary">Cancelar</button>
        <button id="submitRate" class="btn-primary"><i class="fas fa-star"></i> Enviar</button>
      </div>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Estrellas
  const stars = modal.querySelector('#stars');
  let current = 5;
  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('i');
    s.className = 'fas fa-star';
    s.style.fontSize = '22px';
    s.style.cursor = 'pointer';
    s.style.color = i <= current ? '#f59e0b' : '#cbd5e1';
    s.addEventListener('mouseenter', () => {
      [...stars.children].forEach((el, idx) => {
        el.style.color = (idx + 1) <= i ? '#f59e0b' : '#cbd5e1';
      });
    });
    s.addEventListener('click', () => { current = i; });
    stars.appendChild(s);
  }

  stars.addEventListener('mouseleave', () => {
    [...stars.children].forEach((el, idx) => {
      el.style.color = (idx + 1) <= current ? '#f59e0b' : '#cbd5e1';
    });
  });

  const cancelBtn = modal.querySelector('#cancelRate');
  const submitBtn = modal.querySelector('#submitRate');
  const commentEl = modal.querySelector('#ratingComment');

  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  submitBtn.addEventListener('click', async () => {
    const comment = commentEl.value.trim();
    if (comment.length > 500) {
      alert('El comentario debe ser menor a 500 caracteres');
      return;
    }
    try {
      await API.post('/ratings', { contract_id: contract.id, rating: current, comment });
      alert('¡Gracias! Tu calificación fue registrada.');
      document.body.removeChild(overlay);
      fetchContracts();
    } catch (e) {
      alert(e.message);
    }
  });
}


async function fetchContracts() {
  if (!contractsList) return;
  contractsList.innerHTML = '';
  hideMessage();

  try {
    const contracts = await API.get(`/contracts?role=${currentRole}`);

    if (contracts.length === 0) {
      showMessage(`No tienes contratos como ${currentRole === 'client' ? 'cliente' : 'proveedor'}.`);
      return;
    }

    const frag = document.createDocumentFragment();
    contracts.forEach(c => frag.appendChild(renderContractCard(c)));
    contractsList.appendChild(frag);
  } catch (err) {
    showMessage('No se pudieron cargar los contratos.');
  }
}

// Tabs
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRole = btn.dataset.role === 'provider' ? 'provider' : 'client';
    fetchContracts();
  });
});

// Inicializar
fetchContracts();

// Delegación de eventos para acciones y ver perfil
if (contractsList) {
  contractsList.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, [data-view-profile]');
    if (!target) return;

    // Ver perfil
    if (target.hasAttribute('data-view-profile')) {
      e.stopPropagation();
      const userId = target.getAttribute('data-view-profile');
      if (userId) window.location.href = `/vistas/ver-perfil?id=${userId}`;
      return;
    }

    // Acciones de contrato
    const action = target.getAttribute('data-action');
    if (!action) return;

    const card = target.closest('.card');
    const contractId = card && card.dataset.contractId ? card.dataset.contractId : null;
    if (!contractId) return;

    if (action === 'rate') {
      const contract = { id: contractId, contract_number: card && card.dataset.contractNumber ? card.dataset.contractNumber : `#${contractId}` };
      renderRatingModal(contract);
      return;
    }

    const actionMap = {
      accept: 'accepted',
      reject: 'rejected',
      pay: 'paid',
      start: 'in_progress',
      deliver: null,
      complete: 'completed',
      cancel: 'cancelled'
    };
    if (action === 'dispute') {
  const modal = document.getElementById('disputeModal');
  const input = document.getElementById('disputeReasonInput');
  const evidenceInput = document.getElementById('disputeEvidence');
  const submitBtn = document.getElementById('disputeSubmitBtn');
  const cancelBtn = document.getElementById('disputeCancelBtn');
  const errorElement = document.getElementById('disputeError');

  // Crear el input de evidencia si no existe
  if (!evidenceInput) {
    const evidenceField = document.createElement('div');
    evidenceField.innerHTML = `
      <div style="margin-top:12px;">
        <label class="form-label" style="display:block;margin-bottom:6px;font-weight:500;">Pruebas (opcional)</label>
        <input type="file" id="disputeEvidence" multiple accept="image/*,application/pdf,.doc,.docx" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);" />
        <small class="helper" style="display:block;margin-top:4px;">Puedes adjuntar capturas, documentos o entregables relevantes.</small>
      </div>
    `;
    modal.querySelector('.modal-content').insertBefore(evidenceField, submitBtn.parentElement);
  }

  // Limpiar campos y errores
  input.value = '';
  if (evidenceInput) evidenceInput.value = '';
  errorElement.style.display = 'none';
  submitBtn.disabled = false;

  // Validación en tiempo real
  const validateInput = () => {
    const reason = input.value.trim();
    if (reason && reason.length < 10) {
      errorElement.textContent = 'El motivo debe tener al menos 10 caracteres.';
      errorElement.style.display = 'block';
      submitBtn.disabled = true;
    } else {
      errorElement.style.display = 'none';
      submitBtn.disabled = false;
    }
  };

  input.addEventListener('input', validateInput);

  // Mostrar modal
  modal.style.display = 'flex';
  input.focus();

  // Función para cerrar el modal
  const closeModal = () => {
    modal.style.display = 'none';
    document.removeEventListener('keydown', handleEscape);
    modal.removeEventListener('click', handleModalClick);
    input.removeEventListener('input', validateInput);
  };

  // Cerrar al presionar Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', handleEscape);

  // Cerrar al hacer clic fuera del contenido
  const handleModalClick = (e) => {
    if (e.target === modal) closeModal();
  };
  modal.addEventListener('click', handleModalClick);

  // Manejar envío
  const handleSubmit = async () => {
    const reason = input.value.trim();
    const evidenceFileInput = document.getElementById('disputeEvidence');
    const files = Array.from(evidenceFileInput?.files || []);

    if (reason.length < 10) {
      errorElement.textContent = 'El motivo debe tener al menos 10 caracteres.';
      errorElement.style.display = 'block';
      return;
    }

    let evidenceUrls = [];

    if (files.length > 0) {
      // Subir archivos a Supabase
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      try {
        const uploadRes = await API.postMultipart(`/contracts/${contractId}/dispute-evidence`, fd);
        // Asumiendo que el endpoint devuelve un objeto con propiedad `urls` o `delivery_files`
        evidenceUrls = uploadRes.urls || uploadRes.delivery_files || [];
      } catch (err) {
        alert('Error al subir pruebas: ' + (err.message || 'Inténtalo más tarde.'));
        return;
      }
    }

    try {
      // Enviar disputa con pruebas (o sin ellas)
      await API.post(`/contracts/${contractId}/dispute`, { 
        reason, 
        evidence_urls: evidenceUrls 
      });
      showMessage('Disputa abierta exitosamente.');
      fetchContracts();
      closeModal();
    } catch (err) {
      showMessage('Error al abrir la disputa: ' + (err.message || 'Inténtalo más tarde.'));
    }
  };

  // Eventos de botones
  submitBtn.removeEventListener('click', handleSubmit); // Evitar duplicados
  cancelBtn.removeEventListener('click', closeModal);
  submitBtn.addEventListener('click', handleSubmit);
  cancelBtn.addEventListener('click', closeModal);

  return;
}
    const newStatus = actionMap[action];
    if (action === 'deliver') {
      // Abrir selector de archivos y subir via API.postMultipart
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '*/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', async () => {
        const files = Array.from(input.files || []);
        if (files.length === 0) { document.body.removeChild(input); return; }
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        try {
          await API.postMultipart(`/contracts/${contractId}/deliver-files`, fd);
          showMessage('Entregables subidos. Esperando confirmación del cliente.');
          fetchContracts();
        } catch (e) {
          alert(e.message || 'Error al subir entregables');
        } finally {
          document.body.removeChild(input);
        }
      });
      input.click();
      return;
    }
    if (newStatus) updateStatus(contractId, newStatus);
  });
}

// Auto-refresh cada 30 segundos
let refreshInterval;
function startAutoRefresh() {
  refreshInterval = setInterval(fetchContracts, 30000); // 30 segundos
}

function stopAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
}

// Iniciar auto-refresh
startAutoRefresh();

// Detener cuando se oculta la página
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
});
