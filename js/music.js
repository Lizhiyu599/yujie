/**
 * 玉界 - 音乐
 * 包含：个人主页背景、头像/用户名/听歌时长、最近/本地/导入/歌词、
 *       音乐/漫游/其他 三标签页、音乐搜索
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
    var avatar = localStorage.getItem('music_user_avatar') || '';
    if (masks.length > 0) {
        var firstMask = masks[0];
        name = firstMask.name || '用户';
        if (!avatar) avatar = firstMask.avatar || '';
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
    var bg = localStorage.getItem('music_bg') || localStorage.getItem('global_chat_bg') || '';
    var bgStyle = bg ? 'background-image:url(' + bg + ');background-size:cover;background-position:center;' : 'background:linear-gradient(180deg, #f2f2f7 0%, #e8e8ed 40%, #dcdce0 100%);';

    appWindow.innerHTML = `
        <div class="music-app">
            <div class="music-top-bar">
                <span class="music-back-btn" onclick="closeMusic()">‹</span>
                <div class="music-top-right">
                    <img src="https://i.ibb.co/391kzWCn/1782720565299.png" class="music-top-icon" onclick="openMusicSearch()">
                    <img src="https://i.ibb.co/d4wqnw27/1782720493497.png" class="music-top-icon" onclick="showToast('设置功能开发中')">
                </div>
            </div>
            <div class="music-body" id="musicBody">
                <div class="music-profile" style="${bgStyle}" onclick="changeMusicBg(event)">
                    <div class="music-avatar-wrap" onclick="changeMusicAvatar(event)">
                        ${user.avatar ? '<div class="music-avatar" style="background-image:url(' + user.avatar + ');"></div>' : '<div class="music-avatar music-avatar-placeholder">+</div>'}
                    </div>
                    <div class="music-username">${user.name}</div>
                    <div class="music-listen-time">已听 ${formatListenTime(user.listenTime)}</div>
                    <div class="music-func-row">
                        <div class="music-func-item" onclick="showToast('最近播放')">最近</div>
                        <div class="music-func-item" onclick="importLocalMusic()">本地</div>
                        <div class="music-func-item" onclick="importMusicUrl()">导入</div>
                        <div class="music-func-item" onclick="showToast('歌词收藏')">歌词</div>
                    </div>
                </div>
                <div class="music-tab-bar">
                    <span class="music-tab ${musicCurrentTab === 'music' ? 'active' : ''}" onclick="switchMusicTab('music')">音乐</span>
                    <span class="music-tab ${musicCurrentTab === 'roam' ? 'active' : ''}" onclick="switchMusicTab('roam')">漫游</span>
                    <span class="music-tab ${musicCurrentTab === 'other' ? 'active' : ''}" onclick="switchMusicTab('other')">其他</span>
                </div>
                <div class="music-tab-content" id="musicTabContent">
                    ${renderMusicTabContent()}
                </div>
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
function changeMusicAvatar(e) {
    e.stopPropagation();
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(ev) {
        var file = ev.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev2) {
            localStorage.setItem('music_user_avatar', ev2.target.result);
            renderMusicApp();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// ========== 更换背景图 ==========
function changeMusicBg(e) {
    if (e.target.closest('.music-avatar-wrap') || e.target.closest('.music-func-item')) return;
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(ev) {
        var file = ev.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev2) {
            localStorage.setItem('music_bg', ev2.target.result);
            renderMusicApp();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// ========== 导入本地音乐 ==========
function importLocalMusic() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.multiple = true;
    input.onchange = function(e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;
        var localSongs = JSON.parse(localStorage.getItem('music_local_songs') || '[]');
        for (var i = 0; i < files.length; i++) {
            (function(file) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    localSongs.push({
                        id: 'local_' + Date.now() + '_' + i,
                        name: file.name.replace(/\.[^.]+$/, ''),
                        src: ev.target.result,
                        type: 'local'
                    });
                    localStorage.setItem('music_local_songs', JSON.stringify(localSongs));
                    if (i === files.length - 1) {
                        showToast('已导入 ' + files.length + ' 首歌');
                    }
                };
                reader.readAsDataURL(file);
            })(files[i]);
        }
    };
    input.click();
}

// ========== 导入音乐URL ==========
function importMusicUrl() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'musicUrlOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">导入音乐</div>
            <input type="text" class="payment-note" id="musicUrlInput" placeholder="粘贴音乐链接">
            <div style="font-size:11px;color:#8e8e93;margin:4px 0 12px;">支持 mp3 / wav / ogg 等音频直链</div>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeMusicUrl()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmMusicUrl()">确定</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeMusicUrl(); };
}

function closeMusicUrl() {
    var o = document.getElementById('musicUrlOverlay');
    if (o) o.remove();
}

function confirmMusicUrl() {
    var input = document.getElementById('musicUrlInput');
    var url = input ? input.value.trim() : '';
    closeMusicUrl();
    if (!url) return;
    var urlSongs = JSON.parse(localStorage.getItem('music_url_songs') || '[]');
    urlSongs.push({
        id: 'url_' + Date.now(),
        name: '在线音乐 ' + (urlSongs.length + 1),
        src: url,
        type: 'url'
    });
    localStorage.setItem('music_url_songs', JSON.stringify(urlSongs));
    showToast('已导入');
}

// ========== 搜索音乐 ==========
function openMusicSearch() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'musicSearchOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">搜索音乐</div>
            <input type="text" class="payment-note" id="musicSearchInput" placeholder="输入歌名">
            <div class="search-result" id="musicSearchResult"></div>
            <div class="caption-buttons" style="margin-top:12px;">
                <div class="payment-btn-cancel" onclick="closeMusicSearch()">取消</div>
                <div class="payment-btn-confirm" onclick="doMusicSearch()">搜索</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeMusicSearch(); };
}

function closeMusicSearch() {
    var o = document.getElementById('musicSearchOverlay');
    if (o) o.remove();
}

async function doMusicSearch() {
    var input = document.getElementById('musicSearchInput');
    var result = document.getElementById('musicSearchResult');
    var query = input ? input.value.trim() : '';
    if (!query) return;
    result.innerHTML = '<div style="color:#8e8e93;">搜索中…</div>';
    try {
        var res = await fetch('https://api.music.imsyy.top/search?keywords=' + encodeURIComponent(query) + '&t=' + Date.now());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        if (data.result && data.result.songs && data.result.songs.length > 0) {
            result.innerHTML = data.result.songs.slice(0, 10).map(function(s) {
                return '<div style="padding:8px 0;border-bottom:0.5px dashed rgba(0,0,0,0.05);cursor:pointer;" onclick="addMusicFromSearch(\'' + s.id + '\',\'' + (s.name || '').replace(/'/g,"\\'") + '\',\'' + (s.artists && s.artists[0] ? s.artists[0].name : '') + '\')">' + s.name + ' - ' + (s.artists && s.artists[0] ? s.artists[0].name : '') + '</div>';
            }).join('');
        } else {
            result.innerHTML = '<div style="color:#8e8e93;">未找到结果</div>';
        }
    } catch(e) {
        result.innerHTML = '<div style="color:#ff3b30;">搜索失败：' + e.message + '</div>';
    }
}

function addMusicFromSearch(id, name, artist) {
    var songs = JSON.parse(localStorage.getItem('music_url_songs') || '[]');
    songs.push({
        id: 'api_' + id,
        name: name + ' - ' + artist,
        src: '',
        apiId: id,
        type: 'api'
    });
    localStorage.setItem('music_url_songs', JSON.stringify(songs));
    showToast('已添加到歌单');
}
