/**
 * 玉界 - 音乐
 * 包含：个人主页背景、头像/用户名、最近/本地/导入/歌词、
 *       音乐/漫游/其他 三标签页、歌单系统、全屏歌单详情、胶囊播放器、
 *       全屏播放页（唱片+唱针+进度条+控制按钮+三点菜单）、歌曲菜单、
 *       IndexedDB 本地音乐持久存储、全局背景图设置
 */

var musicCurrentTab = 'music';
var musicCurrentPlaylist = null;
var musicCurrentSong = null;
var musicAudio = null;
var musicVinylAngle = 0;
var musicVinylTimer = null;
var musicMenuSongId = null;
var musicQueue = [];

// ========== IndexedDB ==========
var musicDB = null;
function openMusicDB(callback) {
    if (musicDB) { callback(musicDB); return; }
    var request = indexedDB.open('YujieMusic', 1);
    request.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('songs')) {
            db.createObjectStore('songs', { keyPath: 'id' });
        }
    };
    request.onsuccess = function(e) {
        musicDB = e.target.result;
        callback(musicDB);
    };
}

function saveSongToDB(song) {
    openMusicDB(function(db) {
        var tx = db.transaction('songs', 'readwrite');
        tx.objectStore('songs').put(song);
    });
}

function loadSongFromDB(id, callback) {
    openMusicDB(function(db) {
        var tx = db.transaction('songs', 'readonly');
        var req = tx.objectStore('songs').get(id);
        req.onsuccess = function() { callback(req.result); };
        req.onerror = function() { callback(null); };
    });
}

function deleteSongFromDB(id) {
    openMusicDB(function(db) {
        var tx = db.transaction('songs', 'readwrite');
        tx.objectStore('songs').delete(id);
    });
}

// ========== 歌单数据 ==========
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

// ========== 打开/关闭 ==========
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
    return { name: name, avatar: avatar };
}

// ========== 渲染主页 ==========
function renderMusicApp() {
    var appWindow = document.getElementById('musicAppWindow');
    if (!appWindow) return;
    var user = getMusicUserInfo();
    var bg = localStorage.getItem('music_bg') || localStorage.getItem('global_chat_bg') || '';
    var bgStyle = bg ? 'background-image:url(' + bg + ');background-size:cover;background-position:center;' : 'background:linear-gradient(180deg, #f2f2f7 0%, #e8e8ed 40%, #dcdce0 100%);';

    if (musicCurrentPlaylist && !document.querySelector('.music-player-full')) {
        renderPlaylistFullScreen(appWindow);
        return;
    }

    appWindow.innerHTML = ''
        + '<div class="music-app" style="' + bgStyle + '">'
        + '<div class="music-top-bar"><span class="music-back-btn" onclick="closeMusic()">‹</span><div class="music-top-right"><img src="https://i.ibb.co/d4wqnw27/1782720493497.png" class="music-top-icon" onclick="openMusicSettings()"></div></div>'
        + '<div class="music-body" id="musicBody" style="background:transparent;">'
        + '<div class="music-profile">'
        + '<div class="music-avatar-wrap" onclick="changeMusicAvatar(event)">' + (user.avatar ? '<div class="music-avatar" style="background-image:url(' + user.avatar + ');"></div>' : '<div class="music-avatar music-avatar-placeholder">+</div>') + '</div>'
        + '<div class="music-username">' + user.name + '</div>'
        + '<div class="music-func-row"><div class="music-func-item" onclick="showToast(\'最近播放\')">最近</div><div class="music-func-item" onclick="importLocalMusic()">本地</div><div class="music-func-item" onclick="importMusicUrl()">导入</div><div class="music-func-item" onclick="showToast(\'歌词收藏\')">歌词</div></div>'
        + '</div>'
        + '<div class="music-tab-bar"><span class="music-tab ' + (musicCurrentTab === 'music' ? 'active' : '') + '" onclick="switchMusicTab(\'music\')">音乐</span><span class="music-tab ' + (musicCurrentTab === 'roam' ? 'active' : '') + '" onclick="switchMusicTab(\'roam\')">漫游</span><span class="music-tab ' + (musicCurrentTab === 'other' ? 'active' : '') + '" onclick="switchMusicTab(\'other\')">其他</span></div>'
        + '<div class="music-tab-content" id="musicTabContent">' + renderMusicTabContent() + '</div>'
        + '</div></div>';
    
    setTimeout(function() { renderMiniPlayer(appWindow); }, 100);
}
        
