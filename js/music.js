/**
 * 玉界 - 音乐
 * 包含：个人主页背景、头像/用户名/听歌时长、最近/本地/导入/歌词、
 *       音乐/漫游/其他 三标签页
 */

// ========== 当前标签 ==========
var musicCurrentTab = 'music';

// ========== 打开音乐软件 ==========
function openMusic() {
    var appWindow = document.getElementById('musicAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'musicAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    renderMusicApp();
    appWindow.style.display = 'flex';
}

function closeMusic() {
    var appWindow = document.getElementById('musicAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 获取用户信息 ==========
function getMusicUserInfo() {
    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var name = '用户';
    var avatar = '';
    if (masks.length > 0) {
        var firstMask = masks[0];
        name = firstMask.name || '用户';
        avatar = firstMask.avatar || '';
    }
    var listenTime = parseInt(localStorage.getItem('music_listen_time') || 0);
    return { name: name, avatar: avatar, listenTime: listenTime };
}

// ========== 格式化听歌时长 ==========
function formatListenTime(seconds) {
    if (seconds < 60) return seconds + '秒';
    if (seconds < 3600) return Math.floor(seconds / 60) + '分钟';
    return Math.floor(seconds / 3600) + '小时';
}

// ========== 渲染音乐应用 ==========
function renderMusicApp() {
    var appWindow = document.getElementById('musicAppWindow');
    if (!appWindow) return;

    var user = getMusicUserInfo();
    var bg = localStorage.getItem('global_chat_bg') || '';
    var bgStyle = bg ? 'background-image:url(' + bg + ');background-size:cover;background-position:center;' : 'background:linear-gradient(180deg, #f2f2f7 0%, #e8e8ed 40%, #dcdce0 100%);';

    appWindow.innerHTML = `
        <div class="music-app">
            <div class="music-top-bar">
                <span class="music-back-btn" onclick="closeMusic()">‹</span>
                <span class="music-top-title">我的</span>
                <span class="music-top-settings" onclick="showToast('设置功能开发中')">&#9881;</span>
            </div>
            <div class="music-body" id="musicBody">
                <div class="music-profile" style="${bgStyle}">
                    <div class="music-avatar-wrap" onclick="changeMusicAvatar()">
                        ${user.avatar ? '<div class="music-avatar" style="background-image:url(' + user.avatar + ');"></div>' : '<div class="music-avatar music-avatar-placeholder">+</div>'}
                    </div>
                    <div class="music-username">${user.name}</div>
                    <div class="music-listen-time">已听 ${formatListenTime(user.listenTime)}</div>
                    <div class="music-func-row">
                        <div class="music-func-item" onclick="showToast('最近播放')">最近</div>
                        <div class="music-func-item" onclick="importLocalMusic()">本地</div>
                        <div class="music-func-item" onclick="showToast('导入歌单')">导入</div>
                        <div class="music-func-item" onclick="showToast('歌词收藏')">歌词</div>
                    </div>
                </div>
                <div class="music-tab-content" id="musicTabContent">
                    ${renderMusicTabContent()}
                </div>
            </div>
            <div class="music-tab-bar">
                <span class="music-tab ${musicCurrentTab === 'music' ? 'active' : ''}" onclick="switchMusicTab('music')">音乐</span>
                <span class="music-tab ${musicCurrentTab === 'roam' ? 'active' : ''}" onclick="switchMusicTab('roam')">漫游</span>
                <span class="music-tab ${musicCurrentTab === 'other' ? 'active' : ''}" onclick="switchMusicTab('other')">其他</span>
            </div>
        </div>
    `;
}

// ========== 渲染标签内容 ==========
function renderMusicTabContent() {
    switch (musicCurrentTab) {
        case 'music':
            return '<div class="music-page"><div class="music-empty">创建或导入歌单后显示</div></div>';
        case 'roam':
            return '<div class="music-page"><div class="music-empty">音乐播放器</div></div>';
        case 'other':
            return '<div class="music-page"><div class="music-empty">角色歌单</div></div>';
        default:
            return '';
    }
}

// ========== 切换标签 ==========
function switchMusicTab(tab) {
    musicCurrentTab = tab;
    var content = document.getElementById('musicTabContent');
    if (content) content.innerHTML = renderMusicTabContent();
    document.querySelectorAll('.music-tab').forEach(function(t) { t.classList.remove('active'); });
    var tabs = document.querySelectorAll('.music-tab');
    var idx = tab === 'music' ? 0 : tab === 'roam' ? 1 : 2;
    if (tabs[idx]) tabs[idx].classList.add('active');
}

// ========== 更换头像 ==========
function changeMusicAvatar() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            localStorage.setItem('music_user_avatar', ev.target.result);
            renderMusicApp();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// ========== 导入本地音乐 ==========
function importLocalMusic() {
    showToast('本地音乐导入功能开发中');
}
