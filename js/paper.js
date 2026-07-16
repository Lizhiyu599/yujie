/**
 * 玉界 - 纸语（备忘录·电子手账）
 * 书架样式、分类管理、装饰系统、纸张背景
 */

// ========== 内置封面 ==========
var PAPER_COVERS = [
    'https://i.ibb.co/kVs1WT4y/1784182209547.png'
];

// ========== 装饰素材库 ==========
var PAPER_DECOS = [
    'https://i.ibb.co/zW6Cztm3/1784179491713.png',
    'https://i.ibb.co/BH0jRDhg/1784179512627.png',
    'https://i.ibb.co/HDvrPyJb/1784179530559.png',
    'https://i.ibb.co/xSbq3PV0/1784179557806.png',
    'https://i.ibb.co/8DSVrtqG/1784179573955.png',
    'https://i.ibb.co/Dfjt7hpN/1784179626535.png',
    'https://i.ibb.co/j95gWbRY/1784179652015.png'
];

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
    if (raw) { try { return JSON.parse(raw); } catch(e) {} }
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
var paperDecoIdCounter = 0;

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

    var categoryTabs = '<span class="paper-cat-tab ' + (paperCurrentCategory === '全部' ? 'active' : '') + '" onclick="switchPaperCategory(\'全部\')">全部</span>';
    categories.forEach(function(cat) {
        categoryTabs += '<span class="paper-cat-tab ' + (paperCurrentCategory === cat ? 'active' : '') + '" onclick="switchPaperCategory(\'' + cat + '\')">' + cat + '</span>';
    });
    categoryTabs += '<span class="paper-cat-tab add" onclick="addPaperCategory()">+</span>';

    var notesHTML = '';
    if (filteredNotes.length === 0) {
        notesHTML = '<div class="paper-empty">'
            + '<div class="paper-empty-icon">📝</div>'
            + '<div class="paper-empty-text">还没有笔记</div>'
            + '<div class="paper-empty-hint">点击右下角 + 开始记录</div>'
            + '</div>';
    } else {
        notesHTML = '<div class="paper-shelf">';
        filteredNotes.forEach(function(note, index) {
            var coverSrc = note.cover || PAPER_COVERS[0];
            var preview = note.content.replace(/\n/g, ' ').substring(0, 30);
            notesHTML += ''
                + '<div class="paper-book" id="book_' + note.id + '" '
                + 'onclick="openPaperNote(\'' + note.id + '\')" '
                + 'ontouchstart="startBookLongPress(event, \'' + note.id + '\')" '
                + 'ontouchend="cancelBookLongPress()" '
                + 'ontouchmove="cancelBookLongPress()">'
                + '<div class="paper-book-cover" style="background-image:url(' + coverSrc + ');background-size:cover;background-position:center;"></div>'
                + '<div class="paper-book-spine"></div>'
                + '<div class="paper-book-info">'
                + '<div class="paper-book-cat">' + note.category + '</div>'
                + '<div class="paper-book-preview">' + preview + '</div>'
                + '</div>'
                + '</div>';
        });
        notesHTML += '</div>';
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

// ========== 长按删除 ==========
var bookLongPressTimer = null;
function startBookLongPress(e, noteId) {
    bookLongPressTimer = setTimeout(function() {
        confirmDeletePaperNote(noteId);
    }, 600);
}
function cancelBookLongPress() {
    if (bookLongPressTimer) { clearTimeout(bookLongPressTimer); bookLongPressTimer = null; }
}

function confirmDeletePaperNote(noteId) {
    var overlay = document.createElement('div');
    overlay.className = 'paper-confirm-overlay';
    overlay.id = 'paperConfirmOverlay';
    overlay.innerHTML = ''
        + '<div class="paper-confirm-dialog">'
        + '<p>确认删除这本笔记？</p>'
        + '<div class="paper-confirm-btns">'
        + '<button class="paper-btn-cancel" onclick="closePaperConfirm()">取消</button>'
        + '<button class="paper-btn-confirm" onclick="executeDeletePaperNote(\'' + noteId + '\')">删除</button>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaperConfirm(); };
}

function closePaperConfirm() {
    var overlay = document.getElementById('paperConfirmOverlay');
    if (overlay) overlay.remove();
}

function executeDeletePaperNote(noteId) {
    closePaperConfirm();
    var notes = getPaperNotes();
    notes = notes.filter(function(n) { return n.id !== noteId; });
    savePaperNotes(notes);
    renderPaperApp();
    showToast('笔记已删除');
}

function switchPaperCategory(cat) {
    paperCurrentCategory = cat;
    renderPaperApp();
}

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
    paperDecoIdCounter = 0;
    renderPaperEditor(note);
}

