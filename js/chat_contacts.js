/**
 * 玉界 - 联系人管理
 * 包含：新的朋友（好友历史）、联系人列表（字母索引）、编辑角色人设
 */

// ========== 好友请求历史存储 ==========
function getFriendRequests() {
    const raw = localStorage.getItem('friend_requests');
    return raw ? JSON.parse(raw) : [];
}

function saveFriendRequests(requests) {
    localStorage.setItem('friend_requests', JSON.stringify(requests));
}

// ========== 新的朋友页面 ==========
function showNewFriendsPage() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    const requests = getFriendRequests();

    // 按时间分组
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const recentRequests = requests.filter(r => r.timestamp > threeDaysAgo);
    const monthRequests = requests.filter(r => r.timestamp <= threeDaysAgo && r.timestamp > oneMonthAgo);
    const olderRequests = requests.filter(r => r.timestamp <= oneMonthAgo);

    let listHTML = '';

    if (recentRequests.length > 0) {
        listHTML += '<div class="contacts-section-title">三天前</div>';
        listHTML += recentRequests.map(r => renderFriendRequestCard(r)).join('');
    }
    if (monthRequests.length > 0) {
        listHTML += '<div class="contacts-section-title">三天前</div>';
        listHTML += monthRequests.map(r => renderFriendRequestCard(r)).join('');
    }
    if (olderRequests.length > 0) {
        listHTML += '<div class="contacts-section-title">一月前</div>';
        listHTML += olderRequests.map(r => renderFriendRequestCard(r)).join('');
    }

    if (requests.length === 0) {
        listHTML = '<div style="text-align:center;color:#8e8e93;padding:60px 20px;">暂无好友请求</div>';
    }

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="showContactsPage()">‹</span>
                    <span class="nav-title">新的朋友</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;background:#fff;">
                ${listHTML}
            </div>
        </div>
    `;
}

function renderFriendRequestCard(request) {
    const contact = window.ChatConfig.contacts.find(c => c.id === request.contactId);
    const name = contact ? contact.name : (request.name || '未知');
    const avatar = contact ? contact.avatar : (request.name ? request.name.charAt(0) : '?');
    const avatarData = contact ? contact.avatarData : '';

    const statusLabel = request.status === 'accepted' ? '已通过' : '未通过';
    const statusIcon = request.status === 'accepted' ? '↗' : '↘';

    const avatarHTML = avatarData 
        ? `<div class="chat-avatar" style="background-image:url(${avatarData});background-size:cover;background-position:center;">&nbsp;</div>`
        : `<div class="chat-avatar">${avatar}</div>`;

    return `
        <div class="chat-list-item" onclick="openFriendRequestChat('${request.contactId}')">
            ${avatarHTML}
            <div class="chat-info">
                <div class="chat-name">${name}</div>
                <div class="chat-preview">${request.message || ''}</div>
            </div>
            <span style="font-size:12px;color:#8e8e93;flex-shrink:0;">${statusIcon}${statusLabel}</span>
        </div>
    `;
}

function openFriendRequestChat(contactId) {
    // 点击跳转到聊天页面恢复角色
    if (typeof enterChat === 'function') {
        enterChat(contactId);
    }
}

// ========== 联系人列表页面（微信风格） ==========
function showContactsPage() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    const contacts = window.ChatConfig.contacts || [];

    // 按备注或姓名首字母分组
    const groups = {};
    contacts.forEach(c => {
        const displayName = c.name || '';
        const firstChar = displayName.charAt(0).toUpperCase();
        const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(c);
    });

    // 排序字母
    const sortedLetters = Object.keys(groups).sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
    });

    let listHTML = '';

    // 新的朋友入口
    listHTML += `
        <div class="chat-list-item" onclick="showNewFriendsPage()">
            <div class="chat-avatar" style="background:#f5f5f5;color:#8e8e93;">+</div>
            <div class="chat-info">
                <div class="chat-name">新的朋友</div>
            </div>
        </div>
    `;

    // 分组列表
    sortedLetters.forEach(letter => {
        listHTML += '<div class="contacts-section-title">' + letter + '</div>';
        groups[letter].forEach(c => {
            const avatarData = c.avatarData || '';
            const avatarHTML = avatarData 
                ? `<div class="chat-avatar" style="background-image:url(${avatarData});background-size:cover;background-position:center;">&nbsp;</div>`
                : `<div class="chat-avatar">${c.avatar}</div>`;
            listHTML += `
                <div class="chat-list-item" onclick="editContactPersona('${c.id}')">
                    ${avatarHTML}
                    <div class="chat-info">
                        <div class="chat-name">${c.name}</div>
                    </div>
                </div>
            `;
        });
    });

    // 右侧字母索引
    let indexBarHTML = '<div class="contacts-index-bar">';
    sortedLetters.forEach(letter => {
        indexBarHTML += '<span class="contacts-index-letter" onclick="scrollToGroup(\'' + letter + '\')">' + letter + '</span>';
    });
    indexBarHTML += '</div>';

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="renderChatShell()">‹</span>
                    <span class="nav-title">联系人</span>
                    <span class="nav-plus-btn" onclick="togglePlusMenu(event)">+</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;background:#fff;position:relative;" id="contactsScrollArea">
                ${listHTML}
            </div>
            ${indexBarHTML}
        </div>
    `;
}

