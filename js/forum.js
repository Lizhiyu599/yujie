/**
 * 玉界 - 论坛软件（推特式布局）
 * 首页 / 搜索 / 通知 / 私信 四个底部标签
 * AI 生成帖子，评论互通用，数据与聊天软件互通
 */

// ========== 帖子数据存储 ==========
function getForumPosts() {
    var raw = localStorage.getItem('forum_posts');
    return raw ? JSON.parse(raw) : [];
}
function saveForumPosts(posts) {
    localStorage.setItem('forum_posts', JSON.stringify(posts));
}
function getForumComments() {
    var raw = localStorage.getItem('forum_comments');
    return raw ? JSON.parse(raw) : {};
}
function saveForumComments(comments) {
    localStorage.setItem('forum_comments', JSON.stringify(comments));
}

// ========== 通知数据存储 ==========
function getForumNotifications() {
    var raw = localStorage.getItem('forum_notifications');
    return raw ? JSON.parse(raw) : [];
}
function saveForumNotifications(list) {
    localStorage.setItem('forum_notifications', JSON.stringify(list));
}
function addForumNotification(n) {
    var list = getForumNotifications();
    n.id = 'n_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    n.time = Date.now();
    n.read = false;
    list.unshift(n);
    if (list.length > 100) list = list.slice(0, 100);
    saveForumNotifications(list);
}
function getUnreadNotificationCount() {
    return getForumNotifications().filter(function(n) { return !n.read; }).length;
}
function markAllNotificationsRead() {
    var list = getForumNotifications();
    var changed = false;
    list.forEach(function(n) { if (!n.read) { n.read = true; changed = true; } });
    if (changed) saveForumNotifications(list);
}

// ========== 私信数据存储 ==========
function getForumDMList() {
    var raw = localStorage.getItem('forum_dm_list');
    return raw ? JSON.parse(raw) : [];
}
function saveForumDMList(list) {
    localStorage.setItem('forum_dm_list', JSON.stringify(list));
}
function getForumDMMessages(contactId) {
    var raw = localStorage.getItem('forum_dm_' + contactId);
    return raw ? JSON.parse(raw) : [];
}
function saveForumDMMessages(contactId, msgs) {
    localStorage.setItem('forum_dm_' + contactId, JSON.stringify(msgs));
}

// ========== NPC 池 ==========
function getNPCs() {
    var raw = localStorage.getItem('qianban_data');
    if (!raw) return [];
    var all = JSON.parse(raw);
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var data = all[activeMaskId] || { npcs: [] };
    return data.npcs || [];
}
function getRandomNPC() {
    var npcs = getNPCs();
    if (npcs.length === 0) return { name: '路人甲', avatar: '路', gender: '未知' };
    return npcs[Math.floor(Math.random() * npcs.length)];
}

// ========== 当前状态 ==========
var forumCurrentTab = 'home'; // home | search | notifications | messages
var forumCurrentPostId = null;
var forumCurrentDMContactId = null;
var forumSearchQuery = '';
var forumIsGenerating = false;

