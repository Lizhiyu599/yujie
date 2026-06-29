/**
 * 玉界 - 音乐
 * 包含：个人主页背景、头像/用户名/听歌时长、最近/本地/导入/歌词、
 *       音乐/漫游/其他 三标签页、歌单系统、全屏歌单详情、胶囊播放器、
 *       歌曲菜单（下一首播放/编辑歌手/分享/删除）、播放队列
 */

var musicCurrentTab = 'music';
var musicCurrentPlaylist = null;
var musicCurrentSong = null;
var musicAudio = null;
var musicVinylAngle = 0;
var musicVinylTimer = null;
var musicMenuSongId = null;
var musicQueue = [];

function getPlaylists() {
    var raw = localStorage.getItem('music_playlists');
    if (raw) return JSON.parse(raw);
    return [{ id: 'all', name: '全部音乐', songs: [], playCount: 0, cover: '' }];
}

function savePlaylists(playlists) {
    localStorage.setItem('music_playlists', JSON.stringify(playlists));
}

function addSongToPlaylist(playlistId, song) {
    var playlists = getPlaylists();
    var all = playlists.find(function(p) { return p.id === 'all'; });
    if (all) all.songs.push(song);
    if (playlistId !== 'all') {
        var target = playlists.find(function(p) { return p.id === playlistId; });
        if (target) target.songs.push(song);
    }
    savePlaylists(playlists);
}

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
    stopMusic();
    var appWindow = document.getElementById('musicAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

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

function formatListenTime(seconds) {
    if (seconds < 60) return seconds + '秒';
    if (seconds < 3600) return Math.floor(seconds / 60) + '分钟';
    return Math.floor(seconds / 3600) + '小时';
}

function renderMusicApp() {
    var appWindow = document.getElementById('musicAppWindow');
    if (!appWindow) return;
    var user = getMusicUserInfo();
    var bg = localStorage.getItem('music_bg') || localStorage.getItem('global_chat_bg') || '';
    var bgStyle = bg ? 'background-image:url(' + bg + ');background-size:cover;background-position:center;' : 'background:linear-gradient(180deg, #f2f2f7 0%, #e8e8ed 40%, #dcdce0 100%);';

    if (musicCurrentPlaylist) {
        renderPlaylistFullScreen(appWindow);
        return;
    }

    appWindow.innerHTML = ''
        + '<div class="music-app">'
        + '<div class="music-top-bar"><span class="music-back-btn" onclick="closeMusic()">‹</span><div class="music-top-right"><img src="https://i.ibb.co/d4wqnw27/1782720493497.png" class="music-top-icon" onclick="showToast(\'设置功能开发中\')"></div></div>'
        + '<div class="music-body" id="musicBody">'
        + '<div class="music-profile" style="' + bgStyle + '" onclick="changeMusicBg(event)">'
        + '<div class="music-avatar-wrap" onclick="changeMusicAvatar(event)">' + (user.avatar ? '<div class="music-avatar" style="background-image:url(' + user.avatar + ');"></div>' : '<div class="music-avatar music-avatar-placeholder">+</div>') + '</div>'
        + '<div class="music-username">' + user.name + '</div>'
        + '<div class="music-listen-time">已听 ' + formatListenTime(user.listenTime) + '</div>'
        + '<div class="music-func-row"><div class="music-func-item" onclick="showToast(\'最近播放\')">最近</div><div class="music-func-item" onclick="importLocalMusic()">本地</div><div class="music-func-item" onclick="importMusicUrl()">导入</div><div class="music-func-item" onclick="showToast(\'歌词收藏\')">歌词</div></div>'
        + '</div>'
        + '<div class="music-tab-bar"><span class="music-tab ' + (musicCurrentTab === 'music' ? 'active' : '') + '" onclick="switchMusicTab(\'music\')">音乐</span><span class="music-tab ' + (musicCurrentTab === 'roam' ? 'active' : '') + '" onclick="switchMusicTab(\'roam\')">漫游</span><span class="music-tab ' + (musicCurrentTab === 'other' ? 'active' : '') + '" onclick="switchMusicTab(\'other\')">其他</span></div>'
        + '<div class="music-tab-content" id="musicTabContent">' + renderMusicTabContent() + '</div>'
        + '</div></div>';
    
    setTimeout(function() { renderMiniPlayer(appWindow); }, 100);
}

function renderPlaylistFullScreen(appWindow) {
    var playlists = getPlaylists();
    var pl = playlists.find(function(p) { return p.id === musicCurrentPlaylist; });
    if (!pl) { backToPlaylistList(); return; }
    var user = getMusicUserInfo();
    var cover = pl.cover || '';

    var songsHTML = '';
    if (pl.songs.length === 0) {
        songsHTML = '<div class="music-empty">暂无歌曲</div>';
    } else {
        pl.songs.forEach(function(s, i) {
            var isActive = musicCurrentSong && musicCurrentSong.id === s.id;
            var artist = s.artist || '未知歌手';
            songsHTML += ''
                + '<div class="music-song-item' + (isActive ? ' active' : '') + '" onclick="playSong(\'' + s.id + '\')">'
                + '<div class="music-song-cover"><div class="music-vinyl-disc small' + (isActive ? ' spinning' : '') + '"></div></div>'
                + '<div class="music-song-info">'
                + '<div class="music-song-name">' + s.name + '</div>'
                + '<div class="music-song-artist">' + artist + '</div>'
                + '</div>'
                + '<div class="music-song-more" onclick="event.stopPropagation();showSongMenu(\'' + s.id + '\')"><span class="music-dot"></span><span class="music-dot"></span><span class="music-dot"></span></div>'
                + '</div>';
        });
    }

    appWindow.innerHTML = ''
        + '<div class="music-app">'
        + '<div class="music-detail-full">'
        + '<div class="music-detail-header"><span class="music-detail-back" onclick="backToPlaylistList()">‹</span><span class="music-detail-title">歌单</span></div>'
        + '<div class="music-detail-info">'
        + '<div class="music-detail-cover" onclick="changePlaylistCover(\'' + musicCurrentPlaylist + '\')" style="' + (cover ? 'background-image:url(' + cover + ');' : '') + '">' + (cover ? '' : '<span style="color:rgba(0,0,0,0.2);font-size:13px;">封面</span>') + '</div>'
        + '<div class="music-detail-meta"><div class="music-detail-name">' + pl.name + '</div><div class="music-detail-sub">' + user.name + ' · 播放' + (pl.playCount || 0) + '次</div></div>'
        + '</div>'
        + '<div class="music-detail-songs">' + songsHTML + '</div>'
        + '</div></div>';
    
    setTimeout(function() { renderMiniPlayer(appWindow); }, 100);
}

function renderMiniPlayer(appWindow) {
    var existing = appWindow.querySelector('.music-mini-player');
    if (existing) existing.remove();
    if (!musicCurrentSong) return;
    
    var player = document.createElement('div');
    player.className = 'music-mini-player';
    var isPlaying = musicAudio && !musicAudio.paused;
    var artist = musicCurrentSong.artist || '未知歌手';
    player.innerHTML = ''
        + '<div class="music-mini-cover" onclick="togglePlay()"><div class="music-vinyl-disc mini' + (isPlaying ? ' spinning' : '') + '"></div></div>'
        + '<div class="music-mini-info">'
        + '<div class="music-mini-name">' + musicCurrentSong.name + '</div>'
        + '<div class="music-mini-artist">' + artist + '</div>'
        + '</div>'
        + '<div class="music-mini-controls">'
        + '<span class="music-mini-btn" onclick="togglePlay()"><span class="music-play-icon ' + (isPlaying ? 'pause' : 'play') + '"></span></span>'
        + '</div>';
    player.onclick = function(e) { if (!e.target.closest('.music-mini-btn')) showToast(musicCurrentSong.name); };
    appWindow.appendChild(player);
}

function startVinylSpin() {
    if (musicVinylTimer) return;
    musicVinylTimer = setInterval(function() {
        musicVinylAngle += 2;
        var discs = document.querySelectorAll('.music-vinyl-disc.spinning');
        discs.forEach(function(d) { d.style.transform = 'rotate(' + musicVinylAngle + 'deg)'; });
    }, 30);
}

function stopVinylSpin() {
    if (musicVinylTimer) { clearInterval(musicVinylTimer); musicVinylTimer = null; }
}

function playSong(songId) {
    var playlists = getPlaylists();
    var song = null;
    playlists.forEach(function(p) {
        var found = p.songs.find(function(s) { return s.id === songId; });
        if (found) song = found;
    });
    if (!song) return;
    
    musicCurrentSong = song;
    if (musicAudio) { musicAudio.pause(); musicAudio = null; }
    stopVinylSpin();
    
    if (song.src) {
        musicAudio = new Audio(song.src);
        musicAudio.play().catch(function() { showToast('播放失败'); stopVinylSpin(); });
        musicAudio.addEventListener('ended', function() {
            if (musicQueue.length > 0) {
                var next = musicQueue.shift();
                playSong(next.id);
            } else {
                musicCurrentSong = null;
                stopVinylSpin();
                refreshMusicContent();
            }
        });
        startVinylSpin();
    } else {
        showToast('无法播放此歌曲');
    }
    
    refreshMusicContent();
}

function togglePlay() {
    if (!musicAudio) return;
    if (musicAudio.paused) { musicAudio.play(); startVinylSpin(); } 
    else { musicAudio.pause(); stopVinylSpin(); }
    refreshMusicContent();
}

function stopMusic() {
    if (musicAudio) { musicAudio.pause(); musicAudio = null; }
    stopVinylSpin();
    musicCurrentSong = null;
    musicQueue = [];
}

function renderMusicTabContent() {
    switch (musicCurrentTab) {
        case 'music': return renderPlaylistList();
        case 'roam': return '<div class="music-page"><div class="music-empty">音乐播放器</div></div>';
        case 'other': return '<div class="music-page"><div class="music-empty">角色歌单</div></div>';
        default: return '';
    }
}

function renderPlaylistList() {
    var playlists = getPlaylists();
    var html = '<div class="music-page"><div class="music-section-title">歌单</div>';
    playlists.forEach(function(p) {
        html += '<div class="music-playlist-item" onclick="openPlaylist(\'' + p.id + '\')"><div class="music-playlist-cover">' + (p.cover ? '<div style="background-image:url(' + p.cover + ');background-size:cover;background-position:center;width:100%;height:100%;border-radius:8px;"></div>' : '<span style="color:rgba(0,0,0,0.2);font-size:12px;">封面</span>') + '</div><div class="music-playlist-info"><div class="music-playlist-name">' + p.name + '</div><div class="music-playlist-count">' + p.songs.length + '首</div></div></div>';
    });
    html += '<div class="music-create-btn" onclick="createPlaylist()">+ 新建歌单</div></div>';
    return html;
}

function openPlaylist(id) {
    musicCurrentPlaylist = id;
    var appWindow = document.getElementById('musicAppWindow');
    if (appWindow) renderPlaylistFullScreen(appWindow);
}

function backToPlaylistList() {
    musicCurrentPlaylist = null;
    renderMusicApp();
}

function createPlaylist() {
    var name = prompt('请输入歌单名称：');
    if (!name || !name.trim()) return;
    var playlists = getPlaylists();
    playlists.push({ id: 'pl_' + Date.now(), name: name.trim(), songs: [], playCount: 0, cover: '' });
    savePlaylists(playlists);
    var content = document.getElementById('musicTabContent');
    if (content) content.innerHTML = renderPlaylistList();
}

function changePlaylistCover(id) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var MAX_WIDTH = 300;
                var MAX_HEIGHT = 300;
                var width = img.width;
                var height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                var compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                var playlists = getPlaylists();
                var pl = playlists.find(function(p) { return p.id === id; });
                if (pl) { pl.cover = compressedBase64; savePlaylists(playlists); }
                var coverDiv = document.querySelector('.music-detail-cover');
                if (coverDiv) {
                    coverDiv.style.backgroundImage = 'url(' + compressedBase64 + ')';
                    coverDiv.style.backgroundSize = 'cover';
                    coverDiv.style.backgroundPosition = 'center';
                    coverDiv.innerHTML = '';
                }
                setTimeout(function() {
                    var appWindow = document.getElementById('musicAppWindow');
                    if (appWindow) { musicCurrentPlaylist = id; renderPlaylistFullScreen(appWindow); }
                }, 50);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

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

function changeMusicAvatar(e) {
    e.stopPropagation();
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(ev) {
        var file = ev.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev2) { localStorage.setItem('music_user_avatar', ev2.target.result); renderMusicApp(); };
        reader.readAsDataURL(file);
    };
    input.click();
}

