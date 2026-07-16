/**
 * 玉界 - 查手机
 * 选择角色后进入模拟手机桌面，内含浏览器/聊天/便签/商城
 * 聊天：好友列表 + 真实聊天记录 + AI 生成 NPC 聊天
 */

// ========== 数据存储 ==========
function getPhoneData(contactId) {
    var raw = localStorage.getItem('phone_data_' + contactId);
    return raw ? JSON.parse(raw) : {};
}

function savePhoneData(contactId, data) {
    localStorage.setItem('phone_data_' + contactId, JSON.stringify(data));
}

// ========== 当前状态 ==========
var phoneContactId = null;
var phoneCurrentApp = null;
var phoneChatTargetId = null;

// ========== 打开查手机 ==========
function openPhone() {
    var appWindow = document.getElementById('phoneAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'phoneAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#1d1d1f;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    phoneContactId = null;
    phoneCurrentApp = null;
    phoneChatTargetId = null;
    renderPhoneSelect();
    appWindow.style.display = 'flex';
}

function closePhone() {
    var appWindow = document.getElementById('phoneAppWindow');
    if (appWindow) appWindow.style.display = 'none';
    phoneContactId = null;
    phoneCurrentApp = null;
    phoneChatTargetId = null;
}

// ========== 选择角色页面 ==========
function renderPhoneSelect() {
    var appWindow = document.getElementById('phoneAppWindow');
    if (!appWindow) return;

    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var listHTML = '';
    contacts.forEach(function(c) {
        var avatarStyle = c.avatarData ? 'background-image:url(' + c.avatarData + ');background-size:cover;background-position:center;' : '';
        listHTML += ''
            + '<div class="phone-contact-card" onclick="selectPhoneContact(\'' + c.id + '\')">'
            + '<div class="phone-contact-avatar" style="' + avatarStyle + '">' + (c.avatarData ? '' : c.avatar) + '</div>'
            + '<div class="phone-contact-name">' + c.name + '</div>'
            + '<div class="phone-contact-arrow">›</div>'
            + '</div>';
    });

    appWindow.innerHTML = ''
        + '<div class="phone-app">'
        + '<div class="phone-top-bar">'
        + '<div class="phone-back-btn" onclick="closePhone()">‹</div>'
        + '<div class="phone-top-title">查手机</div>'
        + '<div class="phone-top-spacer"></div>'
        + '</div>'
        + '<div class="phone-body">'
        + '<div class="phone-select-hint">选择要查看的角色</div>'
        + listHTML
        + '</div>'
        + '</div>';
}

// ========== 选择角色 → 进入手机桌面 ==========
function selectPhoneContact(contactId) {
    phoneContactId = contactId;
    renderPhoneDesktop();
}

// ========== 渲染手机桌面 ==========
function renderPhoneDesktop() {
    var appWindow = document.getElementById('phoneAppWindow');
    if (!appWindow) return;

    var contact = getContactById(phoneContactId);
    var name = contact ? contact.name : '角色';

    appWindow.innerHTML = ''
        + '<div class="phone-app">'
        + '<div class="phone-top-bar">'
        + '<div class="phone-back-btn" onclick="renderPhoneSelect()">‹</div>'
        + '<div class="phone-top-title">' + name + ' 的手机</div>'
        + '<div class="phone-top-spacer"></div>'
        + '</div>'
        + '<div class="phone-desktop">'
        + '<div class="phone-app-icon" onclick="openPhoneApp(\'browser\')">'
        + '<div class="phone-icon-img"><img src="https://i.ibb.co/tMNtKCJn/1784185126743.png" style="width:64px;height:64px;border-radius:16px;"></div>'
        + '<div class="phone-icon-label">浏览器</div>'
        + '</div>'
        + '<div class="phone-app-icon" onclick="openPhoneApp(\'chat\')">'
        + '<div class="phone-icon-img"><img src="https://i.ibb.co/1YRp6Jmp/1784169343266.png" style="width:64px;height:64px;border-radius:16px;"></div>'
        + '<div class="phone-icon-label">聊天</div>'
        + '</div>'
        + '<div class="phone-app-icon" onclick="openPhoneApp(\'notes\')">'
        + '<div class="phone-icon-img"><img src="https://i.ibb.co/LXRSVNVd/1784178114743.png" style="width:64px;height:64px;border-radius:16px;"></div>'
        + '<div class="phone-icon-label">便签</div>'
        + '</div>'
        + '<div class="phone-app-icon" onclick="openPhoneApp(\'shop\')">'
        + '<div class="phone-icon-img"><img src="https://i.ibb.co/M5J4TPmS/1782661025938.png" style="width:64px;height:64px;border-radius:16px;"></div>'
        + '<div class="phone-icon-label">商城</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}

// ========== 打开应用 ==========
function openPhoneApp(app) {
    phoneCurrentApp = app;
    phoneChatTargetId = null;

    if (app === 'chat') {
        renderPhoneChatList();
        return;
    }

    var data = getPhoneData(phoneContactId);
    var cached = data[app];
    if (cached) {
        renderPhoneAppContent(app, cached);
    } else {
        generatePhoneAppContent(app);
    }
}

// ========== 聊天 → 好友列表 ==========
function renderPhoneChatList() {
    var appWindow = document.getElementById('phoneAppWindow');
    if (!appWindow) return;

    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = typeof getNPCs === 'function' ? getNPCs() : [];
    if (typeof getNPCs !== 'function') {
        // 兜底
        npcs = [];
    }

    // 收集联系人：用户 + NPC
    var chatTargets = [];
    // 用户永远第一位
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeMask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; } }
    var userName = activeMask ? activeMask.name : '我';

    chatTargets.push({
        id: 'user',
        name: userName,
        avatar: activeMask && activeMask.avatar ? activeMask.avatar : '我',
        avatarData: activeMask && activeMask.avatar ? activeMask.avatar : '',
        isUser: true
    });

    // 随机抽 1-4 个 NPC
    var npcCount = Math.min(npcs.length, 4);
    npcCount = Math.max(npcCount, 1);
    var shuffled = npcs.slice().sort(function() { return Math.random() - 0.5; });
    for (var j = 0; j < npcCount; j++) {
        var npc = shuffled[j];
        chatTargets.push({
            id: 'npc_' + j,
            name: npc.name,
            avatar: npc.name.charAt(0),
            avatarData: '',
            isUser: false,
            npcGender: npc.gender || '未知'
        });
    }

    var listHTML = '';
    chatTargets.forEach(function(t) {
        var avatarStyle = t.avatarData ? 'background-image:url(' + t.avatarData + ');background-size:cover;background-position:center;' : '';
        listHTML += ''
            + '<div class="phone-chat-contact" onclick="openPhoneChatDetail(\'' + t.id + '\', \'' + t.name.replace(/'/g, "\\'") + '\', ' + t.isUser + ')">'
            + '<div class="phone-chat-contact-avatar" style="' + avatarStyle + '">' + (t.avatarData ? '' : t.avatar) + '</div>'
            + '<div class="phone-chat-contact-name">' + t.name + '</div>'
            + '<div class="phone-chat-contact-arrow">›</div>'
            + '</div>';
    });

    appWindow.innerHTML = ''
        + '<div class="phone-app">'
        + '<div class="phone-top-bar">'
        + '<div class="phone-back-btn" onclick="renderPhoneDesktop()">‹</div>'
        + '<div class="phone-top-title">聊天</div>'
        + '<div class="phone-top-spacer"></div>'
        + '</div>'
        + '<div class="phone-body">'
        + '<div class="phone-chat-list-title">联系人</div>'
        + listHTML
        + '</div>'
        + '</div>';
}

// ========== 聊天 → 聊天记录详情 ==========
function openPhoneChatDetail(targetId, targetName, isUser) {
    phoneChatTargetId = targetId;
    var appWindow = document.getElementById('phoneAppWindow');
    if (!appWindow) return;

    if (isUser) {
        // 读取真实聊天记录
        var storageKey = (window.ChatState && window.ChatState.isOfflineMode ? 'chat_history_offline_' : 'chat_history_') + phoneContactId;
        var saved = localStorage.getItem(storageKey);
        var messagesHTML = '';
        if (saved) {
            var temp = document.createElement('div');
            temp.innerHTML = saved;
            var rows = temp.querySelectorAll('.bubble-row');
            var last10 = [];
            for (var i = Math.max(0, rows.length - 10); i < rows.length; i++) {
                last10.push(rows[i]);
            }
            last10.forEach(function(row) {
                var bubble = row.querySelector('.bubble, .offline-message');
                var text = bubble ? bubble.textContent : '';
                var isUserMsg = row.classList.contains('user');
                messagesHTML += ''
                    + '<div class="phone-msg-row ' + (isUserMsg ? 'right' : 'left') + '">'
                    + '<div class="phone-msg-bubble ' + (isUserMsg ? 'user' : 'other') + '">' + text + '</div>'
                    + '</div>';
            });
        }
        if (!messagesHTML) {
            messagesHTML = '<div class="phone-empty-chat">暂无聊天记录</div>';
        }

        appWindow.innerHTML = ''
            + '<div class="phone-app">'
            + '<div class="phone-top-bar">'
            + '<div class="phone-back-btn" onclick="openPhoneApp(\'chat\')">‹</div>'
            + '<div class="phone-top-title">' + targetName + '</div>'
            + '<div class="phone-top-spacer"></div>'
            + '</div>'
            + '<div class="phone-body">'
            + '<div class="phone-msg-list">' + messagesHTML + '</div>'
            + '</div>'
            + '</div>';
    } else {
        // 生成 NPC 聊天记录
        showPhoneLoading();
        generatePhoneNPCChat(targetName, phoneContactId, function(content) {
            hidePhoneLoading();
            var lines = content.split('\n').filter(function(l) { return l.trim(); });
            var messagesHTML = '';
            lines.forEach(function(line, i) {
                var isNPC = i % 2 === 0;
                messagesHTML += ''
                    + '<div class="phone-msg-row ' + (isNPC ? 'left' : 'right') + '">'
                    + '<div class="phone-msg-bubble ' + (isNPC ? 'other' : 'user') + '">' + line + '</div>'
                    + '</div>';
            });
            if (!messagesHTML) messagesHTML = '<div class="phone-empty-chat">暂无聊天记录</div>';

            appWindow.innerHTML = ''
                + '<div class="phone-app">'
                + '<div class="phone-top-bar">'
                + '<div class="phone-back-btn" onclick="openPhoneApp(\'chat\')">‹</div>'
                + '<div class="phone-top-title">' + targetName + '</div>'
                + '<div class="phone-top-spacer"></div>'
                + '</div>'
                + '<div class="phone-body">'
                + '<div class="phone-msg-list">' + messagesHTML + '</div>'
                + '</div>'
                + '</div>';
        });
    }
}

// ========== 生成 NPC 聊天 ==========
function generatePhoneNPCChat(npcName, contactId, callback) {
    var contact = getContactById(contactId);
    var contactName = contact ? contact.name : '角色';
    var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(contactId) : '';

    var prompt = '你是' + contactName + '。请生成你和' + npcName + '的最近聊天记录。\n'
        + '格式：每条一行，轮流发言，一共10-16条。\n'
        + '内容要求：自然随意，日常闲聊，分享生活琐事。\n'
        + '每条消息不超过30字。';

    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            var clean = reply.replace(/\{[^}]*\}/g, '').trim();
            callback(clean);
        }).catch(function() {
            callback('');
        });
    } else {
        callback('');
    }
}