// ========== 打开/关闭论坛 ==========
function openForum() {
    var appWindow = document.getElementById('forumAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'forumAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#fff;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    forumCurrentTab = 'home';
    forumCurrentPostId = null;
    forumCurrentDMContactId = null;
    forumSearchQuery = '';
    renderForumApp();
    appWindow.style.display = 'flex';
}
function closeForum() {
    var appWindow = document.getElementById('forumAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 顶部用户头像 ==========
function getForumUserAvatar() {
    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeId = localStorage.getItem('active_mask_id') || '';
    var mask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeId) { mask = masks[i]; break; } }
    if (!mask && masks.length > 0) mask = masks[0];
    return mask && mask.avatar ? mask.avatar : '';
}
function forumOpenProfile() {
    if (typeof openMaskEditor === 'function') openMaskEditor();
}

// ========== 主渲染入口 ==========
function renderForumApp() {
    var appWindow = document.getElementById('forumAppWindow');
    if (!appWindow) return;

    // 私信会话中：整页替换，隐藏底部导航
    if (forumCurrentTab === 'messages' && forumCurrentDMContactId) {
        appWindow.innerHTML = renderForumDMThreadFull(forumCurrentDMContactId);
        setTimeout(function() {
            var body = document.getElementById('forumDMBody');
            if (body) body.scrollTop = body.scrollHeight;
        }, 50);
        return;
    }

    var bodyHTML = '';
    if (forumCurrentTab === 'home') bodyHTML = renderForumHomeBody();
    else if (forumCurrentTab === 'search') bodyHTML = renderForumSearchBody();
    else if (forumCurrentTab === 'notifications') bodyHTML = renderForumNotificationsBody();
    else if (forumCurrentTab === 'messages') bodyHTML = renderForumMessagesBody();

    appWindow.innerHTML = ''
        + '<div class="forum-app">'
        + renderForumTopBar()
        + '<div class="forum-body" id="forumBody">' + bodyHTML + '</div>'
        + (forumCurrentTab === 'home' ? '<div class="forum-fab" onclick="openForumCompose()">+</div>' : '')
        + renderForumBottomBar()
        + '</div>';

    if (forumCurrentTab === 'notifications') markAllNotificationsRead();
    if (forumCurrentTab === 'search') {
        setTimeout(function() {
            var input = document.getElementById('forumSearchInput');
            if (input) { input.focus(); input.value = forumSearchQuery; }
        }, 100);
    }
}

// ========== 顶部栏 ==========
function renderForumTopBar() {
    var avatar = getForumUserAvatar();
    var avatarHTML = '<div class="forum-user-avatar" onclick="forumOpenProfile()" style="' + (avatar ? 'background-image:url(' + avatar + ');background-size:cover;background-position:center;' : '') + '">' + (avatar ? '' : '我') + '</div>';

    if (forumCurrentTab === 'search') {
        return '<div class="forum-top-bar forum-top-bar-search">'
            + avatarHTML
            + '<input type="text" class="forum-search-input" id="forumSearchInput" placeholder="搜索帖子" oninput="forumDoSearch(this.value)">'
            + '</div>';
    }

    var titles = { home: '首页', notifications: '通知', messages: '私信' };
    var rightHTML = '';
    if (forumCurrentTab === 'home') {
        rightHTML = '<div class="forum-top-icon" onclick="refreshForum()">↻</div>';
    } else if (forumCurrentTab === 'notifications') {
        rightHTML = '<div class="forum-top-icon" onclick="showToast(\'设置功能即将上线\')">⚙</div>';
    } else if (forumCurrentTab === 'messages') {
        rightHTML = '<div class="forum-top-pill" onclick="showToast(\'即将上线\')">全部 ⌄</div>';
    }

    return '<div class="forum-top-bar">'
        + avatarHTML
        + '<div class="forum-top-title">' + titles[forumCurrentTab] + '</div>'
        + rightHTML
        + '</div>';
}

// ========== 底部标签栏（4个） ==========
function renderForumBottomBar() {
    var tabs = [
        { key: 'home', icon: '🏠' },
        { key: 'search', icon: '🔍' },
        { key: 'notifications', icon: '🔔', badge: true },
        { key: 'messages', icon: '💌' }
    ];
    var html = '<div class="forum-bottom-bar">';
    tabs.forEach(function(t) {
        var active = forumCurrentTab === t.key;
        var badgeHTML = '';
        if (t.badge && getUnreadNotificationCount() > 0) {
            badgeHTML = '<span class="forum-tab-badge"></span>';
        }
        html += '<div class="forum-bottom-tab' + (active ? ' active' : '') + '" onclick="switchForumTab(\'' + t.key + '\')">'
            + '<span class="forum-bottom-icon">' + t.icon + badgeHTML + '</span>'
            + '</div>';
    });
    html += '</div>';
    return html;
}

function switchForumTab(tab) {
    forumCurrentTab = tab;
    forumCurrentPostId = null;
    forumCurrentDMContactId = null;
    renderForumApp();
}

// ========== 帖子列表（首页/搜索共用） ==========
function renderForumPostList(posts) {
    if (!posts || posts.length === 0) {
        return '<div class="forum-empty">'
            + '<div class="forum-empty-icon">◈</div>'
            + '<div class="forum-empty-text">暂无帖子</div>'
            + '<div class="forum-empty-hint">点击右上角 ↻ 刷新，看看大家在聊什么</div>'
            + '</div>';
    }
    var comments = getForumComments();
    var html = '';
    posts.forEach(function(post) {
        var commentCount = (comments[post.id] || []).length;
        var timeStr = getForumRelativeTime(post.time);
        html += ''
            + '<div class="forum-post" onclick="openForumPost(\'' + post.id + '\')">'
            + '<div class="forum-post-avatar" style="' + (post.avatarData ? 'background-image:url(' + post.avatarData + ');background-size:cover;background-position:center;' : '') + '">' + (post.avatarData ? '' : post.avatar) + '</div>'
            + '<div class="forum-post-body">'
            + '<div class="forum-post-header">'
            + '<span class="forum-post-name">' + post.userName + '</span>'
            + '<span class="forum-post-handle">@' + post.userHandle + '</span>'
            + '<span class="forum-post-time">· ' + timeStr + '</span>'
            + '</div>'
            + '<div class="forum-post-text">' + post.content + '</div>'
            + '<div class="forum-post-actions">'
            + '<span>💬 ' + commentCount + '</span>'
            + '<span>↻</span>'
            + '<span>♡ ' + (post.likes || 0) + '</span>'
            + '<span>↗</span>'
            + '</div>'
            + '</div>'
            + '</div>';
    });
    return html;
}

function renderForumHomeBody() {
    return renderForumPostList(getForumPosts());
}

// ========== 搜索 ==========
function renderForumSearchBody() {
    if (!forumSearchQuery.trim()) {
        return '<div class="forum-empty">'
            + '<div class="forum-empty-icon">🔍</div>'
            + '<div class="forum-empty-text">搜索帖子</div>'
            + '<div class="forum-empty-hint">输入关键词查找已发布的内容</div>'
            + '</div>';
    }
    var posts = getForumPosts();
    var q = forumSearchQuery.toLowerCase();
    var matched = posts.filter(function(p) {
        return (p.content && p.content.toLowerCase().indexOf(q) >= 0) || (p.userName && p.userName.toLowerCase().indexOf(q) >= 0);
    });
    if (matched.length === 0) {
        return '<div class="forum-empty">'
            + '<div class="forum-empty-icon">🔍</div>'
            + '<div class="forum-empty-text">没有找到相关内容</div>'
            + '</div>';
    }
    return renderForumPostList(matched);
}

function forumDoSearch(val) {
    forumSearchQuery = val;
    var body = document.getElementById('forumBody');
    if (body) body.innerHTML = renderForumSearchBody();
}

// ========== 通知 ==========
function renderForumNotificationsBody() {
    var list = getForumNotifications();
    if (list.length === 0) {
        return '<div class="forum-empty">'
            + '<div class="forum-empty-icon">🔔</div>'
            + '<div class="forum-empty-text">暂无通知</div>'
            + '<div class="forum-empty-hint">角色点赞或评论你的帖子时会显示在这里</div>'
            + '</div>';
    }
    var html = '';
    list.forEach(function(n) {
        var actionText = n.type === 'like' ? '赞了你的帖子' : '评论了你的帖子';
        var avatarStyle = n.authorAvatarData ? 'background-image:url(' + n.authorAvatarData + ');background-size:cover;background-position:center;' : '';
        html += '<div class="forum-notif-item' + (n.read ? '' : ' unread') + '" onclick="openForumPost(\'' + n.postId + '\')">'
            + '<div class="forum-notif-avatar" style="' + avatarStyle + '">' + (n.authorAvatarData ? '' : n.authorAvatar) + '</div>'
            + '<div class="forum-notif-body">'
            + '<div class="forum-notif-text"><b>' + n.authorName + '</b> ' + actionText + '</div>'
            + (n.type === 'comment' && n.commentText ? '<div class="forum-notif-comment">"' + n.commentText + '"</div>' : '')
            + '<div class="forum-notif-post-preview">' + (n.postContent || '') + '</div>'
            + '<div class="forum-notif-time">' + getForumRelativeTime(n.time) + '</div>'
            + '</div>'
            + '</div>';
    });
    return html;
}

// 论坛帖子被角色点赞/评论的随机互动
function maybeInteractWithUserPost() {
    var posts = getForumPosts();
    var userPosts = posts.filter(function(p) { return p.isUser; });
    if (userPosts.length === 0) return;
    if (Math.random() > 0.5) return;

    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.length === 0) return;
    var actor = contacts[Math.floor(Math.random() * contacts.length)];
    var targetPost = userPosts[Math.floor(Math.random() * userPosts.length)];

    if (Math.random() < 0.5) {
        targetPost.likes = (targetPost.likes || 0) + 1;
        saveForumPosts(posts);
        addForumNotification({
            type: 'like',
            authorName: actor.name,
            authorAvatar: actor.avatar,
            authorAvatarData: actor.avatarData || '',
            postId: targetPost.id,
            postContent: targetPost.content
        });
        var body = document.getElementById('forumBody');
        if (body && forumCurrentTab === 'home') renderForumApp();
    } else {
        var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(actor.id) : '';
        var prompt = '用户在论坛发了一条帖子：「' + targetPost.content + '」。请以你的口吻给这条帖子写一句简短评论，1句话，自然随意，不超过30字。只输出评论内容。';
        if (typeof callChatAPI === 'function') {
            callChatAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]).then(function(reply) {
                var clean = reply.replace(/\{[^}]*\}/g, '').trim();
                if (!clean) return;
                var comments = getForumComments();
                if (!comments[targetPost.id]) comments[targetPost.id] = [];
                comments[targetPost.id].push({
                    id: 'c_' + Date.now(),
                    userName: actor.name,
                    userHandle: actor.name,
                    avatar: actor.avatar,
                    avatarData: actor.avatarData || '',
                    content: clean,
                    time: Date.now()
                });
                saveForumComments(comments);
                addForumNotification({
                    type: 'comment',
                    authorName: actor.name,
                    authorAvatar: actor.avatar,
                    authorAvatarData: actor.avatarData || '',
                    postId: targetPost.id,
                    postContent: targetPost.content,
                    commentText: clean
                });
                if (forumCurrentTab === 'home') renderForumApp();
            }).catch(function() {});
        }
    }
}

