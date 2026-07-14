/**
 * 玉界 - 创作
 * 同人文生成 + 书架 + 阅读
 */

var _crTab = 'search';
var _crBooks = [];
var _crSelectedChar = null;
var _crSelectedTags = [];
var _crIsGenerating = false;
var _crReaderSettings = {
    bg: 'default',
    fontSize: 16
};

function _crLoadBooks() {
    try { var raw = localStorage.getItem('creation_books'); _crBooks = raw ? JSON.parse(raw) : []; } catch(e) { _crBooks = []; }
}
function _crSaveBooks() { localStorage.setItem('creation_books', JSON.stringify(_crBooks)); }

function openCreation() {
    var appWindow = document.getElementById('creationAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'creationAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    _crLoadBooks();
    _crTab = 'search';
    _crRender();
    appWindow.style.display = 'flex';
}

function closeCreation() {
    var appWindow = document.getElementById('creationAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

function _crRender() {
    var appWindow = document.getElementById('creationAppWindow');
    if (!appWindow) return;

    var bodyHTML = _crTab === 'search' ? _crRenderSearch() : _crRenderBookshelf();
    var title = _crTab === 'search' ? '寻书' : '书架';

    appWindow.innerHTML = ''
        + '<div class="creation-app">'
        + '<div class="cr-nav">'
        + '<div class="cr-nav-back" onclick="closeCreation()">‹</div>'
        + '<div class="cr-nav-title">' + title + '</div>'
        + '</div>'
        + bodyHTML
        + '<div class="cr-tab-bar">'
        + '<span class="cr-tab ' + (_crTab === 'search' ? 'active' : '') + '" onclick="_crSwitchTab(\'search\')">寻书</span>'
        + '<span class="cr-tab ' + (_crTab === 'bookshelf' ? 'active' : '') + '" onclick="_crSwitchTab(\'bookshelf\')">书架</span>'
        + '</div>'
        + '</div>';
}

function _crSwitchTab(tab) {
    _crTab = tab;
    _crRender();
}

// ========== 寻书页 ==========
function _crRenderSearch() {
    return '<div class="cr-body">'
        + _crRenderCharSelect()
        + _crRenderWordCount()
        + _crRenderTags()
        + _crRenderEnding()
        + _crRenderBanned()
        + '<button class="cr-generate-btn" onclick="_crGenerate()">生成文章</button>'
        + '</div>';
}

function _crRenderCharSelect() {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    contacts = contacts.filter(function(c) { return c.id !== 'c1'; });
    
    var html = '<div class="cr-card"><div class="cr-card-title">选择角色</div>';
    html += '<div class="cr-char-select" onclick="_crToggleCharList()">' + (_crSelectedChar ? _crSelectedChar.name : '点击选择角色') + '</div>';
    html += '<div class="cr-char-list" id="crCharList">';
    contacts.forEach(function(c) {
        html += '<div class="cr-char-item" onclick="_crPickChar(\'' + c.id + '\')">' + c.name + '</div>';
    });
    html += '</div></div>';
    return html;
}

function _crToggleCharList() {
    var list = document.getElementById('crCharList');
    if (list) list.classList.toggle('show');
}

function _crPickChar(id) {
    var contacts = window.ChatConfig.contacts.filter(function(c) { return c.id !== 'c1'; });
    _crSelectedChar = contacts.find(function(c) { return c.id === id; }) || null;
    var list = document.getElementById('crCharList');
    if (list) list.classList.remove('show');
    _crRender();
}

function _crRenderWordCount() {
    return '<div class="cr-card">'
        + '<div class="cr-card-title">全篇字数</div>'
        + '<div class="cr-card-hint">建议在6000字以内</div>'
        + '<input type="number" class="cr-input" id="crWordCount" placeholder="请输入字数" value="3000">'
        + '</div>';
}

function _crRenderTags() {
    var tags = ['原世界','现代','古代','仙侠','悬疑','校园','都市','言情','百合','克鲁苏','科幻'];
    var html = '<div class="cr-card"><div class="cr-card-title">题材</div><div class="cr-tags">';
    tags.forEach(function(t) {
        var sel = _crSelectedTags.indexOf(t) >= 0 ? ' selected' : '';
        html += '<div class="cr-tag' + sel + '" onclick="_crToggleTag(this,\'' + t + '\')">' + t + '</div>';
    });
    html += '</div>';
    html += '<input type="text" class="cr-input" id="crCustomTag" placeholder="自定义题材" style="margin-top:8px;">';
    html += '</div>';
    return html;
}

function _crToggleTag(el, tag) {
    var idx = _crSelectedTags.indexOf(tag);
    if (idx >= 0) { _crSelectedTags.splice(idx, 1); el.classList.remove('selected'); }
    else { _crSelectedTags.push(tag); el.classList.add('selected'); }
}

function _crRenderEnding() {
    return '<div class="cr-card">'
        + '<div class="cr-card-title">结局核心走向</div>'
        + '<textarea class="cr-textarea large" id="crEnding" placeholder="描述你想要的结局走向..."></textarea>'
        + '</div>';
}

function _crRenderBanned() {
    return '<div class="cr-card">'
        + '<div class="cr-card-title">禁止出现的剧情</div>'
        + '<textarea class="cr-textarea" id="crBanned" placeholder="描述你不希望出现的情节..."></textarea>'
        + '</div>';
}

// ========== 生成 ==========
function _crGenerate() {
    if (_crIsGenerating) return;
    if (!_crSelectedChar) { showToast('请先选择角色'); return; }
    
    var wordCount = parseInt(document.getElementById('crWordCount').value) || 3000;
    var customTag = document.getElementById('crCustomTag').value.trim();
    var tags = _crSelectedTags.slice();
    if (customTag) tags.push(customTag);
    var ending = document.getElementById('crEnding').value.trim();
    var banned = document.getElementById('crBanned').value.trim();
    
    if (!ending) { showToast('请填写结局核心走向'); return; }
    
    _crIsGenerating = true;
    _crShowGeneratingToast();
    
    var persona = _crSelectedChar.persona || '';
    var maskPersona = '';
    if (_crSelectedChar.maskId) {
        var masks = typeof getMasks === 'function' ? getMasks() : [];
        var mask = masks.find(function(m) { return m.id === _crSelectedChar.maskId; });
        if (mask && mask.persona) maskPersona = mask.persona;
    }
    
    var prompt = '请根据以下设定创作一篇完整的短篇小说。\n\n';
    prompt += '【角色人设】\n' + persona + '\n\n';
    if (maskPersona) prompt += '【用户身份】\n' + maskPersona + '\n\n';
    prompt += '【字数要求】' + wordCount + '字左右，必须写完结局，禁止烂尾。\n';
    if (tags.length > 0) prompt += '【题材】' + tags.join('、') + '\n';
    prompt += '【结局走向】' + ending + '\n';
    if (banned) prompt += '【禁止剧情】' + banned + '\n';
    prompt += '\n请直接输出小说正文，先写标题（用《》括起来），然后换行写正文。';
    
    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: '你是一位才华横溢的小说作家。创作完整、有深度、不烂尾的短篇小说。' },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            _crIsGenerating = false;
            _crHideGeneratingToast();
            var clean = reply.replace(/\{[^}]*\}/g, '').trim();
            _crSaveBook(clean);
            _crShowDoneToast();
        }).catch(function() {
            _crIsGenerating = false;
            _crHideGeneratingToast();
            showToast('生成失败，请检查API配置');
        });
    } else {
        _crIsGenerating = false;
        _crHideGeneratingToast();
        showToast('请先配置API');
    }
}

