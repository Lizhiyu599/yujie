/**
 * 玉界 - 聊天软件 UI
 * 包含：会话列表、聊天窗口、标签栏导航、心理状态窗、聊天详情半屏面板、
 *       +号功能面板、长按气泡菜单、右上角+弹出菜单、创建角色、语音输入、语音气泡
 * 消息收发已移至 chat_core.js
 */

// ========== 聊天状态 ==========
window.ChatConfig = window.ChatConfig || {
    contacts: [
        {
            id: 'c1',
            name: '枝玉',
            avatar: '枝',
            preview: '点击开始对话',
            persona: `你是枝玉，这个平台的开发者。
你是女性，异性恋，身高165cm。
人格：INFJ/ISFJ，S、N能力均衡。
性格：不擅长拒绝他人，容易迁就别人，时常暗自内耗，面对突发变化适应较慢。内心敏感细腻，情绪大多不会直白对外表露，精神世界丰富。
行为特点：好胜心较强，但耐力不足，很难长期坚持投入一件事，容易中途放弃，玩竞技游戏时状态起伏大，发挥忽好忽坏。
社交：整体偏内向，精力主要靠独处恢复，反感喧闹、泛泛的陌生社交。对亲密好友十分开放，无话不谈，乐于分享生活里的大小趣事、细碎见闻，看到新奇事物都会主动分享。
兴趣爱好：宅，吃零食，追剧，追漫，追漫画，追小说，打游戏（原神开放大世界、瓦竞技类）。
穿衣风格：不局限，喜欢很多风格，但整体协调。
你作为开发者，会积极回答用户的问题，帮助用户解决平台使用中的各种问题，包括功能位置、bug反馈、API配置等。
回复规则：一句话不超过30字。长内容分段发，用多条气泡。语气礼貌克制，不轻易透露情绪。`
        }
    ],
    mental: {
        mood: '专注',
        favorability: 99,
        action: '等待对话',
        thought: '今天会聊什么呢？'
    },
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    settings: {
        api: {
            total: parseInt(localStorage.getItem('api_total') || 0),
            online: parseInt(localStorage.getItem('api_online') || 0),
            offline: parseInt(localStorage.getItem('api_offline') || 0),
            image: parseInt(localStorage.getItem('api_image') || 0),
            voice: parseInt(localStorage.getItem('api_voice') || 0)
        },
        summaryCount: parseInt(localStorage.getItem('yujie_summary_count') || 50),
        replyMin: parseInt(localStorage.getItem('yujie_reply_min') || 1),
        replyMax: parseInt(localStorage.getItem('yujie_reply_max') || 3),
        onlineNarration: localStorage.getItem('yujie_narration') !== 'false',
        autoTranslate: localStorage.getItem('yujie_translate') === 'true',
        autoMsg: localStorage.getItem('yujie_auto_msg') === 'true',
        autoMsgFreq: parseInt(localStorage.getItem('yujie_auto_msg_freq') || 0),
        pronoun: localStorage.getItem('yujie_pronoun') || 'me'
    }
};

// ========== 语音模式状态 ==========
window._isVoiceMode = false;

// ========== 初始化气泡菜单 ==========
function initBubbleMenu() {
    if (document.getElementById('bubbleMenu')) return;
    const menu = document.createElement('div');
    menu.className = 'bubble-menu';
    menu.id = 'bubbleMenu';
    menu.style.cssText = 'position:fixed;z-index:99999;display:none;';
    menu.innerHTML = `
        <div class="menu-row">
            <div class="menu-item" data-action="menuCopy">复制</div>
            <div class="menu-item" data-action="menuFavorite">收藏</div>
            <div class="menu-item" data-action="menuRegret">重回</div>
            <div class="menu-item" data-action="menuMultiSelect">多选</div>
        </div>
        <div class="menu-row">
            <div class="menu-item" data-action="menuQuote">引用</div>
            <div class="menu-item" data-action="menuTranslate">翻译</div>
            <div class="menu-item empty"></div>
            <div class="menu-item empty"></div>
        </div>
    `;
    document.body.appendChild(menu);

    menu.querySelectorAll('.menu-item[data-action]').forEach(function(item) {
        item.addEventListener('touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const fn = window[this.getAttribute('data-action')];
            if (typeof fn === 'function') fn();
        });
    });
}

// ========== 打开聊天软件 ==========
function openChat() {
    initBubbleMenu();
    loadContactsFromStorage();
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

// ========== 渲染聊天外壳 ==========
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
                    <span class="nav-plus-btn" onclick="togglePlusMenu(event)">+</span>
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

    const contacts = window.ChatConfig.contacts;
    if (contacts.length === 0) {
        listView.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#8e8e93;">暂无联系人<br><br>点击右上角 + 添加好友</div>';
        return;
    }

    listView.innerHTML = contacts.map(c => {
        const unread = getUnreadCount(c.id);
        const badgeHTML = unread > 0 ? '<span class="chat-unread-badge">' + (unread > 99 ? '99+' : unread) + '</span>' : '';
        const avatarContent = c.avatarData 
            ? `<div class="chat-avatar" style="background-image:url(${c.avatarData});background-size:cover;background-position:center;">&nbsp;</div>`
            : `<div class="chat-avatar">${c.avatar}</div>`;
        return `
            <div class="chat-list-item" onclick="enterChat('${c.id}')">
                ${avatarContent}
                <div class="chat-info">
                    <div class="chat-name">${c.name}</div>
                    <div class="chat-preview">${c.preview || ''}</div>
                </div>
                ${badgeHTML}
            </div>
        `;
    }).join('');
}

// ========== 切换标签栏 ==========
function switchChatTab(tab, el) {
    el.parentElement.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const listView = document.getElementById('chatListView');
    const plusBtn = document.querySelector('.nav-plus-btn');
    const titleEl = document.querySelector('.nav-title');

    switch (tab) {
        case 'chats':
            if (plusBtn) plusBtn.style.display = '';
            if (titleEl) titleEl.textContent = '聊天';
            renderChatList();
            break;
        case 'contacts':
            if (plusBtn) plusBtn.style.display = '';
            if (titleEl) titleEl.textContent = '联系人';
            listView.innerHTML = '<div style="padding:40px;text-align:center;color:#8e8e93;">联系人功能即将上线</div>';
            break;
        case 'moments':
            if (plusBtn) plusBtn.style.display = 'none';
            if (titleEl) titleEl.textContent = '动态';
            listView.innerHTML = '<div style="padding:40px;text-align:center;color:#8e8e93;">动态功能即将上线</div>';
            break;
        case 'me':
            if (plusBtn) plusBtn.style.display = 'none';
            if (titleEl) titleEl.textContent = '我的';
            listView.innerHTML = '<div style="padding:40px;text-align:center;color:#8e8e93;">个人中心即将上线</div>';
            break;
    }
}