// ========== 私信（论坛内独立系统） ==========
function renderForumMessagesBody() {
    var dmList = getForumDMList();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];

    var html = '<div class="forum-dm-start-row" onclick="forumOpenNewDM()"><span>+ 新私信</span></div>';

    if (dmList.length === 0) {
        html += '<div class="forum-empty">'
            + '<div class="forum-empty-icon">💌</div>'
            + '<div class="forum-empty-text">暂无私信</div>'
            + '<div class="forum-empty-hint">点击上方开始与角色私信</div>'
            + '</div>';
        return html;
    }
    dmList.forEach(function(contactId) {
        var contact = contacts.find(function(c) { return c.id === contactId; });
        if (!contact) return;
        var msgs = getForumDMMessages(contactId);
        var last = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        var avatarStyle = contact.avatarData ? 'background-image:url(' + contact.avatarData + ');background-size:cover;background-position:center;' : '';
        html += '<div class="forum-dm-item" onclick="openForumDM(\'' + contactId + '\')">'
            + '<div class="forum-dm-avatar" style="' + avatarStyle + '">' + (contact.avatarData ? '' : contact.avatar) + '</div>'
            + '<div class="forum-dm-info">'
            + '<div class="forum-dm-name">' + contact.name + '</div>'
            + '<div class="forum-dm-last">' + (last ? last.text.substring(0, 30) : '开始对话吧') + '</div>'
            + '</div>'
            + (last ? '<div class="forum-dm-time">' + getForumRelativeTime(last.time) + '</div>' : '')
            + '</div>';
    });
    return html;
}

