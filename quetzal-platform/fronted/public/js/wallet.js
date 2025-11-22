import API from './api.js';

const $ = (id) => document.getElementById(id);
const QUETZAL_TO_COP = 10000;

// Variables globales para PSE
let pseBanks = [];

// Formatear moneda
function formatCurrency(amount, currency = 'Q') {
	const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return currency === 'Q' ? `Q${formatted}` : `$${formatted}`;
}

// Actualizar preview de conversión en tiempo real
function setupCurrencyPreviews() {
	const qAmountInput = $('q-amount');
	const wAmountInput = $('w-amount');
	
	if (qAmountInput) {
		qAmountInput.addEventListener('input', (e) => {
			const amount = parseFloat(e.target.value) || 0;
			const cop = amount * QUETZAL_TO_COP;
			const preview = document.getElementById('purchase-cop-preview');
			if (preview) {
				preview.textContent = amount > 0 
					? `≈ ${formatCurrency(cop, '$')} COP` 
					: '1 Quetzal = 10,000 COP';
			}
		});
	}
	
	if (wAmountInput) {
		wAmountInput.addEventListener('input', (e) => {
			const amount = parseFloat(e.target.value) || 0;
			const cop = amount * QUETZAL_TO_COP;
			const preview = document.getElementById('withdraw-cop-preview');
			if (preview) {
				preview.textContent = amount > 0 
					? `≈ ${formatCurrency(cop, '$')} COP` 
					: '≈ $0 COP';
			}
		});
	}
}

async function loadBalance() {
	try {
		const data = await API.getWalletSummary();
		const balance = data.balanceQz || data.balance || 0;
		$('balance').innerHTML = formatCurrency(balance);
		
		// Actualizar conversión a COP
		const balanceCop = document.getElementById('balance-cop');
		if (balanceCop) {
			balanceCop.textContent = `≈ ${formatCurrency(balance * QUETZAL_TO_COP, '$')} COP`;
		}
	} catch (err) {
		console.error(err);
		$('balance').innerHTML = '<span class="text-danger">Error al cargar</span>';
	}
}

async function loadTransactions() {
	try {
		const res = await API.getWalletSummary();
		const container = $('transactions-list');
		const transactions = res.txs || res.transactions || [];
		
		if (transactions.length === 0) {
			container.innerHTML = `
				<div class="empty-state text-center py-4">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted mb-3">
						<rect x="3" y="3" width="18" height="18" rx="2"></rect>
						<path d="M9 9h6M9 13h6M9 17h6"></path>
					</svg>
					<p class="text-muted">No hay transacciones aún</p>
				</div>
			`;
			return;
		}
		
		container.innerHTML = transactions.map(tx => {
			const amount = tx.amount || 0;
			const isPositive = amount > 0;
			const icon = isPositive ? '↗️' : '↙️';
			const typeClass = isPositive ? 'text-success' : 'text-danger';
			const type = tx.type || tx.description || 'Transacción';
			const date = new Date(tx.createdAt || tx.date || tx.created_at);
			
			return `
				<div class="transaction-item">
					<div class="transaction-icon ${typeClass}">
						${icon}
					</div>
					<div class="transaction-details">
						<div class="transaction-type">${type}</div>
						<div class="transaction-date text-sm text-muted">${formatDate(date)}</div>
					</div>
					<div class="transaction-amount ${typeClass}">
						${isPositive ? '+' : ''}${formatCurrency(Math.abs(amount))}
					</div>
				</div>
			`;
		}).join('');
	} catch (err) {
		console.error(err);
		$('transactions-list').innerHTML = `
			<div class="text-center py-4">
				<p class="text-danger">Error al cargar transacciones</p>
			</div>
		`;
	}
}

