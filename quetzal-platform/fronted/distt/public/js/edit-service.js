    // ============================================
    // EDIT-SERVICE.JS - Lógica para Editar Servicio
    // ============================================

    // Proteger la página
    requireAuth();

    // Elementos del DOM
    const editServiceForm = document.getElementById('edit-service-form');
    const loadingState = document.getElementById('loading-state');
    const submitBtn = document.getElementById('submit-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const requirementsInput = document.getElementById('requirements');
    const priceInput = document.getElementById('price');
    const imagesInput = document.getElementById('images');
    const imagesPreview = document.getElementById('images-preview');
    const currentImagesContainer = document.getElementById('current-images');
    const logoutBtn = document.getElementById('logout-btn');

    // Variables globales
    let serviceId = null;
    let currentService = null;
    let selectedImages = [];
    let imagesToDelete = [];

    // Event Listeners
    editServiceForm.addEventListener('submit', handleSubmit);
    deleteBtn.addEventListener('click', handleDelete);
    titleInput.addEventListener('input', updateCharCounter);
    descriptionInput.addEventListener('input', updateCharCounter);
    requirementsInput.addEventListener('input', updateCharCounter);
    priceInput.addEventListener('input', updatePriceCOP);
    imagesInput.addEventListener('change', handleImagesChange);
    logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    });

    // Obtener ID del servicio de la URL
    const urlParams = new URLSearchParams(window.location.search);
    serviceId = urlParams.get('id');

    if (!serviceId) {
    showAlert('Servicio no encontrado', 'error');
    setTimeout(() => {
        window.location.href = 'services.html';
    }, 2000);
    } else {
    loadServiceData();
    }

    /**
     * Carga los datos del servicio
     */
    async function loadServiceData() {
    try {
        // Llamada a la API
        // const service = await API.getService(serviceId);
        
        // Simulación - datos de ejemplo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        currentService = {
        id: serviceId,
        title: 'Desarrollo de Sitio Web Profesional',
        category: 'desarrollo',
        description: 'Creo sitios web profesionales y modernos utilizando las últimas tecnologías. Incluye diseño responsivo, optimización SEO y panel de administración.',
        price: 15.5,
        deliveryTime: '7',
        availability: 'active',
        requirements: 'Logo en formato vectorial, contenido del sitio, colores de marca',
        images: [
            'https://via.placeholder.com/400x300/6366f1/ffffff?text=Imagen+1',
            'https://via.placeholder.com/400x300/10b981/ffffff?text=Imagen+2',
            'https://via.placeholder.com/400x300/f59e0b/ffffff?text=Imagen+3'
        ]
        };
        
        // Llenar formulario
        document.getElementById('serviceId').value = currentService.id;
        titleInput.value = currentService.title;
        document.getElementById('category').value = currentService.category;
        descriptionInput.value = currentService.description;
        priceInput.value = currentService.price;
        document.getElementById('deliveryTime').value = currentService.deliveryTime;
        document.getElementById('availability').value = currentService.availability;
        requirementsInput.value = currentService.requirements || '';
        
        // Actualizar contadores
        updateCharCounter({ target: titleInput });
        updateCharCounter({ target: descriptionInput });
        updateCharCounter({ target: requirementsInput });
        updatePriceCOP();
        
        // Mostrar imágenes actuales
        displayCurrentImages();
        
        // Ocultar loading y mostrar formulario
        loadingState.style.display = 'none';
        editServiceForm.style.display = 'block';
        
    } catch (error) {
        showAlert('Error al cargar el servicio', 'error');
        setTimeout(() => {
        window.location.href = 'services.html';
        }, 2000);
    }
    }

    /**
     * Muestra las imágenes actuales del servicio
     */
    function displayCurrentImages() {
    currentImagesContainer.innerHTML = '';
    
    if (!currentService.images || currentService.images.length === 0) {
        currentImagesContainer.innerHTML = '<p class="text-muted">No hay imágenes</p>';
        return;
    }
    
    currentService.images.forEach((imageUrl, index) => {
        // Skip si está marcada para eliminar
        if (imagesToDelete.includes(imageUrl)) return;
        
        const imageDiv = document.createElement('div');
        imageDiv.className = 'image-preview-item';
        imageDiv.innerHTML = `
        <img 
            src="${imageUrl}" 
            alt="Imagen ${index + 1}"
            class="image-preview-img">
        <button 
            type="button"
            class="image-preview-remove"
            data-url="${imageUrl}">
            ✕
        </button>
        `;
        
        // Event listener para marcar imagen para eliminar
        const deleteBtn = imageDiv.querySelector('button');
        deleteBtn.addEventListener('click', () => {
        imagesToDelete.push(imageUrl);
        displayCurrentImages();
        });
        
        currentImagesContainer.appendChild(imageDiv);
    });
    }

    /**
     * Actualiza el contador de caracteres
     */
    function updateCharCounter(e) {
    const input = e.target;
    const counter = document.getElementById(`${input.id}-counter`);
    const maxLength = input.getAttribute('maxlength');
    
    if (counter && maxLength) {
        counter.textContent = `${input.value.length}/${maxLength} caracteres`;
    }
    }

    /**
     * Actualiza el equivalente en COP
     */
    function updatePriceCOP() {
    const quetzales = parseFloat(priceInput.value) || 0;
    const cop = quetzalesToCOP(quetzales);
    const priceHelp = document.getElementById('price-cop');
    
    if (priceHelp) {
        priceHelp.textContent = `≈ ${formatCOP(cop)}`;
    }
    }

    /**
     * Maneja el cambio de nuevas imágenes
     */
    function handleImagesChange(e) {
    const files = Array.from(e.target.files);
    
    // Calcular imágenes restantes
    const remainingImages = currentService.images.length - imagesToDelete.length;
    const totalImages = remainingImages + selectedImages.length + files.length;
    
    if (totalImages > 5) {
        showAlert('Puedes tener máximo 5 imágenes en total', 'warning');
        return;
    }
    
    // Validar archivos
    const validFiles = [];
    for (const file of files) {
        const validation = validateImageFile(file, 5);
        
        if (!validation.valid) {
        showAlert(validation.error, 'error');
        continue;
        }
        
        validFiles.push(file);
    }
    
    selectedImages = [...selectedImages, ...validFiles];
    updateNewImagesPreview();
    imagesInput.value = '';
    }

    /**
     * Actualiza el preview de nuevas imágenes
     */
    function updateNewImagesPreview() {
    imagesPreview.innerHTML = '';
    
    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
        const preview = document.createElement('div');
        preview.className = 'image-preview-item';
        preview.innerHTML = `
            <img 
            src="${e.target.result}" 
            alt="Nueva ${index + 1}"
            class="image-preview-img">
            <span class="image-preview-badge badge badge-success">Nueva</span>
            <button 
            type="button"
            class="image-preview-remove"
            data-index="${index}">
            ✕
            </button>
        `;
        
        const deleteBtn = preview.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            selectedImages.splice(index, 1);
            updateNewImagesPreview();
        });
        
        imagesPreview.appendChild(preview);
        };
        
        reader.readAsDataURL(file);
    });
    }

    /**
     * Maneja el envío del formulario
     */
    async function handleSubmit(e) {
    e.preventDefault();
    
    clearFormErrors();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = {
        id: serviceId,
        title: titleInput.value.trim(),
        category: document.getElementById('category').value,
        description: descriptionInput.value.trim(),
        price: parseFloat(priceInput.value),
        deliveryTime: document.getElementById('deliveryTime').value,
        availability: document.getElementById('availability').value,
        requirements: requirementsInput.value.trim(),
        newImages: selectedImages,
        imagesToDelete: imagesToDelete,
        updatedAt: new Date().toISOString()
    };
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span> Guardando...';
    
    try {
        // await API.updateService(formData);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showAlert('¡Servicio actualizado exitosamente!', 'success');
        
        setTimeout(() => {
        window.location.href = 'services.html';
        }, 2000);
        
    } catch (error) {
        showAlert(error.message || 'Error al actualizar el servicio', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cambios';
    }
    }

    /**
     * Maneja la eliminación del servicio
     */
    async function handleDelete() {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.')) {
        return;
    }
    
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Eliminando...';
    
    try {
        // await API.deleteService(serviceId);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showAlert('Servicio eliminado exitosamente', 'success');
        
        setTimeout(() => {
        window.location.href = 'services.html';
        }, 2000);
        
    } catch (error) {
        showAlert('Error al eliminar el servicio', 'error');
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Eliminar Servicio';
    }
    }

    /**
     * Valida el formulario
     */
    function validateForm() {
    let isValid = true;
    
    const title = titleInput.value.trim();
    if (title.length < 10) {
        showFieldError('title', 'El título debe tener al menos 10 caracteres');
        isValid = false;
    }
    
    const description = descriptionInput.value.trim();
    if (description.length < 50) {
        showFieldError('description', 'La descripción debe tener al menos 50 caracteres');
        isValid = false;
    }
    
    const price = parseFloat(priceInput.value);
    if (!price || price < 0.1) {
        showFieldError('price', 'El precio debe ser mayor a 0.1 Quetzales');
        isValid = false;
    }
    
    // Validar que haya al menos una imagen
    const remainingImages = currentService.images.length - imagesToDelete.length;
    const totalImages = remainingImages + selectedImages.length;
    
    if (totalImages === 0) {
        showAlert('El servicio debe tener al menos una imagen', 'warning');
        isValid = false;
    }
    
    return isValid;
    }