function forumOpenNewDM() {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.length === 0) { showToast('暂无可私信的角色'); return; }
    var overlay = document.createElement('div');
    overlay.className = 'sheet-mask show';
    overlay.id = 'forumDMPickerOverlay';
    var listHTML = '';
    contacts.forEach(function(c) {
        var avatarStyle = c.avatarData ? 'background-image:url(' + c.avatarData + ');background-size:cover;background-position:center;' : '';
        listHTML += '<div class="music-menu-item" onclick="forumStartDM(\'' + c.id + '\')">'
            + '<div class="forum-dm-avatar small" style="' + avatarStyle + '">' + (c.avatarData ? '' : c.avatar) + '</div>'
            + '<span>' + c.name + '</span></div>';
    });
    overlay.innerHTML = '<div class="half-sheet" onclick="event.stopPropagation();">'
        + '<div class="sheet-handle"><div class="handle-bar"></div></div>'
        + '<div class="sheet-scroll"><div class="settings-section-title">发起私信</div>' + listHTML + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) { var o = document.getElementById('forumDMPickerOverlay'); if (o) o.remove(); } };
    var handle = overlay.querySelector('.sheet-handle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 60) { var o = document.getElementById('forumDMPickerOverlay'); if (o) o.remove(); } });
}

function forumStartDM(contactId) {
    var o = document.getElementById('forumDMPickerOverlay');
    if (o) o.remove();
    var list = getForumDMList();
    if (list.indexOf(contactId) < 0) { list.unshift(contactId); saveForumDMList(list); }
    openForumDM(contactId);
}

