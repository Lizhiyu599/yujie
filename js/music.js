/**
 * 玉界 - 音乐
 * 包含：个人主页背景、头像/用户名/听歌时长、最近/本地/导入/歌词、
 *       音乐/漫游/其他 三标签页、歌单系统
 */

// ========== 当前标签 ==========
var musicCurrentTab = 'music';
var musicCurrentPlaylist = null; // 当前查看的歌单

// ========== 歌单数据 ==========
function getPlaylists() {
    var raw = localStorage.getItem('music_playlists');
    if (raw) return JSON.parse(raw);
    return [{ id: 'all', name: '全部音乐', songs: [] }];
}

function savePlaylists(playlists) {
    localStorage.setItem('music_playlists', JSON.stringify(playlists));
}

function addSongToPlaylist(playlistId, song) {
    var playlists = getPlaylists();
    // 加到全部音乐
    var all = playlists.find(function(p) { return p.id === 'all'; });
    if (all) all.songs.push(song);
    // 加到指定歌单
    if (playlistId !== 'all') {
        var target = playlists.find(function(p) { return p.id === playlistId; });
        if (target) target.songs.push(song);
    }
    savePlaylists(playlists);
}

// ========== 打开音乐软件 ==========
function openMusic() {
    var appWindow = document.getElementById('musicAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'musicAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    musicCurrentPlaylist = null;
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
    if (musicCurrentPlaylist) {
        return renderPlaylistSongs(musicCurrentPlaylist);
    }
    switch (musicCurrentTab) {
        case 'music':
            return renderPlaylistList();
        case 'roam':
            return '<div class="music-page"><div class="music-empty">音乐播放器</div></div>';
        case 'other':
            return '<div class="music-page"><div class="music-empty">角色歌单</div></div>';
        default:
            return '';
    }
}

// ========== 歌单列表 ==========
function renderPlaylistList() {
    var playlists = getPlaylists();
    var html = '<div class="music-page"><div class="music-section-title">歌单</div>';
    if (playlists.length === 0) {
        html += '<div class="music-empty">暂无歌单</div>';
    } else {
        playlists.forEach(function(p) {
            html += '<div class="music-playlist-item" onclick="openPlaylist(\'' + p.id + '\')"><div class="music-playlist-cover"></div><div class="music-playlist-info"><div class="music-playlist-name">' + p.name + '</div><div class="music-playlist-count">' + p.songs.length + '首</div></div></div>';
        });
    }
    html += '<div class="music-create-btn" onclick="createPlaylist()">+ 新建歌单</div></div>';
    return html;
}

function openPlaylist(id) {
    musicCurrentPlaylist = id;
    var content = document.getElementById('musicTabContent');
    if (content) content.innerHTML = renderPlaylistSongs(id);
}

function backToPlaylistList() {
    musicCurrentPlaylist = null;
    var content = document.getElementById('musicTabContent');
    if (content) content.innerHTML = renderPlaylistList();
}

function renderPlaylistSongs(id) {
    var playlists = getPlaylists();
    var pl = playlists.find(function(p) { return p.id === id; });
    if (!pl) return '';
    var html = '<div class="music-page"><div class="music-playlist-header"><span onclick="backToPlaylistList()">‹ 返回</span><span>' + pl.name + '</span></div>';
    if (pl.songs.length === 0) {
        html += '<div class="music-empty">暂无歌曲</div>';
    } else {
        pl.songs.forEach(function(s, i) {
            html += '<div class="music-song-item"><div class="music-song-index">' + (i + 1) + '</div><div class="music-song-info"><div class="music-song-name">' + s.name + '</div></div></div>';
        });
    }
    html += '</div>';
    return html;
}

// ========== 创建歌单 ==========
function createPlaylist() {
    var name = prompt('请输入歌单名称：');
    if (!name || !name.trim()) return;
    var playlists = getPlaylists();
    playlists.push({ id: 'pl_' + Date.now(), name: name.trim(), songs: [] });
    savePlaylists(playlists);
    var content = document.getElementById('musicTabContent');
    if (content) content.innerHTML = renderPlaylistList();
}

// ========== 切换标签 ==========
function switchMusicTab(tab) {
    musicCurrentTab = tab;
    musicCurrentPlaylist = null;
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
        showPlaylistPicker(function(playlistId) {
            for (var i = 0; i < files.length; i++) {
                (function(file) {
                    var reader = new FileReader();
                    reader.onload = function(ev) {
                        addSongToPlaylist(playlistId, {
                            id: 'local_' + Date.now() + '_' + i,
                            name: file.name.replace(/\.[^.]+$/, ''),
                            src: ev.target.result,
                            type: 'local'
                        });
                        if (i === files.length - 1) {
                            showToast('已导入 ' + files.length + ' 首歌');
                            refreshMusicContent();
                        }
                    };
                    reader.readAsDataURL(file);
                })(files[i]);
            }
        });
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
    showPlaylistPicker(function(playlistId) {
        addSongToPlaylist(playlistId, {
            id: 'url_' + Date.now(),
            name: '在线音乐 ' + (getPlaylists().find(function(p){return p.id===playlistId;}) ? getPlaylists().find(function(p){return p.id===playlistId;}).songs.length + 1 : 1),
            src: url,
            type: 'url'
        });
        showToast('已导入');
        refreshMusicContent();
    });
}

// ========== 歌单选择器 ==========
function showPlaylistPicker(callback) {
    var playlists = getPlaylists();
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'playlistPickerOverlay';
    var listHTML = playlists.map(function(p) {
        return '<div class="music-playlist-option" onclick="selectPlaylist(\'' + p.id + '\')">' + p.name + '</div>';
    }).join('');
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">选择歌单</div>
            ${listHTML}
            <div class="caption-buttons" style="margin-top:12px;">
                <div class="payment-btn-cancel" onclick="closePlaylistPicker()">取消</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePlaylistPicker(); };
    window._playlistCallback = callback;
}

function selectPlaylist(id) {
    closePlaylistPicker();
    if (window._playlistCallback) window._playlistCallback(id);
}

function closePlaylistPicker() {
    var o = document.getElementById('playlistPickerOverlay');
    if (o) o.remove();
    window._playlistCallback = null;
}

function refreshMusicContent() {
    var content = document.getElementById('musicTabContent');
    if (content) content.innerHTML = renderMusicTabContent(); 
}