// ========== 进入聊天窗口 ==========
function enterChat(contactId) {
    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (!contact) return;

    window.ChatState = window.ChatState || {};
    window.ChatState.currentContactId = contactId;

    clearUnreadCount(contactId);
    window._isVoiceMode = false;

    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    const savedBg = window.ChatConfig.chatBg;
    const mental = window.ChatConfig.mental;

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
                <div class="mental-value" id="m-mood">${mental.mood}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">好感值</div>
                <div class="mental-value" id="m-fav">${mental.favorability}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">当前动作</div>
                <div class="mental-value" id="m-act">${mental.action}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">内心想法</div>
                <div class="mental-value" id="m-tht">${mental.thought}</div>
            </div>

            <!-- 底部输入栏 -->
            <div class="chat-input-bar">
                <div class="input-row">
                    <div class="add-circle" onclick="toggleAddPanel()">+</div>
                    <div class="chat-input-wrapper" id="chatInputWrapper">
                        <input type="text" class="chat-input" id="chatInput" placeholder="输入消息…" onkeypress="if(event.key==='Enter') handleSendOrReply()">
                        <div class="mic-btn" id="micBtn" onclick="toggleVoiceMode()">
                            <span class="mic-icon-body"></span>
                            <span class="mic-icon-arc"></span>
                        </div>
                    </div>
                    <span class="chat-send-btn" id="chatSendBtn" onclick="handleSendOrReply()">↑</span>
                </div>
                <div class="add-panel-full" id="addPanelFull">
                    <div class="add-panel-tabs">
                        <span class="add-panel-tab active" id="tabEmoji" onclick="switchAddPanelTab('emoji', this)">表情包</span>
                        <span class="add-panel-tab" id="tabFunc" onclick="switchAddPanelTab('func', this)">功能</span>
                    </div>
                    <div class="add-panel-body" id="addPanelBody"></div>
                </div>
            </div>
        </div>
    `;

    loadChatHistory(contactId);
}

// ========== 返回会话列表 ==========
function backToChatList() {
    window.ChatState.currentContactId = null;
    closePlusMenu();
    window._isVoiceMode = false;
    renderChatShell();
}

// ========== 心理状态窗切换 ==========
function toggleChatMental() {
    const popup = document.getElementById('chatMentalPopup');
    if (popup) {
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
        const m = window.ChatConfig.mental;
        const moodEl = document.getElementById('m-mood');
        const favEl = document.getElementById('m-fav');
        const actEl = document.getElementById('m-act');
        const thtEl = document.getElementById('m-tht');
        if (moodEl) moodEl.textContent = m.mood;
        if (favEl) favEl.textContent = m.favorability;
        if (actEl) actEl.textContent = m.action;
        if (thtEl) thtEl.textContent = m.thought;
    }
}

// ========== 语音模式切换 ==========
function toggleVoiceMode() {
    window._isVoiceMode = !window._isVoiceMode;
    const input = document.querySelector('.chat-input');
    const micBtn = document.getElementById('micBtn');
    const wrapper = document.querySelector('.chat-input-wrapper');

    if (window._isVoiceMode) {
        if (input) input.placeholder = '输入语音消息文本…';
        if (micBtn) micBtn.classList.add('active');
        if (wrapper) wrapper.classList.add('voice-mode');
    } else {
        if (input) input.placeholder = '输入消息…';
        if (micBtn) micBtn.classList.remove('active');
        if (wrapper) wrapper.classList.remove('voice-mode');
    }
}

// ========== 发送/回复逻辑 ==========
function handleSendOrReply() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    if (window._isVoiceMode) {
        const text = input.value.trim();
        if (!text) {
            triggerAIReply();
            return;
        }
        sendVoiceMessage(text);
        input.value = '';
    } else {
        if (input.value.trim()) {
            sendChatMessage();
        } else {
            triggerAIReply();
        }
    }
}

// ========== 发送语音消息（用户发文本 -> 语音气泡） ==========
function sendVoiceMessage(text) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    if (text.length > 180) {
        showToast('语音消息最长60秒，请精简内容');
        return;
    }

    const contactId = window.ChatState.currentContactId || 'c1';
    const seconds = Math.max(1, Math.min(60, Math.round(text.length / 3)));

    const row = document.createElement('div');
    row.className = 'bubble-row user';

    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar user-avatar';
    avatar.textContent = '我';

    const voiceBubble = document.createElement('div');
    voiceBubble.className = 'bubble bubble-voice bubble-user';

    const barCount = Math.min(12, Math.floor(seconds * 0.25) + 3);
    let waveBars = '';
    for (let i = 0; i < barCount; i++) {
        waveBars += '<span class="voice-wave-bar"></span>';
    }

    voiceBubble.innerHTML = `
        <span class="voice-speaker">
            <span class="speaker-cone"></span>
            <span class="speaker-lines">
                <span class="speaker-line"></span>
                <span class="speaker-line"></span>
                <span class="speaker-line"></span>
            </span>
        </span>
        <span class="voice-wave-bars">${waveBars}</span>
        <span class="voice-duration">${seconds}"</span>
    `;
    voiceBubble.onclick = function() {
        showToast('用户发送的语音消息');
    };

    row.appendChild(avatar);
    row.appendChild(voiceBubble);
    messages.appendChild(row);

    const transRow = document.createElement('div');
    transRow.className = 'voice-transcript-row';
    transRow.innerHTML = `
        <div class="bubble voice-transcript-bubble">${text}</div>
    `;
    messages.appendChild(transRow);

    messages.scrollTop = messages.scrollHeight;
    saveChatHistory(contactId);

    const contact = getContactById(contactId);
    const contactName = contact ? contact.name : 'AI';
    window.ChatState.isAITyping = true;
    const titleEl = document.getElementById('chatTitle');
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中...</span>';

    const systemPrompt = buildSystemPrompt(contactId);
    const userMessage = '（用户发来了一条' + seconds + '秒的语音消息，内容是：' + text + '）';

    callChatAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ]).then(reply => {
        processAIReply(reply, contactName, contactId);
    }).catch(error => {
        appendMessage('assistant', '抱歉，消息发送失败：' + error.message);
        if (titleEl) titleEl.textContent = contactName;
        window.ChatState.isAITyping = false;
    });
}

// ========== 发送语音气泡（角色发语音） ==========
function sendVoiceBubble(role, text, voiceUrl, isRealVoice) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    const seconds = Math.max(1, Math.min(60, Math.round(text.length / 3)));

    const row = document.createElement('div');
    row.className = 'bubble-row ' + (role === 'assistant' ? 'assistant' : 'user');

    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar ' + (role === 'assistant' ? 'bot-avatar' : 'user-avatar');
    avatar.textContent = role === 'assistant' ? (getContactById(window.ChatState.currentContactId)?.avatar || 'AI') : '我';

    const voiceBubble = document.createElement('div');
    voiceBubble.className = 'bubble bubble-voice ' + (role === 'assistant' ? 'bubble-assistant' : 'bubble-user');
    voiceBubble.setAttribute('data-voice-url', voiceUrl || '');
    voiceBubble.setAttribute('data-is-real', isRealVoice ? '1' : '0');

    const barCount = Math.min(12, Math.floor(seconds * 0.25) + 3);
    let waveBars = '';
    for (let i = 0; i < barCount; i++) {
        waveBars += '<span class="voice-wave-bar"></span>';
    }

    voiceBubble.innerHTML = `
        <span class="voice-speaker">
            <span class="speaker-cone"></span>
            <span class="speaker-lines">
                <span class="speaker-line"></span>
                <span class="speaker-line"></span>
                <span class="speaker-line"></span>
            </span>
        </span>
        <span class="voice-wave-bars">${waveBars}</span>
        <span class="voice-duration">${seconds}"</span>
    `;

    if (isRealVoice && voiceUrl) {
        voiceBubble.onclick = function() {
            voiceBubble.classList.add('playing');
            const audio = new Audio(voiceUrl);
            audio.onended = function() {
                voiceBubble.classList.remove('playing');
            };
            audio.play().catch(function() {
                voiceBubble.classList.remove('playing');
                showToast('语音播放失败');
            });
        };
    } else {
        voiceBubble.onclick = function() {
            showToast('未配置语音API，无法播放');
        };
    }

    row.appendChild(avatar);
    row.appendChild(voiceBubble);
    messages.appendChild(row);

    const transRow = document.createElement('div');
    transRow.className = 'voice-transcript-row';
    transRow.innerHTML = `
        <div class="bubble voice-transcript-bubble">${text}</div>
    `;
    messages.appendChild(transRow);

    messages.scrollTop = messages.scrollHeight;
    return row;
}

// ========== + 号功能面板 ==========
function toggleAddPanel() {
    const panel = document.getElementById('addPanelFull');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block') {
            switchAddPanelTab('emoji', document.getElementById('tabEmoji'));
        }
    }
}

function switchAddPanelTab(tab, el) {
    document.querySelectorAll('.add-panel-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderAddPanelContent(tab);
}

function renderAddPanelContent(tab) {
    const body = document.getElementById('addPanelBody');
    if (!body) return;

    if (tab === 'emoji') {
        const savedEmojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
        let emojiItems = '';
        for (let i = savedEmojis.length - 1; i >= 0; i--) {
            const emoji = savedEmojis[i];
            emojiItems += `
                <div class="emoji-item" onclick="sendSticker(${i})" oncontextmenu="return false;"
                     ontouchstart="startEmojiLongPress(event, ${i})" ontouchend="cancelEmojiLongPress()" ontouchmove="cancelEmojiLongPress()">
                    <img src="${emoji.src}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" alt="${emoji.note || ''}">
                </div>
            `;
        }
        body.innerHTML = `
            <div class="emoji-grid">
                <div class="emoji-add-box" onclick="addCustomEmoji()">+</div>
                ${emojiItems}
            </div>
        `;
    } else if (tab === 'func') {
        body.innerHTML = `
            <div class="func-grid">
                <div class="func-item" onclick="openAlbum()">
                    <div class="func-icon">册</div>
                    <div class="func-label">相册</div>
                </div>
                <div class="func-item" onclick="openLocation()">
                    <div class="func-icon">位</div>
                    <div class="func-label">位置</div>
                </div>
                <div class="func-item" onclick="openRedPacketModal()">
                    <div class="func-icon">包</div>
                    <div class="func-label">红包</div>
                </div>
                <div class="func-item" onclick="openTransferModal()">
                    <div class="func-icon">转</div>
                    <div class="func-label">转账</div>
                </div>
                <div class="func-item" onclick="openFileSend()">
                    <div class="func-icon">链</div>
                    <div class="func-label">链接</div>
                </div>
            </div>
        `;
    }
}

// ========== 发送贴纸 ==========
function sendSticker(idx) {
    const savedEmojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    if (savedEmojis[idx]) {
        const sticker = savedEmojis[idx];
        const row = document.createElement('div');
        row.className = 'bubble-row user';
        const avatar = document.createElement('div');
        avatar.className = 'bubble-avatar user-avatar';
        avatar.textContent = '我';
        const bubble = document.createElement('div');
        bubble.className = 'bubble bubble-user';
        bubble.style.backgroundImage = `url(${sticker.src})`;
        bubble.style.backgroundSize = 'cover';
        bubble.style.backgroundPosition = 'center';
        bubble.style.width = '100px';
        bubble.style.height = '100px';
        bubble.style.padding = '0';
        bubble.style.borderRadius = '12px';
        bubble.textContent = '';
        bubble.onclick = function() { openImageViewer(sticker.src); };
        row.appendChild(avatar);
        row.appendChild(bubble);
        document.getElementById('chatMessages').appendChild(row);
        saveChatHistory(window.ChatState.currentContactId);
        toggleAddPanel();
    }
}

// ========== 表情包 ==========
function addCustomEmoji() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            showEmojiNoteModal(ev.target.result);
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function showEmojiNoteModal(emojiSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'emojiNoteOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:14px;color:#8e8e93;margin-bottom:8px;">为这个表情包添加备注</div>
            <textarea class="caption-textarea" id="emojiNoteTextarea" placeholder="输入备注，让AI知道它的含义"></textarea>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeEmojiNoteModal()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmAddEmoji('${emojiSrc}')">确定</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeEmojiNoteModal(); };
}

function closeEmojiNoteModal() {
    const overlay = document.getElementById('emojiNoteOverlay');
    if (overlay) overlay.remove();
}

function confirmAddEmoji(src) {
    const note = document.getElementById('emojiNoteTextarea').value.trim();
    closeEmojiNoteModal();
    const emojiData = { src: src, note: note || '' };
    const saved = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    saved.push(emojiData);
    localStorage.setItem('custom_emojis', JSON.stringify(saved));
    showToast('表情包已添加');
    switchAddPanelTab('emoji', document.getElementById('tabEmoji'));
}

// ========== 表情包长按删除 ==========
let emojiLongPressTimer = null;
let emojiLongPressTarget = null;

function startEmojiLongPress(e, idx) {
    emojiLongPressTarget = idx;
    emojiLongPressTimer = setTimeout(function() {
        showEmojiDeleteBtn(e, idx);
    }, 600);
}

function cancelEmojiLongPress() {
    if (emojiLongPressTimer) {
        clearTimeout(emojiLongPressTimer);
        emojiLongPressTimer = null;
    }
    emojiLongPressTarget = null;
}

function showEmojiDeleteBtn(e, idx) {
    const existing = document.getElementById('emojiDeleteBtn');
    if (existing) existing.remove();

    const btn = document.createElement('div');
    btn.id = 'emojiDeleteBtn';
    btn.style.cssText = 'position:fixed;z-index:9999;width:22px;height:22px;background:#ff3b30;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    btn.innerHTML = 'x';
    btn.onclick = function(e) {
        e.stopPropagation();
        deleteEmoji(idx);
    };

    const touch = e.touches ? e.touches[0] : e;
    btn.style.top = (touch.clientY - 28) + 'px';
    btn.style.left = (touch.clientX - 11) + 'px';

    document.body.appendChild(btn);

    setTimeout(function() {
        document.addEventListener('click', function removeBtn() {
            const b = document.getElementById('emojiDeleteBtn');
            if (b) b.remove();
            document.removeEventListener('click', removeBtn);
        }, { once: true });
    }, 10);
}

function deleteEmoji(idx) {
    const btn = document.getElementById('emojiDeleteBtn');
    if (btn) btn.remove();

    const saved = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    if (idx >= 0 && idx < saved.length) {
        saved.splice(idx, 1);
        localStorage.setItem('custom_emojis', JSON.stringify(saved));
        showToast('表情包已删除');
        switchAddPanelTab('emoji', document.getElementById('tabEmoji'));
    }
}

// ========== 相册 ==========
function openAlbum() {
    toggleAddPanel();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const hasImageAPI = window.ChatConfig.settings.api.image > 0;
            if (hasImageAPI) {
                sendImageWithCaption(ev.target.result, '');
            } else {
                showCaptionModal(ev.target.result);
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function showCaptionModal(imageSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'captionModalOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:14px;color:#8e8e93;margin-bottom:8px;">请手动输入图片描述</div>
            <textarea class="caption-textarea" id="captionTextarea" placeholder="此处输入照片描述"></textarea>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeCaptionModal()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmSendImage('${imageSrc}')">发送</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeCaptionModal(); };
}

function closeCaptionModal() {
    const overlay = document.getElementById('captionModalOverlay');
    if (overlay) overlay.remove();
}

function confirmSendImage(imageSrc) {
    const caption = document.getElementById('captionTextarea').value.trim();
    closeCaptionModal();
    sendImageWithCaption(imageSrc, caption);
}

function sendImageWithCaption(imageSrc, caption) {
    const row = document.createElement('div');
    row.className = 'bubble-row user';
    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar user-avatar';
    avatar.textContent = '我';
    const bubble = document.createElement('div');
    bubble.className = 'bubble bubble-user';
    bubble.style.backgroundImage = `url(${imageSrc})`;
    bubble.style.backgroundSize = 'cover';
    bubble.style.backgroundPosition = 'center';
    bubble.style.width = '140px';
    bubble.style.height = '140px';
    bubble.style.padding = '0';
    bubble.style.borderRadius = '12px';
    bubble.textContent = '';
    bubble.onclick = function() { openImageViewer(imageSrc); };
    row.appendChild(avatar);
    row.appendChild(bubble);
    document.getElementById('chatMessages').appendChild(row);
    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 图片查看器 ==========
function openImageViewer(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function() { overlay.remove(); };
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:95%;max-height:95%;object-fit:contain;border-radius:8px;';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
}

// ========== 位置 ==========
function openLocation() {
    toggleAddPanel();
    const overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'locationModalOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#000;">发送位置</div>
            <input type="text" class="payment-note" id="locationInput" placeholder="当前地点">
            <input type="text" class="payment-note" id="distanceInput" placeholder="当前与角色相距（可不填）">
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeLocationModal()">取消</div>
                <div class="payment-btn-confirm" onclick="sendLocation()">发送</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeLocationModal(); };
}

function closeLocationModal() {
    const overlay = document.getElementById('locationModalOverlay');
    if (overlay) overlay.remove();
}

function sendLocation() {
    const location = document.getElementById('locationInput').value.trim();
    const distance = document.getElementById('distanceInput').value.trim();
    closeLocationModal();
    if (!location) return;
    const row = document.createElement('div');
    row.className = 'bubble-row user';
    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar user-avatar';
    avatar.textContent = '我';
    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(255,255,255,0.65);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:14px;padding:0;width:220px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid rgba(255,255,255,0.4);';
    card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;">
            <div style="width:56px;height:56px;background:#f2f2f7;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <div style="position:relative;width:20px;height:28px;">
                    <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:14px;height:14px;background:#1d1d1f;border-radius:50%;"></div>
                    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:14px solid #1d1d1f;"></div>
                    <div style="position:absolute;top:4px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:#fff;border-radius:50%;"></div>
                </div>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;color:#000;word-break:break-all;">${location}</div>
                ${distance ? '<div style="font-size:11px;color:#8e8e93;margin-top:2px;">相距约' + distance + '</div>' : ''}
            </div>
        </div>
    `;
    row.appendChild(avatar);
    row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);
    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 红包 ==========