function openForumDM(contactId) {
    forumCurrentDMContactId = contactId;
    renderForumApp();
}

function forumCloseDM() {
    forumCurrentDMContactId = null;
    renderForumApp();
}

function renderForumDMThreadFull(contactId) {
    var contact = window.ChatConfig && window.ChatConfig.contacts
        ? window.ChatConfig.contacts.find(function(c) { return c.id === contactId; })
        : null;
    if (!contact) { forumCurrentDMContactId = null; return renderForumMessagesBody(); }

    var msgs = getForumDMMessages(contactId);
    var msgsHTML = '';
    msgs.forEach(function(m) {
        msgsHTML += '<div class="forum-dm-bubble-row ' + m.role + '">'
            + '<div class="forum-dm-bubble">' + m.text + '</div>'
            + '</div>';
    });

    return '<div class="forum-app">'
        + '<div class="forum-top-bar">'
        + '<div class="forum-back-btn" onclick="forumCloseDM()">‹</div>'
        + '<div class="forum-top-title">' + contact.name + '</div>'
        + '<div class="forum-top-spacer"></div>'
        + '</div>'
        + '<div class="forum-dm-body" id="forumDMBody">' + msgsHTML + '</div>'
        + '<div class="forum-dm-input-bar">'
        + '<input type="text" class="forum-dm-input" id="forumDMInput" placeholder="发送私信..." onkeypress="if(event.key===\'Enter\') sendForumDM(\'' + contactId + '\')">'
        + '<button class="forum-dm-send-btn" onclick="sendForumDM(\'' + contactId + '\')">发送</button>'
        + '</div>'
        + '</div>';
}

function sendForumDM(contactId) {
    var input = document.getElementById('forumDMInput');
    if (!input || !input.value.trim()) return;
    var text = input.value.trim();
    input.value = '';

    var msgs = getForumDMMessages(contactId);
    msgs.push({ role: 'user', text: text, time: Date.now() });
    saveForumDMMessages(contactId, msgs);
    renderForumApp();

    var contact = window.ChatConfig.contacts.find(function(c) { return c.id === contactId; });
    if (!contact) return;

    var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(contactId) : '';
    systemPrompt += '\n\n【私信模式】这是论坛平台上的私信对话，不是主聊天软件。直接说话，简短自然，不要旁白括号，不要JSON状态信息。';

    var history = msgs.map(function(m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; });

    if (typeof callChatAPI === 'function') {
        callChatAPI([{ role: 'system', content: systemPrompt }].concat(history)).then(function(reply) {
            var clean = reply.replace(/\{[^}]*\}/g, '').replace(/[\(\（][^\)\）]*[\)\）]/g, '').trim();
            if (!clean) return;
            var msgs2 = getForumDMMessages(contactId);
            msgs2.push({ role: 'assistant', text: clean, time: Date.now() });
            saveForumDMMessages(contactId, msgs2);
            if (forumCurrentDMContactId === contactId) renderForumApp();
        }).catch(function() {});
    }
}

