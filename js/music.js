/**
 * 玉界 - 网易云音乐
 * 包含：推荐/漫游/我的 三标签、歌单浏览、播放控制
 */

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

// ========== 当前标签 ==========
var musicCurrentTab = 'recommend';

// ========== 渲染音乐应用 ==========
function renderMusicApp() {
    var appWindow = document.getElementById('musicAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = `
        <div class="music-app">
            <div class="music-top-bar">
                <span class="music-back-btn" onclick="closeMusic()">‹</span>
                <input type="text" class="music-search-box" placeholder="搜索音乐" id="musicSearchInput" oninput="musicSearch(this.value)">
            </div>
            <div class="music-body" id="musicBody">
                ${renderMusicContent()}
            </div>
            <div class="music-tab-bar">
                <span class="music-tab ${musicCurrentTab === 'recommend' ? 'active' : ''}" onclick="switchMusicTab('recommend')">推荐</span>
                <span class="music-tab ${musicCurrentTab === 'roam' ? 'active' : ''}" onclick="switchMusicTab('roam')">漫游</span>
                <span class="music-tab ${musicCurrentTab === 'mine' ? 'active' : ''}" onclick="switchMusicTab('mine')">我的</span>
            </div>
        </div>
    `;
}

// ========== 渲染内容区 ==========
function renderMusicContent() {
    switch (musicCurrentTab) {
        case 'recommend':
            return renderRecommendPage();
        case 'roam':
            return renderRoamPage();
        case 'mine':
            return renderMinePage();
        default:
            return '';
    }
}

// ========== 切换标签 ==========
function switchMusicTab(tab) {
    musicCurrentTab = tab;
    var body = document.getElementById('musicBody');
    if (body) body.innerHTML = renderMusicContent();
    document.querySelectorAll('.music-tab').forEach(function(t) { t.classList.remove('active'); });
    var tabs = document.querySelectorAll('.music-tab');
    var idx = tab === 'recommend' ? 0 : tab === 'roam' ? 1 : 2;
    if (tabs[idx]) tabs[idx].classList.add('active');
}

// ========== 推荐页面 ==========
function renderRecommendPage() {
    return `
        <div class="music-page">
            <div class="music-section-title">热门推荐</div>
            <div class="music-loading">加载中…</div>
            <div class="music-playlist-grid" id="recommendPlaylistGrid"></div>
        </div>
    `;
}

// ========== 漫游页面 ==========
function renderRoamPage() {
    return `
        <div class="music-page">
            <div class="music-section-title">角色漫游</div>
            <div class="music-loading">选择角色后生成专属推荐…</div>
        </div>
    `;
}

// ========== 我的页面 ==========
function renderMinePage() {
    return `
        <div class="music-page">
            <div class="music-section-title">我的</div>
            <div class="music-login-btn" onclick="musicLogin()">
                <div class="music-login-icon">&#9835;</div>
                <span>扫码登录网易云</span>
            </div>
        </div>
    `;
}

// ========== 登录 ==========
async function musicLogin() {
    var overlay = document.createElement('div');
    overlay.className = 'music-login-overlay';
    overlay.id = 'musicLoginOverlay';
    overlay.innerHTML = `
        <div class="music-login-modal">
            <div class="music-login-title">扫码登录</div>
            <div class="music-qr-wrap" id="musicQrWrap">
                <img src="https://music.163.com/api/qrcode/unikey?type=1&key=loading" class="music-qr-img" id="musicQrImg" style="display:none;">
                <div class="music-loading" id="musicQrLoading">生成二维码中…</div>
            </div>
            <div class="music-login-hint">请使用网易云音乐APP扫码</div>
            <button class="music-login-cancel" onclick="closeMusicLogin()">取消</button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeMusicLogin(); };

    try {
        // 用轻量代理获取二维码
        var keyRes = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://music.163.com/api/login/qrcode/unikey?type=1'));
        var keyText = await keyRes.text();
        var key = JSON.parse(keyText).unikey;
        var qrUrl = 'https://music.163.com/login?codekey=' + key;
        
        // 用API生成二维码图片
        var qrImgEl = document.getElementById('musicQrImg');
        var qrLoadEl = document.getElementById('musicQrLoading');
        qrImgEl.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(qrUrl);
        qrImgEl.style.display = 'block';
        if (qrLoadEl) qrLoadEl.style.display = 'none';
        
        window._musicLoginTimer = setInterval(async function() {
            var checkRes = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://music.163.com/api/login/qrcode/client/login?key=' + key + '&type=1'));
            var checkText = await checkRes.text();
            var checkData = JSON.parse(checkText);
            if (checkData.code === 803) {
                clearInterval(window._musicLoginTimer);
                localStorage.setItem('music_cookie', checkData.cookie);
                localStorage.setItem('music_unikey', key);
                closeMusicLogin();
                showToast('登录成功');
                switchMusicTab('mine');
            } else if (checkData.code === 800) {
                clearInterval(window._musicLoginTimer);
                closeMusicLogin();
                showToast('二维码已过期');
            }
        }, 3000);
    } catch(e) {
        var qrLoadEl = document.getElementById('musicQrLoading');
        if (qrLoadEl) qrLoadEl.textContent = '网络错误，请重试';
    }
}

function closeMusicLogin() {
    if (window._musicLoginTimer) { clearInterval(window._musicLoginTimer); window._musicLoginTimer = null; }
    var overlay = document.getElementById('musicLoginOverlay');
    if (overlay) overlay.remove();
}

// ========== 搜索 ==========
function musicSearch(query) {
    // 搜索功能开发中
}
