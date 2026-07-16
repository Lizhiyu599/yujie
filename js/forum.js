/**
 * 玉界论坛 - 核心渲染逻辑
 */

// ========== 1. 极细线条 SVG 图标库 ==========
const SVGIcons = {
    // 顶部 Logo
    xLogo: '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    // 更多按钮
    more: '<svg viewBox="0 0 24 24"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>',
    // 加号
    plus: '<svg viewBox="0 0 24 24"><path d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/></svg>',
    // 底部 4 个导航 (已删除 Grok)
    home: '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 0 1 2.34 5.66v4.74a1 1 0 0 1-1 1h-4v-5h-2v5H6a1 1 0 0 1-1-1v-4.74c0-2.12.84-4.15 2.34-5.66L12 2.69zm0-1.41l-6.36 6.36a10 10 0 0 0-2.93 7.07v4.79a3 3 0 0 0 3 3h4a1 1 0 0 0 1-1v-4h2v4a1 1 0 0 0 1 1h4a3 3 0 0 0 3-3v-4.79a10 10 0 0 0-2.93-7.07L12 1.28z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M21.163 17.16L20 15.997V11c0-3.71-2.483-6.85-5.836-7.73A2.996 2.996 0 0 0 12 1a2.996 2.996 0 0 0-2.164 2.27C6.483 4.15 4 7.29 4 11v4.997l-1.163 1.163a1 1 0 0 0-.293.707v1a1 1 0 0 0 1 1h16.912a1 1 0 0 0 1-1v-1a1 1 0 0 0-.293-.707zM12 21a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z"/></svg>',
    envelope: '<svg viewBox="0 0 24 24"><path d="M1.998 5.5c0-1.381 1.119-2.5 2.5-2.5h15c1.381 0 2.5 1.119 2.5 2.5v13c0 1.381-1.119 2.5-2.5 2.5h-15c-1.381 0-2.5-1.119-2.5-2.5v-13zm2.5-.5c-.276 0-.5.224-.5.5v1.2l7.562 5.671c.261.196.615.196.876 0L20 6.7v-1.2c0-.276-.224-.5-.5-.5h-15zm17.002 3.73l-7.234 5.424a2.492 2.492 0 0 1-2.997 0L4 8.73v9.77c0 .276.224.5.5.5h15c.276 0 .5-.224.5-.5V8.73z"/></svg>',
    // 互动图标
    comment: '<svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.34 3.41-7.84 7.62-7.84h5.26c4.21 0 7.62 3.5 7.62 7.84 0 4.33-3.41 7.83-7.62 7.83H9.37l-4.52 4.1c-.28.26-.7.3-1.02.1-.32-.2-.48-.56-.39-.93l1.11-4.22c-1.72-1.32-2.8-3.32-2.8-5.52v-.08z"/></svg>',
    retweet: '<svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.43 4.42-1.41 1.42L5.5 7.69v8.31C5.5 17.66 6.84 19 8.5 19H16v2H8.5C5.46 21 3 18.54 3 15.5V7.69L.98 9.72.57 9.3 4.5 3.88zM15.07 14.28l1.41-1.42 2.02 2.03V6.58C18.5 4.9 17.16 3.5 15.5 3.5H8v-2h7.5C18.54 1.5 21 3.96 21 7v7.89l2.02-2.03.41.42-3.93 5.42-4.43-4.42z"/></svg>',
    like: '<svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.691-3.697 2.001C11.982 6.191 10.525 5.44 9.303 5.5c-1.892.09-3.303 1.83-3.303 3.8 0 1.5 1.1 3.5 4.5 6.6l1.5 1.4 1.5-1.4c3.4-3.1 4.5-5.1 4.5-6.6 0-1.97-1.411-3.71-3.303-3.8zM12 20.3l-.7-.6C7.2 15.7 5 13.1 5 9.3c0-3 2.1-5.7 5.3-5.8 1.8-.1 3.5.9 4.7 2.4 1.2-1.5 2.9-2.5 4.7-2.4 3.2.1 5.3 2.8 5.3 5.8 0 3.8-2.2 6.4-6.3 10.4l-.7.6z"/></svg>',
    views: '<svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM3 21H1v-7h2v7zm14.25 0h2V9h-2v12z M12.5 21V11h2v10h-2z"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41L7.71 9.71 6.3 8.29 12 2.59zM4 15h2v4c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-4h2v4c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3v-4z"/></svg>'
};