// ========== 生成应用内容 ==========
function generatePhoneAppContent(app) {
    var contact = getContactById(phoneContactId);
    if (!contact) return;
    var contactName = contact.name;

    showPhoneLoading();

    var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(phoneContactId) : '';

    var chatHistory = '';
    if (typeof getRecentHistory === 'function') {
        var history = getRecentHistory(phoneContactId, 40);
        history.forEach(function(m) {
            var roleName = m.role === 'user' ? '用户' : contactName;
            chatHistory += roleName + '：' + m.content + '\n';
        });
    }

    var prompt = '';
    if (app === 'browser') {
        prompt = '你是' + contactName + '。请生成你的浏览器搜索记录。\n'
            + '格式：每条一行，格式为"搜索：xxxx"。生成6-10条。\n'
            + '内容：生活琐事、兴趣爱好、偶尔搜索和用户相关的内容。\n\n'
            + '聊天记录：\n' + chatHistory;
    } else if (app === 'notes') {
        prompt = '你是' + contactName + '。请生成你的便签/备忘录。\n'
            + '格式：每条以"📌"开头，每条不超过200字。生成3-5条。\n'
            + '内容：生活琐事、想法、提醒、对用户的感受。\n\n'
            + '聊天记录：\n' + chatHistory;
    } else if (app === 'shop') {
        prompt = '你是' + contactName + '。请生成你的购物车清单。\n'
            + '格式：每行一个，格式为"商品名 - ¥价格 - 加入原因"。生成4-6个。\n\n'
            + '聊天记录：\n' + chatHistory;
    }

    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            hidePhoneLoading();
            var clean = reply.replace(/\{[^}]*\}/g, '').trim();
            if (!clean) { showToast('生成失败'); return; }
            var data = getPhoneData(phoneContactId);
            data[app] = { content: clean, time: Date.now() };
            savePhoneData(phoneContactId, data);
            renderPhoneAppContent(app, data[app]);
        }).catch(function() {
            hidePhoneLoading();
            showToast('生成失败');
        });
    } else {
        hidePhoneLoading();
        showToast('API未配置');
    }
}