function formatDate(date) {
	const now = new Date();
	const diff = now - date;
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	
	if (days === 0) return 'Hoy, ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
	if (days === 1) return 'Ayer, ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
	if (days < 7) return `Hace ${days} días`;
	return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function handlePurchase(ev) {
	ev.preventDefault();
	
	// Verificar si se está usando PSE
	const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'pse';
	
	if (paymentMethod === 'pse') {
		await handlePsePurchase(ev);
	} else {
		await handleDirectPurchase(ev);
	}
}

// Compra directa (método antiguo - solo para desarrollo/testing)
async function handleDirectPurchase(ev) {
	const amount = parseFloat($('q-amount').value);
	if (!amount || amount <= 0) {
		showAlert('Por favor ingresa una cantidad válida', 'warning', 'purchase-result');
		return;
	}
	
	const btn = ev.target.querySelector('button[type="submit"]');
	const originalText = btn.innerHTML;
	btn.disabled = true;
	btn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px;"></span> Procesando...';
	
	try {
		const res = await API.purchaseQuetzales({ amount });
		showAlert(res.message || '✅ Compra exitosa! Tus Quetzales están disponibles.', 'success', 'purchase-result');
		$('q-amount').value = '';
		document.getElementById('purchase-cop-preview').textContent = '1 Quetzal = 10,000 COP';
		await loadBalance();
		await loadTransactions();
	} catch (err) {
		console.error(err);
		showAlert(err.message || '❌ Error al procesar la compra', 'error', 'purchase-result');
	} finally {
		btn.disabled = false;
		btn.innerHTML = originalText;
	}
}

async function handlePurchase(ev) {
	ev.preventDefault();
	
	// Verificar el método de pago seleccionado en el formulario
	// Asumiendo que tienes inputs de tipo radio con name="payment-method"
	const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
	
	// Asumiendo que el valor para ePayco es 'epayco'
	if (paymentMethod === 'epayco') {
		await handleEpaycoPurchase(ev);
	} else if (paymentMethod === 'pse') {
		// Mantener la lógica existente para PSE
		await handlePsePurchase(ev);
	} else {
		// Opcional: manejar otros métodos o mostrar error
		showAlert('Por favor selecciona un método de pago.', 'warning', 'purchase-result');
		return;
	}
}

// Nueva función para manejar la compra con ePayco Onpage
async function handleEpaycoPurchase(ev) {
	const amountQZ = parseFloat($('q-amount').value);
	const email = document.getElementById('epayco-email')?.value; // Asumiendo un campo de email específico para ePayco

	if (!amountQZ || amountQZ <= 0) {
		showAlert('Por favor ingresa una cantidad válida', 'warning', 'purchase-result');
		return;
	}

	if (!email || !email.includes('@')) { // Validación básica de email
		showAlert('Por favor ingresa un email válido', 'warning', 'purchase-result');
		return;
	}

	const amountCOP = amountQZ * QUETZAL_TO_COP;

	const btn = ev.target.querySelector('button[type="submit"]');
	const originalText = btn.innerHTML;
	btn.disabled = true;
	btn.innerHTML = '<span class="spinner"></span> Procesando...';

	try {
		// Llama a tu backend para crear la transacción y obtener los datos de ePayco
		const response = await API.initEpaycoPayment({ amountCOP, email });

		if (!response.success) {
			throw new Error(response.message || 'Error iniciando pago ePayco Onpage');
		}

		// Recibe los datos de ePayco desde el backend
		const { reference, epaycoData } = response.data; // Accede a response.data

		console.log("Datos recibidos para ePayco Onpage:", epaycoData);

		// 1. Guardar la referencia en localStorage para que pse-callback.html pueda verificarla (o crea una específica)
		localStorage.setItem('lastTransactionRef', reference); // O usa una clave específica como 'epayco_pending_reference'
		// localStorage.setItem('epayco_pending_reference', reference);

		// 2. Inicializar ePayco Checkout Onpage con los datos recibidos
		// Asegúrate de que el script <script src="https://checkout.epayco.co/checkout.js"></script> esté incluido en el HTML
		if (typeof ePayco === 'undefined') {
			throw new Error('El script de ePayco checkout.js no está cargado.');
		}

		// Configura el handler de ePayco con la información recibida del backend
		var handler = ePayco.checkout.configure({
			key: epaycoData.key, // Usar la clave pública del backend
			test: epaycoData.test  // Usar el modo test del backend
		});

		// Abre el checkout de ePayco con los datos del backend
		handler.open(epaycoData);

		// Opcional: Puedes mostrar un mensaje de espera o deshabilitar más acciones hasta que el usuario cierre el checkout
		// o manejar eventos de cierre si el SDK lo permite.

	} catch (error) {
		console.error('Error ePayco Onpage:', error);
		showAlert(error.message || 'Error al procesar el pago', 'error', 'purchase-result');
	} finally {
		// Restaura el botón
		btn.disabled = false;
		btn.innerHTML = originalText;
	}
}

// Compra con PSE
async function handlePsePurchase(ev) {
	const amountQZ = parseFloat($('q-amount').value);
	if (!amountQZ || amountQZ <= 0) {
		showAlert('Por favor ingresa una cantidad válida', 'warning', 'purchase-result');
		return;
	}
	
	const amountCOP = amountQZ * QUETZAL_TO_COP;
	
	// Mostrar modal PSE con formulario
	await showPseModal(amountQZ, amountCOP);
}

// Mostrar modal de PSE
async function showPseModal(amountQZ, amountCOP) {
	// Cargar bancos si no están cargados
	if (pseBanks.length === 0) {
		try {
			const response = await API.getPseBanks();
			pseBanks = response.banks || [];
		} catch (error) {
			showAlert('Error cargando lista de bancos', 'error', 'purchase-result');
			return;
		}
	}
	
	// Crear modal
	const modal = document.createElement('div');
	modal.className = 'modal';
	modal.style.display = 'flex';
	modal.innerHTML = `
		<div class="modal-content" style="max-width: 500px;">
			<div class="modal-header">
				<h3>💳 Pagar con PSE</h3>
				<button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
			</div>
			<div class="modal-body">
				<div class="pse-summary mb-3">
					<div class="d-flex justify-content-between mb-2">
						<span>Quetzales:</span>
						<strong>${formatCurrency(amountQZ)}</strong>
					</div>
					<div class="d-flex justify-content-between mb-3">
						<span>Total a pagar:</span>
						<strong class="text-primary">${formatCurrency(amountCOP, '$')} COP</strong>
					</div>
				</div>
				
				<form id="pse-form">
					<div class="form-group">
						<label for="pse-bank">Banco *</label>
						<select id="pse-bank" name="bank" required class="form-control">
							<option value="">Seleccione su banco</option>
							${pseBanks.map(bank => `<option value="${bank.code}">${bank.name}</option>`).join('')}
						</select>
					</div>
					
					<div class="form-group">
						<label for="pse-person-type">Tipo de persona *</label>
						<select id="pse-person-type" name="personType" required class="form-control">
							<option value="natural">Natural</option>
							<option value="juridica">Jurídica</option>
						</select>
					</div>
					
					<div class="form-group">
						<label for="pse-doc-type">Tipo de documento *</label>
						<select id="pse-doc-type" name="documentType" required class="form-control">
							<option value="CC">Cédula de Ciudadanía</option>
							<option value="CE">Cédula de Extranjería</option>
							<option value="NIT">NIT</option>
							<option value="TI">Tarjeta de Identidad</option>
							<option value="PP">Pasaporte</option>
						</select>
					</div>
					
					<div class="form-group">
						<label for="pse-doc-number">Número de documento *</label>
						<input type="text" id="pse-doc-number" name="documentNumber" required 
							   class="form-control" placeholder="Ej: 1234567890">
					</div>
					
					<div class="form-group">
						<label for="pse-email">Email *</label>
						<input type="email" id="pse-email" name="email" required 
							   class="form-control" placeholder="correo@ejemplo.com">
					</div>
					
					<div class="alert alert-info mt-3">
						<small>
							ℹ️ Serás redirigido al sitio seguro de tu banco para completar el pago.
						</small>
					</div>
					
					<div id="pse-error-container"></div>
					
					<div class="modal-actions mt-4">
						<button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
							Cancelar
						</button>
						<button type="submit" class="btn btn-primary">
							Continuar a PSE
						</button>
					</div>
				</form>
			</div>
		</div>
	`;
	
	document.body.appendChild(modal);
	
	// Handler del formulario PSE
	document.getElementById('pse-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		
		const formData = {
			amountCOP: amountCOP,
			bankCode: document.getElementById('pse-bank').value,
			personType: document.getElementById('pse-person-type').value,
			documentType: document.getElementById('pse-doc-type').value,
			documentNumber: document.getElementById('pse-doc-number').value,
			email: document.getElementById('pse-email').value
		};
		
		const btn = e.target.querySelector('button[type="submit"]');
		const originalText = btn.innerHTML;
		btn.disabled = true;
		btn.innerHTML = '<span class="spinner"></span> Procesando...';
		
		try {
			const response = await API.initPsePayment(formData);
			
			if (response.success && response.transaction) {
				// Guardar referencia en localStorage para verificar después
				localStorage.setItem('pse_pending_reference', response.transaction.reference);
				
				// Mostrar mensaje y redirigir al banco
				showAlert('Redirigiendo al banco...', 'info', 'pse-error-container');
				
				setTimeout(() => {
					window.location.href = response.transaction.bankUrl;
				}, 1500);
			} else {
				throw new Error(response.message || 'Error iniciando pago PSE');
			}
		} catch (error) {
			console.error('Error PSE:', error);
			showAlert(error.message || 'Error al procesar el pago', 'error', 'pse-error-container');
			btn.disabled = false;
			btn.innerHTML = originalText;
		}
	});
}