// ========== 全屏歌单 ==========
function renderPlaylistFullScreen(appWindow) {
    var playlists = getPlaylists();
    var pl = playlists.find(function(p) { return p.id === musicCurrentPlaylist; });
    if (!pl) { backToPlaylistList(); return; }
    var user = getMusicUserInfo();
    var cover = pl.cover || '';
    var bg = localStorage.getItem('music_bg') || localStorage.getItem('global_chat_bg') || '';
    var bgStyle = bg ? 'background-image:url(' + bg + ');background-size:cover;background-position:center;' : '';

    var songsHTML = '';
    if (pl.songs.length === 0) {
        songsHTML = '<div class="music-empty">暂无歌曲</div>';
    } else {
        pl.songs.forEach(function(s, i) {
            var isActive = musicCurrentSong && musicCurrentSong.id === s.id;
            var artist = s.artist || '未知歌手';
            var coverHTML = s.cover 
    ? '<div class="music-song-cover-img' + (isActive ? ' spinning-vinyl' : '') + '" style="background-image:url(' + s.cover + ');"></div>'
    : '<div class="music-vinyl-disc small' + (isActive ? ' spinning' : '') + '"></div>';
    songsHTML += ''
    + '<div class="music-song-item' + (isActive ? ' active' : '') + '" onclick="playSong(\'' + s.id + '\')">'
    + '<div class="music-song-cover">' + coverHTML + '</div>'
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
        + '<div class="music-detail-full" style="' + bgStyle + '">'
        + '<div class="music-detail-header"><span class="music-detail-back" onclick="backToPlaylistList()">‹</span><span class="music-detail-title">歌单</span></div>'
        + '<div class="music-detail-info">'
        + '<div class="music-detail-cover" onclick="changePlaylistCover(\'' + musicCurrentPlaylist + '\')" style="' + (cover ? 'background-image:url(' + cover + ');' : '') + '">' + (cover ? '' : '<span style="color:rgba(0,0,0,0.2);font-size:13px;">封面</span>') + '</div>'
        + '<div class="music-detail-meta"><div class="music-detail-name">' + pl.name + '</div><div class="music-detail-sub">' + user.name + ' · 播放' + (pl.playCount || 0) + '次</div></div>'
        + '</div>'
        + '<div class="music-detail-songs">' + songsHTML + '</div>'
        + '</div></div>';
    
    setTimeout(function() { renderMiniPlayer(appWindow); }, 100);
}

// ========== 胶囊播放器 ==========
function renderMiniPlayer(appWindow) {
    var existing = appWindow.querySelector('.music-mini-player');
    if (existing) existing.remove();
    if (!musicCurrentSong) return;
    
    var player = document.createElement('div');
    player.className = 'music-mini-player';
    var isPlaying = musicAudio && !musicAudio.paused;
    var artist = musicCurrentSong.artist || '未知歌手';
    player.innerHTML = ''
        + '<div class="music-mini-cover" onclick="togglePlay()">' + (musicCurrentSong.cover ? '<div class="music-mini-cover-img' + (isPlaying ? ' spinning' : '') + '" style="background-image:url(' + musicCurrentSong.cover + ');"></div>' : '<div class="music-vinyl-disc mini' + (isPlaying ? ' spinning' : '') + '"></div>') + '</div>'
        + '<div class="music-mini-info">'
        + '<div class="music-mini-name">' + musicCurrentSong.name + '</div>'
        + '<div class="music-mini-artist">' + artist + '</div>'
        + '</div>'
        + '<div class="music-mini-controls">'
        + '<span class="music-mini-btn" onclick="togglePlay()"><img src="' + (isPlaying ? 'https://i.ibb.co/Zp55DJRb/1782732252446.png' : 'https://i.ibb.co/gMth6r2K/1782732345219.png') + '" class="music-play-icon-img"></span>'
        + '</div>';
    player.onclick = function(e) { if (!e.target.closest('.music-mini-btn')) openPlayerFullScreen(); };
    appWindow.appendChild(player);
}

// ========== 全屏播放页 ==========
function openPlayerFullScreen() {
    if (!musicCurrentSong) return;
    var appWindow = document.getElementById('musicAppWindow');
    if (!appWindow) return;
    renderPlayerFullScreen(appWindow);
}

function renderPlayerFullScreen(appWindow) {
    if (!musicCurrentSong) return;
    var existingPlayer = appWindow.querySelector('.music-mini-player');
    if (existingPlayer) existingPlayer.remove();
    if (window._playerTimer) clearInterval(window._playerTimer);

    var isPlaying = musicAudio && !musicAudio.paused;
    var artist = musicCurrentSong.artist || '未知歌手';
    var currentTime = musicAudio ? formatMusicTime(musicAudio.currentTime) : '00:00';
    var duration = musicAudio && musicAudio.duration ? formatMusicTime(musicAudio.duration) : '00:00';
    var progress = musicAudio && musicAudio.duration ? (musicAudio.currentTime / musicAudio.duration * 100) : 0;

    appWindow.innerHTML = ''
        + '<div class="music-app">'
        + '<div class="music-player-full">'
        + '<div class="music-player-header" style="padding-top:48px;">'
+ '<span class="music-detail-back" onclick="backToPlaylistFromPlayer()">‹</span>'
+ '<span class="music-detail-title">正在播放</span>'
+ '<span class="music-player-menu" onclick="showPlayerMenu()"><span class="music-dot"></span><span class="music-dot"></span><span class="music-dot"></span></span>'
+ '</div>'
        + '<div class="music-player-content">'
        + '<div class="music-vinyl-area" id="musicVinylArea" onclick="showLyrics()">'
+ '<div class="music-vinyl-large">'
+ '<div class="music-vinyl-spin' + (isPlaying ? ' spinning' : '') + '">'
+ '<div class="music-vinyl-disc large"></div>'
+ '</div>'
+ '</div>'
+ '<div class="music-tonearm' + (isPlaying ? ' playing' : '') + '">'
+ '<div class="tonearm-base"></div>'
+ '<div class="tonearm-arm"></div>'
+ '<div class="tonearm-head"></div>'
+ '</div>'
+ '</div>'
+ '<div class="music-lyrics-area" id="musicLyricsArea" style="display:none;" onclick="showLyrics()">'
+ '<div class="music-lyrics-scroll">'
+ '<p class="music-lyric-line">歌词功能即将上线</p>'
+ '<p class="music-lyric-line">敬请期待</p>'
+ '</div>'
+ '</div>'
        + '<div class="music-song-detail">'
        + '<div class="music-song-title">' + musicCurrentSong.name + '</div>'
        + '<div class="music-song-artist-lg">' + artist + '</div>'
        + '</div>'
        + '<div class="music-progress-area">'
        + '<div class="music-progress-bar" onclick="seekMusic(event)">'
        + '<div class="music-progress-fill" style="width:' + progress + '%"></div>'
        + '<div class="music-progress-thumb" style="left:' + progress + '%"></div>'
        + '</div>'
        + '<div class="music-time-row">'
        + '<span class="music-time-current">' + currentTime + '</span>'
        + '<span class="music-time-duration">' + duration + '</span>'
        + '</div>'
        + '</div>'
        + '<div class="music-controls">'
        + '<span class="music-ctrl-btn" onclick="playPrevSong()">⏮</span>'
        + '<span class="music-ctrl-btn music-ctrl-play" onclick="togglePlay()"><span class="music-ctrl-play-icon ' + (isPlaying ? 'pause' : 'play') + '"></span></span>'
        + '<span class="music-ctrl-btn" onclick="playNextSong()">⏭</span>'
        + '</div>'
        + '</div>'
        + '</div></div>';

    window._playerTimer = setInterval(updatePlayerProgress, 500);
}

function backToPlaylistFromPlayer() {
    if (window._playerTimer) { clearInterval(window._playerTimer); window._playerTimer = null; }
    if (musicCurrentPlaylist) {
        var appWindow = document.getElementById('musicAppWindow');
        if (appWindow) { renderPlaylistFullScreen(appWindow); setTimeout(function() { renderMiniPlayer(appWindow); }, 100); }
    } else {
        renderMusicApp();
    }
}

function updatePlayerProgress() {
    if (!musicAudio || !musicCurrentSong) return;
    var currentEl = document.querySelector('.music-time-current');
    var fillEl = document.querySelector('.music-progress-fill');
    var thumbEl = document.querySelector('.music-progress-thumb');
    if (currentEl) currentEl.textContent = formatMusicTime(musicAudio.currentTime);
    if (musicAudio.duration) {
        var pct = musicAudio.currentTime / musicAudio.duration * 100;
        if (fillEl) fillEl.style.width = pct + '%';
        if (thumbEl) thumbEl.style.left = pct + '%';
    }
}

function seekMusic(e) {
    if (!musicAudio || !musicAudio.duration) return;
    var bar = e.currentTarget;
    var rect = bar.getBoundingClientRect();
    var pct = (e.clientX - rect.left) / rect.width;
    musicAudio.currentTime = pct * musicAudio.duration;
    updatePlayerProgress();
}

function compressImage(base64, maxWidth, quality, callback) {
    var img = new Image();
    var done = false;
    img.onload = function() {
        if (done) return; done = true;
        var canvas = document.createElement('canvas');
        var width = img.width, height = img.height;
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        try {
            var compressed = canvas.toDataURL('image/jpeg', quality);
            callback(compressed);
        } catch(e) {
            callback(base64);
        }
    };
    img.onerror = function() {
        if (done) return; done = true;
        callback(base64);
    };
    setTimeout(function() {
        if (!done) { done = true; callback(base64); }
    }, 5000);
    img.src = base64;
}

function formatMusicTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function playPrevSong() {
    var playlists = getPlaylists();
    var pl = playlists.find(function(p) { return p.id === (musicCurrentPlaylist || 'all'); });
    if (!pl || !musicCurrentSong) return;
    var idx = -1;
    for (var i = 0; i < pl.songs.length; i++) { if (pl.songs[i].id === musicCurrentSong.id) { idx = i; break; } }
    if (idx > 0) { playSong(pl.songs[idx - 1].id); }
}

function playNextSong() {
    var playlists = getPlaylists();
    var pl = playlists.find(function(p) { return p.id === (musicCurrentPlaylist || 'all'); });
    if (!pl || !musicCurrentSong) return;
    var idx = -1;
    for (var i = 0; i < pl.songs.length; i++) { if (pl.songs[i].id === musicCurrentSong.id) { idx = i; break; } }
    if (idx >= 0 && idx < pl.songs.length - 1) { playSong(pl.songs[idx + 1].id); }
}

function getCurrentLyrics() {
    if (!musicCurrentSong || !musicCurrentSong.lyrics) return [];
    return musicCurrentSong.lyrics;
}

function showLyrics() {
    var vinylArea = document.getElementById('musicVinylArea');
    var lyricsArea = document.getElementById('musicLyricsArea');
    var songDetail = document.querySelector('.music-song-detail');
    if (!vinylArea || !lyricsArea) return;
    if (lyricsArea.style.display === 'flex') {
        // 切回唱片
        lyricsArea.style.display = 'none';
        vinylArea.style.display = 'block';
        if (songDetail) songDetail.style.display = '';
        if (window._lyricsTimer) { clearInterval(window._lyricsTimer); window._lyricsTimer = null; }
    } else {
        // 切换到歌词
        vinylArea.style.display = 'none';
        lyricsArea.style.display = 'flex';
        if (songDetail) songDetail.style.display = 'none';
        renderLyrics();
        if (window._lyricsTimer) clearInterval(window._lyricsTimer);
        window._lyricsTimer = setInterval(updateLyricsHighlight, 300);
    }
}

function renderLyrics() {
    var lyricsArea = document.getElementById('musicLyricsArea');
    if (!lyricsArea) return;
    var lyrics = getCurrentLyrics();
    if (lyrics.length === 0) {
        lyricsArea.innerHTML = '<div class="music-lyrics-scroll"><p class="music-lyric-line">暂无歌词</p></div>';
        return;
    }
    var html = '<div class="music-lyrics-scroll" id="musicLyricsScroll">';
    lyrics.forEach(function(line, i) {
        html += '<p class="music-lyric-line" data-time="' + line.time + '" data-index="' + i + '" onclick="seekToLyric(' + line.time + ', event)">' + line.text + '</p>';
    });
    html += '</div>';
    lyricsArea.innerHTML = html;
}

function updateLyricsHighlight() {
    if (!musicAudio) return;
    var currentTime = musicAudio.currentTime;
    var lines = document.querySelectorAll('.music-lyric-line');
    var scrollContainer = document.getElementById('musicLyricsScroll');
    var activeIndex = -1;
    lines.forEach(function(line, i) {
        var t = parseFloat(line.getAttribute('data-time'));
        if (t <= currentTime) activeIndex = i;
    });
    lines.forEach(function(line, i) {
        if (i === activeIndex) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }
    });
    if (activeIndex >= 0 && scrollContainer && lines[activeIndex]) {
        var activeLine = lines[activeIndex];
        var containerHeight = scrollContainer.clientHeight;
        var lineTop = activeLine.offsetTop;
        var targetTop = lineTop - containerHeight / 2;
        if (targetTop < 0) targetTop = 0;
        scrollContainer.scrollTop = targetTop;
    }
}

function seekToLyric(time, event) {
    if (event) event.stopPropagation();
    if (musicAudio) {
        musicAudio.currentTime = time;
        updateLyricsHighlight();
    }
}

// ========== 播放页三点菜单 ==========
function showPlayerMenu() {
    if (!musicCurrentSong) return;
    var overlay = document.createElement('div');
    overlay.className = 'music-menu-overlay';
    overlay.id = 'playerMenuOverlay';
    overlay.innerHTML = ''
        + '<div class="music-menu-panel" onclick="event.stopPropagation()">'
        + '<div class="music-menu-handle"></div>'
        + '<div class="music-player-menu-info">'
        + '<div class="music-player-menu-cover" id="playerMenuCover" style="background-image:url(' + (musicCurrentSong.cover || '') + ');" onclick="changePlayerSongCover()">' + (musicCurrentSong.cover ? '' : '<span style="color:rgba(0,0,0,0.2);font-size:12px;">封面</span>') + '</div>'
        + '<div class="music-player-menu-meta">'
        + '<div class="music-menu-item" onclick="editPlayerSongName()"><span>歌名：' + musicCurrentSong.name + '</span></div>'
        + '<div class="music-menu-item" onclick="editPlayerSongArtist()"><span>歌手：' + (musicCurrentSong.artist || '未知歌手') + '</span></div>'
        + '</div>'
        + '</div>'
        + '<div class="music-menu-item" onclick="inviteListenTogether()">'
        + '<div class="music-together-avatars">'
        + '<div class="music-together-avatar">' + (getMusicUserInfo().avatar ? '<div style="background-image:url(' + getMusicUserInfo().avatar + ');background-size:cover;background-position:center;width:100%;height:100%;border-radius:50%;"></div>' : '我') + '</div>'
        + '<div class="music-together-add">+</div>'
        + '</div>'
        + '<span>一起听</span>'
+ '</div>'
+ '<div class="music-menu-item" onclick="editSongLyrics()">'
+ '<img src="https://i.ibb.co/jS0YyTb/1782814385302.png" class="music-menu-icon">'
+ '<span>编辑歌词</span>'
+ '</div>'
+ '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePlayerMenu(); };
}

function closePlayerMenu() { var o = document.getElementById('playerMenuOverlay'); if (o) o.remove(); }

function changePlayerSongCover() {
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            var base64 = ev.target.result;
            musicCurrentSong.cover = base64;
            var coverEl = document.getElementById('playerMenuCover');
            if (coverEl) { coverEl.style.backgroundImage = 'url(' + base64 + ')'; coverEl.innerHTML = ''; }
            updateSongInPlaylists(musicCurrentSong.id, 'cover', base64);
            showToast('封面已更新');
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function editPlayerSongName() {
    var newName = prompt('编辑歌曲名称：', musicCurrentSong.name);
    if (newName !== null && newName.trim()) {
        musicCurrentSong.name = newName.trim();
        updateSongInPlaylists(musicCurrentSong.id, 'name', musicCurrentSong.name);
        closePlayerMenu();
        updatePlayerFullInfo();
    }
}

function editPlayerSongArtist() {
    var newArtist = prompt('编辑歌手名称：', musicCurrentSong.artist || '');
    if (newArtist !== null) {
        musicCurrentSong.artist = newArtist.trim();
        updateSongInPlaylists(musicCurrentSong.id, 'artist', musicCurrentSong.artist);
        closePlayerMenu();
        updatePlayerFullInfo();
    }
}

function updateSongInPlaylists(songId, field, value) {
    var playlists = getPlaylists();
    playlists.forEach(function(p) {
        var song = p.songs.find(function(s) { return s.id === songId; });
        if (song) song[field] = value;
    });
    savePlaylists(playlists);
}

function updatePlayerFullInfo() {
    var titleEl = document.querySelector('.music-song-title');
    var artistEl = document.querySelector('.music-song-artist-lg');
    if (titleEl) titleEl.textContent = musicCurrentSong.name;
    if (artistEl) artistEl.textContent = musicCurrentSong.artist || '未知歌手';
    if (document.querySelector('.music-mini-player')) {
        var appWindow = document.getElementById('musicAppWindow');
        if (appWindow) renderMiniPlayer(appWindow);
    }
    refreshMusicContent();
}

function editSongLyrics() {
    if (!musicCurrentSong) return;
    closePlayerMenu();
    
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'lyricsEditOverlay';
    
    var currentLyrics = musicCurrentSong.lyrics || [];
    var lyricsText = '';
    currentLyrics.forEach(function(line) {
        var m = Math.floor(line.time / 60);
        var s = Math.floor(line.time % 60);
        var ms = Math.floor((line.time % 1) * 100);
        lyricsText += '[' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (ms < 10 ? '0' : '') + ms + ']' + line.text + '\n';
    });
    
    overlay.innerHTML = ''
        + '<div class="caption-modal" style="max-height:80%;">'
        + '<div style="font-size:15px;font-weight:600;margin-bottom:8px;color:#000;">编辑歌词</div>'
        + '<div style="font-size:11px;color:#8e8e93;margin-bottom:10px;">粘贴LRC格式歌词，每行一条</div>'
        + '<textarea class="payment-note" id="lyricsEditInput" style="height:200px;resize:none;font-size:13px;line-height:1.6;font-family:monospace;" placeholder="[00:00.00]歌词第一句&#10;[00:05.00]歌词第二句&#10;[00:10.00]歌词第三句"></textarea>'
        + '<div class="caption-buttons">'
        + '<div class="payment-btn-cancel" onclick="closeLyricsEdit()">取消</div>'
        + '<div class="payment-btn-confirm" onclick="confirmLyricsEdit()">确定</div>'
        + '</div></div>';
    
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeLyricsEdit(); };
    
    var textarea = document.getElementById('lyricsEditInput');
    if (textarea && lyricsText) {
        textarea.value = lyricsText;
    }
}

function closeLyricsEdit() {
    var o = document.getElementById('lyricsEditOverlay');
    if (o) o.remove();
}

function confirmLyricsEdit() {
    var input = document.getElementById('lyricsEditInput');
    var raw = input ? input.value.trim() : '';
    closeLyricsEdit();
    
    if (!raw) {
        musicCurrentSong.lyrics = [];
        updateSongInPlaylists(musicCurrentSong.id, 'lyrics', []);
        showToast('歌词已清除');
        return;
    }
    
    var lines = raw.split('\n');
    var lyrics = [];
    var lrcRegex = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/;
    
    lines.forEach(function(line) {
        var match = line.match(lrcRegex);
        if (match) {
            var min = parseInt(match[1]);
            var sec = parseInt(match[2]);
            var ms = match[3] ? parseInt(match[3]) : 0;
            if (ms < 100) ms = ms * 10;
            var time = min * 60 + sec + ms / 1000;
            var text = match[4] || '';
            lyrics.push({ time: time, text: text });
        }
    });
    
    if (lyrics.length === 0) {
        showToast('未识别到有效歌词');
        return;
    }
    
    musicCurrentSong.lyrics = lyrics;
    updateSongInPlaylists(musicCurrentSong.id, 'lyrics', lyrics);
    
    var lyricsArea = document.getElementById('musicLyricsArea');
    if (lyricsArea && lyricsArea.style.display === 'flex') {
        renderLyrics();
    }
    
    showToast('歌词已保存 (' + lyrics.length + '句)');
}

function inviteListenTogether() {
    var contactId = window.ChatState && window.ChatState.currentContactId;
    if (!contactId) { showToast('请先打开一个聊天窗口'); return; }
    var shareText = '（邀请你一起听：' + musicCurrentSong.name + ' - ' + (musicCurrentSong.artist || '未知歌手') + '）';
    if (typeof appendMessage === 'function') { appendMessage('narration', shareText); }
    closePlayerMenu();
    showToast('已邀请角色一起听');
}

// ========== 唱片旋转 ==========
function startVinylSpin() {
    if (musicVinylTimer) return;
    musicVinylTimer = setInterval(function() {
        musicVinylAngle = (musicVinylAngle + 2) % 360;
        var discs = document.querySelectorAll('.music-vinyl-disc.spinning, .music-vinyl-spin.spinning');
        discs.forEach(function(d) {
            d.style.transform = 'rotate(' + musicVinylAngle + 'deg)';
        });
    }, 30);
}

function stopVinylSpin() {
    if (musicVinylTimer) {
        clearInterval(musicVinylTimer);
        musicVinylTimer = null;
    }
    // 角度保持当前值不变，唱片上的 style.transform 已经是当前角度，无需额外操作
}

// ========== 播放 ==========
function playSong(songId) {
    var playlists = getPlaylists();
    var song = null;
    playlists.forEach(function(p) {
        var found = p.songs.find(function(s) { return s.id === songId; });
        if (found) song = found;
    });
        if (!song) return;
    
    // 彻底停掉旧音频
    if (musicAudio) {
        musicAudio.onended = null;
        musicAudio.pause();
        musicAudio.src = '';
        musicAudio = null;
    }
    stopVinylSpin();
    if (window._playerTimer) { clearInterval(window._playerTimer); window._playerTimer = null; }
    
    musicCurrentSong = song;
// 默认测试歌词
if (!musicCurrentSong.lyrics || musicCurrentSong.lyrics.length === 0) {
    var name = musicCurrentSong.name || '歌曲';
    musicCurrentSong.lyrics = [
        { time: 0, text: '♪ ' + name + ' ♪' },
        { time: 5, text: '歌词功能已上线' },
        { time: 10, text: '点击歌词可跳转' },
        { time: 15, text: '随播放自动滚动' },
        { time: 20, text: '长按收藏暂未开放' },
        { time: 25, text: '敬请期待更多功能' }
    ];
}
    
    if (song.type === 'local') {
        loadSongFromDB(song.id, function(data) {
            if (data && data.data) {
                var blob = new Blob([data.data], { type: 'audio/mpeg' });
                var url = URL.createObjectURL(blob);
                musicAudio = new Audio(url);
                musicAudio.play().catch(function() { showToast('播放失败'); });
                musicAudio.addEventListener('ended', function() {
                    if (musicQueue.length > 0) { var next = musicQueue.shift(); playSong(next.id); }
                    else if (document.querySelector('.music-player-full')) {
                        var pl = getPlaylists().find(function(p) { return p.id === (musicCurrentPlaylist || 'all'); });
                        if (pl && musicCurrentSong) {
                            var idx = -1;
                            for (var i = 0; i < pl.songs.length; i++) { if (pl.songs[i].id === musicCurrentSong.id) { idx = i; break; } }
                            if (idx >= 0 && idx < pl.songs.length - 1) { playSong(pl.songs[idx + 1].id); return; }
                        }
                        stopVinylSpin();
                        updatePlayerUIState();
                    } else {
                        musicCurrentSong = null; stopVinylSpin(); refreshMusicContent();
                    }
                });
                startVinylSpin();
                afterPlaySongSwitch();
            } else { showToast('本地文件丢失，请重新导入'); }
        });
    } else if (song.src) {
        musicAudio = new Audio(song.src);
        musicAudio.play().catch(function() { showToast('播放失败'); stopVinylSpin(); });
        musicAudio.addEventListener('ended', function() {
            if (musicQueue.length > 0) { var next = musicQueue.shift(); playSong(next.id); }
            else if (document.querySelector('.music-player-full')) {
                var pl = getPlaylists().find(function(p) { return p.id === (musicCurrentPlaylist || 'all'); });
                if (pl && musicCurrentSong) {
                    var idx = -1;
                    for (var i = 0; i < pl.songs.length; i++) { if (pl.songs[i].id === musicCurrentSong.id) { idx = i; break; } }
                    if (idx >= 0 && idx < pl.songs.length - 1) { playSong(pl.songs[idx + 1].id); return; }
                }
                stopVinylSpin();
                updatePlayerUIState();
            } else {
                musicCurrentSong = null; stopVinylSpin(); refreshMusicContent();
            }
        });
        startVinylSpin();
        afterPlaySongSwitch();
    } else {
        showToast('无法播放此歌曲');
    }
}

function afterPlaySongSwitch() {
    if (document.querySelector('.music-player-full')) {
        updatePlayerUIState();
        return;
    }
    refreshMusicContent();
}

function togglePlay() {
    if (!musicAudio) return;
    if (musicAudio.paused) {
        musicAudio.play();
        startVinylSpin();
    } else {
        musicAudio.pause();
        stopVinylSpin();
    }
    
    if (document.querySelector('.music-player-full')) {
        updatePlayerUIState();
    } else {
        refreshMusicContent();
    }
}

function updatePlayerUIState() {
    var isPlaying = musicAudio && !musicAudio.paused;
    var tonearm = document.querySelector('.music-tonearm');
    var playIcon = document.querySelector('.music-ctrl-play-icon');
    var spin = document.querySelector('.music-vinyl-spin');
    var titleEl = document.querySelector('.music-song-title');
    var artistEl = document.querySelector('.music-song-artist-lg');
    if (spin) { if (isPlaying) spin.classList.add('spinning'); else spin.classList.remove('spinning'); }
    if (tonearm) { if (isPlaying) tonearm.classList.add('playing'); else tonearm.classList.remove('playing'); }
    if (playIcon) { playIcon.className = 'music-ctrl-play-icon ' + (isPlaying ? 'pause' : 'play'); }
    // 切歌时更新歌名歌手
    if (musicCurrentSong) {
        if (titleEl) titleEl.textContent = musicCurrentSong.name;
        if (artistEl) artistEl.textContent = musicCurrentSong.artist || '未知歌手';
    }
}

function stopMusic() {
    if (musicAudio) {
    musicAudio.pause();
    musicAudio.removeAttribute('src');
    musicAudio.load();
    musicAudio.onended = null;
    musicAudio = null;
}
    stopVinylSpin();
    musicCurrentSong = null;
    musicQueue = [];
    if (window._playerTimer) { clearInterval(window._playerTimer); window._playerTimer = null; }
}

// ========== 标签内容 ==========
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

function openPlaylist(id) { musicCurrentPlaylist = id; var appWindow = document.getElementById('musicAppWindow'); if (appWindow) renderPlaylistFullScreen(appWindow); }
function backToPlaylistList() { musicCurrentPlaylist = null; renderMusicApp(); }
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
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas'); var ctx = canvas.getContext('2d');
                var MAX_WIDTH = 300, MAX_HEIGHT = 300;
                var width = img.width, height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                var compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                var playlists = getPlaylists();
                var pl = playlists.find(function(p) { return p.id === id; });
                if (pl) { pl.cover = compressedBase64; savePlaylists(playlists); }
                var coverDiv = document.querySelector('.music-detail-cover');
                if (coverDiv) { coverDiv.style.backgroundImage = 'url(' + compressedBase64 + ')'; coverDiv.style.backgroundSize = 'cover'; coverDiv.style.backgroundPosition = 'center'; coverDiv.innerHTML = ''; }
                setTimeout(function() { var appWindow = document.getElementById('musicAppWindow'); if (appWindow) { musicCurrentPlaylist = id; renderPlaylistFullScreen(appWindow); } }, 50);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function switchMusicTab(tab) {
    musicCurrentTab = tab; musicCurrentPlaylist = null;
    var content = document.getElementById('musicTabContent');
    if (content) content.innerHTML = renderMusicTabContent();
    document.querySelectorAll('.music-tab').forEach(function(t) { t.classList.remove('active'); });
    var tabs = document.querySelectorAll('.music-tab');
    var idx = tab === 'music' ? 0 : tab === 'roam' ? 1 : 2;
    if (tabs[idx]) tabs[idx].classList.add('active');
}

function changeMusicAvatar(e) {
    e.stopPropagation();
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = function(ev) {
        var file = ev.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev2) { localStorage.setItem('music_user_avatar', ev2.target.result); renderMusicApp(); };
        reader.readAsDataURL(file);
    };
    input.click();
}

function changeMusicBg(e) {
    if (e.target.closest('.music-avatar-wrap') || e.target.closest('.music-func-item')) return;
    var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = function(ev) {
        var file = e.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev2) {
            compressImage(ev2.target.result, 800, 0.6, function(compressed) {
                localStorage.setItem('music_bg', compressed);
                showToast('背景已更新');
                var appContainer = document.querySelector('.music-app');
                if (appContainer) {
                    appContainer.style.backgroundImage = 'url(' + compressed + ')';
                    appContainer.style.backgroundSize = 'cover';
                    appContainer.style.backgroundPosition = 'center';
                }
                renderMusicApp();
            });
        };
        reader.onerror = function() { showToast('读取失败'); };
        reader.readAsDataURL(file);
    };
    input.click();
}

