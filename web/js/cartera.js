import { Utils } from './utils.js';
import { API } from './api.js';
import { CONFIG } from './config.js';

const $ = (id) => document.getElementById(id);

const EX_RATE = Number(window.EXCHANGE_RATE_COP_PER_QZ || 10000);

// Mapa de traducciones para tipos y estados de transacciones
const TRANSACTION_LABELS = {
  // Tipos
  purchase: 'Compra de QZ',
  topup: 'Recarga de QZ',
  payment: 'Pago de servicio',
  payment_received: 'Ingreso por servicio',
  refund: 'Reembolso',
  transfer: 'Transferencia enviada',
  transfer_in: 'Transferencia recibida',
  
  // Estados
  completed: 'Completado',
  pending: 'Pendiente',
  processing: 'Procesando',
  failed: 'Fallido',
  rejected: 'Rechazado',
  cancelled: 'Cancelado'
};

// Traducción de tipos de transacción
const TRANSACTION_TYPE_LABELS = {
  purchase: 'Compra de QZ',
  topup: 'Recarga de QZ',
  payment: 'Pago de servicio',
  payment_received: 'Ingreso por servicio',
  refund: 'Reembolso',
  transfer: 'Transferencia enviada',
  transfer_in: 'Transferencia recibida'
};

function fmtCOP(n) {
  return (n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function fmtCOPNumber(n) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n);
}

async function loadBalance() {
  try {
    const data = await API.get('/wallet/balance');
    $('balanceQZ').textContent = `${(data.balance_qz || 0).toFixed(1)} QZ`;
    // Calcular COP a partir de QZ con la tasa de cambio
    const copAmount = (data.balance_qz || 0) * EX_RATE;
    $('balanceCOP').textContent = fmtCOP(copAmount);
    $('exchangeRate').textContent = `1 QZ = ${fmtCOP(EX_RATE)}`;
  } catch {
    $('balanceQZ').textContent = '—';
    $('balanceCOP').textContent = '—';
  }
}

function renderTxItem(tx) {
  const qz = tx.amount_qz_halves ? (Number(tx.amount_qz_halves) / 2).toFixed(1) + ' QZ' : '';
  const cop = tx.amount_cop_cents ? fmtCOP(tx.amount_cop_cents / 100) : '';
  const amount = qz || cop || '';

  // 🌐 Traducir tipo y estado
  const typeLabel = TRANSACTION_LABELS[tx.type] || tx.type;
  const statusLabel = TRANSACTION_LABELS[tx.status] || tx.status;

  const iconMap = { 
    purchase: 'fa-cart-plus', 
    topup: 'fa-plus-circle', 
    payment: 'fa-credit-card', 
    refund: 'fa-rotate-left', 
    transfer: 'fa-arrow-right-arrow-left',
    transfer_in: 'fa-arrow-left-arrow-right'
  };
  const icon = iconMap[tx.type] || 'fa-receipt';

  const el = document.createElement('div');
  el.className = 'list-item';
  el.innerHTML = `
    <div class="list-item-body">
      <div>
        <div style="font-weight:600;"><i class="fas ${icon}"></i> ${typeLabel}</div>
        <div class="helper" style="font-size:12px;">${new Date(tx.created_at).toLocaleString()}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;">${amount}</div>
        <div class="helper" style="text-transform:capitalize;">${statusLabel}</div>
      </div>
    </div>`;
  return el;
}

async function loadTransactions() {
  try {
    const txs = await API.get('/wallet/transactions?limit=20');
    const list = $('txList');
    list.innerHTML = '';
    if (!txs || txs.length === 0) {
      $('txEmpty').style.display = 'block';
      return;
    }
    $('txEmpty').style.display = 'none';
    const frag = document.createDocumentFragment();
    txs.forEach(tx => frag.appendChild(renderTxItem(tx)));
    list.appendChild(frag);
  } catch {
    $('txEmpty').style.display = 'block';
  }
}

function updateTopupCost() {
  const qz = Number($('topupAmount').value || 0);
  const cop = qz * EX_RATE;
  $('topupCost').textContent = fmtCOP(cop);
}