async function handlePurchase_old(ev) {
	ev.preventDefault();
	const amount = parseFloat($('q-amount').value);
	if (!amount || amount <= 0) {
		showAlert('Por favor ingresa una cantidad válida', 'warning', 'purchase-result');
		return;
	}
	
	const btn = ev.target.querySelector('button[type="submit"]');
	const originalText = btn.innerHTML;
	btn.disabled = true;
	btn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px;"></span> Procesando...';
	
	try {
		const res = await API.purchaseQuetzales({ amount });
		showAlert(res.message || '✅ Compra exitosa! Tus Quetzales están disponibles.', 'success', 'purchase-result');
		$('q-amount').value = '';
		document.getElementById('purchase-cop-preview').textContent = '1 Quetzal = 10,000 COP';
		await loadBalance();
		await loadTransactions();
	} catch (err) {
		console.error(err);
		showAlert(err.message || '❌ Error al procesar la compra', 'error', 'purchase-result');
	} finally {
		btn.disabled = false;
		btn.innerHTML = originalText;
	}
}

async function handleWithdraw(ev) {
	ev.preventDefault();
	const amount = parseFloat($('w-amount').value);
	const bankDetails = $('bank-details').value.trim();
	
	if (!amount || amount <= 0) {
		showAlert('Por favor ingresa una cantidad válida', 'warning', 'withdraw-result');
		return;
	}
	
	if (!bankDetails) {
		showAlert('Por favor ingresa los datos bancarios', 'warning', 'withdraw-result');
		return;
	}
	
	const btn = ev.target.querySelector('button[type="submit"]');
	const originalText = btn.innerHTML;
	btn.disabled = true;
	btn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px;"></span> Procesando...';
	
	try {
		const res = await API.withdrawFunds({ amount, bankDetails });
		showAlert(res.message || '✅ Solicitud de retiro enviada. Se procesará en 1-3 días hábiles.', 'success', 'withdraw-result');
		$('w-amount').value = '';
		$('bank-details').value = '';
		document.getElementById('withdraw-cop-preview').textContent = '≈ $0 COP';
		await loadBalance();
		await loadTransactions();
	} catch (err) {
		console.error(err);
		showAlert(err.message || '❌ Error al procesar el retiro', 'error', 'withdraw-result');
	} finally {
		btn.disabled = false;
		btn.innerHTML = originalText;
	}
}

