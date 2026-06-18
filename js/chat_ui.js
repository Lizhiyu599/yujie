/**
 * 玉界 - 聊天软件 UI
 * 包含：会话列表、聊天窗口、标签栏导航、心理状态窗、聊天详情半屏面板、+号功能面板
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

    window.ChatState = window.ChatState || {};
    window.ChatState.currentContactId = contactId;

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
                    <input type="text" class="chat-input" id="chatInput" placeholder="输入消息…" onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <span class="chat-send-btn" onclick="sendChatMessage()">↑</span>
                </div>
                <div class="add-panel-full" id="addPanelFull">
                    <div class="add-panel-tabs">
                        <span class="add-panel-tab active" onclick="switchAddPanelTab('emoji', this)">表情包</span>
                        <span class="add-panel-tab" onclick="switchAddPanelTab('func', this)">功能</span>
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

// ========== + 号功能面板 ==========
function toggleAddPanel() {
    const panel = document.getElementById('addPanelFull');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block') {
            renderAddPanelContent('emoji');
        }
    }
}

function switchAddPanelTab(tab, el) {
    el.parentElement.querySelectorAll('.add-panel-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderAddPanelContent(tab);
}

function renderAddPanelContent(tab) {
    const body = document.getElementById('addPanelBody');
    if (!body) return;

    if (tab === 'emoji') {
        body.innerHTML = `
            <div class="emoji-grid">
                <div class="emoji-add-box" onclick="addCustomEmoji()">+</div>
            </div>
        `;
    } else if (tab === 'func') {
        body.innerHTML = `
            <div class="func-grid">
                <div class="func-item" onclick="openAlbum()">
                    <div class="func-icon">[相]</div>
                    <div class="func-label">相册</div>
                </div>
                <div class="func-item" onclick="openLocation()">
                    <div class="func-icon">[位]</div>
                    <div class="func-label">位置</div>
                </div>
                <div class="func-item" onclick="openRedPacketModal()">
                    <div class="func-icon">[红]</div>
                    <div class="func-label">红包</div>
                </div>
                <div class="func-item" onclick="openTransferModal()">
                    <div class="func-icon">[转]</div>
                    <div class="func-label">转账</div>
                </div>
                <div class="func-item" onclick="openFileSend()">
                    <div class="func-icon">[文]</div>
                    <div class="func-label">文件</div>
                </div>
            </div>
        `;
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
            const note = prompt('为这个表情包添加备注，让AI知道它的含义：');
            const emojiData = { src: ev.target.result, note: note || '' };
            const saved = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
            saved.push(emojiData);
            localStorage.setItem('custom_emojis', JSON.stringify(saved));
            showToast('表情包已添加');
        };
        reader.readAsDataURL(file);
    };
    input.click();
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
                appendMessage('user', '[图片]');
                const imgBubble = document.createElement('div');
                imgBubble.className = 'bubble bubble-user';
                imgBubble.style.backgroundImage = `url(${ev.target.result})`;
                imgBubble.style.backgroundSize = 'cover';
                imgBubble.style.backgroundPosition = 'center';
                imgBubble.style.minHeight = '120px';
                imgBubble.textContent = '';
                document.getElementById('chatMessages').appendChild(imgBubble);
                saveChatHistory(window.ChatState.currentContactId);
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
            <textarea class="caption-textarea" id="captionTextarea" placeholder="此处输入照片描述"></textarea>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeCaptionModal()">取消</div>
                <div class="payment-btn-confirm" onclick="sendImageWithCaption('${imageSrc}')">发送</div>
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

function sendImageWithCaption(imageSrc) {
    const caption = document.getElementById('captionTextarea').value.trim();
    closeCaptionModal();
    appendMessage('user', caption || '[图片]');
    const imgBubble = document.createElement('div');
    imgBubble.className = 'bubble bubble-user';
    imgBubble.style.backgroundImage = `url(${imageSrc})`;
    imgBubble.style.backgroundSize = 'cover';
    imgBubble.style.backgroundPosition = 'center';
    imgBubble.style.minHeight = '120px';
    imgBubble.textContent = '';
    document.getElementById('chatMessages').appendChild(imgBubble);
    saveChatHistory(window.ChatState.currentContactId);
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
            <input type="text" class="payment-note" id="distanceInput" placeholder="当前与角色相距（可不填详细距离）">
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
    let msg = '[位置] ' + location;
    if (distance) msg += ' (相距约' + distance + ')';
    appendMessage('user', msg);
    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 红包 ==========
function openRedPacketModal() {
    toggleAddPanel();
    showPaymentModal('红包', 200);
}

// ========== 转账 ==========
function openTransferModal() {
    toggleAddPanel();
    showPaymentModal('转账', 20000);
}

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
            <div class="payment-method-header" onclick="togglePaymentMethod()">
                <span>支付方式</span><span class="arrow" id="paymentArrow">></span>
            </div>
            <div class="payment-method-body" id="paymentMethodBody">
                <div class="payment-method-option selected" onclick="selectPaymentMethod('balance', this)">零钱</div>
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
    if (val) {
        display.textContent = parseFloat(val).toFixed(2);
        display.classList.add('filled');
    } else {
        display.textContent = '00.00';
        display.classList.remove('filled');
    }
}

function togglePaymentMethod() {
    const body = document.getElementById('paymentMethodBody');
    const arrow = document.getElementById('paymentArrow');
    if (body && arrow) {
        const show = body.classList.toggle('show');
        arrow.textContent = show ? 'V' : '>';
    }
}

function selectPaymentMethod(method, el) {
    el.parentElement.querySelectorAll('.payment-method-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

function closePaymentModal() {
    const overlay = document.getElementById('paymentModalOverlay');
    if (overlay) overlay.remove();
}

function confirmPayment(type, maxAmount) {
    const amountInput = document.getElementById('paymentAmountInput');
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
        showToast('请输入有效金额');
        return;
    }
    if (amount > maxAmount) {
        showToast(type + '最高' + maxAmount + '元');
        return;
    }
    const note = document.getElementById('paymentNoteInput').value.trim();
    closePaymentModal();
    let msg = '[' + type + '] ' + amount.toFixed(2) + '元';
    if (note) msg += ' 备注：' + note;
    appendMessage('user', msg);
    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 文件 ==========
function openFileSend() {
    toggleAddPanel();
    const link = prompt('粘贴抖音/小红书/B站链接发给角色：');
    if (link && link.trim()) {
        appendMessage('user', '[分享链接] ' + link.trim());
        saveChatHistory(window.ChatState.currentContactId);
    }
            }

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

                <!-- API 消耗详情 -->
                <div class="settings-section-title">API消耗详情</div>
                <div class="glass-card">
                    <div class="api-row"><span class="label">全部点数</span><span class="value" id="apiTotal">${api.total || 0} token</span></div>
                    <div class="api-row"><span class="label">API</span><span class="value" id="apiOnline">${api.online || 0} token</span><span class="label">副API</span><span class="value" id="apiOffline">${api.offline || 0} token</span></div>
                    <div class="api-row"><span class="label">生图</span><span class="value" id="apiImage">${api.image || 0} token</span><span class="label">语音</span><span class="value" id="apiVoice">${api.voice || 0} token</span></div>
                </div>

                <!-- 搜索聊天记录 -->
                <div class="settings-section-title">搜索聊天记录</div>
                <div class="glass-card">
                    <input type="text" class="search-input" id="chatSearchInput" placeholder="请输入内容…" oninput="searchChatHistory(this.value)">
                    <div class="search-result" id="chatSearchResult"></div>
                </div>

                <!-- 聊天总结 -->
                <div class="settings-section-title">聊天总结</div>
                <div class="glass-card">
                    <div class="slider-row"><span class="hint">提示：默认50轮自动总结，你可调自动总结轮数又或是手动总结。</span></div>
                    <div class="slider-row" style="margin-top:8px;"><span class="hint">自动总结轮数</span><span class="val" id="summaryVal">${settings.summaryCount || 50}轮</span></div>
                    <input type="range" min="10" max="200" value="${settings.summaryCount || 50}" class="ios-slider" oninput="updateSummaryCount(this.value)">
                    <button class="black-btn" onclick="manualSummary()">手动总结</button>
                </div>

                <!-- 聊天背景图 -->
                <div class="settings-section-title">聊天背景图</div>
                <div class="glass-card">
                    <div class="bg-preview-2x4" id="chatBgPreview" style="background-image:url(${config.chatBg || ''});" onclick="pickChatBg()">${!config.chatBg ? '点击添加聊天背景图' : ''}</div>
                    <button class="black-btn" onclick="clearChatBg()">清除当前背景</button>
                </div>

                <!-- 角色回复条数 -->
                <div class="settings-section-title">角色回复条数</div>
                <div class="glass-card">
                    <div class="slider-row"><span class="hint">回复最少</span><span class="val" id="replyMinVal">${settings.replyMin || 1}</span></div>
                    <input type="range" min="1" max="10" value="${settings.replyMin || 1}" class="ios-slider" oninput="updateReplyMin(this.value)">
                    <div class="slider-row" style="margin-top:10px;"><span class="hint">回复最多</span><span class="val" id="replyMaxVal">${settings.replyMax || 3}</span></div>
                    <input type="range" min="1" max="10" value="${settings.replyMax || 3}" class="ios-slider" oninput="updateReplyMax(this.value)">
                </div>

                <!-- 线上聊天旁白 -->
                <div class="settings-section-title">线上聊天旁白</div>
                <div class="glass-card">
                    <div class="switch-row"><span>开启旁白</span><input type="checkbox" class="ios-switch-sm" ${settings.onlineNarration !== false ? 'checked' : ''} onchange="toggleNarration(this.checked)"></div>
                </div>

                <!-- 人称选择 -->
                <div class="settings-section-title">人称选择</div>
                <div class="glass-card">
                    <div class="switch-row"><span>第一人称"我"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'me' ? 'checked' : ''} onchange="setPronoun('me', this)"></div>
                    <div class="switch-row"><span>第二人称"你"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'you' ? 'checked' : ''} onchange="setPronoun('you', this)"></div>
                    <div class="switch-row"><span>第三人称"ta"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'ta' ? 'checked' : ''} onchange="setPronoun('ta', this)"></div>
                </div>

                <!-- 自动发消息 -->
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

                <!-- 自动翻译 -->
                <div class="settings-section-title">自动翻译</div>
                <div class="glass-card">
                    <div class="switch-row"><span>自动翻译</span><input type="checkbox" class="ios-switch-sm" ${settings.autoTranslate === true ? 'checked' : ''} onchange="toggleAutoTranslate(this.checked)"></div>
                    <div class="hint" style="margin-top:6px;">非简体中文的内容都将自动翻译成简体中文。</div>
                </div>

                <!-- 危险区 -->
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

// ========== 详情面板交互函数 ==========
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

// ========== 搜索聊天记录 ==========
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
    closeChatSettings();
    showToast('已定位到聊天记录');
}

// ========== 占位函数 ==========
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