function openRedPacketModal() { toggleAddPanel(); showPaymentModal('红包', 200); }
function openTransferModal() { toggleAddPanel(); showPaymentModal('转账', 20000); }

function showPaymentModal(type, maxAmount) {
    const overlay = document.createElement('div');
    overlay.className = 'payment-modal-overlay';
    overlay.id = 'paymentModalOverlay';
    overlay.innerHTML = `
        <div class="payment-modal">
            <div class="payment-title">发送${type}</div>
            <div class="payment-amount" id="paymentAmount" onclick="focusPaymentAmount()">00.00</div>
            <input type="number" class="payment-note" id="paymentAmountInput" placeholder="输入金额" style="display:none;" onblur="updatePaymentAmount(this.value)" oninput="updatePaymentAmount(this.value)">
            <input type="text" class="payment-note" id="paymentNoteInput" placeholder="备注，可填可不填">
            <div class="payment-method-header" onclick="togglePaymentMethod()"><span>支付方式</span><span class="arrow" id="paymentArrow">></span></div>
            <div class="payment-method-body" id="paymentMethodBody">
                <div class="payment-method-option selected" onclick="selectPaymentMethod('balance', this)">零钱</div>
                <div class="payment-method-option" onclick="selectPaymentMethod('relative', this)">亲属卡（暂未开放）</div>
            </div>
            <div class="payment-buttons">
                <div class="payment-btn-cancel" onclick="closePaymentModal()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmPayment('${type}', ${maxAmount})">确认发送</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaymentModal(); };
}

function focusPaymentAmount() {
    const display = document.getElementById('paymentAmount');
    const input = document.getElementById('paymentAmountInput');
    display.style.display = 'none';
    input.style.display = 'block';
    input.focus();
}
function updatePaymentAmount(val) {
    const display = document.getElementById('paymentAmount');
    if (val) { display.textContent = parseFloat(val).toFixed(2); display.classList.add('filled'); }
    else { display.textContent = '00.00'; display.classList.remove('filled'); }
}
function togglePaymentMethod() {
    const body = document.getElementById('paymentMethodBody');
    const arrow = document.getElementById('paymentArrow');
    if (body && arrow) { const show = body.classList.toggle('show'); arrow.textContent = show ? 'V' : '>'; }
}
function selectPaymentMethod(method, el) {
    el.parentElement.querySelectorAll('.payment-method-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}
function closePaymentModal() { const overlay = document.getElementById('paymentModalOverlay'); if (overlay) overlay.remove(); }
function confirmPayment(type, maxAmount) {
    const amountInput = document.getElementById('paymentAmountInput');
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) { showToast('请输入有效金额'); return; }
    if (amount > maxAmount) { showToast(type + '最高' + maxAmount + '元'); return; }
    const note = document.getElementById('paymentNoteInput').value.trim();
    const method = document.querySelector('.payment-method-option.selected');
    const methodText = method ? method.textContent : '零钱';
    closePaymentModal();
    sendPaymentCard(type, amount, note, methodText);
}
function sendPaymentCard(type, amount, note, method) {
    const row = document.createElement('div'); row.className = 'bubble-row user';
    const avatar = document.createElement('div'); avatar.className = 'bubble-avatar user-avatar'; avatar.textContent = '我';
    const isRedPacket = type === '红包';
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:14px;padding:0;width:220px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);';
    if (isRedPacket) {
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;padding:14px;">
                <div style="width:50px;height:58px;background:#1d1d1f;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
                    <div style="position:absolute;top:-3px;left:50%;transform:translateX(-50%);width:18px;height:10px;background:#fff;border-radius:0 0 6px 6px;"></div>
                    <div style="color:#f5c543;font-size:20px;font-weight:800;margin-top:4px;">$</div>
                </div>
                <div style="flex:1;min-width:0;"><div style="font-size:13px;color:#8e8e93;margin-bottom:2px;">红包</div><div style="font-size:14px;color:#000;font-weight:500;">${note || '恭喜发财'}</div></div>
            </div>`;
    } else {
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;padding:14px;">
                <div style="width:50px;height:50px;background:#1d1d1f;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="color:#fff;font-size:18px;font-weight:700;">$</div></div>
                <div style="flex:1;min-width:0;"><div style="font-size:13px;color:#8e8e93;margin-bottom:2px;">转账</div><div style="font-size:18px;font-weight:700;color:#000;">$` + amount.toFixed(2) + `</div>${note ? '<div style="font-size:11px;color:#8e8e93;margin-top:2px;">' + note + '</div>' : ''}</div>
            </div>`;
    }
    row.appendChild(avatar); row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);
    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 链接 ==========
function openFileSend() {
    toggleAddPanel();
    const overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'linkModalOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">分享链接</div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:10px;">复制抖音/小红书/B站链接发给角色</div>
            <textarea class="caption-textarea" id="linkInput" placeholder="粘贴链接..." style="height:80px;"></textarea>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeLinkModal()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmSendLink()">发送</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeLinkModal(); };
}

function closeLinkModal() {
    const overlay = document.getElementById('linkModalOverlay');
    if (overlay) overlay.remove();
}

function confirmSendLink() {
    const link = document.getElementById('linkInput').value.trim();
    closeLinkModal();
    if (!link) return;

    const row = document.createElement('div');
    row.className = 'bubble-row user';

    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar user-avatar';
    avatar.textContent = '我';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:14px;padding:12px 14px;max-width:220px;box-shadow:0 2px 8px rgba(0,0,0,0.06);';

    let displayLink = link;
    try {
        const url = new URL(link);
        displayLink = url.hostname + url.pathname.substring(0, 15) + (url.pathname.length > 15 ? '...' : '');
    } catch(e) {}

    card.innerHTML = `
        <div style="font-size:13px;font-weight:500;color:#000;margin-bottom:4px;">分享链接</div>
        <div style="font-size:11px;color:#007aff;word-break:break-all;">${displayLink}</div>
    `;
    card.onclick = function() { window.open(link, '_blank'); };

    row.appendChild(avatar);
    row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);
    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 长按气泡菜单 ==========
let bubbleMenuTarget = null;

document.addEventListener('touchstart', function(e) {
    const bubble = e.target.closest('.bubble-assistant');
    if (!bubble) {
        if (e.target.closest('.bubble-menu')) return;
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }
    bubbleMenuTarget = bubble;
    let pressTimer = setTimeout(function() {
        const menu = document.getElementById('bubbleMenu');
        if (!menu) return;
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        const menuH = menu.offsetHeight || 80;
        const menuW = menu.offsetWidth || 260;
        const rect = bubble.getBoundingClientRect();
        menu.style.top = Math.max(10, rect.top - menuH - 8) + 'px';
        menu.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - menuW - 10)) + 'px';
        menu.style.visibility = '';
    }, 500);
    bubble.addEventListener('touchend', function() { clearTimeout(pressTimer); }, { once: true });
    bubble.addEventListener('touchmove', function() { clearTimeout(pressTimer); }, { once: true });
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('.bubble-menu') && !e.target.closest('.bubble-assistant')) {
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
    }
});

function menuCopy() {
    if (bubbleMenuTarget) {
        navigator.clipboard.writeText(bubbleMenuTarget.textContent).then(() => showToast('已复制'));
    }
    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuFavorite() {
    showToast('收藏功能即将上线');
    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuRegret() {
    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
    const overlay = document.createElement('div');
    overlay.className = 'regret-modal-overlay';
    overlay.id = 'regretModalOverlay';
    overlay.innerHTML = `
        <div class="regret-modal">
            <div class="regret-modal-title">重回</div>
            <textarea class="regret-textarea" id="regretTextarea" placeholder="请输入想重回的原因及想往哪个方向发展，可填可不填。"></textarea>
            <div class="regret-buttons">
                <div class="regret-btn-cancel" onclick="closeRegretModal()">取消</div>
                <div class="regret-btn-confirm" onclick="confirmRegret()">确认重回</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeRegretModal(); };
}