// ========== 渲染应用内容 ==========
function renderPhoneAppContent(app, cached) {
    var appWindow = document.getElementById('phoneAppWindow');
    if (!appWindow) return;

    var appNames = { browser: '浏览器', notes: '便签', shop: '商城' };
    var appName = appNames[app] || '';
    var content = cached.content;
    var lines = content.split('\n').filter(function(l) { return l.trim(); });
    var contentHTML = '';

    if (app === 'browser') {
        contentHTML = '<div class="phone-browser-list">';
        lines.forEach(function(line) {
            contentHTML += '<div class="phone-browser-item">' + line.replace(/^搜索[：:]\s*/, '') + '</div>';
        });
        contentHTML += '</div>';
    } else if (app === 'notes') {
        contentHTML = '<div class="phone-notes-list">';
        lines.forEach(function(line) {
            contentHTML += '<div class="phone-notes-item">' + line + '</div>';
        });
        contentHTML += '</div>';
    } else if (app === 'shop') {
        contentHTML = '<div class="phone-shop-list">';
        lines.forEach(function(line) {
            var parts = line.split(' - ');
            contentHTML += ''
                + '<div class="phone-shop-item">'
                + '<div class="phone-shop-name">' + (parts[0] || '') + '</div>'
                + '<div class="phone-shop-price">' + (parts[1] || '') + '</div>'
                + '<div class="phone-shop-reason">' + (parts[2] || '') + '</div>'
                + '</div>';
        });
        contentHTML += '</div>';
    }

    appWindow.innerHTML = ''
        + '<div class="phone-app">'
        + '<div class="phone-top-bar">'
        + '<div class="phone-back-btn" onclick="renderPhoneDesktop()">‹</div>'
        + '<div class="phone-top-title">' + appName + '</div>'
        + '<div class="phone-btn-refresh" onclick="generatePhoneAppContent(\'' + app + '\')">↻</div>'
        + '</div>'
        + '<div class="phone-body">' + contentHTML + '</div>'
        + '</div>';
}

// ========== 加载动画 ==========
var phoneLoadingEl = null;
function showPhoneLoading() {
    hidePhoneLoading();
    var appWindow = document.getElementById('phoneAppWindow');
    if (!appWindow) return;
    phoneLoadingEl = document.createElement('div');
    phoneLoadingEl.className = 'phone-loading';
    phoneLoadingEl.innerHTML = '<div class="phone-loading-spinner"></div><div>正在偷看...</div>';
    appWindow.appendChild(phoneLoadingEl);
}

function hidePhoneLoading() {
    if (phoneLoadingEl) { phoneLoadingEl.remove(); phoneLoadingEl = null; }
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {});
