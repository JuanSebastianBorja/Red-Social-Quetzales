// Mensajes: chat en tiempo real con Socket.IO
import { API } from './api.js';
import { CONFIG } from './config.js';

const conversationsList = document.getElementById('conversationsList');
const conversationsMessage = document.getElementById('conversationsMessage');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatHeader = document.getElementById('chatHeader');
const chatTitle = document.getElementById('chatTitle');
const chatInputArea = document.getElementById('chatInputArea');
const selectConversationMessage = document.getElementById('selectConversationMessage');
const chatPanel = document.getElementById('chatPanel');
const backToConversations = document.getElementById('backToConversations');

let currentConversationId = null;
let socket = null;

// Inicializar Socket.IO
function initSocket(token) {
  socket = io(`${CONFIG.API_BASE_URL}`, {
  auth: { token },
  transports: ['websocket']
});

  socket.on('connect', () => {
    console.log('Conectado al chat');
  });

  socket.on('new_message', (msg) => {
    if (msg.conversation_id === currentConversationId) {
      appendMessage(msg); 
    }
  });

  socket.on('message_sent', (data) => {
    // Opcional: confirmación visual
  });

  socket.on('error', (err) => {
    alert('Error en el chat: ' + err.message);
  });

  socket.on('disconnect', () => {
    console.log('Desconectado del chat');
  });

  socket.on('conversation_updated', (update) => {
    const convItem = document.querySelector(`[data-conversation-id="${update.conversationId}"]`);
    if (convItem) {
      const previewEl = convItem.querySelector('.helper');
      const timeEl = convItem.querySelector('div[style*="text-align:right"]');
      if (previewEl) {
        previewEl.textContent = update.lastMessagePreview;
      }
      if (timeEl) {
        timeEl.textContent = new Date(update.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  });
}

function showMessage(el, text, type = 'info') {
  el.textContent = text;
  el.style.display = 'block';
  el.className = `helper ${type === 'error' ? 'error' : ''}`;
}

function renderConversationItem(conv) {
  const isUser1 = conv.user1_id === currentUserId;
  const otherUser = {
    id: isUser1 ? conv.user2_id : conv.user1_id,
    name: isUser1 ? conv.user2_name : conv.user1_name,
    avatar: isUser1 ? conv.user2_avatar : conv.user1_avatar
  };

  const container = document.createElement('div');
  container.className = 'conversation-item';
  container.setAttribute('data-conversation-id', conv.id);
  container.onclick = () => {
    // Remover active de todos
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.remove('active');
    });
    // Agregar active al actual
    container.classList.add('active');
    openConversation(conv.id, otherUser.name);
  };

  const avatarUrl = otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=6366f1&color=fff`;

  container.innerHTML = `
    <img src="${avatarUrl}" alt="${otherUser.name}" class="avatar" />
    <div class="conversation-info">
      <div class="conversation-name">${otherUser.name}</div>
      <div class="conversation-preview">${conv.last_message_preview || 'Ningún mensaje'}</div>
    </div>
    <div class="conversation-meta">
      ${conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
    </div>
  `;

  return container;
}

async function fetchConversations() {
  conversationsList.innerHTML = '';
  try {
    const data = await API.get('/messaging/conversations');
    if (!Array.isArray(data) || data.length === 0) {
      showMessage(conversationsMessage, 'No tienes conversaciones aún.');
      return;
    }
    const frag = document.createDocumentFragment();
    data.forEach(conv => frag.appendChild(renderConversationItem(conv)));
    conversationsList.appendChild(frag);
  } catch (err) {
    showMessage(conversationsMessage, 'No se pudieron cargar las conversaciones.', 'error');
  }
}

function openConversation(conversationId, title) {
  currentConversationId = conversationId;
  chatTitle.textContent = title;
  
  // Mostrar chat
  selectConversationMessage.style.display = 'none';
  messagesContainer.style.display = 'flex';
  chatInputArea.style.display = 'block';
  
  // En mobile, activar panel de chat
  if (window.innerWidth <= 768) {
    chatPanel.classList.add('active');
  }
  
  loadMessages(conversationId);
}

async function loadMessages(conversationId) {
  messagesContainer.innerHTML = '';
  try {
    const messages = await API.get(`/messaging/conversations/${conversationId}/messages`);
    if (Array.isArray(messages)) {
      messages.forEach(msg => appendMessage(msg)); // ✅
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  } catch (err) {
    console.error('Error al cargar mensajes:', err);
  }
}

function appendMessage(msg) {
  const isSent = msg.sender_id === currentUserId; 
  
  // Debug: ver qué datos llegan
  console.log('Mensaje recibido:', msg);

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
  
  const textEl = document.createElement('div');
  textEl.className = 'message-text';
  // Intentar diferentes campos posibles del mensaje
  textEl.textContent = msg.content || msg.message || msg.text || '';
  
  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = new Date(msg.created_at).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  bubble.appendChild(textEl);
  bubble.appendChild(timeEl);
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || !currentConversationId) return;

  if (socket && socket.connected) {
    socket.emit('send_message', {
      conversationId: currentConversationId,
      content: content,
      type: 'text'
    });
  }

  // Limpiar input y scroll
  messageInput.value = '';
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Event listeners
if (sendMessageBtn) {
  sendMessageBtn.addEventListener('click', sendMessage);
}

if (messageInput) {
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/vistas/login.html';
  });
}

// Inicializar
let currentUserId = null;

async function initApp() {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
  if (!token) {
    window.location.href = '/vistas/login.html';
    return;
  }
  

  // Obtener el ID del usuario logueado
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      currentUserId = user.id;
    } else {
      window.location.href = '/vistas/login.html';
      return;
    }
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    window.location.href = '/vistas/login.html';
    return;
  }

  initSocket(token);
  fetchConversations();

  // Botón volver en mobile
  if (backToConversations) {
    backToConversations.addEventListener('click', () => {
      chatPanel.classList.remove('active');
    });
  }

  // Manejo de URL con conversationId (opcional pero útil)
  const urlParams = new URLSearchParams(window.location.search);
  const conversationIdFromUrl = urlParams.get('conversationId');
  if (conversationIdFromUrl) {
    // Puedes cargar la conversación aquí si lo deseas
  }

  // En mensajes.js, dentro de initApp(), después de initSocket()
  if (typeof window.initNotifications === 'function' && socket) {
      window.initNotifications(currentUserId, socket);
  }

// Escuchar notificaciones en tiempo real
  socket.on('new_notification', (notif) => {
    if (typeof window.handleNewNotification === 'function') {
      window.handleNewNotification(notif);
    }
  });
}

initApp();