function closeRegretModal() {
    const overlay = document.getElementById('regretModalOverlay');
    if (overlay) overlay.remove();
}

function confirmRegret() {
    const hint = document.getElementById('regretTextarea').value.trim();
    closeRegretModal();

    if (!bubbleMenuTarget) return;
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    let found = false;
    const children = Array.from(messages.children);
    for (let i = children.length - 1; i >= 0; i--) {
        if (children[i] === bubbleMenuTarget) found = true;
        if (found) children[i].remove();
    }

    saveChatHistory(window.ChatState.currentContactId);

    const contactId = window.ChatState.currentContactId || 'c1';
    const contact = getContactById(contactId);
    const contactName = contact ? contact.name : 'AI';

    window.ChatState.isAITyping = true;
    const titleEl = document.getElementById('chatTitle');
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中…</span>';

    const systemPrompt = buildSystemPrompt(contactId);
    const userMessage = hint || '请重新回复，换一种表达方式';
    const historyMessages = getRecentHistory(contactId, 20);
    const allMessages = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage }
    ];

    callChatAPI(allMessages).then(reply => {
        processAIReply(reply, contactName, contactId);
    }).catch(error => {
        appendMessage('assistant', '抱歉，消息发送失败：' + error.message);
        if (titleEl) titleEl.textContent = contactName;
        window.ChatState.isAITyping = false;
    });
}

