    // ============================================
    // CREATE-SERVICE.JS - Lógica para Crear Servicio
    // ============================================

    import API from './api.js'; // Importa el objeto API

// Variables globales para el módulo 
let selectedImages = []; // Array para almacenar imágenes seleccionadas
let user = null; // Inicializar user como null

// Función para inicializar la página
async function init() {
    // Verificar autenticación y tipo de usuario
    if (!setupAuth()) {
        return; // Detener si no es proveedor o no está autenticado
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

    // Verificar que los elementos existan antes de añadir listeners
    if (createServiceForm) {
        createServiceForm.addEventListener('submit', handleSubmit);
    } else {
        console.error("Formulario '#create-service-form' no encontrado en el DOM.");
        return; // Detener si no hay formulario
    }

    if (titleInput) titleInput.addEventListener('input', updateCharCounter);
    if (descriptionInput) descriptionInput.addEventListener('input', updateCharCounter);
    if (requirementsInput) requirementsInput.addEventListener('input', updateCharCounter);
    if (priceInput) priceInput.addEventListener('input', updatePriceCOP);
    if (imagesInput) imagesInput.addEventListener('change', handleImagesChange);
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout(); 
    });

    // Cargar balance y transacciones si es relevante aquí (opcional)
    // await loadBalance(); // Si estás en wallet.html
    // await loadTransactions(); // Si estás en wallet.html
}

// Función para verificar autenticación y tipo de usuario
function setupAuth() {
    requireAuth();

    user = getAuthUser();
    if (user && user.userType === 'consumer') {
        showAlert('Solo los proveedores pueden publicar servicios', 'warning');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return false; // Indicar que la inicialización debe detenerse
    }
    return true; // Continuar con la inicialización
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
 * Actualiza el equivalente en COP del precio
 */
function updatePriceCOP() {
    const priceInput = document.getElementById('price'); // Obtener el input dentro de la función si no está globalmente disponible
    const quetzales = parseFloat(priceInput?.value) || 0;
    const cop = quetzales * 10000; 
    const priceHelp = document.getElementById('price-cop');

    if (priceHelp) {
        priceHelp.textContent = `≈ $${cop.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} COP`;
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
    e.target.value = ''; // Limpiar el input del evento
}

/**
 * Actualiza el preview de imágenes
 */
function updateImagesPreview() {
    const imagesPreview = document.getElementById('images-preview'); // Obtener el contenedor dentro de la función si no está globalmente disponible
    if (!imagesPreview) {
        console.error("Contenedor '#images-preview' no encontrado.");
        return;
    }

    imagesPreview.innerHTML = '';

    selectedImages.forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'image-preview-item';
            preview.innerHTML = `
                <img 
                src="${e.target.result}" 
                alt="Preview ${index + 1}"
                class="image-preview-img">
                <button 
                type="button"
                class="image-preview-remove"
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

  // Validar formulario (sin validar imágenes aquí, solo campos del servicio)
  if (!validateForm()) {
    return;
  }

  // Obtener datos del formulario (sin las imágenes)
  const formData = {
    title: document.getElementById('title').value.trim(),
    category: document.getElementById('category').value,
    description: document.getElementById('description').value.trim(),
    price: parseFloat(document.getElementById('price').value),
    deliveryTime: document.getElementById('deliveryTime').value,
    availability: document.getElementById('availability').value,
    requirements: document.getElementById('requirements').value.trim(),
    // No incluir 'images' aquí
    // images: selectedImages, // <-- COMENTA ESTA LÍNEA
    // userId: user.id, // <-- No es necesario enviarlo, el backend lo obtiene de req.user
    // createdAt: new Date().toISOString() // <-- No es necesario enviarlo, el backend lo pone automáticamente
  };

  const submitBtn = document.getElementById('submit-btn');
  // Deshabilitar botón
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></span> Publicando...';

  try {
    // 1. Crear el servicio en el backend 
    const response = await API.createService(formData); // Llama a la API para crear el servicio

    if (!response.success) {
      throw new Error(response.message || 'Error al crear el servicio');
    }

    const { service } = response.data; 
    const serviceId = service.id; // Obtener el ID del servicio recién creado

    console.log("Servicio creado exitosamente con ID:", serviceId);

    // 2. Subir las imágenes 
    if (selectedImages.length > 0) {
      console.log("Subiendo imágenes para el servicio:", serviceId);
      // Llamar a una nueva función para subir imágenes
      await uploadServiceImages(serviceId, selectedImages);
    }

    showAlert(response.message || '✅ Servicio publicado exitosamente!', 'success');

    setTimeout(() => {
      window.location.href = 'services.html';
    }, 2000);

  } catch (error) {
    console.error("Error creando servicio o subiendo imágenes:", error);
    showAlert(error.message || '❌ Error al publicar el servicio', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publicar Servicio';
  }
}

/**
 * Sube imágenes para un servicio específico
 */
async function uploadServiceImages(serviceId, images) {
  // Crear FormData para enviar archivos
  const formData = new FormData();
  formData.append('serviceId', serviceId);

  images.forEach((file, index) => {
    formData.append('images', file); 
  });

  try {
    // Llama a una nueva ruta del backend para subir imágenes
    const response = await API.uploadServiceImages(formData);
    if (!response.success) {
      throw new Error(response.message || 'Error al subir imágenes');
    }
    console.log("Imágenes subidas exitosamente:", response.data);
  } catch (error) {
    console.error("Error subiendo imágenes:", error);
    throw error;
  }
}

/**
 * Valida todo el formulario
 */
function validateForm() {
    let isValid = true;

    // Validar título
    const titleInput = document.getElementById('title'); // Obtener el input dentro de la función
    const title = titleInput?.value.trim() || '';
    if (title.length < 10) {
        showFieldError('title', 'El título debe tener al menos 10 caracteres');
        isValid = false;
    }

    // Validar categoría
    const categoryInput = document.getElementById('category');
    const category = categoryInput?.value || '';
    if (!category) {
        showFieldError('category', 'Selecciona una categoría');
        isValid = false;
    }

    // Validar descripción
    const descriptionInput = document.getElementById('description');
    const description = descriptionInput?.value.trim() || '';
    if (description.length < 50) {
        showFieldError('description', 'La descripción debe tener al menos 50 caracteres');
        isValid = false;
    }

    // Validar precio
    const priceInput = document.getElementById('price');
    const price = parseFloat(priceInput?.value);
    if (!price || price < 0.1) {
        showFieldError('price', 'El precio debe ser mayor a 0.1 Quetzales');
        isValid = false;
    }

    // Validar tiempo de entrega
    const deliveryTimeInput = document.getElementById('deliveryTime');
    const deliveryTime = deliveryTimeInput?.value || '';
    if (!deliveryTime) {
        showFieldError('deliveryTime', 'Selecciona un tiempo de entrega');
        isValid = false;
    }

    // Validar disponibilidad
    const availabilityInput = document.getElementById('availability');
    const availability = availabilityInput?.value || '';
    if (!availability) {
        showFieldError('availability', 'Selecciona el estado del servicio');
        isValid = false;
    }

    // Validar términos
    const termsInput = document.getElementById('terms');
    const terms = termsInput?.checked || false;
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

// Asegurar que el DOM esté completamente cargado antes de ejecutar la lógica principal
document.addEventListener('DOMContentLoaded', init);