// ========== 打开帖子详情 ==========
function openForumPost(postId) {
    forumCurrentPostId = postId;
    var posts = getForumPosts();
    var post = posts.find(function(p) { return p.id === postId; });
    if (!post) return;

    var comments = getForumComments();
    var postComments = comments[postId] || [];

    var commentsHTML = '';
    postComments.forEach(function(c) {
        commentsHTML += ''
            + '<div class="forum-comment">'
            + '<div class="forum-comment-avatar" style="' + (c.avatarData ? 'background-image:url(' + c.avatarData + ');background-size:cover;background-position:center;' : '') + '">' + (c.avatarData ? '' : c.avatar) + '</div>'
            + '<div class="forum-comment-body">'
            + '<div class="forum-comment-header">'
            + '<span class="forum-comment-name">' + c.userName + '</span>'
            + '<span class="forum-comment-handle">@' + c.userHandle + '</span>'
            + '<span class="forum-comment-time">· ' + getForumRelativeTime(c.time) + '</span>'
            + '</div>'
            + '<div class="forum-comment-text">' + c.content + '</div>'
            + '</div>'
            + '</div>';
    });

    var appWindow = document.getElementById('forumAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = ''
        + '<div class="forum-app">'
        + '<div class="forum-top-bar">'
        + '<div class="forum-back-btn" onclick="renderForumApp()">‹</div>'
        + '<div class="forum-top-title">帖子</div>'
        + '<div class="forum-top-spacer"></div>'
        + '</div>'
        + '<div class="forum-body">'
        + '<div class="forum-post detail">'
        + '<div class="forum-post-avatar" style="' + (post.avatarData ? 'background-image:url(' + post.avatarData + ');background-size:cover;background-position:center;' : '') + '">' + (post.avatarData ? '' : post.avatar) + '</div>'
        + '<div class="forum-post-body">'
        + '<div class="forum-post-header">'
        + '<span class="forum-post-name">' + post.userName + '</span>'
        + '<span class="forum-post-handle">@' + post.userHandle + '</span>'
        + '</div>'
        + '<div class="forum-post-text detail-text">' + post.content + '</div>'
        + '<div class="forum-post-time-detail">' + post.timeStr + '</div>'
        + '<div class="forum-post-actions-detail">'
        + '<span>💬 ' + postComments.length + '</span>'
        + '<span>♡ ' + (post.likes || 0) + '</span>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="forum-comments-section">'
        + commentsHTML
        + '</div>'
        + '</div>'
        + '<div class="forum-compose-bar">'
        + '<input type="text" class="forum-compose-input" id="forumCommentInput" placeholder="发表评论...">'
        + '<button class="forum-compose-btn" onclick="submitForumComment(\'' + postId + '\')">发送</button>'
        + '</div>'
        + '</div>';
}

// ========== 提交评论 ==========
function submitForumComment(postId) {
    var input = document.getElementById('forumCommentInput');
    if (!input || !input.value.trim()) return;
    var text = input.value.trim();
    input.value = '';

    var comments = getForumComments();
    if (!comments[postId]) comments[postId] = [];

    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var activeMask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; } }
    var userName = activeMask ? activeMask.name : '我';
    var userAvatarData = activeMask && activeMask.avatar ? activeMask.avatar : '';

    comments[postId].push({
        id: 'c_' + Date.now(),
        userName: userName,
        userHandle: userName,
        avatar: '我',
        avatarData: userAvatarData,
        content: text,
        time: Date.now()
    });
    saveForumComments(comments);

    var posts = getForumPosts();
    var post = posts.find(function(p) { return p.id === postId; });
    if (post && post.contactId) {
        syncForumCommentToChat(post.contactId, post.userName, text);
    }
    if (post && post.contactId) {
        autoReplyToComment(post, text);
    }

    openForumPost(postId);
}

