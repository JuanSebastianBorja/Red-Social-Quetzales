    // ============================================
    // CREATE-SERVICE.JS - Lógica para Crear Servicio
    // ============================================

    // Proteger la página
    requireAuth();

    // Verificar que el usuario sea proveedor
    const user = getAuthUser();
    if (user && user.userType === 'consumer') {
    showAlert('Solo los proveedores pueden publicar servicios', 'warning');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
    }

    // Elementos del DOM
    const createServiceForm = document.getElementById('create-service-form');
    const submitBtn = document.getElementById('submit-btn');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const requirementsInput = document.getElementById('requirements');
    const priceInput = document.getElementById('price');
    const imagesInput = document.getElementById('images');
    const imagesPreview = document.getElementById('images-preview');
    const logoutBtn = document.getElementById('logout-btn');

    // Event Listeners
    createServiceForm.addEventListener('submit', handleSubmit);
    titleInput.addEventListener('input', updateCharCounter);
    descriptionInput.addEventListener('input', updateCharCounter);
    requirementsInput.addEventListener('input', updateCharCounter);
    priceInput.addEventListener('input', updatePriceCOP);
    imagesInput.addEventListener('change', handleImagesChange);
    logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    });

    // Array para almacenar imágenes seleccionadas
    let selectedImages = [];

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
     * Actualiza el equivalente en COP del precio
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
     * Maneja el cambio de imágenes
     */
    function handleImagesChange(e) {
    const files = Array.from(e.target.files);
    
    // Validar cantidad
    if (files.length + selectedImages.length > 5) {
        showAlert('Puedes subir máximo 5 imágenes', 'warning');
        return;
    }
    
    // Validar cada archivo
    const validFiles = [];
    for (const file of files) {
        const validation = validateImageFile(file, 5);
        
        if (!validation.valid) {
        showAlert(validation.error, 'error');
        continue;
        }
        
        validFiles.push(file);
    }
    
    // Agregar archivos válidos
    selectedImages = [...selectedImages, ...validFiles];
    
    // Actualizar preview
    updateImagesPreview();
    
    // Limpiar input
    imagesInput.value = '';
    }

    /**
     * Actualiza el preview de imágenes
     */
    function updateImagesPreview() {
    imagesPreview.innerHTML = '';
    
    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
        const preview = document.createElement('div');
        preview.style.position = 'relative';
        preview.innerHTML = `
            <img 
            src="${e.target.result}" 
            alt="Preview ${index + 1}"
            style="width: 100%; height: 150px; object-fit: cover; border-radius: var(--radius-md);">
            <button 
            type="button"
            class="btn btn-sm"
            style="position: absolute; top: 0.5rem; right: 0.5rem; background-color: var(--error); color: white; padding: 0.25rem 0.5rem;"
            data-index="${index}">
            ✕
            </button>
        `;
        
        // Event listener para eliminar
        const deleteBtn = preview.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            selectedImages.splice(index, 1);
            updateImagesPreview();
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
    
    // Limpiar errores
    clearFormErrors();
    
    // Validar formulario
    if (!validateForm()) {
        return;
    }
    
    // Obtener datos del formulario
    const formData = {
        title: titleInput.value.trim(),
        category: document.getElementById('category').value,
        description: descriptionInput.value.trim(),
        price: parseFloat(priceInput.value),
        deliveryTime: document.getElementById('deliveryTime').value,
        availability: document.getElementById('availability').value,
        requirements: requirementsInput.value.trim(),
        images: selectedImages,
        userId: user.id,
        createdAt: new Date().toISOString()
    };
    
    // Deshabilitar botón
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span> Publicando...';
    
    try {
        // Aquí harías el upload de imágenes y creación del servicio
        // const response = await API.createService(formData);
        
        // Simulación
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showAlert('¡Servicio publicado exitosamente!', 'success');
        
        setTimeout(() => {
        window.location.href = 'services.html';
        }, 2000);
        
    } catch (error) {
        showAlert(error.message || 'Error al publicar el servicio', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publicar Servicio';
    }
    }

    /**
     * Valida todo el formulario
     */
    function validateForm() {
    let isValid = true;
    
    // Validar título
    const title = titleInput.value.trim();
    if (title.length < 10) {
        showFieldError('title', 'El título debe tener al menos 10 caracteres');
        isValid = false;
    }
    
    // Validar categoría
    const category = document.getElementById('category').value;
    if (!category) {
        showFieldError('category', 'Selecciona una categoría');
        isValid = false;
    }
    
    // Validar descripción
    const description = descriptionInput.value.trim();
    if (description.length < 50) {
        showFieldError('description', 'La descripción debe tener al menos 50 caracteres');
        isValid = false;
    }
    
    // Validar precio
    const price = parseFloat(priceInput.value);
    if (!price || price < 0.1) {
        showFieldError('price', 'El precio debe ser mayor a 0.1 Quetzales');
        isValid = false;
    }
    
    // Validar tiempo de entrega
    const deliveryTime = document.getElementById('deliveryTime').value;
    if (!deliveryTime) {
        showFieldError('deliveryTime', 'Selecciona un tiempo de entrega');
        isValid = false;
    }
    
    // Validar disponibilidad
    const availability = document.getElementById('availability').value;
    if (!availability) {
        showFieldError('availability', 'Selecciona el estado del servicio');
        isValid = false;
    }
    
    // Validar términos
    const terms = document.getElementById('terms').checked;
    if (!terms) {
        showFieldError('terms', 'Debes aceptar los términos');
        isValid = false;
    }
    
    // Validar al menos una imagen
    if (selectedImages.length === 0) {
        showAlert('Debes agregar al menos una imagen del servicio', 'warning');
        isValid = false;
    }
    
    return isValid;
    }