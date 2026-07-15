/**
 * 玉界 - 信件软件
 * 包含：信封展示、展开动画、回信、日历跳转、信件设置、数据持久化
 * 一个角色一天最多一封信，内容基于聊天记录生成
 */

// ========== 信件数据存储 ==========
function getLetters() {
    var contactId = getLetterSelectedChar();
    var key = contactId ? 'letter_entries_' + contactId : 'letter_entries';
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
}

function saveLetters(letters) {
    var contactId = getLetterSelectedChar();
    var key = contactId ? 'letter_entries_' + contactId : 'letter_entries';
    localStorage.setItem(key, JSON.stringify(letters));
}

function getLetterSelectedChar() {
    return localStorage.getItem('letter_selected_char') || '';
}

function getLetterFontSettings() {
    var raw = localStorage.getItem('letter_font_settings');
    return raw ? JSON.parse(raw) : { size: 0, color: '#3a2a1a', fontFamily: '' };
}

function saveLetterFontSettings(settings) {
    localStorage.setItem('letter_font_settings', JSON.stringify(settings));
}

// ========== 当前状态 ==========
var letterCurrentIndex = 0;
var letterIsOpen = false;
var letterCalendarDate = new Date();
var isLetterGenerating = false;

// ========== 打开信件软件 ==========
function openLetter() {
    var appWindow = document.getElementById('letterAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'letterAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f5f0e8;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    letterCurrentIndex = 0;
    letterIsOpen = false;
    letterCalendarDate = new Date();
    renderLetterApp();
    appWindow.style.display = 'flex';
}

function closeLetter() {
    var appWindow = document.getElementById('letterAppWindow');
    if (appWindow) appWindow.style.display = 'none';
    letterIsOpen = false;
}

// ========== 渲染信件应用 ==========
function renderLetterApp() {
    var appWindow = document.getElementById('letterAppWindow');
    if (!appWindow) return;

    var letters = getLetters();
    var hasLetters = letters.length > 0;
    var currentLetter = hasLetters ? letters[letterCurrentIndex] : null;
    var fontSettings = getLetterFontSettings();

    appWindow.innerHTML = ''
        + '<div class="letter-app">'
        + '<div class="letter-top-bar">'
        + '<div class="letter-back-btn" onclick="closeLetter()">‹</div>'
        + '<div class="letter-top-title">信 件</div>'
        + '<div class="letter-top-actions">'
        + '<div class="letter-btn-refresh" onclick="generateLetter()">↻</div>'
        + '<div class="letter-btn-calendar" onclick="openLetterCalendar()">📅</div>'
        + '<div class="letter-btn-settings" onclick="openLetterSettings()">○</div>'
        + '</div>'
        + '</div>'
        + '<div class="letter-body">'
        + renderLetterEnvelope(currentLetter, fontSettings)
        + '</div>'
        + '<div class="letter-bottom-bar">'
        + (hasLetters && letterCurrentIndex > 0 ? '<button class="letter-nav-btn" onclick="prevLetter()">‹ 上一封</button>' : '<div></div>')
        + '<button class="letter-reply-btn" onclick="openReplyModal()">回 信</button>'
        + (hasLetters && letterCurrentIndex < letters.length - 1 ? '<button class="letter-nav-btn" onclick="nextLetter()">下一封 ›</button>' : '<div></div>')
        + '</div>'
        + '</div>';
}

// ========== 渲染信封 ==========
function renderLetterEnvelope(letter, fontSettings) {
    if (!letter) {
        return '<div class="letter-empty">'
            + '<div class="letter-empty-icon">✉</div>'
            + '<div class="letter-empty-text">暂无信件</div>'
            + '<div class="letter-empty-hint">角色会在这里给你写信</div>'
            + '</div>';
    }

    var paperStyle = ''
        + 'font-size:' + (14 + parseInt(fontSettings.size) / 5) + 'px;'
        + 'color:' + fontSettings.color + ';'
        + (fontSettings.fontFamily ? 'font-family:' + fontSettings.fontFamily + ';' : '');

    return ''
        + '<div class="letter-envelope ' + (letterIsOpen ? 'open' : '') + '" id="letterEnvelope" onclick="openEnvelope()">'
        + '<div class="envelope-body">'
        + '<div class="envelope-back"></div>'
        + '<div class="envelope-flap"></div>'
        + '<div class="envelope-front">'
        + '<div class="envelope-stamp">' + (letter.stamp || '✿') + '</div>'
        + '<div class="envelope-from">' + letter.author + '</div>'
        + '<div class="envelope-to">致 你</div>'
        + '</div>'
        + '<div class="envelope-paper" id="envelopePaper" style="' + paperStyle + '">'
        + '<div class="paper-date">' + letter.date + '</div>'
        + '<div class="paper-content">' + letter.content + '</div>'
        + '<div class="paper-signature">—— ' + letter.author + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}

// ========== 展开信封 ==========
function openEnvelope() {
    if (letterIsOpen) return;
    letterIsOpen = true;
    var envelope = document.getElementById('letterEnvelope');
    if (envelope) {
        envelope.classList.add('open');
    }
}

// ========== 翻信 ==========
function prevLetter() {
    if (letterCurrentIndex > 0) {
        letterCurrentIndex--;
        letterIsOpen = false;
        renderLetterApp();
    }
}

function nextLetter() {
    var letters = getLetters();
    if (letterCurrentIndex < letters.length - 1) {
        letterCurrentIndex++;
        letterIsOpen = false;
        renderLetterApp();
    }
}

// ========== 回信弹窗 ==========
function openReplyModal() {
    var contactId = getLetterSelectedChar();
    if (!contactId) {
        showToast('请先在设置中选择角色');
        return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'letter-reply-overlay';
    overlay.id = 'letterReplyOverlay';
    overlay.innerHTML = ''
        + '<div class="letter-reply-panel">'
        + '<div class="letter-reply-handle" id="letterReplyHandle"></div>'
        + '<div class="letter-reply-title">回信</div>'
        + '<textarea class="letter-reply-textarea" id="letterReplyInput" placeholder="写下你想说的话…"></textarea>'
        + '<button class="letter-reply-send" onclick="sendReply()">发送回信</button>'
        + '</div>';
    document.body.appendChild(overlay);

    overlay.onclick = function(e) { if (e.target === overlay) closeReplyModal(); };

    var handle = document.getElementById('letterReplyHandle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 40) closeReplyModal(); });
    handle.addEventListener('click', function() { closeReplyModal(); });
}

function closeReplyModal() {
    var overlay = document.getElementById('letterReplyOverlay');
    if (overlay) overlay.remove();
}

function sendReply() {
    var input = document.getElementById('letterReplyInput');
    var text = input ? input.value.trim() : '';
    if (!text) { showToast('请输入回信内容'); return; }

    var contactId = getLetterSelectedChar();
    var contact = window.ChatConfig && window.ChatConfig.contacts
        ? window.ChatConfig.contacts.find(function(c) { return c.id === contactId; })
        : null;

    // 保存回信到聊天记录
    if (contact && typeof appendMessage === 'function') {
        var storageKey = 'chat_history_' + contactId;
        var saved = localStorage.getItem(storageKey) || '';
        var now = new Date();
        var h = now.getHours(); var m = now.getMinutes().toString().padStart(2, '0');
        var period = h < 12 ? '上午' : '下午'; var displayH = h % 12 || 12;
        var timeStr = period + ' ' + displayH + ':' + m;
        var htmlToAdd = ''
            + '<div class="chat-time-stamp">' + timeStr + '</div>'
            + '<div class="bubble-row user" data-role="user">'
            + '<div class="bubble-avatar user-avatar">我</div>'
            + '<div class="bubble bubble-user">' + text + '</div>'
            + '</div>'
            + '<div class="bubble-narration">（回信）</div>';
        localStorage.setItem(storageKey, saved + htmlToAdd);
    }

    closeReplyModal();
    showToast('回信已发送');
}

// ========== 日历 ==========
function openLetterCalendar() {
    var overlay = document.createElement('div');
    overlay.className = 'letter-calendar-overlay';
    overlay.id = 'letterCalendarOverlay';
    overlay.innerHTML = ''
        + '<div class="letter-calendar-panel">'
        + '<div class="letter-calendar-header">'
        + '<span onclick="letterCalendarChangeMonth(-1)">‹</span>'
        + '<span class="letter-calendar-month" id="letterCalendarMonth"></span>'
        + '<span onclick="letterCalendarChangeMonth(1)">›</span>'
        + '</div>'
        + '<div class="letter-calendar-grid" id="letterCalendarGrid"></div>'
        + '<div class="letter-calendar-close" onclick="closeLetterCalendar()">关闭</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeLetterCalendar(); };
    renderLetterCalendarGrid();
}

function closeLetterCalendar() {
    var overlay = document.getElementById('letterCalendarOverlay');
    if (overlay) overlay.remove();
}

function letterCalendarChangeMonth(delta) {
    letterCalendarDate.setMonth(letterCalendarDate.getMonth() + delta);
    renderLetterCalendarGrid();
}

function renderLetterCalendarGrid() {
    var monthEl = document.getElementById('letterCalendarMonth');
    var gridEl = document.getElementById('letterCalendarGrid');
    if (!monthEl || !gridEl) return;

    var year = letterCalendarDate.getFullYear();
    var month = letterCalendarDate.getMonth();
    monthEl.textContent = year + '年' + (month + 1) + '月';

    var letters = getLetters();
    var letterDates = {};
    letters.forEach(function(l, index) { letterDates[l.date] = index; });

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date();
    var todayKey = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';

    var html = '';
    var dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    dayNames.forEach(function(d) { html += '<div class="letter-calendar-day-name">' + d + '</div>'; });
    for (var i = 0; i < firstDay; i++) html += '<div></div>';
    for (var d = 1; d <= daysInMonth; d++) {
        var dateKey = year + '年' + (month + 1) + '月' + d + '日';
        var hasLetter = letterDates[dateKey] !== undefined;
        var isToday = dateKey === todayKey;
        var cls = 'letter-calendar-day';
        if (hasLetter) cls += ' has-letter';
        if (isToday) cls += ' today';
        if (hasLetter) {
            html += '<div class="' + cls + '" onclick="jumpToLetter(' + letterDates[dateKey] + ')">' + d + '</div>';
        } else {
            html += '<div class="' + cls + '">' + d + '</div>';
        }
    }
    gridEl.innerHTML = html;
}

function jumpToLetter(index) {
    closeLetterCalendar();
    letterCurrentIndex = index;
    letterIsOpen = false;
    renderLetterApp();
}

// ========== 设置面板 ==========
function openLetterSettings() {
    var fontSettings = getLetterFontSettings();
    var contactId = getLetterSelectedChar();

    var overlay = document.createElement('div');
    overlay.className = 'letter-settings-overlay';
    overlay.id = 'letterSettingsOverlay';
    overlay.innerHTML = ''
        + '<div class="letter-settings-panel">'
        + '<div class="letter-settings-handle" id="letterSettingsHandle"></div>'
        + '<div class="letter-settings-title">信件设置</div>'

        + '<div class="letter-settings-section">选择角色</div>'
        + '<div id="letterCharList"></div>'
        + '<button class="letter-btn-save" onclick="saveLetterChar()">保存角色</button>'

        + '<div class="letter-font-header" onclick="toggleLetterFontSection()">'
        + '<span>信件字体</span>'
        + '<span class="arrow" id="letterFontArrow">∨</span>'
        + '</div>'
        + '<div class="letter-font-body" id="letterFontBody">'
        + '<div class="letter-font-preview" id="letterFontPreview" style="'
        + 'font-size:' + (15 + parseInt(fontSettings.size) / 5) + 'px;'
        + 'color:' + fontSettings.color + ';'
        + (fontSettings.fontFamily ? 'font-family:' + fontSettings.fontFamily + ';' : '')
        + '">你好呀，见字如面。</div>'

        + '<div class="letter-font-slider-row">'
        + '<span>字体大小</span>'
        + '<span id="letterFontSizeVal">' + fontSettings.size + '</span>'
        + '</div>'
        + '<input type="range" min="-50" max="50" value="' + fontSettings.size + '" class="letter-font-slider"'
        + ' oninput="document.getElementById(\'letterFontSizeVal\').innerText=this.value; document.getElementById(\'letterFontPreview\').style.fontSize=' + (15 + parseInt(fontSettings.size) / 5) + ' + \'px\';">'

        + '<div style="font-size:13px;color:#666;margin:10px 0 6px;">字体颜色</div>'
        + '<div class="letter-color-row">'
        + '<div class="letter-color-dot" style="background:#3a2a1a;" onclick="previewLetterFontColor(\'#3a2a1a\')"></div>'
        + '<div class="letter-color-dot" style="background:#5c4a3a;" onclick="previewLetterFontColor(\'#5c4a3a\')"></div>'
        + '<div class="letter-color-dot" style="background:#8e7a6a;" onclick="previewLetterFontColor(\'#8e7a6a\')"></div>'
        + '<div class="letter-color-dot" style="background:#2a4a6a;" onclick="previewLetterFontColor(\'#2a4a6a\')"></div>'
        + '<div class="letter-color-dot" style="background:#4a3a5a;" onclick="previewLetterFontColor(\'#4a3a5a\')"></div>'
        + '<input type="color" class="letter-color-picker" onchange="previewLetterFontColor(this.value)">'
        + '</div>'

        + '<div style="font-size:13px;color:#666;margin:10px 0 6px;">字体上传</div>'
        + '<div class="letter-upload-box" onclick="document.getElementById(\'letterFontFileInput\').click()">点击上传字体文件</div>'
        + '<input type="file" id="letterFontFileInput" accept=".ttf,.otf,.woff,.woff2" style="display:none;" onchange="handleLetterFontUpload(event)">'

        + '<button class="letter-btn-save" onclick="saveLetterFont()">保存字体</button>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);

    overlay.onclick = function(e) { if (e.target === overlay) closeLetterSettings(); };

    var handle = document.getElementById('letterSettingsHandle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 40) closeLetterSettings(); });
    handle.addEventListener('click', function() { closeLetterSettings(); });

    renderLetterCharList();
}

function closeLetterSettings() {
    var overlay = document.getElementById('letterSettingsOverlay');
    if (overlay) overlay.remove();
}

function renderLetterCharList() {
    var list = document.getElementById('letterCharList');
    if (!list) return;
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var selected = getLetterSelectedChar();
    var html = '';
    contacts.forEach(function(c) {
        var isActive = c.id === selected;
        html += '<div class="letter-char-item' + (isActive ? ' active' : '') + '" onclick="selectLetterChar(\'' + c.id + '\')">' + c.name + (isActive ? ' ✓' : '') + '</div>';
    });
    list.innerHTML = html || '<div style="color:#999;font-size:13px;">暂无角色</div>';
}

function selectLetterChar(id) {
    localStorage.setItem('letter_selected_char', id);
    renderLetterCharList();
}

function saveLetterChar() {
    showToast('角色已保存');
    closeLetterSettings();
}

// ========== 字体设置 ==========
var letterPreviewColor = '#3a2a1a';

function previewLetterFontColor(color) {
    letterPreviewColor = color;
    var preview = document.getElementById('letterFontPreview');
    if (preview) preview.style.color = color;
}

function handleLetterFontUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        localStorage.setItem('letter_custom_font', ev.target.result);
        localStorage.setItem('letter_custom_font_name', file.name);
        showToast('字体已上传：' + file.name);
    };
    reader.readAsDataURL(file);
}

function toggleLetterFontSection() {
    var body = document.getElementById('letterFontBody');
    var arrow = document.getElementById('letterFontArrow');
    if (body && arrow) {
        var isOpen = body.classList.toggle('open');
        arrow.classList.toggle('open', isOpen);
    }
}

function saveLetterFont() {
    var size = parseInt(document.getElementById('letterFontSizeVal').innerText);
    var settings = { size: size, color: letterPreviewColor, fontFamily: '' };
    var customFontName = localStorage.getItem('letter_custom_font_name');
    if (customFontName) {
        settings.fontFamily = '"' + customFontName.replace(/\.[^.]+$/, '') + '"';
    }
    saveLetterFontSettings(settings);
    closeLetterSettings();
    renderLetterApp();
    showToast('字体已保存');
}

// ========== 生成信件（基于聊天记录） ==========
function generateLetter() {
    if (isLetterGenerating) { showToast('信件正在生成中…'); return; }
    var contactId = getLetterSelectedChar();
    if (!contactId) { showToast('请先在设置中选择角色'); return; }

    var today = new Date();
    var dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';
    var letters = getLetters();
    if (letters.length > 0 && letters[letters.length - 1].date === dateStr) {
        showToast('今天已经有信件了');
        return;
    }

    var contact = window.ChatConfig && window.ChatConfig.contacts
        ? window.ChatConfig.contacts.find(function(c) { return c.id === contactId; })
        : null;
    var author = contact ? contact.name : '角色';

    // 读取最近聊天记录
    var chatHistory = '';
    if (typeof getRecentHistory === 'function') {
        var history = getRecentHistory(contactId, 30);
        history.forEach(function(m) {
            var roleName = m.role === 'user' ? '用户' : author;
            chatHistory += roleName + '：' + m.content + '\n';
        });
    }

    isLetterGenerating = true;
    var toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.textContent = '正在生成信件…';
    document.body.appendChild(toast);

    var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(contactId) : '';
    var prompt = '请以' + author + '的口吻，根据最近的聊天记录给用户写一封信。\n'
        + '【字数要求】150~200字，必须在这个范围内。\n'
        + '【格式要求】有称呼、正文、落款。像真人写信一样自然。\n'
        + '【内容要求】根据聊天记录分享你的心情、对用户的想念、日常小事。\n\n'
        + '最近的聊天记录：\n' + (chatHistory || '暂无聊天记录');

    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            toast.remove();
            isLetterGenerating = false;
            var clean = reply.replace(/\{[^}]*\}/g, '').trim();
            if (!clean) { showToast('信件生成失败'); return; }
            letters.push({ date: dateStr, content: clean, author: author });
            saveLetters(letters);
            letterCurrentIndex = letters.length - 1;
            letterIsOpen = false;
            renderLetterApp();
            showToast('信件已送达');
        }).catch(function() {
            toast.remove();
            isLetterGenerating = false;
            showToast('生成失败，请重试');
        });
    } else {
        toast.remove();
        isLetterGenerating = false;
        showToast('API未配置');
    }
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {});