// ========== 导入 ==========
function importLocalMusic() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'audio/*,.mp3,.wav,.ogg,.flac,.m4a'; input.multiple = true;
    input.onchange = function(e) {
        var files = e.target.files; if (!files || files.length === 0) return;
        var loaded = 0;
        for (var i = 0; i < files.length; i++) {
            (function(file, idx) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    var songId = 'local_' + Date.now() + '_' + idx;
                    saveSongToDB({ id: songId, name: file.name.replace(/\.[^.]+$/, ''), artist: '本地音乐', type: 'local', data: ev.target.result });
                    addSongToPlaylist('all', { id: songId, name: file.name.replace(/\.[^.]+$/, ''), artist: '本地音乐', type: 'local', src: '' });
                    loaded++;
                    if (loaded === files.length) { showToast('已导入 ' + files.length + ' 首歌'); refreshMusicContent(); }
                };
                reader.readAsArrayBuffer(file);
            })(files[i], i);
        }
    };
    input.click();
}

function importMusicUrl() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay'; overlay.id = 'musicUrlOverlay';
    overlay.innerHTML = '<div class="caption-modal"><div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">导入音乐</div><input type="text" class="payment-note" id="musicUrlInput" placeholder="粘贴音乐链接"><div style="font-size:11px;color:#8e8e93;margin:4px 0 12px;">支持 mp3 / wav / ogg 等音频直链</div><div class="caption-buttons"><div class="payment-btn-cancel" onclick="closeMusicUrl()">取消</div><div class="payment-btn-confirm" onclick="confirmMusicUrl()">确定</div></div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeMusicUrl(); };
}
function closeMusicUrl() { var o = document.getElementById('musicUrlOverlay'); if (o) o.remove(); }
function confirmMusicUrl() {
    var input = document.getElementById('musicUrlInput'); var url = input ? input.value.trim() : ''; closeMusicUrl();
    if (!url) return;
    var playlists = getPlaylists(); var pl = playlists.find(function(p) { return p.id === 'all' }); var count = pl ? pl.songs.length + 1 : 1;
    addSongToPlaylist('all', { id: 'url_' + Date.now(), name: '在线音乐 ' + count, src: url, type: 'url', artist: '在线音乐' });
    showToast('已导入'); refreshMusicContent();
}