// ========== 同步评论到聊天记录 ==========
function syncForumCommentToChat(contactId, postAuthor, commentText) {
    var storageKey = 'chat_history_' + contactId;
    var saved = localStorage.getItem(storageKey) || '';
    var now = new Date();
    var h = now.getHours(); var m = now.getMinutes().toString().padStart(2, '0');
    var period = h < 12 ? '上午' : '下午'; var displayH = h % 12 || 12;
    var htmlToAdd = ''
        + '<div class="chat-time-stamp">' + period + ' ' + displayH + ':' + m + '</div>'
        + '<div class="bubble-row user" data-role="user">'
        + '<div class="bubble-avatar user-avatar">我</div>'
        + '<div class="bubble bubble-user">我在论坛评论了' + postAuthor + '的帖子：' + commentText + '</div>'
        + '</div>';
    localStorage.setItem(storageKey, saved + htmlToAdd);
}

// ========== AI 自动回复评论 ==========
function autoReplyToComment(post, userComment) {
    var contactId = post.contactId;
    if (!contactId) return;

    var contact = window.ChatConfig && window.ChatConfig.contacts
        ? window.ChatConfig.contacts.find(function(c) { return c.id === contactId; })
        : null;
    if (!contact) return;

    var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(contactId) : '';
    var prompt = '你在论坛上发了一个帖子：「' + post.content + '」。\n'
        + '用户评论了你的帖子：「' + userComment + '」\n'
        + '请以你的口吻简短回复用户的评论，1-3句话，自然随意。';

    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            var clean = reply.replace(/\{[^}]*\}/g, '').trim();
            if (!clean) return;
            var comments = getForumComments();
            if (!comments[post.id]) comments[post.id] = [];
            comments[post.id].push({
                id: 'c_' + Date.now(),
                userName: post.userName,
                userHandle: post.userHandle,
                avatar: post.avatar,
                avatarData: post.avatarData || '',
                content: clean,
                time: Date.now(),
                isAutoReply: true
            });
            saveForumComments(comments);

            addForumNotification({
                type: 'comment',
                authorName: post.userName,
                authorAvatar: post.avatar,
                authorAvatarData: post.avatarData || '',
                postId: post.id,
                postContent: post.content,
                commentText: clean
            });

            var storageKey = 'chat_history_' + contactId;
            var saved = localStorage.getItem(storageKey) || '';
            var now = new Date();
            var h = now.getHours(); var m = now.getMinutes().toString().padStart(2, '0');
            var period = h < 12 ? '上午' : '下午'; var displayH = h % 12 || 12;
            var htmlToAdd = ''
                + '<div class="chat-time-stamp">' + period + ' ' + displayH + ':' + m + '</div>'
                + '<div class="bubble-row assistant" data-role="assistant">'
                + '<div class="bubble-avatar bot-avatar">' + post.avatar + '</div>'
                + '<div class="bubble bubble-assistant">在论坛回复了评论：' + clean + '</div>'
                + '</div>';
            localStorage.setItem(storageKey, saved + htmlToAdd);

            if (forumCurrentPostId === post.id) openForumPost(post.id);
        }).catch(function() {});
    }
}