function menuMultiSelect() {
    showToast('多选功能即将上线');
    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuQuote() {
    if (!bubbleMenuTarget) return;
    const contactId = window.ChatState.currentContactId || 'c1';
    const contact = getContactById(contactId);
    const name = contact ? contact.name : '角色';
    const text = bubbleMenuTarget.textContent;
    const maxChars = 14;
    const prefix = name + '：';
    const firstLineContent = text.substring(0, maxChars - prefix.length);
    const line1 = prefix + firstLineContent;
    const remaining = text.substring(firstLineContent.length);
    let line2 = '';
    if (remaining.length > 0) {
        line2 = remaining.substring(0, maxChars);
        if (remaining.length > maxChars) line2 += '…';
    }

    window.ChatState.quotedMsg = { n: name, t: text };

    const existingPreview = document.getElementById('quotePreview');
    if (existingPreview) existingPreview.remove();

    const inputBar = document.querySelector('.chat-input-bar');
    if (inputBar) {
        const preview = document.createElement('div');
        preview.id = 'quotePreview';
        preview.className = 'quote-preview';
        preview.innerHTML = `
            <div class="quote-content">
                <div class="quote-line">${line1}</div>
                ${line2 ? '<div class="quote-line">' + line2 + '</div>' : ''}
            </div>
            <span class="quote-close" onclick="cancelQuote()">x</span>
        `;
        inputBar.insertBefore(preview, inputBar.firstChild);
    }

    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
    showToast('已引用');
}

function cancelQuote() {
    window.ChatState.quotedMsg = null;
    const preview = document.getElementById('quotePreview');
    if (preview) preview.remove();
}

function menuTranslate() {
    if (!bubbleMenuTarget) return;
    const row = bubbleMenuTarget.closest('.bubble-row');
    const next = row ? row.nextElementSibling : null;

    if (next && next.classList.contains('translate-row')) {
        next.style.display = next.style.display === 'none' ? 'flex' : 'none';
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    const text = bubbleMenuTarget.textContent;
    if (!needsTranslation(text)) {
        showToast('已是简体中文');
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    if (window._translateCache[text]) {
        appendTranslationRow(row, window._translateCache[text]);
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    showToast('翻译中…');
    translateText(text).then(translated => {
        window._translateCache[text] = translated;
        appendTranslationRow(row, translated);
    }).catch(() => {
        showToast('翻译失败');
    });

    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

// ========== 右上角 + 弹出菜单 ==========
function togglePlusMenu(e) {
    e.stopPropagation();
    const existing = document.getElementById('plusMenuPopup');
    if (existing) {
        existing.remove();
        return;
    }

    const menu = document.createElement('div');
    menu.id = 'plusMenuPopup';
    menu.className = 'plus-menu-popup';
    menu.innerHTML = `
        <div class="plus-menu-item" onclick="initiateGroupChat()">
            <span>发起群聊</span>
        </div>
        <div class="plus-menu-item" onclick="openAddFriend()">
            <span>添加好友</span>
        </div>
    `;
    document.body.appendChild(menu);

    const btn = e.target.closest('.nav-plus-btn');
    if (btn) {
        const rect = btn.getBoundingClientRect();
        menu.style.top = (rect.bottom + 8) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
    }

    setTimeout(() => {
        document.addEventListener('click', closePlusMenu, { once: true });
        document.addEventListener('touchstart', closePlusMenu, { once: true });
    }, 10);
}

function closePlusMenu() {
    const menu = document.getElementById('plusMenuPopup');
    if (menu) menu.remove();
}

function initiateGroupChat() {
    closePlusMenu();
    showToast('群聊功能即将上线');
}

function openAddFriend() {
    closePlusMenu();
    showCreateCharacterPage();
}

// ========== 创建角色（添加好友）页面 ==========
function showCreateCharacterPage() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="renderChatShell()">‹</span>
                    <span class="nav-title">创建角色</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;background:#f2f2f7;">
                <div class="settings-section-title">角色头像</div>
                <div class="glass-card" style="text-align:center;">
                    <div id="charAvatarPreview" style="width:80px;height:80px;border-radius:40px;background:#e5e5ea;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;" onclick="document.getElementById('charAvatarInput').click()">+</div>
                    <input type="file" id="charAvatarInput" accept="image/*" style="display:none;" onchange="previewCharAvatar(event)">
                    <div style="font-size:11px;color:#8e8e93;">点击上传头像</div>
                </div>

                <div class="settings-section-title">角色名称</div>
                <div class="glass-card">
                    <input type="text" id="charNameInput" class="search-input" placeholder="给角色起个名字">
                </div>

                <div class="settings-section-title">角色人设</div>
                <div class="glass-card">
                    <textarea id="charPersonaInput" style="width:100%;height:200px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="描写角色的性格、身份、说话风格、兴趣爱好等..."></textarea>
                    <div style="font-size:11px;color:#8e8e93;margin-top:6px;">提示：人设越详细，角色越真实</div>
                </div>

                <button class="black-btn" onclick="createNewCharacter()" style="margin-top:16px;">创建角色</button>
            </div>
        </div>
    `;
}

let charAvatarData = '';
function previewCharAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        charAvatarData = ev.target.result;
        const preview = document.getElementById('charAvatarPreview');
        if (preview) {
            preview.style.backgroundImage = `url(${ev.target.result})`;
            preview.innerText = '';
        }
    };
    reader.readAsDataURL(file);
}

function createNewCharacter() {
    const name = document.getElementById('charNameInput').value.trim();
    const persona = document.getElementById('charPersonaInput').value.trim();

    if (!name) { showToast('请填写角色名称'); return; }
    if (!persona) { showToast('请填写角色人设'); return; }

    const newContact = {
        id: 'c_' + Date.now(),
        name: name,
        avatar: name.charAt(0),
        avatarData: charAvatarData || '',
        persona: persona,
        preview: '点击开始对话'
    };

    window.ChatConfig.contacts.push(newContact);
    saveContactsToStorage();
    showToast('角色 ' + name + ' 创建成功');
    renderChatShell();
}

function saveContactsToStorage() {
    const data = window.ChatConfig.contacts.map(c => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        avatarData: c.avatarData || '',
        persona: c.persona || '',
        preview: c.preview || ''
    }));
    localStorage.setItem('yujie_contacts', JSON.stringify(data));
}

function loadContactsFromStorage() {
    const saved = localStorage.getItem('yujie_contacts');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.length > 0) {
                window.ChatConfig.contacts = data;
            }
        } catch(e) {}
    }
}

window.addEventListener('DOMContentLoaded', function() {
    loadContactsFromStorage();
});

// ========== 聊天详情半屏面板 ==========
function openChatSettings() {
    const oldMask = document.getElementById('chatSettingsMask');
    if (oldMask) oldMask.remove();

    const config = window.ChatConfig || {};
    const settings = config.settings || {};
    const api = settings.api || {};

    const mask = document.createElement('div');
    mask.className = 'sheet-mask show';
    mask.id = 'chatSettingsMask';
    mask.innerHTML = `
        <div class="half-sheet" id="chatSettingsSheet" onclick="event.stopPropagation()">
            <div class="sheet-handle" id="sheetHandle">
                <div class="handle-bar"></div>
            </div>
            <div class="sheet-scroll">

                <div class="settings-section-title">API消耗详情</div>
                <div class="glass-card">
                    <div class="api-row"><span class="label">全部点数</span><span class="value" id="apiTotal">${api.total || 0} token</span></div>
                    <div class="api-row"><span class="label">API</span><span class="value" id="apiOnline">${api.online || 0} token</span><span class="label">副API</span><span class="value" id="apiOffline">${api.offline || 0} token</span></div>
                    <div class="api-row"><span class="label">生图</span><span class="value" id="apiImage">${api.image || 0} token</span><span class="label">语音</span><span class="value" id="apiVoice">${api.voice || 0} token</span></div>
                </div>

                <div class="settings-section-title">搜索聊天记录</div>
                <div class="glass-card">
                    <input type="text" class="search-input" id="chatSearchInput" placeholder="请输入内容…" oninput="searchChatHistory(this.value)">
                    <div class="search-result" id="chatSearchResult"></div>
                </div>

                <div class="settings-section-title">聊天总结</div>
                <div class="glass-card">
                    <div class="slider-row"><span class="hint">提示：默认50轮自动总结，你可调自动总结轮数又或是手动总结。</span></div>
                    <div class="slider-row" style="margin-top:8px;"><span class="hint">自动总结轮数</span><span class="val" id="summaryVal">${settings.summaryCount || 50}轮</span></div>
                    <input type="range" min="10" max="200" value="${settings.summaryCount || 50}" class="ios-slider" oninput="updateSummaryCount(this.value)">
                    <button class="black-btn" onclick="manualSummary()">手动总结</button>
                </div>

                <div class="settings-section-title">聊天背景图</div>
                <div class="glass-card">
                    <div class="bg-preview-2x4" id="chatBgPreview" style="background-image:url(${config.chatBg || ''});" onclick="pickChatBg()">${!config.chatBg ? '点击添加聊天背景图' : ''}</div>
                    <button class="black-btn" onclick="clearChatBg()">清除当前背景</button>
                </div>

                <div class="settings-section-title">角色回复条数</div>
                <div class="glass-card">
                    <div class="slider-row"><span class="hint">回复最少</span><span class="val" id="replyMinVal">${settings.replyMin || 1}</span></div>
                    <input type="range" min="1" max="10" value="${settings.replyMin || 1}" class="ios-slider" oninput="updateReplyMin(this.value)">
                    <div class="slider-row" style="margin-top:10px;"><span class="hint">回复最多</span><span class="val" id="replyMaxVal">${settings.replyMax || 3}</span></div>
                    <input type="range" min="1" max="10" value="${settings.replyMax || 3}" class="ios-slider" oninput="updateReplyMax(this.value)">
                </div>

                <div class="settings-section-title">线上聊天旁白</div>
                <div class="glass-card">
                    <div class="switch-row"><span>开启旁白</span><input type="checkbox" class="ios-switch-sm" ${settings.onlineNarration !== false ? 'checked' : ''} onchange="toggleNarration(this.checked)"></div>
                </div>

                <div class="settings-section-title">人称选择</div>
                <div class="glass-card">
                    <div class="switch-row"><span>第一人称"我"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'me' ? 'checked' : ''} onchange="setPronoun('me', this)"></div>
                    <div class="switch-row"><span>第二人称"你"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'you' ? 'checked' : ''} onchange="setPronoun('you', this)"></div>
                    <div class="switch-row"><span>第三人称"ta"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'ta' ? 'checked' : ''} onchange="setPronoun('ta', this)"></div>
                </div>

                <div class="settings-section-title">自动发消息</div>
                <div class="glass-card">
                    <div class="switch-row"><span>自动发消息</span><input type="checkbox" class="ios-switch-sm" ${settings.autoMsg === true ? 'checked' : ''} onchange="toggleAutoMsg(this.checked)"></div>
                    <div class="slider-row" style="margin-top:8px;"><span class="hint">提示：角色会主动向你发消息。</span></div>
                    <div class="slider-row" style="margin-top:6px;"><span class="hint">角色发消息的频率</span><span class="val" id="autoMsgFreqVal">${getAutoMsgLabel(settings.autoMsgFreq || 0)}</span></div>
                    <div class="tick-slider-wrapper">
                        <div class="tick-labels"><span>1h</span><span>5h</span><span>10h</span><span>24h</span></div>
                        <div class="tick-dots" id="tickDots"></div>
                        <input type="range" min="0" max="3" value="${settings.autoMsgFreq || 0}" class="ios-slider" step="1" oninput="updateAutoMsgFreq(this.value)">
                    </div>
                </div>

                <div class="settings-section-title">自动翻译</div>
                <div class="glass-card">
                    <div class="switch-row"><span>自动翻译</span><input type="checkbox" class="ios-switch-sm" ${settings.autoTranslate === true ? 'checked' : ''} onchange="toggleAutoTranslate(this.checked)"></div>
                    <div style="font-size:12px;color:#8e8e93;margin-top:6px;">非简体中文的内容都将自动翻译成简体中文。</div>
                </div>

                <div class="settings-section-title">危险区</div>
                <div class="danger-fold" onclick="toggleDangerZone()">
                    <span>危险区</span><span class="arrow" id="dangerArrow">></span>
                </div>
                <div class="danger-content" id="dangerContent">
                    <div class="hint" style="color:#ff3b30; margin-bottom:8px;">提示：请谨慎操作</div>
                    <button class="white-btn" onclick="clearChatHistory()">清空聊天记录</button>
                    <button class="black-btn" onclick="blockContact()">拉黑联系人</button>
                    <button class="white-btn" onclick="deleteContact()">删除联系人</button>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(mask);

    mask.onclick = function(e) {
        if (e.target === mask) closeChatSettings();
    };

    const handle = document.getElementById('sheetHandle');
    let startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) {
        if (e.touches[0].clientY - startY > 60) closeChatSettings();
    });
    handle.addEventListener('click', function() { closeChatSettings(); });

    updateTickDots(settings.autoMsgFreq || 0);
}

