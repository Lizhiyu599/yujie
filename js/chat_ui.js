/**
 * 玉界 - 聊天软件 UI
 * 包含：会话列表、聊天窗口、标签栏导航、心理状态窗
 * 消息收发已移至 chat_core.js
 */

// ========== 聊天状态 ==========
window.ChatConfig = window.ChatConfig || {
    contacts: [
        { id: 'c1', name: '枝玉', avatar: '枝', preview: '点击开始对话' }
    ],
    mental: {
        mood: '专注',
        favorability: 99,
        action: '等待对话',
        thought: '今天会聊什么呢？'
    },
    chatBg: localStorage.getItem('yujie_chat_bg') || ''
};

// ========== 打开聊天软件 ==========
function openChat() {
    let appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'chatAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    renderChatShell();
    appWindow.style.display = 'flex';
}

function closeChat() {
    const appWindow = document.getElementById('chatAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染聊天外壳（会话列表 + 标签栏） ==========
function renderChatShell() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="closeChat()">‹</span>
                    <span class="nav-title">聊天</span>
                </div>
            </div>
            <div class="chat-list" id="chatListView"></div>
            <div class="tab-fixed-bottom">
                <span class="tab-item active" onclick="switchChatTab('chats', this)">聊天</span>
                <span class="tab-item" onclick="switchChatTab('contacts', this)">联系人</span>
                <span class="tab-item" onclick="switchChatTab('moments', this)">动态</span>
                <span class="tab-item" onclick="switchChatTab('me', this)">我的</span>
            </div>
        </div>
    `;

    renderChatList();
}

// ========== 渲染会话列表 ==========
function renderChatList() {
    const listView = document.getElementById('chatListView');
    if (!listView) return;

    listView.innerHTML = window.ChatConfig.contacts.map(c => `
        <div class="chat-list-item" onclick="enterChat('${c.id}')">
            <div class="chat-avatar">${c.avatar}</div>
            <div class="chat-info">
                <div class="chat-name">${c.name}</div>
                <div class="chat-preview">${c.preview || ''}</div>
            </div>
        </div>
    `).join('');
}

// ========== 切换标签栏 ==========
function switchChatTab(tab, el) {
    el.parentElement.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const listView = document.getElementById('chatListView');
    if (!listView) return;

    switch (tab) {
        case 'chats':
            renderChatList();
            break;
        case 'contacts':
            listView.innerHTML = '<div style="padding:40px;text-align:center;color:#8e8e93;">联系人功能即将上线</div>';
            break;
        case 'moments':
            listView.innerHTML = '<div style="padding:40px;text-align:center;color:#8e8e93;">动态功能即将上线</div>';
            break;
        case 'me':
            listView.innerHTML = '<div style="padding:40px;text-align:center;color:#8e8e93;">个人中心即将上线</div>';
            break;
    }
}

// ========== 进入聊天窗口 ==========
function enterChat(contactId) {
    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (!contact) return;

    window.ChatState.currentContactId = contactId;

    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    const savedBg = window.ChatConfig.chatBg;

    appWindow.innerHTML = `
        <div class="chat-overlay" id="chatOverlay">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="backToChatList()">‹</span>
                    <span class="nav-title" id="chatTitle" onclick="openChatSettings()">${contact.name}</span>
                    <span class="nav-mental-btn" onclick="toggleChatMental()">○</span>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages" style="background-image:url(${savedBg});">
                <div style="text-align:center;color:#c7c7cc;font-size:13px;margin-top:20px;">现在可以开始聊天了</div>
            </div>

            <!-- 心理状态窗 -->
            <div class="mental-popup" id="chatMentalPopup" onclick="toggleChatMental()">
                <div class="mental-title">窥视ta...</div>
                <div class="mental-label">心情</div>
                <div class="mental-value" id="m-mood">${window.ChatConfig.mental.mood}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">好感值</div>
                <div class="mental-value" id="m-fav">${window.ChatConfig.mental.favorability}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">当前动作</div>
                <div class="mental-value" id="m-act">${window.ChatConfig.mental.action}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">内心想法</div>
                <div class="mental-value" id="m-tht">${window.ChatConfig.mental.thought}</div>
            </div>

            <!-- 底部输入栏 -->
            <div class="chat-input-bar">
                <div class="input-row">
                    <input type="text" class="chat-input" id="chatInput" placeholder="输入消息…" onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <span class="chat-send-btn" onclick="sendChatMessage()">↑</span>
                </div>
            </div>
        </div>
    `;

    loadChatHistory(contactId);
}

// ========== 返回会话列表 ==========
function backToChatList() {
    window.ChatState.currentContactId = null;
    renderChatShell();
}

// ========== 心理状态窗切换 ==========
function toggleChatMental() {
    const popup = document.getElementById('chatMentalPopup');
    if (popup) {
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
        const moodEl = document.getElementById('m-mood');
        const favEl = document.getElementById('m-fav');
        const actEl = document.getElementById('m-act');
        const thtEl = document.getElementById('m-tht');
        if (moodEl) moodEl.textContent = window.ChatConfig.mental.mood;
        if (favEl) favEl.textContent = window.ChatConfig.mental.favorability;
        if (actEl) actEl.textContent = window.ChatConfig.mental.action;
        if (thtEl) thtEl.textContent = window.ChatConfig.mental.thought;
    }
}

// ========== 聊天详情半屏面板（占位） ==========
function openChatSettings() {
    showToast('聊天详情功能即将上线');
}
