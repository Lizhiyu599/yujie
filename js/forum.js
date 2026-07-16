/**
 * 玉界 - 论坛软件
 * 推特风格，角色/路人/用户均可发帖评论
 * AI 生成帖子，评论互通用，数据与聊天软件互通
 */

// ========== 数据存储 ==========
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
var forumCurrentPostId = null;
var forumIsGenerating = false;

// ========== 打开论坛 ==========
function openForum() {
    var appWindow = document.getElementById('forumAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'forumAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#fff;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    forumCurrentPostId = null;
    renderForumApp();
    appWindow.style.display = 'flex';
}

function closeForum() {
    var appWindow = document.getElementById('forumAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染外壳 ==========
function renderForumApp() {
    var appWindow = document.getElementById('forumAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = ''
        + '<div class="forum-app">'
        + '<div class="forum-top-bar">'
        + '<div class="forum-back-btn" onclick="closeForum()">‹</div>'
        + '<div class="forum-top-title">论 坛</div>'
        + '<div class="forum-btn-refresh" onclick="refreshForum()">↻</div>'
        + '</div>'
        + '<div class="forum-body" id="forumBody">'
        + renderForumContent()
        + '</div>'
        + '<div class="forum-bottom-bar">'
        + '<span class="forum-tab active" onclick="switchForumTab(\'home\', this)">首页</span>'
        + '<span class="forum-tab" onclick="openForumCompose()">发帖</span>'
        + '<span class="forum-tab" onclick="switchForumTab(\'notifications\', this)">通知</span>'
        + '</div>'
        + '</div>';
}

function switchForumTab(tab, el) {
    if (tab === 'home') {
        forumCurrentPostId = null;
        renderForumApp();
    }
}

// ========== 渲染帖子列表 ==========
function renderForumContent() {
    var posts = getForumPosts();
    if (posts.length === 0) {
        return '<div class="forum-empty">'
            + '<div class="forum-empty-icon">◈</div>'
            + '<div class="forum-empty-text">暂无帖子</div>'
            + '<div class="forum-empty-hint">点击 ↻ 刷新，看看大家在聊什么</div>'
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

// ========== 打开帖子详情 ==========
function openForumPost(postId) {
    forumCurrentPostId = postId;
    var posts = getForumPosts();
    var post = posts.find(function(p) { return p.id === postId; });
    if (!post) return;

    var comments = getForumComments();
    var postComments = comments[postId] || [];
    var timeStr = getForumRelativeTime(post.time);

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
    for (var i = 0; i < masks.length; i++) {
        if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; }
    }
    var userName = activeMask ? activeMask.name : '我';
    var userAvatar = activeMask && activeMask.avatar ? activeMask.avatar : '我';
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

    // 同步到聊天记录
    var posts = getForumPosts();
    var post = posts.find(function(p) { return p.id === postId; });
    if (post && post.contactId) {
        syncForumCommentToChat(post.contactId, post.userName, text);
    }

    // 调用 AI 让发帖人回复
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
            // 同步到聊天记录
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
    for (var i = 0; i < masks.length; i++) {
        if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; }
    }
    var userName = activeMask ? activeMask.name : '我';
    var userAvatar = activeMask && activeMask.avatar ? activeMask.avatar : '我';
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
            renderForumApp();
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