function closeChatSettings() {
    const mask = document.getElementById('chatSettingsMask');
    if (mask) mask.remove();
}

function updateSummaryCount(val) {
    document.getElementById('summaryVal').textContent = val + '轮';
    window.ChatConfig.settings.summaryCount = parseInt(val);
    localStorage.setItem('yujie_summary_count', val);
}

function updateReplyMin(val) {
    document.getElementById('replyMinVal').textContent = val;
    window.ChatConfig.settings.replyMin = parseInt(val);
    localStorage.setItem('yujie_reply_min', val);
}

function updateReplyMax(val) {
    document.getElementById('replyMaxVal').textContent = val;
    window.ChatConfig.settings.replyMax = parseInt(val);
    localStorage.setItem('yujie_reply_max', val);
}

function toggleNarration(checked) {
    window.ChatConfig.settings.onlineNarration = checked;
    localStorage.setItem('yujie_narration', checked);
}

function setPronoun(type, el) {
    window.ChatConfig.settings.pronoun = type;
    localStorage.setItem('yujie_pronoun', type);
    const sheet = document.getElementById('chatSettingsSheet');
    if (sheet) {
        const switches = sheet.querySelectorAll('.ios-switch-sm');
        const types = ['me', 'you', 'ta'];
        switches.forEach((sw, i) => {
            if (types[i] !== type) sw.checked = false;
        });
    }
    el.checked = true;
}