function changeMusicBg(e) {
    if (e.target.closest('.music-avatar-wrap') || e.target.closest('.music-func-item')) return;
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(ev) {
        var file = ev.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev2) { localStorage.setItem('music_bg', ev2.target.result); renderMusicApp(); };
        reader.readAsDataURL(file);
    };
    input.click();
}

function importLocalMusic() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*,.mp3,.wav,.ogg,.flac,.m4a';
    input.multiple = true;
    input.onchange = function(e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;
        for (var i = 0; i < files.length; i++) {
            var url = URL.createObjectURL(files[i]);
            addSongToPlaylist('all', { id: 'local_' + Date.now() + '_' + i, name: files[i].name.replace(/\.[^.]+$/, ''), src: url, type: 'local', artist: '本地音乐' });
        }
        showToast('已导入 ' + files.length + ' 首歌');
        refreshMusicContent();
    };
    input.click();
}

function importMusicUrl() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'musicUrlOverlay';
    overlay.innerHTML = '<div class="caption-modal"><div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">导入音乐</div><input type="text" class="payment-note" id="musicUrlInput" placeholder="粘贴音乐链接"><div style="font-size:11px;color:#8e8e93;margin:4px 0 12px;">支持 mp3 / wav / ogg 等音频直链</div><div class="caption-buttons"><div class="payment-btn-cancel" onclick="closeMusicUrl()">取消</div><div class="payment-btn-confirm" onclick="confirmMusicUrl()">确定</div></div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeMusicUrl(); };
}