async function handleTopup() {
  const btn = $('topupBtn');
  const msg = $('topupMsg');
  const input = $('topupAmount');
  const qz = Number(input.value || 0);
  if (!qz || qz <= 0) return;
  btn.disabled = true;
  msg.textContent = 'Creando transacción...';
  try {
    const p = await API.post('/payments/purchase', { qz_amount: qz });
    msg.textContent = 'Confirmando pago (simulado)...';
    await API.post('/payments/mock-confirm', { payment_reference: p.payment_reference });
    msg.textContent = 'Recarga realizada';
    // Limpiar el campo y resetear el costo
    input.value = '1';
    updateTopupCost();
    await loadBalance();
    await loadTransactions();
    // Limpiar mensaje después de 2 segundos
    setTimeout(() => { msg.textContent = ''; }, 2000);
  } catch (e) {
    console.error(e);
    msg.textContent = 'No se pudo realizar la recarga';
  } finally {
    btn.disabled = false;
  }
}

function init() {
  $('topupAmount').addEventListener('input', updateTopupCost);
  $('topupBtn').addEventListener('click', handleTopup);
  updateTopupCost();
  loadBalance();
  loadTransactions();

  // Conectar autocompletado al input de destinatario
const recipientInput = $('transferRecipient');
if (recipientInput) {
  let searchTimeout;
  recipientInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchRecipients(e.target.value);
    }, 300);
  });

  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#transferRecipient') && !e.target.closest('#recipientSuggestions')) {
      hideSuggestions();
    }
  });
}
}



document.addEventListener('DOMContentLoaded', init);

// === Transferencia de Quetzales ===
async function openTransferModal() {
  $('transferModal').style.display = 'block';
  $('transferMessage').textContent = '';
  $('transferRecipient').value = '';
  $('transferAmount').value = '';
  $('transferDescription').value = '';
}

function closeTransferModal() {
  $('transferModal').style.display = 'none';
}

async function handleTransfer() {
  const msgEl = $('transferMessage');
  msgEl.textContent = '';
  msgEl.style.color = 'var(--danger)';

  const recipientId = $('transferRecipientId').value.trim();
  if (!recipientId) {
    msgEl.textContent = 'Selecciona un destinatario válido';
    return;
  }

  const amountQZ = parseFloat($('transferAmount').value);
  const description = $('transferDescription').value.trim() || 'Transferencia de Quetzales';

  // Validaciones de monto
  if (isNaN(amountQZ) || amountQZ < 0.5) {
    msgEl.textContent = 'Monto mínimo: 0.5 QZ';
    return;
  }
  if (amountQZ > 100) {
    msgEl.textContent = 'Monto máximo: 100 QZ por transacción';
    return;
  }

  const amountHalves = Math.round(amountQZ * 2);

  try {
    await API.post('/wallet/transfer', {
      recipient_id: recipientId,
      amount_qz_halves: amountHalves,
      description
    });

    msgEl.style.color = 'var(--success)';
    msgEl.textContent = '¡Transferencia completada!';
    await loadBalance();
    await loadTransactions();
    setTimeout(() => closeTransferModal(), 2000);
  } catch (err) {
  console.error('Transfer error:', err);
  let errorMsg = 'Error al transferir Quetzales';
  
  // Mensajes específicos del backend
  if (err?.message) {
    if (err.message.includes('Saldo insuficiente')) {
      errorMsg = 'No tienes Quetzales suficientes';
    } else if (err.message.includes('No puedes transferirte a ti mismo')) {
      errorMsg = 'No puedes hacer transferencias a ti mismo';
    } else {
      errorMsg = err.message;
    }
  }

  msgEl.textContent = errorMsg;
}
}

// Event listeners para el modal
if ($('openTransferModal')) {
  $('openTransferModal').addEventListener('click', openTransferModal);
}
if ($('cancelTransfer')) {
  $('cancelTransfer').addEventListener('click', closeTransferModal);
}
if ($('confirmTransfer')) {
  $('confirmTransfer').addEventListener('click', handleTransfer);
}

// Estado: resultados de búsqueda
let recipientSearchResults = [];

// Buscar destinatarios en tiempo real
async function searchRecipients(query) {
  if (!query.trim() || query.length < 2) {
    hideSuggestions();
    return;
  }
  try {
    // Llamar a tu endpoint de búsqueda, pero con límites mínimos
    const res = await API.get(`/users/search?search=${encodeURIComponent(query)}&limit=5`);
    recipientSearchResults = res.users || [];
    showSuggestions(recipientSearchResults);
  } catch (err) {
    console.error('Search error:', err);
    hideSuggestions();
  }
}