function showAlert(message, type, containerId) {
	const container = document.getElementById(containerId);
	if (!container) return;
	
	const alertClass = `alert alert-${type}`;
	const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
	const icon = icons[type] || icons.info;
	
	container.innerHTML = `
		<div class="${alertClass}" style="animation: slideDown 0.3s ease-out;">
			<span style="font-size: 1.25rem;">${icon}</span>
			<span>${message}</span>
		</div>
	`;
	
	setTimeout(() => {
		container.innerHTML = '';
	}, 5000);
}

function init() {
	const purchaseForm = document.getElementById('purchase-form');
	const withdrawForm = document.getElementById('withdraw-form');
	if (purchaseForm) purchaseForm.addEventListener('submit', handlePurchase);
	if (withdrawForm) withdrawForm.addEventListener('submit', handleWithdraw);

	// Logout
	const logoutBtn = document.getElementById('logout-btn');
	if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
		e.preventDefault();
		logout();
	});

	// Setup currency conversion previews
	setupCurrencyPreviews();

	// Load data
	loadBalance();
	loadTransactions();
	
	// Verificar si hay una transacción PSE pendiente
	checkPendingPseTransaction();
}

// Verificar transacción PSE pendiente al cargar la página
async function checkPendingPseTransaction() {
	const reference = localStorage.getItem('pse_pending_reference');
	if (!reference) return;
	
	try {
		const response = await API.getPseStatus(reference);
		
		if (response.success && response.transaction) {
			const { status } = response.transaction;
			
			if (status === 'approved') {
				showAlert('✅ Pago aprobado! Tus Quetzales han sido acreditados.', 'success', 'purchase-result');
				localStorage.removeItem('pse_pending_reference');
				await loadBalance();
				await loadTransactions();
			} else if (status === 'rejected' || status === 'failed') {
				showAlert('❌ El pago fue rechazado. Intenta nuevamente.', 'error', 'purchase-result');
				localStorage.removeItem('pse_pending_reference');
			} else if (status === 'expired') {
				showAlert('⏱️ La transacción ha expirado.', 'warning', 'purchase-result');
				localStorage.removeItem('pse_pending_reference');
			}
			// Si está 'pending' o 'processing', no hacer nada aún
		}
	} catch (error) {
		console.error('Error verificando transacción PSE:', error);
	}
}

document.addEventListener('DOMContentLoaded', init);