function _crSaveBook(content) {
    var titleMatch = content.match(/《(.+?)》/);
    var title = titleMatch ? titleMatch[1] : '未命名';
    _crBooks.unshift({
        id: 'book_' + Date.now(),
        title: title,
        content: content,
        charName: _crSelectedChar ? _crSelectedChar.name : '',
        time: Date.now()
    });
    _crSaveBooks();
}

function _crShowGeneratingToast() {
    var toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.id = 'crGeneratingToast';
    toast.textContent = '努力写文中…';
    document.body.appendChild(toast);
}

function _crHideGeneratingToast() {
    var t = document.getElementById('crGeneratingToast');
    if (t) t.remove();
}

function _crShowDoneToast() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'crDoneOverlay';
    overlay.innerHTML = '<div class="caption-modal" style="text-align:center;">'
        + '<div style="font-size:18px;font-weight:700;color:#000;margin-bottom:6px;">老大你的文好了！！速来</div>'
        + '<button class="black-btn" onclick="_crCloseDone()" style="margin-top:12px;">查看</button>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) _crCloseDone(); };
}

function _crCloseDone() {
    var o = document.getElementById('crDoneOverlay');
    if (o) o.remove();
    _crTab = 'bookshelf';
    _crRender();
}

// ========== 书架 ==========
function _crRenderBookshelf() {
    var html = '<div class="cr-body">';
    if (_crBooks.length === 0) {
        html += '<div style="text-align:center;color:#8e8e93;padding:40px 0;">书架空空如也</div>';
    } else {
        html += '<div class="cr-bookshelf">';
        _crBooks.forEach(function(book, i) {
            var preview = book.content.replace(/《.+?》/, '').replace(/\n/g, '').substring(0, 80);
            html += '<div class="cr-book-item" onclick="_crOpenBook(' + i + ')" oncontextmenu="event.preventDefault();" ontouchstart="_crLongPressTimer=setTimeout(function(){_crDeleteBook(' + i + ');},600);" ontouchend="clearTimeout(_crLongPressTimer);" ontouchmove="clearTimeout(_crLongPressTimer);">'
                + '<div class="cr-book-title">' + book.title + '</div>'
                + '<div class="cr-book-preview">' + preview + '</div>'
                + '<div style="font-size:10px;color:#c7c7cc;margin-top:6px;">' + book.charName + '</div>'
                + '</div>';
        });
        html += '</div>';
    }
    html += '</div>';
    return html;
}

var _crLongPressTimer = null;

