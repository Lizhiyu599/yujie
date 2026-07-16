/**
 * 玉界 - 纸语（备忘录·电子手账）
 * 包含：分类管理、随手记、装饰系统、纸张背景、数据持久化
 */

// ========== 数据存储 ==========
function getPaperNotes() {
    var raw = localStorage.getItem('paper_notes');
    return raw ? JSON.parse(raw) : [];
}

function savePaperNotes(notes) {
    localStorage.setItem('paper_notes', JSON.stringify(notes));
}

function getPaperCategories() {
    var raw = localStorage.getItem('paper_categories');
    if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
    }
    var defaults = ['日记', '笔记', '随手记'];
    localStorage.setItem('paper_categories', JSON.stringify(defaults));
    return defaults;
}

function savePaperCategories(categories) {
    localStorage.setItem('paper_categories', JSON.stringify(categories));
}

// ========== 当前状态 ==========
var paperCurrentCategory = '全部';
var paperEditingNoteId = null;

// ========== 打开纸语 ==========
function openPaper() {
    var appWindow = document.getElementById('paperAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'paperAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f5f0e8;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    paperCurrentCategory = '全部';
    paperEditingNoteId = null;
    renderPaperApp();
    appWindow.style.display = 'flex';
}

function closePaper() {
    var appWindow = document.getElementById('paperAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染主界面 ==========
function renderPaperApp() {
    var appWindow = document.getElementById('paperAppWindow');
    if (!appWindow) return;

    var categories = getPaperCategories();
    var notes = getPaperNotes();
    var filteredNotes = paperCurrentCategory === '全部'
        ? notes
        : notes.filter(function(n) { return n.category === paperCurrentCategory; });

    // 分类标签
    var categoryTabs = '<span class="paper-cat-tab ' + (paperCurrentCategory === '全部' ? 'active' : '') + '" onclick="switchPaperCategory(\'全部\')">全部</span>';
    categories.forEach(function(cat) {
        categoryTabs += '<span class="paper-cat-tab ' + (paperCurrentCategory === cat ? 'active' : '') + '" onclick="switchPaperCategory(\'' + cat + '\')">' + cat + '</span>';
    });
    categoryTabs += '<span class="paper-cat-tab add" onclick="addPaperCategory()">+</span>';

    // 笔记列表
    var notesHTML = '';
    if (filteredNotes.length === 0) {
        notesHTML = '<div class="paper-empty">'
            + '<div class="paper-empty-icon">📝</div>'
            + '<div class="paper-empty-text">还没有笔记</div>'
            + '<div class="paper-empty-hint">点击右下角 + 开始记录</div>'
            + '</div>';
    } else {
        filteredNotes.forEach(function(note) {
            var preview = note.content.replace(/\n/g, ' ').substring(0, 60);
            var bgStyle = note.paperBg ? 'background-image:url(' + note.paperBg + ');background-size:cover;' : '';
            notesHTML += ''
                + '<div class="paper-note-card" style="' + bgStyle + '" onclick="openPaperNote(\'' + note.id + '\')">'
                + '<div class="paper-note-time">' + formatPaperTime(note.time) + '</div>'
                + '<div class="paper-note-preview">' + preview + '</div>'
                + '<div class="paper-note-meta">'
                + '<span class="paper-note-cat">' + note.category + '</span>'
                + '</div>'
                + '</div>';
        });
    }

    appWindow.innerHTML = ''
        + '<div class="paper-app">'
        + '<div class="paper-top-bar">'
        + '<div class="paper-back-btn" onclick="closePaper()">‹</div>'
        + '<div class="paper-top-title">纸 语</div>'
        + '<div class="paper-top-spacer"></div>'
        + '</div>'
        + '<div class="paper-categories">' + categoryTabs + '</div>'
        + '<div class="paper-body">' + notesHTML + '</div>'
        + '<div class="paper-fab" onclick="openPaperNote(\'new\')">+</div>'
        + '</div>';
}

// ========== 切换分类 ==========
function switchPaperCategory(cat) {
    paperCurrentCategory = cat;
    renderPaperApp();
}

// ========== 添加分类 ==========
function addPaperCategory() {
    var overlay = document.createElement('div');
    overlay.className = 'paper-modal-overlay';
    overlay.id = 'paperCatOverlay';
    overlay.innerHTML = ''
        + '<div class="paper-modal-panel">'
        + '<div class="paper-modal-title">新建分类</div>'
        + '<input type="text" class="paper-modal-input" id="paperCatInput" placeholder="分类名称">'
        + '<div class="paper-modal-btns">'
        + '<button class="paper-btn-cancel" onclick="closePaperCatModal()">取消</button>'
        + '<button class="paper-btn-confirm" onclick="confirmAddPaperCategory()">确定</button>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaperCatModal(); };
}

function closePaperCatModal() {
    var overlay = document.getElementById('paperCatOverlay');
    if (overlay) overlay.remove();
}

function confirmAddPaperCategory() {
    var input = document.getElementById('paperCatInput');
    var name = input ? input.value.trim() : '';
    closePaperCatModal();
    if (!name) return;
    var categories = getPaperCategories();
    if (categories.indexOf(name) >= 0) { showToast('分类已存在'); return; }
    categories.push(name);
    savePaperCategories(categories);
    paperCurrentCategory = name;
    renderPaperApp();
}

// ========== 打开/新建笔记 ==========
function openPaperNote(noteId) {
    var note = null;
    if (noteId !== 'new') {
        var notes = getPaperNotes();
        note = notes.find(function(n) { return n.id === noteId; });
    }
    paperEditingNoteId = noteId;
    renderPaperEditor(note);
}

// ========== 渲染笔记编辑器 ==========
function renderPaperEditor(note) {
    var appWindow = document.getElementById('paperAppWindow');
    if (!appWindow) return;

    var content = note ? note.content : '';
    var category = note ? note.category : '随手记';
    var paperBg = note ? (note.paperBg || '') : '';
    var decorations = note ? (note.decorations || []) : [];

    var categories = getPaperCategories();
    var catOptions = '';
    categories.forEach(function(cat) {
        catOptions += '<option value="' + cat + '" ' + (cat === category ? 'selected' : '') + '>' + cat + '</option>';
    });

    // 装饰小图标
    var decoHTML = '';
    decorations.forEach(function(d) {
        decoHTML += '<img src="' + d.src + '" class="paper-deco-img" style="left:' + d.x + '%;top:' + d.y + '%;width:' + d.w + 'px;" onclick="removePaperDeco(this, \'' + d.src + '\')">';
    });

    appWindow.innerHTML = ''
        + '<div class="paper-app">'
        + '<div class="paper-top-bar">'
        + '<div class="paper-back-btn" onclick="saveAndExitPaperEditor()">‹</div>'
        + '<div class="paper-top-title">编辑</div>'
        + '<div class="paper-top-actions">'
        + '<span class="paper-btn-deco" onclick="openPaperDecoPanel()">🎀</span>'
        + '<span class="paper-btn-bg" onclick="openPaperBgPanel()">🖼</span>'
        + '</div>'
        + '</div>'
        + '<div class="paper-editor-body" style="' + (paperBg ? 'background-image:url(' + paperBg + ');background-size:cover;background-position:center;' : '') + '" id="paperEditorBody">'
        + decoHTML
        + '<select class="paper-cat-select" id="paperCatSelect">' + catOptions + '</select>'
        + '<textarea class="paper-textarea" id="paperTextarea" placeholder="在此书写...">' + content + '</textarea>'
        + '</div>'
        + '<div class="paper-editor-bottom">'
        + (note ? '<button class="paper-btn-delete" onclick="deletePaperNote(\'' + note.id + '\')">删除</button>' : '')
        + '</div>'
        + '</div>';
}

// ========== 保存笔记 ==========
function saveAndExitPaperEditor() {
    var textarea = document.getElementById('paperTextarea');
    var catSelect = document.getElementById('paperCatSelect');
    if (!textarea) { renderPaperApp(); return; }

    var content = textarea.value.trim();
    var category = catSelect ? catSelect.value : '随手记';

    if (!content && paperEditingNoteId === 'new') {
        renderPaperApp();
        return;
    }

    var notes = getPaperNotes();

    if (paperEditingNoteId === 'new') {
        if (!content) { renderPaperApp(); return; }
        notes.unshift({
            id: 'note_' + Date.now(),
            content: content,
            category: category,
            time: Date.now(),
            paperBg: '',
            decorations: []
        });
    } else {
        var index = notes.findIndex(function(n) { return n.id === paperEditingNoteId; });
        if (index >= 0) {
            if (!content) {
                notes.splice(index, 1);
            } else {
                notes[index].content = content;
                notes[index].category = category;
                notes[index].time = Date.now();
            }
        }
    }

    savePaperNotes(notes);
    paperEditingNoteId = null;
    renderPaperApp();
}

// ========== 删除笔记 ==========
function deletePaperNote(noteId) {
    var notes = getPaperNotes();
    notes = notes.filter(function(n) { return n.id !== noteId; });
    savePaperNotes(notes);
    paperEditingNoteId = null;
    renderPaperApp();
    showToast('笔记已删除');
}

// ========== 背景纸面板 ==========
function openPaperBgPanel() {
    var overlay = document.createElement('div');
    overlay.className = 'paper-modal-overlay';
    overlay.id = 'paperBgOverlay';
    overlay.innerHTML = ''
        + '<div class="paper-modal-panel">'
        + '<div class="paper-modal-title">选择纸张</div>'
        + '<div class="paper-bg-grid">'
        + '<div class="paper-bg-item" onclick="setPaperBg(\'\')" style="background:#fdfaf3;">纯色</div>'
        + '<div class="paper-bg-item" onclick="setPaperBg(\'https://i.ibb.co/placeholder/grid.png\')" style="background:#f9f6f0;">网格</div>'
        + '<div class="paper-bg-item" onclick="setPaperBg(\'https://i.ibb.co/placeholder/dot.png\')" style="background:#faf8f4;">点阵</div>'
        + '<div class="paper-bg-item" onclick="document.getElementById(\'paperBgUpload\').click()" style="background:rgba(0,0,0,0.03);">+ 自定义</div>'
        + '<input type="file" id="paperBgUpload" accept="image/*" style="display:none;" onchange="uploadPaperBg(event)">'
        + '</div>'
        + '<button class="paper-btn-cancel" onclick="closePaperBgPanel()">关闭</button>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaperBgPanel(); };
}

function closePaperBgPanel() {
    var overlay = document.getElementById('paperBgOverlay');
    if (overlay) overlay.remove();
}

function setPaperBg(src) {
    var body = document.getElementById('paperEditorBody');
    if (body) {
        body.style.backgroundImage = src ? 'url(' + src + ')' : '';
        body.style.backgroundSize = src ? 'cover' : '';
        body.style.backgroundPosition = src ? 'center' : '';
    }
    window._paperTempBg = src;
    closePaperBgPanel();
}

function uploadPaperBg(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        setPaperBg(ev.target.result);
    };
    reader.readAsDataURL(file);
}

// ========== 装饰面板 ==========
function openPaperDecoPanel() {
    var overlay = document.createElement('div');
    overlay.className = 'paper-modal-overlay';
    overlay.id = 'paperDecoOverlay';
    overlay.innerHTML = ''
        + '<div class="paper-modal-panel">'
        + '<div class="paper-modal-title">添加装饰</div>'
        + '<div class="paper-deco-grid">'
        + '<div class="paper-deco-item" onclick="addPaperDeco(\'🌸\')">🌸</div>'
        + '<div class="paper-deco-item" onclick="addPaperDeco(\'⭐\')">⭐</div>'
        + '<div class="paper-deco-item" onclick="addPaperDeco(\'💫\')">💫</div>'
        + '<div class="paper-deco-item" onclick="addPaperDeco(\'🍀\')">🍀</div>'
        + '<div class="paper-deco-item" onclick="addPaperDeco(\'🌙\')">🌙</div>'
        + '<div class="paper-deco-item" onclick="addPaperDeco(\'☁️\')">☁️</div>'
        + '<div class="paper-deco-item" onclick="addPaperDeco(\'🦋\')">🦋</div>'
        + '<div class="paper-deco-item" onclick="addPaperDeco(\'🎵\')">🎵</div>'
        + '<div class="paper-deco-item" onclick="document.getElementById(\'paperDecoUpload\').click()">+</div>'
        + '<input type="file" id="paperDecoUpload" accept="image/*" style="display:none;" onchange="uploadPaperDeco(event)">'
        + '</div>'
        + '<button class="paper-btn-cancel" onclick="closePaperDecoPanel()">关闭</button>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaperDecoPanel(); };
}

function closePaperDecoPanel() {
    var overlay = document.getElementById('paperDecoOverlay');
    if (overlay) overlay.remove();
}

function addPaperDeco(src) {
    var body = document.getElementById('paperEditorBody');
    if (!body) return;
    var img = document.createElement('img');
    img.src = src;
    img.className = 'paper-deco-img';
    img.style.cssText = 'position:absolute;left:' + (10 + Math.random() * 60) + '%;top:' + (10 + Math.random() * 60) + '%;width:40px;pointer-events:auto;';
    img.onclick = function() { removePaperDeco(img, src); };
    body.appendChild(img);
    closePaperDecoPanel();
}

function uploadPaperDeco(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        addPaperDeco(ev.target.result);
    };
    reader.readAsDataURL(file);
}

function removePaperDeco(el, src) {
    el.remove();
}

// ========== 格式化时间 ==========
function formatPaperTime(timestamp) {
    var d = new Date(timestamp);
    return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {});