function closeMusicUrl() { var o = document.getElementById('musicUrlOverlay'); if (o) o.remove(); }

function confirmMusicUrl() {
    var input = document.getElementById('musicUrlInput');
    var url = input ? input.value.trim() : '';
    closeMusicUrl();
    if (!url) return;
    var playlists = getPlaylists(); var pl = playlists.find(function(p) { return p.id === 'all' }); var count = pl ? pl.songs.length + 1 : 1;
    addSongToPlaylist('all', { id: 'url_' + Date.now(), name: '在线音乐 ' + count, src: url, type: 'url', artist: '在线音乐' });
    showToast('已导入'); refreshMusicContent();
}

function refreshMusicContent() {
    if (musicCurrentPlaylist) { var appWindow = document.getElementById('musicAppWindow'); if (appWindow) renderPlaylistFullScreen(appWindow); }
    else { var content = document.getElementById('musicTabContent'); if (content) content.innerHTML = renderMusicTabContent(); }
}

// ========== 歌曲菜单 ==========
function showSongMenu(songId) {
    musicMenuSongId = songId;
    var overlay = document.createElement('div');
    overlay.className = 'music-menu-overlay';
    overlay.id = 'musicMenuOverlay';
    overlay.innerHTML = ''
        + '<div class="music-menu-panel" onclick="event.stopPropagation()">'
        + '<div class="music-menu-handle"></div>'
        + '<div class="music-menu-item" onclick="queueNextSong()">'
        + '<img src="https://i.ibb.co/sJH89rWN/1782732005182.png" class="music-menu-icon">'
        + '<span>下一首播放</span>'
        + '</div>'
        + '<div class="music-menu-item" onclick="editSongArtist()">'
        + '<img src="https://i.ibb.co/sdMqx2R0/1782732122983.png" class="music-menu-icon">'
        + '<span>歌手：未知歌手</span>'
        + '</div>'
        + '<div class="music-menu-item" onclick="shareSongToChar()">'
        + '<img src="https://i.ibb.co/nMXjFKSx/1782732081584.png" class="music-menu-icon">'
        + '<span>分享</span>'
        + '</div>'
        + '<div class="music-menu-item" onclick="deleteSongConfirm()">'
        + '<img src="https://i.ibb.co/h1M6LCrj/1782732044417.png" class="music-menu-icon">'
        + '<span>删除</span>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeSongMenu(); };
    updateSongMenuArtist();
}

