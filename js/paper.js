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
    var decorations = note ? (note.decorations || []) : [];

    var categories = getPaperCategories();
    var catOptions = '';
    categories.forEach(function(cat) {
        catOptions += '<option value="' + cat + '" ' + (cat === category ? 'selected' : '') + '>' + cat + '</option>';
    });

    var decoHTML = '';
    decorations.forEach(function(d, i) {
        decoHTML += '<div class="paper-deco-wrapper" id="deco_' + i + '" style="left:' + (d.x || 10) + '%;top:' + (d.y || 10) + '%;width:' + (d.w || 60) + 'px;transform:rotate(' + (d.r || 0) + 'deg);" data-x="' + (d.x || 10) + '" data-y="' + (d.y || 10) + '" data-w="' + (d.w || 60) + '" data-r="' + (d.r || 0) + '" data-src="' + d.src + '">'
            + '<img src="' + d.src + '" class="paper-deco-img" style="width:100%;height:auto;pointer-events:none;">'
            + '<span class="paper-deco-del" onclick="removePaperDecoById(' + i + ')">×</span>'
            + '<span class="paper-deco-resize" onmousedown="startDecoResize(event, ' + i + ')" ontouchstart="startDecoResize(event, ' + i + ')"></span>'
            + '</div>';
    });

    appWindow.innerHTML = ''
        + '<div class="paper-app">'
        + '<div class="paper-top-bar">'
        + '<div class="paper-back-btn" onclick="saveAndExitPaperEditor()">‹</div>'
        + '<div class="paper-top-title">纸 语</div>'
        + '<div class="paper-top-actions">'
        + '<span class="paper-btn-deco" onclick="openPaperDecoPanel()">🎀</span>'
        + '<span class="paper-btn-bg" onclick="openPaperBgPanel()">🖼</span>'
        + '</div>'
        + '</div>'
        + '<div class="paper-editor-body" style="' + (paperBg ? 'background-image:url(' + paperBg + ');background-size:cover;background-position:center;' : '') + '" id="paperEditorBody">'
        + '<div id="paperDecoContainer" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:4;">' + decoHTML + '</div>'
        + '<select class="paper-cat-select" id="paperCatSelect">' + catOptions + '</select>'
        + '<textarea class="paper-textarea" id="paperTextarea" placeholder="在此书写...">' + content + '</textarea>'
        + '</div>'
        + '<div class="paper-editor-bottom">'
        + (note ? '<button class="paper-btn-delete" onclick="deletePaperNote(\'' + note.id + '\')">删除</button>' : '')
        + '</div>'
        + '</div>';

    // 绑定拖拽
    setTimeout(bindDecoDrag, 100);
}

// ========== 保存笔记 ==========
function saveAndExitPaperEditor() {
    var textarea = document.getElementById('paperTextarea');
    var catSelect = document.getElementById('paperCatSelect');
    if (!textarea) { renderPaperApp(); return; }

    var content = textarea.value.trim();
    var category = catSelect ? catSelect.value : '随手记';

    // 收集装饰数据
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
            paperBg: window._paperTempBg || '',
            decorations: decorations
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
                notes[index].paperBg = window._paperTempBg || notes[index].paperBg || '';
                notes[index].decorations = decorations;
            }
        }
    }

    savePaperNotes(notes);
    paperEditingNoteId = null;
    window._paperTempBg = '';
    renderPaperApp();
}

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
        + '<div class="paper-bg-item plain" onclick="setPaperBg(\'\')"><span>纯色</span></div>'
        + '<div class="paper-bg-item grid" onclick="setPaperBg(\'grid\')"><span>网格</span></div>'
        + '<div class="paper-bg-item dot" onclick="setPaperBg(\'dot\')"><span>点阵</span></div>'
        + '<div class="paper-bg-item custom" onclick="document.getElementById(\'paperBgUpload\').click()"><span>+ 自定义</span></div>'
        + '<input type="file" id="paperBgUpload" accept="image/*" style="display:none;" onchange="uploadPaperBg(event)">'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaperBgPanel(); };
}

function closePaperBgPanel() {
    var overlay = document.getElementById('paperBgOverlay');
    if (overlay) overlay.remove();
}

function setPaperBg(type) {
    var body = document.getElementById('paperEditorBody');
    if (!body) return;
    body.style.backgroundImage = '';
    body.classList.remove('paper-bg-grid-pattern', 'paper-bg-dot-pattern');
    if (type === 'grid') {
        body.classList.add('paper-bg-grid-pattern');
    } else if (type === 'dot') {
        body.classList.add('paper-bg-dot-pattern');
    }
    window._paperTempBgType = type;
    window._paperTempBg = '';
    closePaperBgPanel();
}

function uploadPaperBg(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        var body = document.getElementById('paperEditorBody');
        if (body) {
            body.style.backgroundImage = 'url(' + ev.target.result + ')';
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            body.classList.remove('paper-bg-grid-pattern', 'paper-bg-dot-pattern');
        }
        window._paperTempBg = ev.target.result;
        window._paperTempBgType = '';
    };
    reader.readAsDataURL(file);
}

