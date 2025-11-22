// Inject a developer-friendly quick navigation to all views
// Adds a floating button and a panel with links to every page in /views

(function () {
	if (typeof document === 'undefined') return;

	const VIEWS = [
		{ name: 'Landing', file: 'landing-page.html' },
		{ name: 'Home (index)', file: 'index.html' },
		{ name: 'Index Vistas', file: 'index-vistas.html' },
		{ name: 'Login', file: 'login.html' },
		{ name: 'Registro', file: 'register.html' },
		{ name: 'Servicios Públicos', file: 'services-public.html' },
		{ name: 'Detalle Servicio Público', file: 'service-detail-public.html' },
		{ name: 'Dashboard', file: 'dashboard.html' },
		{ name: 'Perfil', file: 'profile.html' },
		{ name: 'Servicios (privado)', file: 'services.html' },
		{ name: 'Crear Servicio', file: 'create-service.html' },
		{ name: 'Editar Servicio', file: 'edit-service.html' },
		{ name: 'Mensajes', file: 'messages.html' },
		{ name: 'Contratos', file: 'contracts.html' },
		{ name: 'Wallet', file: 'wallet.html' },
		{ name: 'PSE Callback', file: 'pse-callback.html' },
		{ name: 'PSE Bank Simulator', file: 'pse-bank-simulator.html' },
		{ name: 'Admin Dashboard', file: 'admin-dashboard.html' },
		{ name: 'Admin Usuarios', file: 'admin-users.html' },
		{ name: 'Admin Servicios', file: 'admin-services.html' },
		{ name: 'Admin Transacciones', file: 'admin-transactions.html' },
		{ name: 'Admin Reports', file: 'admin-reports.html' }
	];

	// Determine base path to /views regardless of current location
	function toViewUrl(file) {
		// If already under /views/, keep relative; otherwise build absolute
		const isInViews = window.location.pathname.includes('/views/');
		return isInViews ? file : '/views/' + file;
	}

	function createStyles() {
		const style = document.createElement('style');
		style.textContent = `
			.qz-quick-btn {
				position: fixed; right: 16px; bottom: 16px; z-index: 9999;
				background: #2563eb; color: #fff; border: none; border-radius: 9999px;
				padding: 10px 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); cursor: pointer; font-size: 14px;
			}
			.qz-quick-panel {
				position: fixed; right: 16px; bottom: 64px; z-index: 9999; width: 320px; max-height: 60vh; overflow: auto;
				background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.15);
				display: none;
			}
			.qz-quick-panel.open { display: block; }
			.qz-quick-header { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; display:flex; align-items:center; justify-content: space-between; }
			.qz-quick-close { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #6b7280; }
			.qz-quick-list { list-style: none; margin: 0; padding: 8px 0; }
			.qz-quick-list li { margin: 0; padding: 0; }
			.qz-quick-list a { display: block; padding: 8px 16px; color: #111827; text-decoration: none; }
			.qz-quick-list a:hover { background: #f3f4f6; }
			.qz-quick-section { padding: 6px 16px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
		`;
		document.head.appendChild(style);
	}

	function createPanel() {
		const btn = document.createElement('button');
		btn.className = 'qz-quick-btn';
		btn.title = 'Abrir navegación rápida';
		btn.textContent = '☰ Menú';

		const panel = document.createElement('div');
		panel.className = 'qz-quick-panel';
		panel.innerHTML = `
			<div class="qz-quick-header">
				<span>Vistas de Quetzal</span>
				<button class="qz-quick-close" aria-label="Cerrar">×</button>
			</div>
			<div>
				<div class="qz-quick-section">General</div>
				<ul class="qz-quick-list" id="qz-list-general"></ul>
				<div class="qz-quick-section">Usuario</div>
				<ul class="qz-quick-list" id="qz-list-user"></ul>
				<div class="qz-quick-section">Admin</div>
				<ul class="qz-quick-list" id="qz-list-admin"></ul>
				<div class="qz-quick-section">PSE</div>
				<ul class="qz-quick-list" id="qz-list-pse"></ul>
			</div>
		`;

		document.body.appendChild(btn);
		document.body.appendChild(panel);

		const map = {
			general: document.getElementById('qz-list-general'),
			user: document.getElementById('qz-list-user'),
			admin: document.getElementById('qz-list-admin'),
			pse: document.getElementById('qz-list-pse')
		};

		VIEWS.forEach(v => {
			const a = document.createElement('a');
			a.href = toViewUrl(v.file);
			a.textContent = v.name;
			const li = document.createElement('li');
			li.appendChild(a);
			// Categorize
			const n = v.name.toLowerCase();
			if (n.startsWith('admin')) map.admin.appendChild(li);
			else if (n.includes('pse')) map.pse.appendChild(li);
			else if (['dashboard','perfil','mensajes','servicios (privado)','crear servicio','editar servicio','wallet','contratos'].some(k => n.includes(k))) map.user.appendChild(li);
			else map.general.appendChild(li);
		});

		btn.addEventListener('click', () => {
			panel.classList.toggle('open');
		});
		panel.querySelector('.qz-quick-close').addEventListener('click', () => panel.classList.remove('open'));
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => { createStyles(); createPanel(); });
	} else {
		createStyles(); createPanel();
	}
})();

