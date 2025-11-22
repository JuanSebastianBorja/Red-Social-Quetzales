    // ============================================
    // PROFILE.JS - Lógica de Perfil de Usuario
    // ============================================

    // Proteger la página
    requireAuth();

    // Elementos del DOM
    const profileForm = document.getElementById('profile-form');
    const securityForm = document.getElementById('security-form');
    const notificationsForm = document.getElementById('notifications-form');
    const avatarInput = document.getElementById('avatar-input');
    const profileAvatar = document.getElementById('profile-avatar');
    const addSkillBtn = document.getElementById('add-skill-btn');
    const skillInput = document.getElementById('skill-input');
    const skillsContainer = document.getElementById('skills-container');
    const logoutBtn = document.getElementById('logout-btn');

    // Event Listeners
    profileForm.addEventListener('submit', handleProfileSubmit);
    securityForm.addEventListener('submit', handleSecuritySubmit);
    notificationsForm.addEventListener('submit', handleNotificationsSubmit);
    avatarInput.addEventListener('change', handleAvatarChange);
    addSkillBtn.addEventListener('click', handleAddSkill);
    skillInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSkill();
    }
    });
    logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    });

    // Navegación entre tabs
    const navLinks = document.querySelectorAll('.profile-nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.dataset.tab;
        
        // Remover clase active de todos
        navLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        // Activar el seleccionado
        link.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
    });

    // Cargar datos del usuario
    loadUserData();

    // Cargar actividad adicional (wallet, servicios, transacciones)
    loadProfileActivity();

    async function loadProfileActivity() {
        try {
            // Wallet
            const balance = await API.getWalletBalance();
            document.getElementById('profile-balance-quetzales').textContent = `Q${(balance.balance || 0).toFixed(2)}`;
            document.getElementById('profile-pending-escrow').textContent = `Q${(balance.escrowBalance || 0).toFixed(2)}`;
            document.getElementById('profile-balance-cop').textContent = `$${((balance.balance || 0) * 10000).toLocaleString()} COP`;

            // Mis servicios
            const myServices = await API.getMyServices();
            const servicesContainer = document.getElementById('profile-my-services');
            servicesContainer.innerHTML = '';
            (myServices || []).forEach(service => {
                const div = document.createElement('div');
                div.className = 'service-card';
                div.innerHTML = `
                    <div class="service-card-image"><img src="${(service.images && service.images[0]) || '/public/img/placeholder.jpg'}" alt="${service.title}"></div>
                    <div class="service-card-content">
                        <h4>${service.title}</h4>
                        <p class="price">Q${(service.price || 0).toFixed(2)}</p>
                        <div class="flex justify-between items-center mt-2">
                            <span class="status status-${service.status}">${service.status}</span>
                            <a href="edit-service.html?id=${service.id}" class="btn btn-sm btn-secondary">Editar</a>
                        </div>
                    </div>
                `;
                servicesContainer.appendChild(div);
            });

            // Transacciones
            const txs = await API.getTransactions({ limit: 10 });
            const txContainer = document.getElementById('profile-transactions-list');
            txContainer.innerHTML = '';
            (txs || []).forEach(tx => {
                const item = document.createElement('div');
                item.className = 'transaction-item';
                item.innerHTML = `
                    <div class="transaction-icon ${tx.type}">${tx.type}</div>
                    <div class="transaction-info">
                        <div class="transaction-title">${tx.description}</div>
                        <div class="transaction-date">${new Date(tx.createdAt || tx.date || tx.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="transaction-amount ${tx.amount > 0 ? 'positive' : 'negative'}">${tx.amount > 0 ? '+' : ''}Q${(tx.amount || 0).toFixed(2)}</div>
                `;
                txContainer.appendChild(item);
            });
        } catch (err) {
            console.error('Error loading profile activity', err);
        }
    }

    /**
     * Carga los datos del usuario desde localStorage o API
     */
    function loadUserData() {
    const user = getAuthUser();
    
    if (user) {
        // Cargar datos en el formulario
        document.getElementById('fullName').value = user.name || '';
        document.getElementById('phone').value = user.phone || '+57 300 123 4567';
        document.getElementById('city').value = user.city || 'bogota';
        document.getElementById('userType').value = user.userType || 'both';
        document.getElementById('bio').value = user.bio || 'Desarrollador Full Stack con 5 años de experiencia...';
        document.getElementById('website').value = user.website || '';
        
        // Actualizar avatar
        if (user.avatar) {
        profileAvatar.src = user.avatar;
        }
    }
    }

    /**
     * Maneja el envío del formulario de perfil
     */
    async function handleProfileSubmit(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        city: document.getElementById('city').value,
        userType: document.getElementById('userType').value,
        bio: document.getElementById('bio').value.trim(),
        website: document.getElementById('website').value.trim()
    };
    
    try {
        // Llamada a la API
        // await API.updateProfile(formData);
        
        // Simulación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Actualizar localStorage
        const user = getAuthUser();
        const updatedUser = { ...user, ...formData, name: formData.fullName };
        localStorage.setItem('quetzal_user', JSON.stringify(updatedUser));
        
        showAlert('Perfil actualizado exitosamente', 'success');
    } catch (error) {
        showAlert('Error al actualizar el perfil', 'error');
    }
    }

    /**
     * Maneja el envío del formulario de seguridad
     */
    async function handleSecuritySubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Validar nueva contraseña
    if (!isValidPassword(newPassword)) {
        showAlert('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número', 'error');
        return;
    }
    
    // Validar coincidencia
    if (newPassword !== confirmNewPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }
    
    try {
        // Llamada a la API
        // await API.changePassword({ currentPassword, newPassword });
        
        // Simulación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showAlert('Contraseña actualizada exitosamente', 'success');
        
        // Limpiar formulario
        securityForm.reset();
    } catch (error) {
        showAlert('Error al actualizar la contraseña', 'error');
    }
    }

    /**
     * Maneja el envío del formulario de notificaciones
     */
    async function handleNotificationsSubmit(e) {
    e.preventDefault();
    
    const preferences = {
        emailTransactions: document.getElementById('email-transactions').checked,
        emailMessages: document.getElementById('email-messages').checked,
        emailServices: document.getElementById('email-services').checked,
        emailMarketing: document.getElementById('email-marketing').checked,
        pushEnabled: document.getElementById('push-enabled').checked
    };
    
    try {
        // Llamada a la API
        // await API.updateNotificationPreferences(preferences);
        
        // Simulación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showAlert('Preferencias guardadas exitosamente', 'success');
    } catch (error) {
        showAlert('Error al guardar preferencias', 'error');
    }
    }

    /**
     * Maneja el cambio de avatar
     */
    async function handleAvatarChange(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validar archivo
    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
        showAlert(validation.error, 'error');
        return;
    }
    
    try {
        // Leer archivo como data URL
        const reader = new FileReader();
        reader.onload = async (event) => {
        const dataUrl = event.target.result;
        
        // Actualizar preview
        profileAvatar.src = dataUrl;
        
        // Aquí harías el upload a tu API
        // await API.uploadAvatar(file);
        
        // Actualizar localStorage
        const user = getAuthUser();
        user.avatar = dataUrl;
        localStorage.setItem('quetzal_user', JSON.stringify(user));
        
        showAlert('Avatar actualizado exitosamente', 'success');
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        showAlert('Error al subir la imagen', 'error');
    }
    }

    /**
     * Maneja agregar una habilidad
     */
    function handleAddSkill() {
    const skill = skillInput.value.trim();
    
    if (!skill) {
        showAlert('Ingresa una habilidad', 'warning');
        return;
    }
    
    if (skill.length < 2) {
        showAlert('La habilidad debe tener al menos 2 caracteres', 'warning');
        return;
    }
    
    // Crear badge de habilidad
    const skillBadge = document.createElement('span');
    skillBadge.className = 'skill-badge';
    skillBadge.innerHTML = `${skill} <span class="skill-remove">×</span>`;
    
    // Event listener para eliminar
    skillBadge.addEventListener('click', () => {
        skillBadge.remove();
    });
    
    // Agregar al contenedor
    skillsContainer.appendChild(skillBadge);
    
    // Limpiar input
    skillInput.value = '';
    skillInput.focus();
    }

    /**
     * Contador de caracteres para textareas
     */
    document.getElementById('bio').addEventListener('input', function() {
    const counter = document.createElement('span');
    counter.textContent = `${this.value.length}/1000 caracteres`;
    });

    // Inicializar contadores si existen
    const textareas = document.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
    const maxLength = textarea.getAttribute('maxlength');
    const helpText = textarea.parentElement.querySelector('.form-help');
    
    if (helpText) {
        textarea.addEventListener('input', () => {
        helpText.textContent = `${textarea.value.length}/${maxLength} caracteres`;
        });
        
        // Inicializar contador
        helpText.textContent = `${textarea.value.length}/${maxLength} caracteres`;
    }
    });