function scrollToGroup(letter) {
    const area = document.getElementById('contactsScrollArea');
    if (!area) return;
    const titles = area.querySelectorAll('.contacts-section-title');
    for (let i = 0; i < titles.length; i++) {
        if (titles[i].textContent === letter) {
            titles[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
        }
    }
}

// ========== 编辑角色人设页面 ==========
function editContactPersona(contactId) {
    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="showContactsPage()">‹</span>
                    <span class="nav-title">编辑角色</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;background:#f2f2f7;">

                <div class="settings-section-title">角色头像</div>
                <div class="glass-card" style="text-align:center;">
                    <div id="editAvatarPreview" style="width:80px;height:80px;border-radius:40px;background:#e5e5ea;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;${contact.avatarData ? 'background-image:url(' + contact.avatarData + ');' : ''}" onclick="document.getElementById('editAvatarInput').click()">${contact.avatarData ? '' : contact.avatar}</div>
                    <input type="file" id="editAvatarInput" accept="image/*" style="display:none;" onchange="updateEditAvatar(event)">
                    <div style="font-size:11px;color:#8e8e93;">点击更换头像</div>
                </div>

                <div class="settings-section-title">角色名称</div>
                <div class="glass-card">
                    <input type="text" id="editCharName" class="search-input" value="${contact.name}" placeholder="角色名称">
                </div>

                <div class="settings-section-title">角色人设</div>
                <div class="glass-card">
                    <textarea id="editCharPersona" style="width:100%;height:250px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;">${contact.persona || ''}</textarea>
                </div>

                <button class="black-btn" onclick="saveContactEdit('${contactId}')" style="margin-top:16px;">保存修改</button>
                <button class="white-btn" onclick="deleteContactFromEdit('${contactId}')" style="border-color:#ff3b30;color:#ff3b30;">删除角色</button>
            </div>
        </div>
    `;
}

let editAvatarData = '';
function updateEditAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        editAvatarData = ev.target.result;
        const preview = document.getElementById('editAvatarPreview');
        if (preview) {
            preview.style.backgroundImage = `url(${ev.target.result})`;
            preview.innerText = '';
        }
    };
    reader.readAsDataURL(file);
}

function saveContactEdit(contactId) {
    const name = document.getElementById('editCharName').value.trim();
    const persona = document.getElementById('editCharPersona').value.trim();

    if (!name) { showToast('请填写角色名称'); return; }

    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (contact) {
        contact.name = name;
        contact.avatar = name.charAt(0);
        if (editAvatarData) contact.avatarData = editAvatarData;
        if (persona) contact.persona = persona;
        saveContactsToStorage();
        showToast('角色信息已更新');
        showContactsPage();
    }
}

function deleteContactFromEdit(contactId) {
    if (confirm('确定删除该角色？删除后可从聊天记录中恢复。')) {
        // 生成好友验证请求
        const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
        if (contact) {
            const requests = getFriendRequests();
            requests.push({
                contactId: contactId,
                name: contact.name,
                message: '我重新申请添加你为好友',
                status: 'pending',
                timestamp: Date.now()
            });
            saveFriendRequests(requests);
        }

        window.ChatConfig.contacts = window.ChatConfig.contacts.filter(c => c.id !== contactId);
        saveContactsToStorage();
        showToast('角色已删除');
        showContactsPage();
    }
}                                                                                                                                                                                                                                                                                        