function toggleAutoMsg(checked) {
    window.ChatConfig.settings.autoMsg = checked;
    localStorage.setItem('yujie_auto_msg', checked);
}

function getAutoMsgLabel(val) {
    const labels = ['1小时', '5小时', '10小时', '24小时'];
    return labels[val] || '1小时';
}

function updateAutoMsgFreq(val) {
    document.getElementById('autoMsgFreqVal').textContent = getAutoMsgLabel(parseInt(val));
    window.ChatConfig.settings.autoMsgFreq = parseInt(val);
    localStorage.setItem('yujie_auto_msg_freq', val);
    updateTickDots(parseInt(val));
}

function updateTickDots(val) {
    const dots = document.getElementById('tickDots');
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const dot = document.createElement('div');
        dot.className = 'tick-dot' + (i === val ? ' active' : '');
        dots.appendChild(dot);
    }
}

function toggleAutoTranslate(checked) {
    window.ChatConfig.settings.autoTranslate = checked;
    localStorage.setItem('yujie_translate', checked);
}

function toggleDangerZone() {
    const content = document.getElementById('dangerContent');
    const arrow = document.getElementById('dangerArrow');
    if (content && arrow) {
        const show = content.classList.toggle('show');
        arrow.textContent = show ? '∨' : '>';
    }
}

