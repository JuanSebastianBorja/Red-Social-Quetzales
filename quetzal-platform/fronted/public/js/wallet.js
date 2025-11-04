import API from './api.js';

const $ = (id) => document.getElementById(id);
const QUETZAL_TO_COP = 10000;

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
		const data = await API.getWalletBalance();
		const balance = data.balance || 0;
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
		const res = await API.getTransactions({ limit: 20 });
		const container = $('transactions-list');
		const transactions = res.transactions || res || [];
		
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
}

document.addEventListener('DOMContentLoaded', init);