// Mostrar sugerencias
function showSuggestions(users) {
  const container = $('recipientSuggestions');
  if (users.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.innerHTML = '';
  users.forEach(user => {
    const el = document.createElement('div');
    el.className = 'list-item' ;
    el.style.padding = '8px 12px';
    el.style.cursor = 'pointer';
    el.style.borderBottom = '1px solid var(--border)';
    const avatar = user.avatar 
      ? `<img src="${user.avatar}" style="width:24px;height:24px;border-radius:50%;margin-right:8px;">`
      : `<div style="width:24px;height:24px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:8px;"><span style="color:white;font-size:12px;">${(user.full_name || 'U').charAt(0)}</span></div>`;
    el.innerHTML = `${avatar} <strong>${user.full_name}</strong><br><small style="color:var(--text-tertiary);">${user.city || ''}</small>`;
    el.addEventListener('click', () => {
      // Guardar UUID en campo oculto
      $('transferRecipientId').value = user.id;
      // Mostrar nombre en el input visible
      $('transferRecipient').value = user.full_name; // Muestra el nombre
      hideSuggestions();
    if ($('selectedRecipientName')) {
    $('selectedRecipientName').textContent = `→ ${user.full_name}`;
    $('selectedRecipientName').style.display = 'block';
  }
});
    container.appendChild(el);
  });
  container.style.display = 'block';
}

function hideSuggestions() {
  $('recipientSuggestions').style.display = 'none';
}

// Generar y descargar reporte fiscal en CSV
// Abrir modal de reporte
function openReportModal() {
  $('reportModal').style.display = 'block';
  $('reportMessage').textContent = '';
  
  // Fechas por defecto: último año
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  $('reportEndDate').valueAsDate = today;
  $('reportStartDate').valueAsDate = oneYearAgo;
}

// Cerrar modal
function closeReportModal() {
  $('reportModal').style.display = 'none';
}

// Generar y descargar reporte
async function handleGenerateReport() {
  const startDateInput = $('reportStartDate').value;
  const endDateInput = $('reportEndDate').value;
  const msgEl = $('reportMessage');

  if (!startDateInput || !endDateInput) {
    msgEl.textContent = 'Selecciona ambas fechas';
    return;
  }

  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);

  if (startDate > endDate) {
    msgEl.textContent = 'La fecha de inicio no puede ser mayor que la de fin';
    return;
  }

  msgEl.textContent = 'Generando reporte...';
  msgEl.style.color = 'var(--text-secondary)';

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/wallet/reports?startDate=${startDateInput}&endDate=${endDateInput}`, {
      headers: API.getHeaders()
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}`);
    }

    const data = await res.json();

    // Convertir a CSV
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Monto (QZ)', 'Monto (COP)', 'Descripción'];
    const rows = data.report.map(r => [
    new Date(r.date).toISOString().split('T')[0],
    TRANSACTION_TYPE_LABELS[r.type] || r.type,
    r.category === 'income' ? 'Ingreso' : 'Gasto',
    r.amount_qz,
    Math.round(r.amount_qz * EX_RATE), // ← Número puro, sin comillas, sin formato
    `"${(r.description || '').replace(/"/g, '""')}"`
  ]);
    

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += headers.join(',') + '\n';
    csvContent += rows.map(e => e.join(',')).join('\n');

    // Descargar
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_quetzales_${startDateInput}_a_${endDateInput}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    closeReportModal();
    Utils.showToast('Reporte descargado exitosamente', 'success');
  } catch (err) {
    console.error('Report error:', err);
    msgEl.textContent = err.message || 'Error al generar el reporte';
    msgEl.style.color = 'var(--danger)';
  }
}

// Event listeners
if ($('generateReportBtn')) {
  $('generateReportBtn').addEventListener('click', openReportModal);
}
if ($('cancelReport')) {
  $('cancelReport').addEventListener('click', closeReportModal);
}
if ($('confirmReport')) {
  $('confirmReport').addEventListener('click', handleGenerateReport);
}