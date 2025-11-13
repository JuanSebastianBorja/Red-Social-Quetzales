import API from './api.js';
import { requireAuth, logout } from './auth.js';

// Asegura protección básica; las vistas también pueden llamar a requireAuth()
requireAuth();

const $ = (id) => document.getElementById(id);

// Controla el contexto (compras/ventas) para acciones y textos
let currentTab = 'purchases';
let currentStatus = 'all';

// Formatear moneda
function formatCurrency(amount) {
    return `Q${parseFloat(amount).toFixed(2)}`;
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Traducir estados
const statusTranslations = {
    pending: 'Pendiente',
    paid: 'Pagado',
    in_progress: 'En Progreso',
    delivered: 'Entregado',
    completed: 'Completado',
    disputed: 'En Disputa',
    cancelled: 'Cancelado'
};

// Cargar contratos
async function loadContracts() {
    const container = $('contracts-list');
    container.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>Cargando...</p></div>';

    try {
        const params = currentStatus !== 'all' ? { status: currentStatus } : {};
        
        const response = currentTab === 'purchases' 
            ? await API.getMyPurchases(params)
            : await API.getMySales(params);

        const contracts = response.contracts || [];

        if (contracts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <path d="M9 11h6M9 15h6"></path>
                    </svg>
                    <h3>No hay ${currentTab === 'purchases' ? 'compras' : 'ventas'} aún</h3>
                    <p class="text-muted">
                        ${currentTab === 'purchases' 
                            ? 'Explora servicios y contrata el que necesites' 
                            : 'Crea servicios para que otros puedan contratarte'}
                    </p>
                </div>
            `;
            return;
        }

    container.innerHTML = contracts.map(contract => _renderContractCard(contract)).join('');

    } catch (error) {
        console.error('Error cargando contratos:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p class="text-danger">Error al cargar contratos: ${error.message}</p>
            </div>
        `;
    }
}

// Renderizar tarjeta de contrato
// Versión interna utilizada por esta vista y por las funciones exportadas
function _renderContractCard(contract) {
    const isBuyer = currentTab === 'purchases';
    const otherParty = isBuyer ? contract.seller : contract.buyer;
    const statusClass = `status-${contract.status}`;

    // Calcular progreso
    const progressSteps = {
        pending: 0,
        paid: 20,
        in_progress: 50,
        delivered: 75,
        completed: 100,
        disputed: 60,
        cancelled: 0
    };
    const progress = progressSteps[contract.status] || 0;

    // Determinar acciones disponibles
    const actions = getAvailableActions(contract, isBuyer);

    return `
        <div class="contract-card" data-contract-id="${contract.id}">
            <div class="contract-header">
                <div>
                    <div class="contract-title">${contract.title}</div>
                    <div class="contract-number">${contract.contractNumber}</div>
                </div>
                <span class="status-badge ${statusClass}">
                    ${statusTranslations[contract.status]}
                </span>
            </div>

            <div class="contract-meta">
                <div class="contract-meta-item">
                    <span>👤</span>
                    <span>${isBuyer ? 'Vendedor' : 'Comprador'}: ${otherParty?.fullName || 'N/A'}</span>
                </div>
                <div class="contract-meta-item">
                    <span>📅</span>
                    <span>${formatDate(contract.createdAt)}</span>
                </div>
                ${contract.deliveryDays ? `
                <div class="contract-meta-item">
                    <span>⏱️</span>
                    <span>${contract.deliveryDays} días</span>
                </div>
                ` : ''}
            </div>

            <div class="contract-amount">
                ${formatCurrency(contract.servicePrice)}
                ${contract.platformFee ? `<small style="font-size: 14px; color: #999;">+ ${formatCurrency(contract.platformFee)} comisión</small>` : ''}
            </div>

            ${contract.status !== 'cancelled' && contract.status !== 'completed' ? `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            ` : ''}

            <div class="contract-actions">
                <button class="btn-sm btn-primary-sm" onclick="viewContractDetails(${contract.id})">
                    👁️ Ver Detalles
                </button>
                ${actions.map(action => `
                    <button class="btn-sm ${action.btnClass}" onclick="${action.handler}(${contract.id})">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// Determinar acciones disponibles según estado
function getAvailableActions(contract, isBuyer) {
    const actions = [];

    switch (contract.status) {
        case 'paid':
            if (!isBuyer) {
                actions.push({
                    label: '▶️ Iniciar Trabajo',
                    handler: 'startWork',
                    btnClass: 'btn-success-sm'
                });
            }
            break;

        case 'in_progress':
            if (!isBuyer) {
                actions.push({
                    label: '✅ Marcar como Entregado',
                    handler: 'markAsDelivered',
                    btnClass: 'btn-success-sm'
                });
            }
            if (isBuyer) {
                actions.push({
                    label: '⚠️ Abrir Disputa',
                    handler: 'openDispute',
                    btnClass: 'btn-warning-sm'
                });
            }
            break;

        case 'delivered':
            if (isBuyer) {
                actions.push({
                    label: '✓ Aceptar y Pagar',
                    handler: 'completeContract',
                    btnClass: 'btn-success-sm'
                });
                actions.push({
                    label: '⚠️ Abrir Disputa',
                    handler: 'openDispute',
                    btnClass: 'btn-warning-sm'
                });
            }
            break;

        case 'completed':
            if (isBuyer && !contract.ratingId) {
                actions.push({
                    label: '⭐ Calificar',
                    handler: 'rateService',
                    btnClass: 'btn-primary-sm'
                });
            }
            break;
    }

    return actions;
}

// Ver detalles del contrato
window.viewContractDetails = async function(contractId) {
    try {
        const response = await API.getContract(contractId);
        const contract = response.contract;

        const modal = $('contract-modal');
        const modalBody = $('modal-body');

        modalBody.innerHTML = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4>${contract.title}</h4>
                    <p class="text-muted">${contract.contractNumber}</p>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <strong>Estado:</strong>
                            <br>${statusTranslations[contract.status]}
                        </div>
                        <div>
                            <strong>Monto:</strong>
                            <br>${formatCurrency(contract.totalAmount)}
                        </div>
                        <div>
                            <strong>Comprador:</strong>
                            <br>${contract.buyer.fullName}
                        </div>
                        <div>
                            <strong>Vendedor:</strong>
                            <br>${contract.seller.fullName}
                        </div>
                    </div>
                </div>

                ${contract.description ? `
                <div style="margin-bottom: 20px;">
                    <strong>Descripción:</strong>
                    <p>${contract.description}</p>
                </div>
                ` : ''}

                ${contract.requirements ? `
                <div style="margin-bottom: 20px;">
                    <strong>Requisitos:</strong>
                    <p>${contract.requirements}</p>
                </div>
                ` : ''}

                ${contract.deliveryFiles && contract.deliveryFiles.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <strong>Archivos Entregados:</strong>
                    <ul>
                        ${contract.deliveryFiles.map(file => `<li><a href="${file}" target="_blank">📎 ${file}</a></li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <div style="margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="document.getElementById('contract-modal').style.display='none'">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';

    } catch (error) {
        alert('Error al cargar detalles: ' + error.message);
    }
};

// Iniciar trabajo
window.startWork = async function(contractId) {
    if (!confirm('¿Estás listo para iniciar el trabajo?')) return;

    try {
        await API.updateContractStatus(contractId, { status: 'in_progress' });
        alert('¡Trabajo iniciado! El cliente ha sido notificado.');
        loadContracts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// Marcar como entregado
window.markAsDelivered = async function(contractId) {
    const deliveryFiles = prompt('URLs de archivos entregados (separados por coma):');
    
    try {
        await API.updateContractStatus(contractId, {
            status: 'delivered',
            deliveryFiles: deliveryFiles ? deliveryFiles.split(',').map(s => s.trim()) : []
        });
        alert('¡Trabajo marcado como entregado! El cliente será notificado para su revisión.');
        loadContracts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// Completar contrato
window.completeContract = async function(contractId) {
    if (!confirm('¿Estás satisfecho con el trabajo? Los fondos serán liberados al vendedor.')) return;

    try {
        await API.updateContractStatus(contractId, { status: 'completed' });
        alert('¡Contrato completado! Los fondos han sido liberados al vendedor.');
        loadContracts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// Abrir disputa
window.openDispute = async function(contractId) {
    const reason = prompt('Describe el motivo de la disputa:');
    if (!reason) return;

    try {
        await API.updateContractStatus(contractId, {
            status: 'disputed',
            reason
        });
        alert('Disputa abierta. Un administrador revisará el caso.');
        loadContracts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// Calificar servicio
window.rateService = async function(contractId) {
    alert('Función de calificación próximamente disponible');
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Tab switcher
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            loadContracts();
        });
    });

    // Status filter
    document.querySelectorAll('.status-badge').forEach(badge => {
        badge.addEventListener('click', () => {
            document.querySelectorAll('.status-badge').forEach(b => b.classList.remove('active'));
            badge.classList.add('active');
            currentStatus = badge.dataset.status;
            loadContracts();
        });
    });

    // Logout
    const logoutBtn = $('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Cargar contratos iniciales
    loadContracts();
});

// ==========================
// Exports para vistas nuevas
// ==========================

// Obtiene contrataciones del comprador
export async function getMyContracts(params = {}) {
    return API.getMyPurchases(params);
}

// Obtiene ventas del vendedor
export async function getMySales(params = {}) {
    return API.getMySales(params);
}

// Renderiza tarjeta según rol explícito (buyer|seller)
export function renderContractCard(contract, role = 'buyer') {
    const previous = currentTab;
    currentTab = role === 'buyer' ? 'purchases' : 'sales';
    const html = _renderContractCard(contract);
    currentTab = previous;
    return html;
}

// Inicializa listeners en contenedor (no-op aquí porque usamos onclick en HTML)
export function initContractListeners(containerSelector, role = 'buyer') {
    // Mantener compatibilidad con vistas que esperan esta función
    // Si en el futuro migramos a event delegation, podemos implementarlo aquí.
    return;
}

// Crear contrato (wrapper sobre API)
export async function createContract(serviceId, requirements = '') {
    return API.createContract({ serviceId, requirements });
}