// ========== 渲染笔记编辑器 ==========
function renderPaperEditor(note) {
    var appWindow = document.getElementById('paperAppWindow');
    if (!appWindow) return;

    var content = note ? note.content : '';
    var category = note ? note.category : '随手记';
    var paperBg = note ? (note.paperBg || '') : '';
    var paperBgType = note ? (note.paperBgType || '') : '';
    var decorations = note ? (note.decorations || []) : [];
    var cover = note ? (note.cover || PAPER_COVERS[0]) : PAPER_COVERS[0];

    var categories = getPaperCategories();
    var catOptions = '';
    categories.forEach(function(cat) {
        catOptions += '<option value="' + cat + '" ' + (cat === category ? 'selected' : '') + '>' + cat + '</option>';
    });

    var decoHTML = '';
    decorations.forEach(function(d, i) {
        decoHTML += '<div class="paper-deco-wrapper" id="deco_' + i + '" '
            + 'style="left:' + (d.x || 10) + '%;top:' + (d.y || 10) + '%;width:' + (d.w || 60) + 'px;transform:rotate(' + (d.r || 0) + 'deg);" '
            + 'data-x="' + (d.x || 10) + '" data-y="' + (d.y || 10) + '" data-w="' + (d.w || 60) + '" data-r="' + (d.r || 0) + '" data-src="' + d.src + '">'
            + '<img src="' + d.src + '" class="paper-deco-img" style="width:100%;height:auto;pointer-events:none;">'
            + '<span class="paper-deco-del" onclick="event.stopPropagation();removePaperDecoById(' + i + ')">×</span>'
            + '</div>';
    });

    var bgClass = '';
    if (paperBgType === 'grid') bgClass = 'paper-bg-grid-pattern';
    else if (paperBgType === 'dot') bgClass = 'paper-bg-dot-pattern';

    appWindow.innerHTML = ''
        + '<div class="paper-app">'
        + '<div class="paper-top-bar">'
        + '<div class="paper-back-btn" onclick="saveAndExitPaperEditor()">‹</div>'
        + '<div class="paper-top-spacer" style="flex:1;"></div>'
        + '<div class="paper-top-actions">'
        + '<span class="paper-btn-deco" onclick="openPaperDecoPanel()"><img src="https://i.ibb.co/xK84zd6Y/retouch-2026071613485866.png" style="width:24px;height:24px;"></span>'
        + '<span class="paper-btn-bg" onclick="openPaperBgPanel()"><img src="https://i.ibb.co/84YWCWgh/retouch-2026071613494498.png" style="width:24px;height:24px;"></span>'
        + '</div>'
        + '</div>'
        + '<div class="paper-editor-body ' + bgClass + '" style="' + (paperBg && !paperBgType ? 'background-image:url(' + paperBg + ');background-size:cover;background-position:center;' : '') + '" id="paperEditorBody">'
        + '<div id="paperDecoContainer">' + decoHTML + '</div>'
        + '<div class="paper-editor-row">'
        + '<select class="paper-cat-select" id="paperCatSelect">' + catOptions + '</select>'
        + '<div class="paper-cover-select" onclick="openCoverPicker()" style="background-image:url(' + cover + ');background-size:cover;background-position:center;"></div>'
        + '</div>'
        + '<textarea class="paper-textarea" id="paperTextarea" placeholder="在此书写...">' + content + '</textarea>'
        + '</div>'
        + '</div>';

    setTimeout(bindDecoEvents, 200);
}

// ========== 封面选择 ==========
function openCoverPicker() {
    var overlay = document.createElement('div');
    overlay.className = 'paper-modal-overlay';
    overlay.id = 'paperCoverOverlay';
    var itemsHTML = '';
    PAPER_COVERS.forEach(function(src) {
        itemsHTML += '<div class="paper-cover-item" onclick="selectPaperCover(\'' + src + '\')" style="background-image:url(' + src + ');background-size:cover;background-position:center;"></div>';
    });
    itemsHTML += '<div class="paper-cover-item custom" onclick="document.getElementById(\'paperCoverUpload\').click()"><span>+</span></div>';
    overlay.innerHTML = ''
        + '<div class="paper-modal-panel">'
        + '<div class="paper-modal-title">选择封面</div>'
        + '<div class="paper-cover-grid">' + itemsHTML + '</div>'
        + '<input type="file" id="paperCoverUpload" accept="image/*" style="display:none;" onchange="uploadPaperCover(event)">'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeCoverPicker(); };
}