function _crDeleteBook(index) {
    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'crDeleteOverlay';
    overlay.innerHTML = '<div class="confirm-dialog">'
        + '<p>确认删除《' + _crBooks[index].title + '》？</p>'
        + '<div class="confirm-buttons">'
        + '<div class="confirm-btn-cancel" onclick="_crCancelDelete()">取消</div>'
        + '<div class="confirm-btn-delete" onclick="_crConfirmDelete(' + index + ')">确定</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
}
function _crCancelDelete() { var o = document.getElementById('crDeleteOverlay'); if (o) o.remove(); }
function _crConfirmDelete(index) {
    var o = document.getElementById('crDeleteOverlay'); if (o) o.remove();
    _crBooks.splice(index, 1);
    _crSaveBooks();
    _crRender();
}

// ========== 阅读 ==========
function _crOpenBook(index) {
    var book = _crBooks[index];
    if (!book) return;
    
    var appWindow = document.getElementById('creationAppWindow');
    if (!appWindow) return;
    
    var contentHTML = '';
    var lines = book.content.split('\n');
    var firstLine = true;
    lines.forEach(function(line) {
        line = line.trim();
        if (!line) return;
        if (firstLine && line.indexOf('《') >= 0) {
            contentHTML += '<h2>' + line + '</h2>';
            firstLine = false;
        } else {
            contentHTML += '<p>' + line + '</p>';
        }
    });
    
    var bgClass = '';
    if (_crReaderSettings.bg === 'warm') bgClass = ' warm';
    else if (_crReaderSettings.bg === 'dark') bgClass = ' dark';
    else if (_crReaderSettings.bg === 'green') bgClass = ' green';
    
    appWindow.innerHTML = ''
        + '<div class="creation-app">'
        + '<div class="cr-nav">'
        + '<div class="cr-nav-back" onclick="_crSwitchTab(\'bookshelf\');_crRender();">‹</div>'
        + '<div class="cr-nav-title">阅读</div>'
        + '</div>'
        + '<div class="cr-reader' + bgClass + '" style="font-size:' + _crReaderSettings.fontSize + 'px;" id="crReaderContent">'
        + contentHTML
        + '</div>'
        + '<div class="cr-reader-fab" onclick="_crOpenReaderSettings()">Aa</div>'
        + '</div>';
}

function _crOpenReaderSettings() {
    var overlay = document.createElement('div');
    overlay.className = 'sheet-mask show';
    overlay.id = 'crReaderSettingsOverlay';
    
    var bgHTML = '';
    var bgs = [
        { key: 'default', label: '默认', style: 'background:#fafaf7;' },
        { key: 'warm', label: '暖黄', style: 'background:#fdf6e8;' },
        { key: 'white', label: '白色', style: 'background:#fff;' },
        { key: 'green', label: '绿色', style: 'background:#e8f0e3;' },
        { key: 'dark', label: '暗色', style: 'background:#1a1a1a;' }
    ];
    bgs.forEach(function(b) {
        var sel = _crReaderSettings.bg === b.key ? ' selected' : '';
        bgHTML += '<div class="ac-cat-item' + sel + '" onclick="_crSetBg(\'' + b.key + '\')" style="' + b.style + ';flex:1;min-width:50px;height:36px;border-radius:8px;border:1px solid rgba(0,0,0,0.1);"></div>';
    });
    
    overlay.innerHTML = '<div class="half-sheet" onclick="event.stopPropagation();" style="max-height:40vh;">'
        + '<div class="sheet-handle"><div class="handle-bar"></div></div>'
        + '<div class="sheet-scroll">'
        + '<div class="settings-section-title">阅读颜色</div>'
        + '<div style="display:flex;gap:6px;margin-bottom:16px;">' + bgHTML + '</div>'
        + '<div class="settings-section-title">字号</div>'
        + '<div class="cr-slider-row">'
        + '<span>A-</span>'
        + '<input type="range" min="10" max="40" value="' + _crReaderSettings.fontSize + '" class="ios-slider" oninput="_crSetFontSize(this.value)">'
        + '<span>A+</span>'
        + '</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) _crCloseReaderSettings(); };
    
    var handle = overlay.querySelector('.sheet-handle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 60) _crCloseReaderSettings(); });
}

function _crCloseReaderSettings() { var o = document.getElementById('crReaderSettingsOverlay'); if (o) o.remove(); }

function _crSetBg(key) {
    _crReaderSettings.bg = key;
    var reader = document.getElementById('crReaderContent');
    if (reader) {
        reader.className = 'cr-reader';
        if (key === 'warm') reader.classList.add('warm');
        else if (key === 'dark') reader.classList.add('dark');
        else if (key === 'green') reader.classList.add('green');
    }
    var items = document.querySelectorAll('#crReaderSettingsOverlay .ac-cat-item');
    items.forEach(function(i) { i.classList.remove('selected'); });
    if (event && event.target) event.target.classList.add('selected');
}

function _crSetFontSize(val) {
    _crReaderSettings.fontSize = val;
    var reader = document.getElementById('crReaderContent');
    if (reader) reader.style.fontSize = val + 'px';
}