// ========== 发帖 ==========
function openForumCompose() {
    var overlay = document.createElement('div');
    overlay.className = 'forum-compose-overlay';
    overlay.id = 'forumComposeOverlay';
    overlay.innerHTML = ''
        + '<div class="forum-compose-panel">'
        + '<div class="forum-compose-handle" id="forumComposeHandle"></div>'
        + '<div class="forum-compose-title">发帖</div>'
        + '<textarea class="forum-compose-textarea" id="forumComposeInput" placeholder="分享你的想法..."></textarea>'
        + '<button class="forum-compose-send" onclick="publishForumPost()">发布</button>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeForumCompose(); };

    var handle = document.getElementById('forumComposeHandle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 40) closeForumCompose(); });
    handle.addEventListener('click', function() { closeForumCompose(); });
}
function closeForumCompose() {
    var overlay = document.getElementById('forumComposeOverlay');
    if (overlay) overlay.remove();
}
function publishForumPost() {
    var input = document.getElementById('forumComposeInput');
    if (!input || !input.value.trim()) { showToast('请输入内容'); return; }
    var text = input.value.trim();
    closeForumCompose();

    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var activeMask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; } }
    var userName = activeMask ? activeMask.name : '我';
    var userAvatarData = activeMask && activeMask.avatar ? activeMask.avatar : '';

    var posts = getForumPosts();
    posts.unshift({
        id: 'p_' + Date.now(),
        userName: userName,
        userHandle: userName,
        avatar: '我',
        avatarData: userAvatarData,
        content: text,
        time: Date.now(),
        timeStr: getForumRelativeTime(Date.now()),
        likes: 0,
        isUser: true
    });
    saveForumPosts(posts);
    forumCurrentTab = 'home';
    renderForumApp();
    showToast('帖子已发布');
}

// ========== 刷新论坛 ==========
function refreshForum() {
    if (forumIsGenerating) { showToast('正在生成中…'); return; }
    forumIsGenerating = true;
    var toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.textContent = '正在生成帖子…';
    document.body.appendChild(toast);

    maybeInteractWithUserPost();

    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = getNPCs();
    var allAuthors = [];

    contacts.forEach(function(c) {
        allAuthors.push({
            name: c.name,
            handle: c.name,
            avatar: c.avatar,
            avatarData: c.avatarData || '',
            contactId: c.id,
            isContact: true
        });
    });
    npcs.forEach(function(n) {
        allAuthors.push({
            name: n.name,
            handle: n.name,
            avatar: n.name.charAt(0),
            avatarData: '',
            contactId: null,
            isContact: false
        });
    });

    if (allAuthors.length === 0) {
        allAuthors.push({ name: '路人甲', handle: '路人甲', avatar: '路', avatarData: '', contactId: null, isContact: false });
    }

    var author = allAuthors[Math.floor(Math.random() * allAuthors.length)];

    var systemPrompt = '';
    if (author.isContact && author.contactId && typeof buildSystemPrompt === 'function') {
        systemPrompt = buildSystemPrompt(author.contactId);
    }

    var prompt = '请以' + author.name + '的口吻发一条简短的论坛帖子。\n'
        + '【字数要求】20~60字。\n'
        + '【内容】可以分享日常、心情、吐槽、有趣的事。自然随意，像真人发的。\n'
        + '格式：只输出帖子内容，不加引号不加标记。';

    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: systemPrompt || '你是一个普通用户，在论坛上发帖。简短自然。' },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            toast.remove();
            forumIsGenerating = false;
            var clean = reply.replace(/\{[^}]*\}/g, '').trim();
            if (!clean) { showToast('生成失败'); return; }
            var posts = getForumPosts();
            posts.unshift({
                id: 'p_' + Date.now(),
                userName: author.name,
                userHandle: author.handle,
                avatar: author.avatar,
                avatarData: author.avatarData,
                content: clean,
                time: Date.now(),
                timeStr: getForumRelativeTime(Date.now()),
                likes: Math.floor(Math.random() * 20),
                contactId: author.contactId
            });
            saveForumPosts(posts);
            if (forumCurrentTab === 'home') renderForumApp();
        }).catch(function() {
            toast.remove();
            forumIsGenerating = false;
            showToast('生成失败');
        });
    } else {
        toast.remove();
        forumIsGenerating = false;
        showToast('API未配置');
    }
}

// ========== 相对时间 ==========
function getForumRelativeTime(timestamp) {
    var now = Date.now();
    var diff = now - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    var d = new Date(timestamp);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {});
