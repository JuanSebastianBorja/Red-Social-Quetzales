// Chat Bot Manager
class ChatBot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        // URL del chat trigger de n8n - formato: https://tu-instancia.n8n.cloud/webhook/WEBHOOK_ID/chat
        this.n8nWebhookUrl = ''; 
        this.useFallback = false; // Si true, usa respuestas predefinidas
        this.sessionId = this.generateSessionId();
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.createChatUI();
        this.attachEventListeners();
        this.showWelcomeMessage();
    }

    createChatUI() {
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-bot-container';
        chatContainer.innerHTML = `
            <button class="chat-bot-button" id="chatBotButton" aria-label="Abrir chat de ayuda">
                <i class="fas fa-comments"></i>
            </button>
            
            <div class="chat-bot-window" id="chatBotWindow">
                <div class="chat-bot-header">
                    <div class="chat-bot-header-content">
                        <div class="chat-bot-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="chat-bot-info">
                            <h3>Asistente Quetzal</h3>
                            <p>En línea</p>
                        </div>
                    </div>
                    <button class="chat-bot-close" id="chatBotClose" aria-label="Cerrar chat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="chat-bot-messages" id="chatBotMessages">
                    <!-- Los mensajes se agregarán aquí dinámicamente -->
                </div>
                
                <div class="quick-suggestions" id="quickSuggestions">
                    <button class="suggestion-chip" data-message="¿Cómo publicar un servicio?">
                        Publicar servicio
                    </button>
                    <button class="suggestion-chip" data-message="¿Cómo funcionan los contratos?">
                        Contratos
                    </button>
                    <button class="suggestion-chip" data-message="¿Cómo recargar mi cartera?">
                        Recargar cartera
                    </button>
                    <button class="suggestion-chip" data-message="Necesito ayuda">
                        Ayuda
                    </button>
                </div>
                
                <div class="chat-bot-input">
                    <input 
                        type="text" 
                        id="chatBotInput" 
                        placeholder="Escribe tu mensaje..." 
                        autocomplete="off"
                    />
                    <button class="chat-bot-send" id="chatBotSend" aria-label="Enviar mensaje">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(chatContainer);
    }

    attachEventListeners() {
        const chatButton = document.getElementById('chatBotButton');
        const closeButton = document.getElementById('chatBotClose');
        const sendButton = document.getElementById('chatBotSend');
        const input = document.getElementById('chatBotInput');
        const suggestions = document.querySelectorAll('.suggestion-chip');

        chatButton.addEventListener('click', () => this.toggleChat());
        closeButton.addEventListener('click', () => this.closeChat());
        sendButton.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        suggestions.forEach(chip => {
            chip.addEventListener('click', () => {
                const message = chip.getAttribute('data-message');
                this.sendUserMessage(message);
            });
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chatBotWindow');
        const chatButton = document.getElementById('chatBotButton');
        
        if (this.isOpen) {
            chatWindow.classList.add('active');
            chatButton.classList.add('active');
            document.getElementById('chatBotInput').focus();
        } else {
            chatWindow.classList.remove('active');
            chatButton.classList.remove('active');
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('chatBotWindow').classList.remove('active');
        document.getElementById('chatBotButton').classList.remove('active');
    }

    showWelcomeMessage() {
        const messagesContainer = document.getElementById('chatBotMessages');
        const welcomeHTML = `
            <div class="welcome-message">
                <i class="fas fa-robot"></i>
                <h4>¡Hola! Soy tu asistente virtual</h4>
                <p>¿En qué puedo ayudarte hoy?</p>
            </div>
        `;
        messagesContainer.innerHTML = welcomeHTML;
    }

    sendMessage() {
        const input = document.getElementById('chatBotInput');
        const message = input.value.trim();
        
        if (message) {
            this.sendUserMessage(message);
            input.value = '';
        }
    }

    async sendUserMessage(message) {
        this.addMessage('user', message);
        this.showTypingIndicator();
        
        try {
            let response;
            
            // Si hay URL de n8n configurada y no está en modo fallback, usar n8n
            if (this.n8nWebhookUrl && !this.useFallback) {
                response = await this.sendToN8n(message);
            } else {
                // Usar respuestas predefinidas como fallback
                response = this.getBotResponseFallback(message);
            }
            
            this.hideTypingIndicator();
            this.addMessage('bot', response);
        } catch (error) {
            console.error('Error al obtener respuesta:', error);
            this.hideTypingIndicator();
            
            // Si falla n8n, intentar con respuestas predefinidas
            const fallbackResponse = this.getBotResponseFallback(message);
            this.addMessage('bot', fallbackResponse);
        }
    }

    async sendToN8n(message) {
        try {
            const userData = this.getUserContext();
            
            // Formato específico para Chat Trigger de n8n
            const payload = {
                action: 'sendMessage',
                sessionId: this.sessionId,
                chatInput: message
            };

            const response = await fetch(this.n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // El Chat Trigger devuelve la respuesta en formato específico
            // Puede ser data.output o data.text o directamente el texto
            let botResponse = '';
            
            if (typeof data === 'string') {
                botResponse = data;
            } else if (data.output) {
                botResponse = data.output;
            } else if (data.text) {
                botResponse = data.text;
            } else if (data.response) {
                botResponse = data.response;
            } else {
                // Si es un array o estructura compleja, intentar extraer el mensaje
                botResponse = JSON.stringify(data);
            }
            
            return botResponse || 'Lo siento, no pude procesar tu mensaje.';
            
        } catch (error) {
            console.error('Error al conectar con n8n:', error);
            throw error;
        }
    }

    getUserContext() {
        // Obtener contexto del usuario del localStorage o sesión
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        return {
            isAuthenticated: !!token,
            userData: user ? JSON.parse(user) : null,
            currentPage: window.location.pathname
        };
    }

    // Método para configurar la URL del webhook de n8n
    setN8nWebhook(url) {
        this.n8nWebhookUrl = url;
        this.useFallback = false;
        console.log('Webhook de n8n configurado:', url);
    }

    // Método para activar/desactivar el modo fallback
    setFallbackMode(enabled) {
        this.useFallback = enabled;
        console.log('Modo fallback:', enabled ? 'activado' : 'desactivado');
    }

    addMessage(sender, text) {
        const messagesContainer = document.getElementById('chatBotMessages');
        
        // Remover mensaje de bienvenida si existe
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}`;
        
        const time = new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        // Obtener avatar del usuario
        let avatarHTML = '';
        if (sender === 'bot') {
            avatarHTML = `
                <div class="message-avatar ${sender}">
                    <i class="fas fa-robot"></i>
                </div>
            `;
        } else {
            // Para el usuario, intentar obtener su foto de perfil
            const userAvatar = this.getUserAvatar();
            if (userAvatar) {
                avatarHTML = `
                    <div class="message-avatar ${sender} message-avatar-image">
                        <img src="${userAvatar}" alt="Usuario" />
                    </div>
                `;
            } else {
                avatarHTML = `
                    <div class="message-avatar ${sender}">
                        <i class="fas fa-user"></i>
                    </div>
                `;
            }
        }
        
        messageElement.innerHTML = `
            ${avatarHTML}
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        this.messages.push({ sender, text, time });
    }

    getUserAvatar() {
        try {
            const user = localStorage.getItem('user');
            if (user) {
                const userData = JSON.parse(user);
                // Retornar avatar_url si existe, o generar uno con UI Avatars
                if (userData.avatar_url) {
                    return userData.avatar_url;
                } else if (userData.username) {
                    // Generar avatar con UI Avatars basado en el nombre de usuario
                    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=6366f1&color=fff&size=128`;
                }
            }
            return null;
        } catch (error) {
            console.error('Error al obtener avatar del usuario:', error);
            return null;
        }
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatBotMessages');
        const typingElement = document.createElement('div');
        typingElement.className = 'chat-message bot';
        typingElement.id = 'typingIndicator';
        typingElement.innerHTML = `
            <div class="message-avatar bot">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator active">
                    <div class="typing-dots">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatBotMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Respuestas predeterminadas como fallback
    getBotResponseFallback(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hola') || lowerMessage.includes('buenos')) {
            return '¡Hola! 👋 Bienvenido a tu dashboard de Quetzal. ¿En qué puedo ayudarte hoy?';
        }
        
        if (lowerMessage.includes('servicio') && (lowerMessage.includes('publicar') || lowerMessage.includes('crear'))) {
            return 'Para publicar un servicio, ve a la sección "Publicar Servicio" en el menú lateral. Completa título, descripción, categoría, precio y condiciones. ¿Necesitas ayuda con algún paso específico?';
        }
        
        if (lowerMessage.includes('contrato')) {
            return 'Los contratos se generan automáticamente cuando alguien acepta tu servicio. Puedes ver todos tus contratos en la sección "Contratos" del menú. Los fondos se retienen en escrow hasta la finalización. ¿Tienes alguna pregunta específica?';
        }
        
        if (lowerMessage.includes('cartera') || lowerMessage.includes('recargar') || lowerMessage.includes('dinero')) {
            return 'Puedes recargar tu cartera desde la sección "Cartera" usando ePayco. Las recargas se convierten automáticamente a Quetzales (QZ). También puedes retirar fondos desde allí. ¿Necesitas ayuda con una transacción?';
        }
        
        if (lowerMessage.includes('disputa')) {
            return 'Si tienes un problema con un contrato, puedes abrir una disputa desde la sección "Disputas". Un administrador revisará el caso y tomará una decisión. ¿Tienes un contrato problemático?';
        }
        
        if (lowerMessage.includes('mensaje') || lowerMessage.includes('chat')) {
            return 'Los mensajes te permiten comunicarte con otros usuarios. Revisa la sección "Mensajes" para ver tus conversaciones. Puedes enviar mensajes a clientes o proveedores de servicios.';
        }
        
        if (lowerMessage.includes('perfil') || lowerMessage.includes('calificación') || lowerMessage.includes('reputación')) {
            return 'Tu perfil muestra tu información, servicios y calificaciones. Una buena reputación ayuda a conseguir más clientes. Puedes editar tu perfil desde la sección "Perfil" en el menú.';
        }
        
        if (lowerMessage.includes('solicitud')) {
            return 'En "Solicitudes" puedes ver las ofertas que has enviado para servicios y las que han recibido tus publicaciones. Gestiona aceptaciones y rechazos desde ahí.';
        }
        
        if (lowerMessage.includes('ayuda') || lowerMessage.includes('problema') || lowerMessage.includes('soporte')) {
            return 'Estoy aquí para ayudarte. Puedo asistirte con: publicación de servicios, contratos, gestión de cartera, disputas, mensajes, y más. ¿Qué necesitas específicamente?';
        }
        
        if (lowerMessage.includes('gracias')) {
            return '¡De nada! 😊 Si necesitas algo más, no dudes en preguntarme. Estoy aquí para ayudarte.';
        }
        
        // Respuesta por defecto
        return 'Entiendo tu consulta. Puedo ayudarte con: publicar servicios, gestionar contratos, recargar cartera, resolver disputas, y más. ¿Podrías darme más detalles sobre lo que necesitas?';
    }
}

// Inicializar el chat bot cuando el DOM esté listo
let chatBotInstance;

document.addEventListener('DOMContentLoaded', () => {
    chatBotInstance = new ChatBot();
    
    // Configurar el webhook del Chat Trigger de n8n
    // IMPORTANTE: El formato debe ser: https://tu-instancia/webhook/WEBHOOK_ID/chat
    // Tu webhookId es: 44038449-ed55-44a0-893c-8962b0a15b90
    
    // Detectar entorno y configurar URL apropiada
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
        // CONFIGURACIÓN PARA PRODUCCIÓN (Render)
        
        // Opción 1: n8n desplegado en Render (recomendado) ⭐
        // Reemplaza 'tu-n8n-app' con el nombre de tu servicio de n8n en Render
        // chatBotInstance.setN8nWebhook('https://tu-n8n-app.onrender.com/webhook/44038449-ed55-44a0-893c-8962b0a15b90/chat');
        
        // Opción 2: n8n cloud
        // chatBotInstance.setN8nWebhook('https://tu-instancia.n8n.cloud/webhook/44038449-ed55-44a0-893c-8962b0a15b90/chat');
        
        // Opción 3: Otro servidor de n8n
        // chatBotInstance.setN8nWebhook('https://tu-n8n-production.com/webhook/44038449-ed55-44a0-893c-8962b0a15b90/chat');
        
        // TEMPORAL: Usar modo fallback en producción hasta configurar n8n
        chatBotInstance.setFallbackMode(true);
        console.log('Chat Bot: Modo fallback activado (sin conexión a n8n)');
        console.log('Para conectar con n8n, descomenta una de las opciones arriba');
    } else {
        // CONFIGURACIÓN PARA DESARROLLO LOCAL
        chatBotInstance.setN8nWebhook('http://localhost:5678/webhook/44038449-ed55-44a0-893c-8962b0a15b90/chat');
        chatBotInstance.setFallbackMode(false);
        console.log('Chat Bot: Conectado a n8n local');
    }
});

// Exponer instancia globalmente para configuración dinámica
window.chatBot = () => chatBotInstance;