// ========== 装饰面板 ==========
var PAPER_DECOS = [
    'https://i.ibb.co/zW6Cztm3/1784179491713.png',
    'https://i.ibb.co/BH0jRDhg/1784179512627.png',
    'https://i.ibb.co/HDvrPyJb/1784179530559.png'
];

function openPaperDecoPanel() {
    var overlay = document.createElement('div');
    overlay.className = 'paper-modal-overlay';
    overlay.id = 'paperDecoOverlay';
    var itemsHTML = '';
    PAPER_DECOS.forEach(function(src, i) {
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

function closePaperDecoPanel() {
    var overlay = document.getElementById('paperDecoOverlay');
    if (overlay) overlay.remove();
}

function addPaperDeco(src) {
    var container = document.getElementById('paperDecoContainer');
    if (!container) return;
    var idx = paperDecoIdCounter++;
    var wrapper = document.createElement('div');
    wrapper.className = 'paper-deco-wrapper';
    wrapper.id = 'deco_' + idx;
    wrapper.setAttribute('data-x', '30');
    wrapper.setAttribute('data-y', '30');
    wrapper.setAttribute('data-w', '60');
    wrapper.setAttribute('data-r', '0');
    wrapper.setAttribute('data-src', src);
    wrapper.style.cssText = 'left:30%;top:30%;width:60px;transform:rotate(0deg);';
    wrapper.innerHTML = ''
        + '<img src="' + src + '" class="paper-deco-img" style="width:100%;height:auto;pointer-events:none;">'
        + '<span class="paper-deco-del" onclick="removePaperDecoById(' + idx + ')">×</span>'
        + '<span class="paper-deco-resize" onmousedown="startDecoResize(event, ' + idx + ')" ontouchstart="startDecoResize(event, ' + idx + ')"></span>';
    container.appendChild(wrapper);
    bindDecoDragForWrapper(wrapper);
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

function removePaperDecoById(idx) {
    var el = document.getElementById('deco_' + idx);
    if (el) el.remove();
}

// ========== 装饰拖拽 ==========
function bindDecoDrag() {
    var wrappers = document.querySelectorAll('.paper-deco-wrapper');
    wrappers.forEach(function(w) { bindDecoDragForWrapper(w); });
}

function bindDecoDragForWrapper(wrapper) {
    var startX, startY, origLeft, origTop;
    wrapper.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('paper-deco-del') || e.target.classList.contains('paper-deco-resize')) return;
        e.stopPropagation();
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        origLeft = parseFloat(wrapper.style.left);
        origTop = parseFloat(wrapper.style.top);
        wrapper.style.transition = 'none';
        wrapper.style.zIndex = '10';
    });
    wrapper.addEventListener('touchmove', function(e) {
        if (!startX) return;
        e.preventDefault();
        var dx = (e.touches[0].clientX - startX) / wrapper.parentElement.offsetWidth * 100;
        var dy = (e.touches[0].clientY - startY) / wrapper.parentElement.offsetHeight * 100;
        wrapper.style.left = Math.max(0, Math.min(90, origLeft + dx)) + '%';
        wrapper.style.top = Math.max(0, Math.min(90, origTop + dy)) + '%';
    });
    wrapper.addEventListener('touchend', function() {
        wrapper.style.transition = '';
        wrapper.style.zIndex = '4';
        wrapper.setAttribute('data-x', parseFloat(wrapper.style.left));
        wrapper.setAttribute('data-y', parseFloat(wrapper.style.top));
        startX = null;
    });
}

// ========== 装饰缩放 ==========
function startDecoResize(e, idx) {
    e.stopPropagation();
    e.preventDefault();
    var wrapper = document.getElementById('deco_' + idx);
    if (!wrapper) return;
    var startDist = 0;
    var origW = parseInt(wrapper.getAttribute('data-w'));
    var touchStart = function(ev) {
        if (ev.touches.length === 2) {
            startDist = Math.hypot(
                ev.touches[0].clientX - ev.touches[1].clientX,
                ev.touches[0].clientY - ev.touches[1].clientY
            );
        }
    };
    var touchMove = function(ev) {
        if (ev.touches.length === 2 && startDist > 0) {
            var dist = Math.hypot(
                ev.touches[0].clientX - ev.touches[1].clientX,
                ev.touches[0].clientY - ev.touches[1].clientY
            );
            var scale = dist / startDist;
            var newW = Math.max(30, Math.min(200, origW * scale));
            wrapper.style.width = newW + 'px';
            wrapper.setAttribute('data-w', newW);
        }
    };
    var touchEnd = function() {
        document.removeEventListener('touchstart', touchStart);
        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', touchEnd);
    };
    document.addEventListener('touchstart', touchStart);
    document.addEventListener('touchmove', touchMove);
    document.addEventListener('touchend', touchEnd);
}

// ========== 格式化时间 ==========
function formatPaperTime(timestamp) {
    var d = new Date(timestamp);
    return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {});
