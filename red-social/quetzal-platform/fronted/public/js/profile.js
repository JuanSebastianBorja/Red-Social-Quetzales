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
    skillBadge.className = 'badge badge-info';
    skillBadge.style.padding = '0.5rem 1rem';
    skillBadge.style.fontSize = '0.875rem';
    skillBadge.style.cursor = 'pointer';
    skillBadge.innerHTML = `${skill} <span style="margin-left: 0.5rem; font-weight: bold;">×</span>`;
    
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