// ========== 2. 状态管理 ==========
let forumCurrentTab = 'home';
let forumHomeSubTab = 'recommend';

// ========== 3. 顶部栏渲染 (处理居中和状态栏) ==========
function renderForumTopBar() {
    // 兼容获取头像逻辑
    const avatar = (typeof getForumUserAvatar === 'function') ? getForumUserAvatar() : '';
    const avatarStyle = avatar ? `background-image:url(${avatar});` : '';

    let html = `
        <div class="forum-top-bar-container">
            <div class="forum-top-bar">
                <div class="forum-user-avatar" onclick="forumOpenProfile()" style="${avatarStyle}"></div>
                <div class="forum-top-logo">${SVGIcons.xLogo}</div>
                <div class="forum-top-right-actions">
                    <button class="forum-upgrade-btn" onclick="refreshForum()">刷新</button>
                    <div class="forum-top-more-btn">${SVGIcons.more}</div>
                </div>
            </div>
    `;

    if (forumCurrentTab === 'home') {
        html += `
            <div class="forum-tabs-nav">
                <div class="forum-tab-item ${forumHomeSubTab === 'recommend' ? 'active' : ''}" onclick="switchHomeSubTab('recommend')">为你推荐</div>
                <div class="forum-tab-item ${forumHomeSubTab === 'following' ? 'active' : ''}" onclick="switchHomeSubTab('following')">正在关注</div>
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
}

// ========== 4. 底部导航栏渲染 (精简版，无Grok) ==========
function renderForumBottomBar() {
    const tabs = [
        { key: 'home', icon: SVGIcons.home },
        { key: 'search', icon: SVGIcons.search },
        { key: 'notifications', icon: SVGIcons.bell },
        { key: 'messages', icon: SVGIcons.envelope }
    ];

    let html = '<div class="forum-bottom-bar">';
    tabs.forEach(t => {
        const activeClass = forumCurrentTab === t.key ? 'active' : '';
        html += `
            <div class="forum-bottom-tab ${activeClass}" onclick="switchForumTab('${t.key}')">
                <div class="forum-bottom-icon">${t.icon}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// ========== 5. 本地存储与核心数据处理 ==========
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

// ========== 6. 打开/关闭论坛主界面 ==========
function openForum() {
    var appWindow = document.getElementById('forumAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'forumAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#ffffff;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    forumCurrentTab = 'home';
    forumHomeSubTab = 'recommend';
    renderForumApp();
    appWindow.style.display = 'flex';
}
function closeForum() {
    var appWindow = document.getElementById('forumAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 7. 顶/底栏路由与子Tab切换 ==========
function switchForumTab(tab) {
    forumCurrentTab = tab;
    renderForumApp();
}
function switchHomeSubTab(sub) {
    forumHomeSubTab = sub;
    renderForumApp();
}

// ========== 8. 帖子列表渲染 (复刻 X 原版极细图标与布局) ==========
function renderForumPostList(posts) {
    if (!posts || posts.length === 0) {
        return '<div class="forum-empty">'
            + '<div class="forum-empty-icon">✧</div>'
            + '<div class="forum-empty-text">这里还空空如也</div>'
            + '<div class="forum-empty-hint">点击右上角刷新，接收新鲜事物吧</div>'
            + '</div>';
    }
    var comments = getForumComments();
    var html = '';
    
    posts.forEach(function(post) {
        var commentCount = (comments[post.id] || []).length;
        var timeStr = getForumRelativeTime(post.time);
        var avatarStyle = post.avatarData ? 'background-image:url(' + post.avatarData + ');' : '';

        html += '<div class="forum-post" onclick="openForumPost(\'' + post.id + '\')">'
            + '<div class="forum-post-avatar" style="' + avatarStyle + '"></div>'
            + '<div class="forum-post-body">'
            + '<div class="forum-post-header">'
            + '<div class="forum-post-meta">'
            + '<span class="forum-post-name">' + post.userName + '</span>'
            + '<span class="forum-post-handle">@' + post.userHandle + '</span>'
            + '<span class="forum-post-dot">·</span>'
            + '<span class="forum-post-time">' + timeStr + '</span>'
            + '</div>'
            + '<div class="forum-post-more">' + SVGIcons.more + '</div>'
            + '</div>'
            + '<div class="forum-post-text">' + post.content + '</div>'
            
            // X 极简浅灰细线图标组
            + '<div class="forum-post-actions" onclick="event.stopPropagation();">'
            + '<button class="forum-action-btn comment" onclick="openForumPost(\'' + post.id + '\')">' + SVGIcons.comment + '<span>' + commentCount + '</span></button>'
            + '<button class="forum-action-btn retweet">' + SVGIcons.retweet + '<span>' + Math.floor((post.likes || 0) / 3) + '</span></button>'
            + '<button class="forum-action-btn like" onclick="handleLikePost(\'' + post.id + '\')">' + SVGIcons.like + '<span>' + (post.likes || 0) + '</span></button>'
            + '<button class="forum-action-btn views">' + SVGIcons.views + '<span>' + ((post.likes || 0) * 7 + 12) + '</span></button>'
            + '<button class="forum-action-btn share">' + SVGIcons.share + '</button>'
            + '</div>'

            + '</div>'
            + '</div>';
    });
    return html;
}

// ========== 9. 主渲染入口 (整合各 Tab 的内容) ==========
function renderForumApp() {
    var appWindow = document.getElementById('forumAppWindow');
    if (!appWindow) return;

    // 如果在帖子详情页，渲染详情
    if (forumCurrentTab === 'home' && forumCurrentPostId) {
        appWindow.innerHTML = renderForumPostDetail(forumCurrentPostId);
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
        + (forumCurrentTab === 'home' ? '<div class="forum-fab" onclick="openForumCompose()">' + SVGIcons.plus + '</div>' : '')
        + renderForumBottomBar()
        + '</div>';
}

function renderForumHomeBody() {
    var posts = getForumPosts();
    if (forumHomeSubTab === 'following') {
        // 过滤关注：非用户发帖
        posts = posts.filter(function(p) { return !p.isUser; });
    }
    return renderForumPostList(posts);
}

function renderForumSearchBody() {
    return '<div class="forum-empty">'
        + '<div class="forum-empty-icon">🔍</div>'
        + '<div class="forum-empty-text">搜索</div>'
        + '<div class="forum-empty-hint">查找推文、话题以及用户</div>'
        + '</div>';
}

function renderForumNotificationsBody() {
    return '<div class="forum-empty">'
        + '<div class="forum-empty-icon">🔔</div>'
        + '<div class="forum-empty-text">暂无通知</div>'
        + '<div class="forum-empty-hint">当有人点赞或评论你的帖子时，你将在这里看到</div>'
        + '</div>';
}

function renderForumMessagesBody() {
    return '<div class="forum-empty">'
        + '<div class="forum-empty-icon">✉️</div>'
        + '<div class="forum-empty-text">私信</div>'
        + '<div class="forum-empty-hint">与你关注的创作者或AI伙伴畅聊</div>'
        + '</div>';
}

// ========== 10. 帖子详情与互动逻辑 (接回评论、点赞功能) ==========
function openForumPost(postId) {
    forumCurrentPostId = postId;
    renderForumApp();
}

function closeForumPostDetail() {
    forumCurrentPostId = null;
    renderForumApp();
}

function renderForumPostDetail(postId) {
    var posts = getForumPosts();
    var post = posts.find(function(p) { return p.id === postId; });
    if (!post) {
        return '<div class="forum-app"><div class="forum-body"><div class="forum-empty">帖子不存在</div></div></div>';
    }

    var comments = getForumComments()[postId] || [];
    var commentsHTML = '';
    comments.forEach(function(c) {
        var cAvatarStyle = c.avatarData ? 'background-image:url(' + c.avatarData + ');' : '';
        commentsHTML += '<div class="forum-post" style="border-bottom: 1px solid #eff3f4; padding-left: 24px;">'
            + '<div class="forum-post-avatar" style="width:32px; height:32px; ' + cAvatarStyle + '"></div>'
            + '<div class="forum-post-body">'
            + '<div class="forum-post-meta" style="font-size:14px;">'
            + '<span class="forum-post-name">' + c.userName + '</span>'
            + '<span class="forum-post-handle">@' + c.userHandle + '</span>'
            + '<span class="forum-post-dot">·</span>'
            + '<span class="forum-post-time">' + getForumRelativeTime(c.time) + '</span>'
            + '</div>'
            + '<div class="forum-post-text" style="font-size:14px; margin-top:4px;">' + c.content + '</div>'
            + '</div>'
            + '</div>';
    });

    var avatarStyle = post.avatarData ? 'background-image:url(' + post.avatarData + ');' : '';

    return '<div class="forum-app">'
        + '<div class="forum-top-bar-container">'
        + '<div class="forum-top-bar">'
        + '<div class="forum-top-more-btn" onclick="closeForumPostDetail()"><svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#0f1419;"><path d="M7.414 13l5.293 5.293-1.414 1.414L3.586 12l7.707-7.707 1.414 1.414L7.414 11H21v2H7.414z"/></svg></div>'
        + '<div class="forum-top-logo" style="font-weight:700;font-size:16px;">帖子</div>'
        + '<div></div>'
        + '</div>'
        + '</div>'
        + '<div class="forum-body" style="padding-bottom:120px;">'
        + '<div class="forum-post" style="border-bottom: 1px solid #eff3f4; cursor:default;">'
        + '<div class="forum-post-avatar" style="' + avatarStyle + '"></div>'
        + '<div class="forum-post-body">'
        + '<div class="forum-post-meta">'
        + '<span class="forum-post-name">' + post.userName + '</span>'
        + '<span class="forum-post-handle">@' + post.userHandle + '</span>'
        + '</div>'
        + '<div class="forum-post-text" style="font-size:18px; margin: 12px 0;">' + post.content + '</div>'
        + '<div class="forum-post-time" style="font-size:13px; color:#536471;">' + new Date(post.time).toLocaleString() + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="forum-comments-section">' + commentsHTML + '</div>'
        + '</div>'
        + '<div class="forum-bottom-bar" style="height:auto; padding: 8px 16px; border-top:1px solid #eff3f4; display:flex; gap:12px; align-items:center;">'
        + '<input type="text" id="forumCommentInput" placeholder="发布你的回复" style="flex:1; border:1px solid #cfd9de; border-radius:9999px; padding:8px 16px; outline:none; font-size:14px;">'
        + '<button onclick="publishForumComment(\'' + post.id + '\')" style="background:#1d9bf0; color:#fff; border:none; padding:6px 16px; border-radius:9999px; font-weight:700; font-size:14px;">回复</button>'
        + '</div>'
        + '</div>';
}

function handleLikePost(postId) {
    var posts = getForumPosts();
    var index = posts.findIndex(function(p) { return p.id === postId; });
    if (index !== -1) {
        posts[index].likes = (posts[index].likes || 0) + 1;
        saveForumPosts(posts);
        renderForumApp();
    }
}

function publishForumComment(postId) {
    var input = document.getElementById('forumCommentInput');
    if (!input || !input.value.trim()) return;
    var text = input.value.trim();

    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var activeMask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; } }
    var userName = activeMask ? activeMask.name : '我';
    var userAvatarData = activeMask && activeMask.avatar ? activeMask.avatar : '';

    var allComments = getForumComments();
    if (!allComments[postId]) allComments[postId] = [];
    allComments[postId].push({
        id: 'c_' + Date.now(),
        userName: userName,
        userHandle: userName,
        avatarData: userAvatarData,
        content: text,
        time: Date.now()
    });
    saveForumComments(allComments);
    renderForumApp();
}

// ========== 11. 发布新推文（面具发帖） ==========
function openForumCompose() {
    var overlay = document.createElement('div');
    overlay.className = 'forum-compose-overlay';
    overlay.id = 'forumComposeOverlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:300;display:flex;align-items:flex-end;';
    
    overlay.innerHTML = ''
        + '<div class="forum-compose-panel" style="width:100%; background:#fff; border-top-left-radius:16px; border-top-right-radius:16px; padding:16px; display:flex; flex-direction:column; gap:12px; box-shadow: 0 -4px 12px rgba(0,0,0,0.1);">'
        + '<div style="display:flex; justify-content:space-between; align-items:center;">'
        + '<span style="font-weight:700; font-size:16px; color:#0f1419;">发布推文</span>'
        + '<span onclick="closeForumCompose()" style="color:#536471; font-size:14px; cursor:pointer;">取消</span>'
        + '</div>'
        + '<textarea class="forum-compose-textarea" id="forumComposeInput" placeholder="有什么新鲜事？" style="width:100%; height:120px; border:none; outline:none; resize:none; font-size:16px; line-height:1.4; color:#0f1419;"></textarea>'
        + '<button class="forum-compose-send" onclick="publishForumPost()" style="background:#1d9bf0; color:#ffffff; border:none; padding:10px; border-radius:9999px; font-weight:700; font-size:15px; cursor:pointer; width:100%;">发布</button>'
        + '</div>';
    
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeForumCompose(); };
}

function closeForumCompose() {
    var overlay = document.getElementById('forumComposeOverlay');
    if (overlay) overlay.remove();
}

function publishForumPost() {
    var input = document.getElementById('forumComposeInput');
    if (!input || !input.value.trim()) return;
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
        avatarData: userAvatarData,
        content: text,
        time: Date.now(),
        likes: 0,
        isUser: true
    });
    saveForumPosts(posts);
    forumCurrentTab = 'home';
    forumCurrentPostId = null;
    renderForumApp();
}

// ========== 12. 刷新功能与 API 动态生成 ==========
let forumIsGenerating = false;
function refreshForum() {
    if (forumIsGenerating) return;
    forumIsGenerating = true;

    var toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.textContent = '正在获取最新动态...';
    document.body.appendChild(toast);

    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.length === 0) {
        toast.remove();
        forumIsGenerating = false;
        return;
    }
    
    var author = contacts[Math.floor(Math.random() * contacts.length)];
    var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(author.id) : '';

    var prompt = '请以' + author.name + '的口吻发一条简短的类似Twitter的动态分享。\n'
        + '【字数要求】20~50字。\n'
        + '【内容】吐槽工作、分享生活的碎碎念、或有趣的想法。语言要现代、网感、口语化，不要老土，绝不能有emoji！\n'
        + '格式：只输出文本，不需要引号。';

    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: systemPrompt || '你是一个在社交媒体发帖的用户。' },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            toast.remove();
            forumIsGenerating = false;
            var clean = reply.replace(/\{[^}]*\}/g, '').trim();
            if (!clean) return;
            var posts = getForumPosts();
            posts.unshift({
                id: 'p_' + Date.now(),
                userName: author.name,
                userHandle: author.name,
                avatarData: author.avatarData || author.avatar,
                content: clean,
                time: Date.now(),
                likes: Math.floor(Math.random() * 50) + 10,
                contactId: author.id
            });
            saveForumPosts(posts);
            renderForumApp();
        }).catch(function() {
            toast.remove();
            forumIsGenerating = false;
        });
    } else {
        toast.remove();
        forumIsGenerating = false;
    }
}

// ========== 13. 时间与头像辅助工具 ==========
function getForumRelativeTime(timestamp) {
    var now = Date.now();
    var diff = now - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    var d = new Date(timestamp);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

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
