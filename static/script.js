/**
 * Vietnamese Hate Speech Detection Chatbot
 * Frontend JavaScript - Chat logic & API calls
 */

// ---- Session ----
const SESSION_ID = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

// ---- DOM Elements ----
const chatArea = document.getElementById('chatArea');
const messagesContainer = document.getElementById('messagesContainer');
const welcomeContainer = document.getElementById('welcomeContainer');
const messageInput = document.getElementById('messageInput');
const btnSend = document.getElementById('btnSend');
const btnReset = document.getElementById('btnReset');
const btnMenu = document.getElementById('btnMenu');
const sidebar = document.getElementById('sidebar');

let isProcessing = false;

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
    // Quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-text');
            messageInput.value = text;
            updateSendButton();
            sendMessage();
        });
    });

    // Send button
    btnSend.addEventListener('click', sendMessage);

    // Input events
    messageInput.addEventListener('input', () => {
        autoResize();
        updateSendButton();
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Reset button
    btnReset.addEventListener('click', resetConversation);

    // Mobile menu
    btnMenu.addEventListener('click', toggleSidebar);

    // Focus input
    messageInput.focus();
});

// ---- Send Message ----
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || isProcessing) return;

    isProcessing = true;

    // Hide welcome
    if (welcomeContainer) {
        welcomeContainer.style.display = 'none';
    }

    // Add user message
    addMessage(text, 'user');

    // Clear input
    messageInput.value = '';
    autoResize();
    updateSendButton();

    // Show typing indicator
    const typingEl = showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                session_id: SESSION_ID
            })
        });

        const data = await response.json();

        // Remove typing indicator
        typingEl.remove();

        if (data.type === 'classification') {
            addClassificationResult(data);
        } else if (data.type === 'error') {
            addMessage(data.message, 'bot');
        } else {
            addMessage(data.message, 'bot');
        }
    } catch (error) {
        typingEl.remove();
        addMessage('Xin lỗi, không thể kết nối đến server. Vui lòng thử lại.', 'bot');
    }

    isProcessing = false;
    messageInput.focus();
}

// ---- Add Message Bubble ----
function addMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}`;

    const avatar = sender === 'user' ? 'U' : '🤖';

    messageEl.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${escapeHtml(text)}</div>
    `;

    messagesContainer.appendChild(messageEl);
    scrollToBottom();
}

// ---- Add Classification Result ----
function addClassificationResult(data) {
    const cls = data.classification.toUpperCase();
    const confidence = data.confidence || 0;
    const explanation = data.explanation || '';

    const clsClass = cls === 'CLEAN' ? 'clean' : cls === 'OFFENSIVE' ? 'offensive' : 'hate';
    const clsIcon = cls === 'CLEAN' ? '✅' : cls === 'OFFENSIVE' ? '⚠️' : '🚫';

    const messageEl = document.createElement('div');
    messageEl.className = 'message bot';

    messageEl.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="classification-result">
            <div class="result-header">
                <div class="result-badge ${clsClass}">
                    <span class="result-badge-icon">${clsIcon}</span>
                    ${cls}
                </div>
                <span class="result-confidence">${confidence}% confidence</span>
            </div>
            <div class="confidence-bar-container">
                <div class="confidence-bar">
                    <div class="confidence-fill ${clsClass}" id="confFill-${Date.now()}"></div>
                </div>
            </div>
            <div class="result-explanation">${escapeHtml(explanation)}</div>
        </div>
    `;

    messagesContainer.appendChild(messageEl);
    scrollToBottom();

    // Animate confidence bar
    requestAnimationFrame(() => {
        const fill = messageEl.querySelector('.confidence-fill');
        if (fill) {
            fill.style.width = confidence + '%';
        }
    });
}

// ---- Typing Indicator ----
function showTypingIndicator() {
    const el = document.createElement('div');
    el.className = 'message bot';
    el.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(el);
    scrollToBottom();
    return el;
}

// ---- Reset Conversation ----
async function resetConversation() {
    try {
        await fetch('/api/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: SESSION_ID })
        });
    } catch (e) { /* ignore */ }

    messagesContainer.innerHTML = '';
    if (welcomeContainer) {
        welcomeContainer.style.display = 'flex';
    }

    // Close mobile sidebar
    sidebar.classList.remove('open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ---- Utilities ----
function scrollToBottom() {
    requestAnimationFrame(() => {
        chatArea.scrollTop = chatArea.scrollHeight;
    });
}

function autoResize() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function updateSendButton() {
    const hasText = messageInput.value.trim().length > 0;
    btnSend.classList.toggle('active', hasText);
    btnSend.disabled = !hasText;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleSidebar() {
    sidebar.classList.toggle('open');

    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
        document.body.appendChild(overlay);
    }
    overlay.classList.toggle('active');
}