function closeCoverPicker() {
    var overlay = document.getElementById('paperCoverOverlay');
    if (overlay) overlay.remove();
}

function selectPaperCover(src) {
    window._paperTempCover = src;
    var el = document.querySelector('.paper-cover-select');
    if (el) { el.style.backgroundImage = 'url(' + src + ')'; }
    closeCoverPicker();
}

function uploadPaperCover(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        selectPaperCover(ev.target.result);
    };
    reader.readAsDataURL(file);
}

// ========== 保存笔记 ==========
function saveAndExitPaperEditor() {
    var textarea = document.getElementById('paperTextarea');
    var catSelect = document.getElementById('paperCatSelect');
    if (!textarea) { renderPaperApp(); return; }

    var content = textarea.value.trim();
    var category = catSelect ? catSelect.value : '随手记';

    var decorations = [];
    var wrappers = document.querySelectorAll('.paper-deco-wrapper');
    wrappers.forEach(function(w) {
        decorations.push({
            src: w.getAttribute('data-src'),
            x: parseFloat(w.getAttribute('data-x')),
            y: parseFloat(w.getAttribute('data-y')),
            w: parseInt(w.getAttribute('data-w')),
            r: parseInt(w.getAttribute('data-r'))
        });
    });

    if (!content && paperEditingNoteId === 'new') { renderPaperApp(); return; }

    var notes = getPaperNotes();
    if (paperEditingNoteId === 'new') {
        if (!content) { renderPaperApp(); return; }
        notes.unshift({
            id: 'note_' + Date.now(),
            content: content,
            category: category,
            time: Date.now(),
            paperBg: window._paperTempBg || '',
            paperBgType: window._paperTempBgType || '',
            decorations: decorations,
            cover: window._paperTempCover || PAPER_COVERS[0]
        });
    } else {
        var index = notes.findIndex(function(n) { return n.id === paperEditingNoteId; });
        if (index >= 0) {
            if (!content) { notes.splice(index, 1); }
            else {
                notes[index].content = content;
                notes[index].category = category;
                notes[index].time = Date.now();
                notes[index].paperBg = window._paperTempBg || notes[index].paperBg || '';
                notes[index].paperBgType = window._paperTempBgType || notes[index].paperBgType || '';
                notes[index].decorations = decorations;
                notes[index].cover = window._paperTempCover || notes[index].cover || PAPER_COVERS[0];
            }
        }
    }

    savePaperNotes(notes);
    paperEditingNoteId = null;
    window._paperTempBg = '';
    window._paperTempBgType = '';
    window._paperTempCover = '';
    renderPaperApp();
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
        + '<div class="paper-bg-item plain" onclick="setPaperBg(\'\', \'\')"><span>纯色</span></div>'
        + '<div class="paper-bg-item grid" onclick="setPaperBg(\'\', \'grid\')"><span>网格</span></div>'
        + '<div class="paper-bg-item dot" onclick="setPaperBg(\'\', \'dot\')"><span>点阵</span></div>'
        + '<div class="paper-bg-item custom" onclick="document.getElementById(\'paperBgUpload\').click()"><span>+</span></div>'
        + '<input type="file" id="paperBgUpload" accept="image/*" style="display:none;" onchange="uploadPaperBg(event)">'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaperBgPanel(); };
}

function closePaperBgPanel() { var o = document.getElementById('paperBgOverlay'); if (o) o.remove(); }

function setPaperBg(src, type) {
    var body = document.getElementById('paperEditorBody');
    if (!body) return;
    body.style.backgroundImage = src ? 'url(' + src + ')' : '';
    body.style.backgroundSize = src ? 'cover' : '';
    body.style.backgroundPosition = src ? 'center' : '';
    body.classList.remove('paper-bg-grid-pattern', 'paper-bg-dot-pattern');
    if (type === 'grid') body.classList.add('paper-bg-grid-pattern');
    if (type === 'dot') body.classList.add('paper-bg-dot-pattern');
    window._paperTempBg = src;
    window._paperTempBgType = type;
    closePaperBgPanel();
}

function uploadPaperBg(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) { setPaperBg(ev.target.result, ''); };
    reader.readAsDataURL(file);
}

