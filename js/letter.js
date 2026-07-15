/**
 * 玉界 - 信件软件
 * 包含：信封展示、展开动画、回信、日历跳转、信件设置、数据持久化
 * 一个角色一天最多一封信
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
        + renderLetterEnvelope(currentLetter)
        + '</div>'
        + '<div class="letter-bottom-bar">'
        + (hasLetters && letterCurrentIndex > 0 ? '<button class="letter-nav-btn" onclick="prevLetter()">‹ 上一封</button>' : '<div></div>')
        + '<button class="letter-reply-btn" onclick="replyLetter()">回 信</button>'
        + (hasLetters && letterCurrentIndex < letters.length - 1 ? '<button class="letter-nav-btn" onclick="nextLetter()">下一封 ›</button>' : '<div></div>')
        + '</div>'
        + '</div>';
}

// ========== 渲染信封 ==========
function renderLetterEnvelope(letter) {
    if (!letter) {
        return '<div class="letter-empty">'
            + '<div class="letter-empty-icon">✉</div>'
            + '<div class="letter-empty-text">暂无信件</div>'
            + '<div class="letter-empty-hint">角色会在这里给你写信</div>'
            + '</div>';
    }

    return ''
        + '<div class="letter-envelope ' + (letterIsOpen ? 'open' : '') + '" id="letterEnvelope" onclick="openEnvelope()">'
        + '<div class="envelope-body">'
        + '<div class="envelope-front">'
        + '<div class="envelope-stamp">' + (letter.stamp || '') + '</div>'
        + '<div class="envelope-flap"></div>'
        + '</div>'
        + '<div class="envelope-paper" id="envelopePaper">'
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

// ========== 回信 ==========
function replyLetter() {
    var contactId = getLetterSelectedChar();
    if (!contactId) {
        showToast('请先在设置中选择角色');
        return;
    }
    if (typeof openChat === 'function') {
        closeLetter();
        setTimeout(function() {
            openChat();
            setTimeout(function() {
                if (typeof enterChat === 'function') {
                    enterChat(contactId);
                }
            }, 300);
        }, 200);
    } else {
        showToast('聊天功能未加载');
    }
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

// ========== 设置 ==========
function openLetterSettings() {
    var overlay = document.createElement('div');
    overlay.className = 'letter-settings-overlay';
    overlay.id = 'letterSettingsOverlay';
    overlay.innerHTML = ''
        + '<div class="letter-settings-panel">'
        + '<div class="letter-settings-handle" id="letterSettingsHandle"></div>'
        + '<div class="letter-settings-title">信件设置</div>'
        + '<div class="letter-settings-section">选择角色</div>'
        + '<div id="letterCharList"></div>'
        + '<button class="letter-btn-save" onclick="saveLetterChar()">保存</button>'
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

// ========== 生成信件 ==========
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

    isLetterGenerating = true;
    var toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.textContent = '正在生成信件…';
    document.body.appendChild(toast);

    var systemPrompt = typeof buildSystemPrompt === 'function' ? buildSystemPrompt(contactId) : '';
    var prompt = '请以' + author + '的口吻，给用户写一封信。像真人写信一样，有称呼、正文、落款。内容可以分享最近的心情、对用户的想念、一些日常小事。字数300-500字。';

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