function updateSongMenuArtist() {
    if (!musicMenuSongId) return;
    var playlists = getPlaylists();
    var song = null;
    playlists.forEach(function(p) {
        var found = p.songs.find(function(s) { return s.id === musicMenuSongId; });
        if (found) song = found;
    });
    if (song) {
        var artistEl = document.querySelector('.music-menu-item:nth-child(3) span');
        if (artistEl) artistEl.textContent = '歌手：' + (song.artist || '未知歌手');
    }
}

function closeSongMenu() {
    var o = document.getElementById('musicMenuOverlay');
    if (o) o.remove();
    musicMenuSongId = null;
}

function queueNextSong() {
    if (!musicMenuSongId) return;
    var playlists = getPlaylists();
    var song = null;
    playlists.forEach(function(p) {
        var found = p.songs.find(function(s) { return s.id === musicMenuSongId; });
        if (found) song = found;
    });
    if (song) { musicQueue.push(song); showToast('已加入下一首播放'); }
    closeSongMenu();
}

function editSongArtist() {
    var playlists = getPlaylists();
    var song = null;
    playlists.forEach(function(p) {
        var found = p.songs.find(function(s) { return s.id === musicMenuSongId; });
        if (found) song = found;
    });
    if (!song) { closeSongMenu(); return; }
    
    closeSongMenu();
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'editArtistOverlay';
    overlay.innerHTML = ''
        + '<div class="caption-modal">'
        + '<div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">编辑歌手</div>'
        + '<input type="text" class="payment-note" id="editArtistInput" placeholder="输入歌手名称" value="' + (song.artist || '') + '">'
        + '<div class="caption-buttons">'
        + '<div class="payment-btn-cancel" onclick="closeEditArtist()">取消</div>'
        + '<div class="payment-btn-confirm" onclick="confirmEditArtist()">确定</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeEditArtist(); };
}