// ========== 装饰面板 ==========
function openPaperDecoPanel() {
    var overlay = document.createElement('div');
    overlay.className = 'paper-modal-overlay';
    overlay.id = 'paperDecoOverlay';
    var itemsHTML = '';
    PAPER_DECOS.forEach(function(src) {
        itemsHTML += '<div class="paper-deco-item" onclick="addPaperDeco(\'' + src + '\')"><img src="' + src + '" style="width:100%;height:100%;object-fit:contain;"></div>';
    });
    itemsHTML += '<div class="paper-deco-item custom" onclick="document.getElementById(\'paperDecoUpload\').click()"><span>+</span></div>';
    overlay.innerHTML = ''
        + '<div class="paper-modal-panel">'
        + '<div class="paper-modal-title">添加装饰</div>'
        + '<div class="paper-deco-grid">' + itemsHTML + '</div>'
        + '<input type="file" id="paperDecoUpload" accept="image/*" style="display:none;" onchange="uploadPaperDeco(event)">'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaperDecoPanel(); };
}

function closePaperDecoPanel() { var o = document.getElementById('paperDecoOverlay'); if (o) o.remove(); }

function addPaperDeco(src) {
    var container = document.getElementById('paperDecoContainer');
    if (!container) return;
    var idx = paperDecoIdCounter++;
    var wrapper = document.createElement('div');
    wrapper.className = 'paper-deco-wrapper';
    wrapper.id = 'deco_' + idx;
    wrapper.setAttribute('data-x', '30');
    wrapper.setAttribute('data-y', '30');
    wrapper.setAttribute('data-w', '70');
    wrapper.setAttribute('data-r', '0');
    wrapper.setAttribute('data-src', src);
    wrapper.style.cssText = 'left:30%;top:30%;width:70px;transform:rotate(0deg);';
    wrapper.innerHTML = ''
        + '<img src="' + src + '" class="paper-deco-img" style="width:100%;height:auto;pointer-events:none;">'
        + '<span class="paper-deco-del" onclick="event.stopPropagation();removePaperDecoById(' + idx + ')">×</span>';
    container.appendChild(wrapper);
    bindDecoEventsForWrapper(wrapper);
    closePaperDecoPanel();
}

function uploadPaperDeco(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) { addPaperDeco(ev.target.result); };
    reader.readAsDataURL(file);
}

function removePaperDecoById(idx) {
    var el = document.getElementById('deco_' + idx);
    if (el) el.remove();
}

// ========== 装饰交互 ==========
function bindDecoEvents() {
    document.querySelectorAll('.paper-deco-wrapper').forEach(function(w) { bindDecoEventsForWrapper(w); });
}

function bindDecoEventsForWrapper(wrapper) {
    var sx, sy, ox, oy, ow, or, sd = 0, sa = 0, dragging = false;
    wrapper.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('paper-deco-del')) return;
        e.stopPropagation();
        var t = e.touches;
        if (t.length === 1) { sx = t[0].clientX; sy = t[0].clientY; ox = parseFloat(wrapper.style.left); oy = parseFloat(wrapper.style.top); dragging = true; }
        else if (t.length === 2) { dragging = false; sd = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); sa = Math.atan2(t[0].clientY - t[1].clientY, t[0].clientX - t[1].clientX) * 180 / Math.PI; ow = parseInt(wrapper.getAttribute('data-w')); or = parseInt(wrapper.getAttribute('data-r')); }
        wrapper.style.transition = 'none'; wrapper.style.zIndex = '10';
    });
    wrapper.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var t = e.touches;
        if (t.length === 1 && dragging && sx) {
            var dx = (t[0].clientX - sx) / wrapper.parentElement.offsetWidth * 100;
            var dy = (t[0].clientY - sy) / wrapper.parentElement.offsetHeight * 100;
            wrapper.style.left = Math.max(0, Math.min(90, ox + dx)) + '%';
            wrapper.style.top = Math.max(0, Math.min(90, oy + dy)) + '%';
        } else if (t.length === 2 && sd > 0) {
            var d = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
            var a = Math.atan2(t[0].clientY - t[1].clientY, t[0].clientX - t[1].clientX) * 180 / Math.PI;
            var nw = Math.max(30, Math.min(250, ow * (d / sd)));
            var nr = or + (a - sa);
            wrapper.style.width = nw + 'px'; wrapper.style.transform = 'rotate(' + nr + 'deg)';
            wrapper.setAttribute('data-w', nw); wrapper.setAttribute('data-r', Math.round(nr));
        }
    });
    wrapper.addEventListener('touchend', function() {
        wrapper.style.transition = ''; wrapper.style.zIndex = '4';
        if (dragging) { wrapper.setAttribute('data-x', parseFloat(wrapper.style.left)); wrapper.setAttribute('data-y', parseFloat(wrapper.style.top)); }
        sx = null; sd = 0; dragging = false;
    });
}

// ========== 格式化时间 ==========
function formatPaperTime(timestamp) {
    var d = new Date(timestamp);
    return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

window.addEventListener('DOMContentLoaded', function() {});
