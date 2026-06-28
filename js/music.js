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
                <div class="music-loading">生成二维码中…</div>
            </div>
            <div class="music-login-hint" id="musicLoginHint" style="font-weight: 500; transition: 0.3s;">请使用网易云音乐APP扫码</div>
            <button class="music-login-cancel" onclick="closeMusicLogin()">取消</button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeMusicLogin(); };

    var apiBase = 'https://netease-api-dun.vercel.app';

    try {
        // 1. 获取 key (注意参数名必须是 timestamp)
        var keyRes = await fetch(apiBase + '/login/qr/key?timestamp=' + Date.now());
        var keyData = await keyRes.json();
        var key = keyData.data.unikey;
        
        // 2. 获取二维码图片
        var qrRes = await fetch(apiBase + '/login/qr/create?key=' + key + '&qrimg=true&timestamp=' + Date.now());
        var qrData = await qrRes.json();
        var qrImg = qrData.data.qrimg;
        var qrWrap = document.getElementById('musicQrWrap');
        if (qrWrap) qrWrap.innerHTML = '<img src="' + qrImg + '" class="music-qr-img">';
        
        // 3. 轮询
        window._musicLoginTimer = setInterval(async function() {
            try {
                // 【核心修复】：必须使用 timestamp 才能击穿 API 服务端内部的 axios 缓存
                var checkRes = await fetch(apiBase + '/login/qr/check?key=' + key + '&timestamp=' + Date.now());
                var checkData = await checkRes.json();
                
                var code = checkData.code || (checkData.data && checkData.data.code);
                var hintEl = document.getElementById('musicLoginHint');

                if (code === 801) {
                    // 等待扫码，保持默认
                } else if (code === 802) {
                    // 用户手机已扫码，但还没点“授权登录”
                    if(hintEl) {
                        hintEl.innerText = '已扫码，请在手机上点击确认';
                        hintEl.style.color = '#007aff'; // 变成蓝色提示
                    }
                } else if (code === 803) {
                    // 授权成功
                    clearInterval(window._musicLoginTimer);
                    var cookie = checkData.cookie || (checkData.data && checkData.data.cookie) || '';
                    localStorage.setItem('music_cookie', cookie);
                    if(hintEl) {
                        hintEl.innerText = '登录成功！';
                        hintEl.style.color = '#34c759'; // 变成绿色提示
                    }
                    setTimeout(() => {
                        closeMusicLogin();
                        if(typeof showToast === 'function') showToast('登录成功');
                        switchMusicTab('mine');
                    }, 500); // 稍微延迟一下，让用户看到成功提示
                } else if (code === 800) {
                    // 二维码过期
                    clearInterval(window._musicLoginTimer);
                    if(hintEl) {
                        hintEl.innerText = '二维码已过期，请重新打开';
                        hintEl.style.color = '#ff3b30'; // 变成红色提示
                    }
                }
            } catch(e) {
                console.warn("主API轮询检查错误:", e);
            }
        }, 3000);

    } catch(e) {
        console.warn("主API失效，尝试备用方案...", e);
        try {
            var keyUrl = 'https://music.163.com/api/login/qrcode/unikey?type=1&timestamp=' + Date.now();
            var keyRes2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(keyUrl));
            var keyText2 = await keyRes2.text();
            var key2 = JSON.parse(keyText2).unikey;
            
            var qrUrl2 = 'https://music.163.com/login?codekey=' + key2;
            var qrWrap2 = document.getElementById('musicQrWrap');
            if (qrWrap2) qrWrap2.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(qrUrl2) + '" class="music-qr-img">';
            
            window._musicLoginTimer = setInterval(async function() {
                try {
                    var checkUrl = 'https://music.163.com/api/login/qrcode/client/login?key=' + key2 + '&type=1&timestamp=' + Date.now();
                    var checkRes2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(checkUrl));
                    var checkText2 = await checkRes2.text();
                    var checkData2 = JSON.parse(checkText2);
                    
                    var code2 = checkData2.code || (checkData2.data && checkData2.data.code);
                    var hintEl = document.getElementById('musicLoginHint');

                    if (code2 === 802) {
                        if(hintEl) { hintEl.innerText = '已扫码，请在手机上点击确认'; hintEl.style.color = '#007aff'; }
                    } else if (code2 === 803) {
                        clearInterval(window._musicLoginTimer);
                        var cookie2 = checkData2.cookie || (checkData2.data && checkData2.data.cookie) || '';
                        localStorage.setItem('music_cookie', cookie2);
                        if(hintEl) { hintEl.innerText = '登录成功！'; hintEl.style.color = '#34c759'; }
                        setTimeout(() => {
                            closeMusicLogin();
                            if(typeof showToast === 'function') showToast('登录成功');
                            switchMusicTab('mine');
                        }, 500);
                    } else if (code2 === 800) {
                        clearInterval(window._musicLoginTimer);
                        if(hintEl) { hintEl.innerText = '二维码已过期，请重新打开'; hintEl.style.color = '#ff3b30'; }
                    }
                } catch(e2) {}
            }, 3000);
        } catch(e2) {
            var qrWrap = document.getElementById('musicQrWrap');
            if (qrWrap) qrWrap.innerHTML = '<div class="music-loading" style="color:red;">网络服务已断开<br>请稍后再试或自建API</div>';
        }
    }
}

// 确保清理函数存在
function closeMusicLogin() {
    var overlay = document.getElementById('musicLoginOverlay');
    if (overlay) overlay.remove();
    if (window._musicLoginTimer) {
        clearInterval(window._musicLoginTimer);
        window._musicLoginTimer = null;
    }
}

// ========== 搜索 ==========
function musicSearch(query) {
    // 搜索功能开发中
}