function closeEditArtist() { var o = document.getElementById('editArtistOverlay'); if (o) o.remove(); }

function confirmEditArtist() {
    var input = document.getElementById('editArtistInput');
    var newArtist = input ? input.value.trim() : '';
    closeEditArtist();
    if (!newArtist || !musicMenuSongId) return;
    var playlists = getPlaylists();
    playlists.forEach(function(p) {
        var song = p.songs.find(function(s) { return s.id === musicMenuSongId; });
        if (song) song.artist = newArtist;
    });
    savePlaylists(playlists);
    refreshMusicContent();
}

function shareSongToChar() {
    if (!musicMenuSongId) return;
    var playlists = getPlaylists();
    var song = null;
    playlists.forEach(function(p) {
        var found = p.songs.find(function(s) { return s.id === musicMenuSongId; });
        if (found) song = found;
    });
    if (!song) { closeSongMenu(); return; }
    closeSongMenu();
    var contactId = window.ChatState && window.ChatState.currentContactId;
    if (!contactId) {
        showToast('请先打开一个聊天窗口');
        return;
    }
    var shareText = '（分享了一首歌：' + song.name + ' - ' + (song.artist || '未知歌手') + '）';
    if (typeof appendMessage === 'function') {
        appendMessage('narration', shareText);
    }
    showToast('已分享给角色');
}

function deleteSongConfirm() {
    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'deleteSongOverlay';
    overlay.innerHTML = ''
        + '<div class="confirm-dialog">'
        + '<p>确认删除当前音乐？</p>'
        + '<div class="confirm-buttons">'
        + '<div class="confirm-btn-cancel" onclick="cancelDeleteSong()">取消</div>'
        + '<div class="confirm-btn-delete" onclick="confirmDeleteSong()">确定</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
}

function cancelDeleteSong() {
    var o = document.getElementById('deleteSongOverlay');
    if (o) o.remove();
}

function confirmDeleteSong() {
    var o = document.getElementById('deleteSongOverlay');
    if (o) o.remove();
    var songId = musicMenuSongId;
    musicMenuSongId = null;
    if (!songId) return;
    var playlists = getPlaylists();
    playlists.forEach(function(p) {
        p.songs = p.songs.filter(function(s) { return s.id !== songId; });
    });
    savePlaylists(playlists);
    showToast('已删除');
    refreshMusicContent();
}