function refreshMusicContent() {
    if (document.querySelector('.music-player-full')) return;
    if (musicCurrentPlaylist) { var appWindow = document.getElementById('musicAppWindow'); if (appWindow) renderPlaylistFullScreen(appWindow); }
    else { var content = document.getElementById('musicTabContent'); if (content) content.innerHTML = renderMusicTabContent(); }
}

// ========== 歌曲菜单 ==========
function showSongMenu(songId) {
    musicMenuSongId = songId;
    var overlay = document.createElement('div'); overlay.className = 'music-menu-overlay'; overlay.id = 'musicMenuOverlay';
    overlay.innerHTML = ''
        + '<div class="music-menu-panel" onclick="event.stopPropagation()">'
        + '<div class="music-menu-handle"></div>'
        + '<div class="music-menu-item" onclick="queueNextSong()"><img src="https://i.ibb.co/sJH89rWN/1782732005182.png" class="music-menu-icon"><span>下一首播放</span></div>'
        + '<div class="music-menu-item" onclick="shareSongToChar()"><img src="https://i.ibb.co/nMXjFKSx/1782732081584.png" class="music-menu-icon"><span>分享</span></div>'
        + '<div class="music-menu-item" onclick="deleteSongConfirm()"><img src="https://i.ibb.co/h1M6LCrj/1782732044417.png" class="music-menu-icon"><span>删除</span></div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeSongMenu(); };
}
function closeSongMenu() { var o = document.getElementById('musicMenuOverlay'); if (o) o.remove(); musicMenuSongId = null; }
function queueNextSong() {
    if (!musicMenuSongId) return;
    var playlists = getPlaylists(); var song = null;
    playlists.forEach(function(p) { var found = p.songs.find(function(s) { return s.id === musicMenuSongId; }); if (found) song = found; });
    if (song) { musicQueue.push(song); showToast('已加入下一首播放'); }
    closeSongMenu();
}
function shareSongToChar() {
    if (!musicMenuSongId) return;
    var playlists = getPlaylists(); var song = null;
    playlists.forEach(function(p) { var found = p.songs.find(function(s) { return s.id === musicMenuSongId; }); if (found) song = found; });
    if (!song) { closeSongMenu(); return; }
    closeSongMenu();
    var contactId = window.ChatState && window.ChatState.currentContactId;
    if (!contactId) { showToast('请先打开一个聊天窗口'); return; }
    var shareText = '（分享了一首歌：' + song.name + ' - ' + (song.artist || '未知歌手') + '）';
    if (typeof appendMessage === 'function') { appendMessage('narration', shareText); }
    showToast('已分享给角色');
}
function deleteSongConfirm() {
    var songId = musicMenuSongId;
    closeSongMenu();
    setTimeout(function() {
        var overlay = document.createElement('div'); overlay.className = 'confirm-overlay'; overlay.id = 'deleteSongOverlay';
        overlay.innerHTML = '<div class="confirm-dialog"><p>确认删除当前音乐？</p><div class="confirm-buttons"><div class="confirm-btn-cancel" onclick="cancelDeleteSong()">取消</div><div class="confirm-btn-delete" onclick="confirmDeleteSong(\'' + songId + '\')">确定</div></div></div>';
        document.body.appendChild(overlay);
    }, 300);
}
function cancelDeleteSong() { var o = document.getElementById('deleteSongOverlay'); if (o) o.remove(); }
function confirmDeleteSong(songId) {
    var o = document.getElementById('deleteSongOverlay'); if (o) o.remove();
    if (!songId) return;
    var playlists = getPlaylists();
    playlists.forEach(function(p) { p.songs = p.songs.filter(function(s) { return s.id !== songId; }); });
    savePlaylists(playlists);
    deleteSongFromDB(songId);
    showToast('已删除');
    refreshMusicContent();
}

