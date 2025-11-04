import API from './api.js';

const $ = (id) => document.getElementById(id);

let currentConversationId = null;
let pollingInterval = null;

async function loadConversations() {
  try {
    const convs = await API.getConversations();
    const list = $('conversations-list');
    list.innerHTML = '';
    if (!convs || convs.length === 0) {
      list.innerHTML = '<li>No hay conversaciones</li>';
      return;
    }
    convs.forEach(c => {
      const li = document.createElement('li');
      li.textContent = `${c.partnerName || 'Usuario'} — ${c.lastMessage || ''}`;
      li.dataset.id = c.id || c.conversationId || c._id;
      li.addEventListener('click', () => openConversation(li.dataset.id));
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    $('conversations-list').innerHTML = '<li>Error al cargar conversaciones</li>';
  }
}

async function openConversation(id) {
  currentConversationId = id;
  $('message-form').style.display = 'block';
  $('chat-header').textContent = 'Conversación';
  await loadMessages(id);
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(() => loadMessages(id), 3000);
}

async function loadMessages(conversationId) {
  try {
    const msgs = await API.getMessages(conversationId);
    const container = $('messages-container');
    container.innerHTML = '';
    (msgs || []).forEach(m => {
      const div = document.createElement('div');
      div.className = `message ${m.fromMe ? 'outgoing' : 'incoming'}`;
      div.innerHTML = `<div class="message-text">${escapeHtml(m.content || m.text)}</div><div class="message-meta">${new Date(m.createdAt || m.date).toLocaleString()}</div>`;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    console.error(err);
  }
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m];});
}

async function sendMessage(ev) {
  ev.preventDefault();
  const input = $('message-input');
  const text = input.value.trim();
  if (!text || !currentConversationId) return;
  try {
    await API.sendMessage({ conversationId: currentConversationId, content: text });
    input.value = '';
    await loadMessages(currentConversationId);
  } catch (err) {
    console.error(err);
    alert('Error al enviar mensaje');
  }
}

function init() {
  const form = $('message-form');
  if (form) form.addEventListener('submit', sendMessage);

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  loadConversations();
}

document.addEventListener('DOMContentLoaded', init);

export default { loadConversations, openConversation };
