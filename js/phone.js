/**
 * 玉界 - 查手机
 * 选择角色后进入模拟手机桌面，内含浏览器/聊天/便签/商城
 * 所有内容通过 API 基于聊天记录生成，与聊天软件无缝衔接
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
    renderPhoneSelect();
    appWindow.style.display = 'flex';
}

function closePhone() {
    var appWindow = document.getElementById('phoneAppWindow');
    if (appWindow) appWindow.style.display = 'none';
    phoneContactId = null;
    phoneCurrentApp = null;
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
        + '<div class="phone-icon-img">🌐</div>'
        + '<div class="phone-icon-label">浏览器</div>'
        + '</div>'
        + '<div class="phone-app-icon" onclick="openPhoneApp(\'chat\')">'
        + '<div class="phone-icon-img">💬</div>'
        + '<div class="phone-icon-label">聊天</div>'
        + '</div>'
        + '<div class="phone-app-icon" onclick="openPhoneApp(\'notes\')">'
        + '<div class="phone-icon-img">📝</div>'
        + '<div class="phone-icon-label">便签</div>'
        + '</div>'
        + '<div class="phone-app-icon" onclick="openPhoneApp(\'shop\')">'
        + '<div class="phone-icon-img">🛒</div>'
        + '<div class="phone-icon-label">商城</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}

// ========== 打开应用 ==========
function openPhoneApp(app) {
    phoneCurrentApp = app;
    var data = getPhoneData(phoneContactId);
    var cached = data[app];

    if (cached) {
        renderPhoneAppContent(app, cached);
    } else {
        generatePhoneAppContent(app);
    }
}

// ========== 生成应用内容 ==========
function generatePhoneAppContent(app) {
    var contact = getContactById(phoneContactId);
    if (!contact) return;
    var contactName = contact.name;

    showPhoneLoading();

    var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(phoneContactId) : '';

    // 读取最近聊天记录
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
        prompt = '你是' + contactName + '。以下是你和用户的聊天记录，以及你的生活。\n'
            + '请根据这些内容，生成你的浏览器搜索记录。\n'
            + '格式：每条一行，格式为"搜索：xxxx"。生成6-10条。\n'
            + '内容要求：自然真实，包括生活琐事搜索、兴趣爱好搜索、偶尔搜索和用户相关的内容。\n\n'
            + '聊天记录：\n' + chatHistory;
    } else if (app === 'chat') {
        prompt = '你是' + contactName + '。以下是你和用户的聊天记录。\n'
            + '请生成你的聊天列表，展示你最近和谁聊了天。\n'
            + '格式：每行一个人，格式为"与xxx聊天：最后一条消息内容"。生成4-6条。\n'
            + '其中必须有一条是用户，并写出你给用户的备注名（用括号标注，如"备注：xxx"）。\n\n'
            + '聊天记录：\n' + chatHistory;
    } else if (app === 'notes') {
        prompt = '你是' + contactName + '。以下是你和用户的聊天记录，以及你的生活。\n'
            + '请根据这些内容，生成你的便签/备忘录。\n'
            + '格式：每条便签以"📌"开头，每条不超过200字。生成3-5条。\n'
            + '内容要求：生活琐事、想法、提醒、对用户的感受等。自然真实。\n\n'
            + '聊天记录：\n' + chatHistory;
    } else if (app === 'shop') {
        prompt = '你是' + contactName + '。以下是你和用户的聊天记录，以及你的生活。\n'
            + '请根据这些内容，生成你的购物车清单。\n'
            + '格式：每行一个商品，格式为"商品名 - ¥价格 - 加入原因"。生成4-6个商品。\n'
            + '价格合理，加入原因自然。\n\n'
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
            data[app] = {
                content: clean,
                time: Date.now()
            };
            savePhoneData(phoneContactId, data);
            renderPhoneAppContent(app, data[app]);
        }).catch(function() {
            hidePhoneLoading();
            showToast('生成失败，请重试');
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

    var appNames = { browser: '浏览器', chat: '聊天', notes: '便签', shop: '商城' };
    var appName = appNames[app] || '';

    var content = cached.content;
    // 处理换行
    var lines = content.split('\n').filter(function(l) { return l.trim(); });
    var contentHTML = '';

    if (app === 'browser') {
        contentHTML = '<div class="phone-browser-list">';
        lines.forEach(function(line) {
            contentHTML += '<div class="phone-browser-item">' + line.replace(/^搜索[：:]\s*/, '') + '</div>';
        });
        contentHTML += '</div>';
    } else if (app === 'chat') {
        contentHTML = '<div class="phone-chat-list">';
        lines.forEach(function(line) {
            contentHTML += '<div class="phone-chat-item">' + line + '</div>';
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
            var name = parts[0] || '';
            var price = parts[1] || '';
            var reason = parts[2] || '';
            contentHTML += ''
                + '<div class="phone-shop-item">'
                + '<div class="phone-shop-name">' + name + '</div>'
                + '<div class="phone-shop-price">' + price + '</div>'
                + '<div class="phone-shop-reason">' + reason + '</div>'
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
        + '<div class="phone-body">'
        + contentHTML
        + '</div>'
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