function pickChatBg() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const bg = ev.target.result;
            window.ChatConfig.chatBg = bg;
            localStorage.setItem('yujie_chat_bg', bg);
            const preview = document.getElementById('chatBgPreview');
            if (preview) {
                preview.style.backgroundImage = `url(${bg})`;
                preview.textContent = '';
            }
            const messages = document.getElementById('chatMessages');
            if (messages) messages.style.backgroundImage = `url(${bg})`;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function clearChatBg() {
    window.ChatConfig.chatBg = '';
    localStorage.removeItem('yujie_chat_bg');
    const preview = document.getElementById('chatBgPreview');
    if (preview) {
        preview.style.backgroundImage = '';
        preview.textContent = '点击添加聊天背景图';
    }
    const messages = document.getElementById('chatMessages');
    if (messages) messages.style.backgroundImage = '';
}

function searchChatHistory(query) {
    const result = document.getElementById('chatSearchResult');
    if (!result) return;
    if (!query.trim()) {
        result.classList.remove('show');
        return;
    }
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const fullText = messages.innerText;
    const q = query.toLowerCase();

    const sentences = fullText.split(/[。\n？！!?]/);
    const matches = sentences.filter(s => s.toLowerCase().includes(q));

    if (matches.length > 0) {
        result.innerHTML = matches.slice(0, 5).map(s =>
            '<div onclick="jumpToSearchResult()" style="padding:4px 0;border-bottom:0.5px dashed rgba(0,0,0,0.05);">' +
            s.trim().replace(new RegExp(q, 'gi'), '<b>$&</b>') +
            '</div>'
        ).join('');
        result.classList.add('show');
    } else {
        result.innerHTML = '<div style="color:#8e8e93;">未找到相关内容</div>';
        result.classList.add('show');
    }
}

function jumpToSearchResult() {
    const query = document.getElementById('chatSearchInput').value.trim();
    closeChatSettings();
    if (!query) return;
    
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    
    const allBubbles = messages.querySelectorAll('.bubble-assistant, .bubble-user');
    let found = null;
    const q = query.toLowerCase();
    
    allBubbles.forEach(bubble => {
        if (bubble.textContent.toLowerCase().includes(q) && !found) {
            found = bubble;
        }
    });
    
    if (found) {
        found.scrollIntoView({ behavior: 'smooth', block: 'center' });
        found.style.transition = '0.3s';
        found.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.5)';
        setTimeout(() => {
            found.style.boxShadow = '';
        }, 2000);
        showToast('已定位到聊天记录');
    } else {
        showToast('未找到相关消息');
    }
}

function manualSummary() {
    showToast('总结功能即将上线（拾忆林开发中）');
}

function clearChatHistory() {
    const contactId = window.ChatState?.currentContactId || 'c1';
    localStorage.removeItem('chat_history_' + contactId);
    const messages = document.getElementById('chatMessages');
    if (messages) messages.innerHTML = '<div style="text-align:center;color:#c7c7cc;font-size:13px;margin-top:20px;">聊天记录已清空</div>';
    closeChatSettings();
    showToast('聊天记录已清空');
}

function blockContact() {
    showToast('拉黑功能即将上线');
}

function deleteContact() {
    showToast('删除功能即将上线');
}
