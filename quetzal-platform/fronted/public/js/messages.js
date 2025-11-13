// ============================================
// MESSAGES.JS - Sistema de Mensajería
// ============================================

import API from './api.js';

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================

let currentConversationId = null;
let pollingInterval = null;
let currentUser = null;

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Configurar event listeners
    setupEventListeners();
    
    // Cargar conversaciones
    await loadConversations();
    
    // Iniciar polling cada 5 segundos
    setInterval(refreshCurrentConversation, 5000);
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    const form = document.getElementById('message-form');
    if (form) {
        form.addEventListener('submit', handleSendMessage);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// ============================================
// CARGAR CONVERSACIONES
// ============================================

async function loadConversations() {
    try {
        const response = await API.getConversations({ status: 'active', limit: 50 });
        const conversations = response.conversations || [];
        
        const list = document.getElementById('conversations-list');
        
        if (!conversations.length) {
            list.innerHTML = '<li class="empty-message">No hay conversaciones</li>';
            return;
        }
        
        list.innerHTML = conversations.map(conv => {
            const otherUser = conv.otherUser || {};
            const unreadBadge = conv.unreadCount > 0 
                ? `<span class="unread-badge">${conv.unreadCount}</span>` 
                : '';
            
            const serviceInfo = conv.service 
                ? `<div class="conversation-service">📦 ${escapeHtml(conv.service.title)}</div>` 
                : '';
            
            const timeAgo = conv.lastMessageAt 
                ? formatTimeAgo(new Date(conv.lastMessageAt))
                : '';
            
            return `
                <li class="conversation-item ${conv.unreadCount > 0 ? 'unread' : ''}" 
                    data-id="${conv.id}" 
                    onclick="window.messagesApp.openConversation('${conv.id}')">
                    <div class="conversation-avatar">
                        <img src="${otherUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(otherUser.fullName || 'Usuario')}" 
                             alt="${escapeHtml(otherUser.fullName || 'Usuario')}">
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-header">
                            <h4>${escapeHtml(otherUser.fullName || 'Usuario')}</h4>
                            ${unreadBadge}
                        </div>
                        <p class="conversation-preview">${escapeHtml(conv.lastMessagePreview || '')}</p>
                        ${serviceInfo}
                    </div>
                    <div class="conversation-time">${timeAgo}</div>
                </li>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error cargando conversaciones:', error);
        document.getElementById('conversations-list').innerHTML = 
            '<li class="error-message">Error al cargar conversaciones</li>';
    }
}

// ============================================
// ABRIR CONVERSACIÓN
// ============================================

async function openConversation(id) {
    try {
        currentConversationId = id;
        
        // Obtener información de la conversación
        const response = await API.getConversation(id);
        const conversation = response.conversation;
        
        // Actualizar header
        const chatHeader = document.getElementById('chat-header');
        const otherUser = conversation.otherUser || {};
        chatHeader.innerHTML = `
            <div class="chat-header-info">
                <img src="${otherUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(otherUser.fullName || 'Usuario')}" 
                     alt="${escapeHtml(otherUser.fullName || 'Usuario')}"
                     class="chat-header-avatar">
                <div>
                    <h3>${escapeHtml(otherUser.fullName || 'Usuario')}</h3>
                    ${conversation.service ? `<p class="chat-service">📦 ${escapeHtml(conversation.service.title)}</p>` : ''}
                </div>
            </div>
        `;
        
        // Mostrar formulario de mensaje
        document.getElementById('message-form').style.display = 'flex';
        
        // Cargar mensajes
        await loadMessages(id);
        
        // Marcar como leído
        await API.markConversationAsRead(id);
        
        // Actualizar UI de conversaciones
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === id);
            if (item.dataset.id === id) {
                item.classList.remove('unread');
                const badge = item.querySelector('.unread-badge');
                if (badge) badge.remove();
            }
        });
        
    } catch (error) {
        console.error('Error abriendo conversación:', error);
        alert('Error al abrir la conversación');
    }
}

// ============================================
// CARGAR MENSAJES
// ============================================

async function loadMessages(conversationId) {
    try {
        const response = await API.getMessages(conversationId, { limit: 100 });
        const messages = response.messages || [];
        
        const container = document.getElementById('messages-container');
        const wasAtBottom = isScrolledToBottom(container);
        
        container.innerHTML = messages.map(msg => {
            const isOwn = msg.sender.id === currentUser.id;
            const messageClass = isOwn ? 'message-own' : 'message-other';
            
            let attachmentsHTML = '';
            if (msg.attachments && msg.attachments.length > 0) {
                attachmentsHTML = `
                    <div class="message-attachments">
                        ${msg.attachments.map(att => `
                            <a href="${att.url}" target="_blank" class="attachment">
                                📎 ${escapeHtml(att.name)}
                            </a>
                        `).join('')}
                    </div>
                `;
            }
            
            return `
                <div class="message ${messageClass}">
                    ${!isOwn ? `<img src="${msg.sender.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(msg.sender.fullName)}" 
                                     alt="${escapeHtml(msg.sender.fullName)}" 
                                     class="message-avatar">` : ''}
                    <div class="message-content">
                        <div class="message-bubble">
                            <p>${escapeHtml(msg.content)}</p>
                            ${attachmentsHTML}
                        </div>
                        <div class="message-time">${formatTime(new Date(msg.created_at))}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll al final si estaba al final
        if (wasAtBottom || messages.length > 0) {
            scrollToBottom(container);
        }
        
    } catch (error) {
        console.error('Error cargando mensajes:', error);
    }
}

// ============================================
// ENVIAR MENSAJE
// ============================================

async function handleSendMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content || !currentConversationId) return;
    
    try {
        await API.sendMessage(currentConversationId, {
            content,
            messageType: 'text'
        });
        
        input.value = '';
        
        // Recargar mensajes
        await loadMessages(currentConversationId);
        
        // Actualizar lista de conversaciones
        await loadConversations();
        
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        alert('Error al enviar el mensaje');
    }
}

// ============================================
// REFRESCAR CONVERSACIÓN ACTUAL
// ============================================

async function refreshCurrentConversation() {
    if (currentConversationId) {
        await loadMessages(currentConversationId);
    }
    await loadConversations();
}

// ============================================
// UTILIDADES
// ============================================

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    // Si es del mismo día, mostrar hora
    if (diff < 24 * 60 * 60 * 1000 && now.getDate() === date.getDate()) {
        return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es de ayer
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate()) {
        return 'Ayer ' + date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Fecha completa
    return date.toLocaleDateString('es', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

function isScrolledToBottom(element) {
    return element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
}

function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

window.messagesApp = {
    openConversation
};

// ============================================
// INICIAR AL CARGAR EL DOM
// ============================================

document.addEventListener('DOMContentLoaded', init);