// ========== 设置 ==========
function openMusicSettings() {
    var overlay = document.createElement('div');
    overlay.className = 'sheet-mask show';
    overlay.id = 'musicSettingsMask';
    var currentBg = localStorage.getItem('music_bg') || '';
    overlay.innerHTML = ''
        + '<div class="half-sheet" onclick="event.stopPropagation()">'
        + '<div class="sheet-handle"><div class="handle-bar"></div></div>'
        + '<div class="sheet-scroll">'
        + '<div class="settings-section-title">全局背景图</div>'
        + '<div class="settings-hint">提示：音乐软件所有页面都将应用此背景</div>'
        + '<div class="glass-card">'
        + '<div class="bg-preview-2x4" id="musicBgPreview" style="background-image:url(' + currentBg + ');" onclick="document.getElementById(\'musicBgInput\').click()">' + (currentBg ? '' : '点击更换全局背景图') + '</div>'
        + '<input type="file" id="musicBgInput" accept="image/*" style="display:none;" onchange="handleMusicBg(event)">'
        + '<button class="black-btn" onclick="clearMusicBg()">清除全局背景图</button>'
        + '</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeMusicSettings(); };
    var handle = overlay.querySelector('.sheet-handle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 60) closeMusicSettings(); });
    handle.addEventListener('click', function() { closeMusicSettings(); });
}
function closeMusicSettings() { var o = document.getElementById('musicSettingsMask'); if (o) o.remove(); }
function handleMusicBg(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        compressImage(ev.target.result, 800, 0.6, function(compressed) {
            localStorage.setItem('music_bg', compressed);
            var preview = document.getElementById('musicBgPreview');
            if (preview) { preview.style.backgroundImage = 'url(' + compressed + ')'; preview.innerText = ''; }
            var appContainer = document.querySelector('.music-app');
            if (appContainer) {
                appContainer.style.backgroundImage = 'url(' + compressed + ')';
                appContainer.style.backgroundSize = 'cover';
                appContainer.style.backgroundPosition = 'center';
            }
            closeMusicSettings();
            renderMusicApp();
            showToast('全局背景图已保存');
        });
    };
    reader.onerror = function() { showToast('读取失败'); };
    reader.readAsDataURL(file);
}
function clearMusicBg() {
    localStorage.removeItem('music_bg');
    var preview = document.getElementById('musicBgPreview');
    if (preview) { preview.style.backgroundImage = ''; preview.innerText = '点击更换全局背景图'; }
    renderMusicApp(); showToast('已清除');
}
