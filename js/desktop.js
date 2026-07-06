/**
 * 玉界 - 桌面管理系统 v4.0
 * 图标与小组件统一网格混排
 * 4列x6行网格 + 真机级实时拖拽避让
 */

// ========== 全局状态 ==========
var isEditing = false;
var longPressTimer = null;
var addButton = null;
var halfPanel = null;
var touchStartX = 0, touchStartY = 0;

// ========== 拖拽状态 ==========
var dragState = null; // 当前拖拽状态对象

// ========== 数据层 ==========
function getItems() {
    var raw = localStorage.getItem('desktop_items_v3');
    if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
    }
    var storyCity = localStorage.getItem('weather_story_city') || '';
    var realCity = localStorage.getItem('weather_city') || '';
    var displayCity = storyCity || realCity || '上海';
    var countdowns = getCountdowns();
    var items = [{
        id: 'widget-clock-default',
        type: 'widget',
        widgetType: 'clock',
        size: '2x4',
        page: 0,
        avatar: '',
        signature: '——  ..おやすみ ..——',
        signature2: '🩶✩* iwish..★행복｡◍•)♡',
        temp: '24°',
        weatherDesc: displayCity + '·晴'
    }];
    
    countdowns.forEach(function(cd) {
        items.push({
            id: 'widget-countdown-' + cd.id,
            type: 'widget',
            widgetType: 'countdown',
            size: '2x2',
            page: 0,
            countdownId: cd.id
        });
    });
    
    return items;
}

function getCountdowns() {
    var raw = localStorage.getItem('desktop_countdowns');
    if (raw) return JSON.parse(raw);
    return [{
        id: 'default',
        title: '玉界机',
        date: '2026-06-12',
        bg: ''
    }];
}

function saveCountdowns(countdowns) {
    localStorage.setItem('desktop_countdowns', JSON.stringify(countdowns));
}

function saveItems(items) {
    localStorage.setItem('desktop_items_v3', JSON.stringify(items));
}

function addDesktopIcon(item) {
    var items = getItems();
    var existing = items.findIndex(function(i) { return i.id === item.id; });
    var newItem = {
        id: item.id,
        type: 'app',
        name: item.name,
        icon: item.icon || '',
        action: item.action || null,
        size: '1x1',
        page: 0
    };
    if (existing >= 0) {
        items[existing] = newItem;
    } else {
        items.push(newItem);
    }
    saveItems(items);
}

// ========== 网格工具函数 ==========
var TOTAL_ROWS = 6, TOTAL_COLS = 4;

function buildOccupiedMap(pageItems, reserved) {
    var occupied = {};
    function occupy(r1, c1, r2, c2) {
        for (var r = r1; r <= r2; r++) {
            for (var c = c1; c <= c2; c++) { occupied[r + '_' + c] = true; }
        }
    }
    pageItems.forEach(function(item) {
        if (item.id === (reserved || '').id) return;
        if (item.gridPos) {
            occupy(item.gridPos.row, item.gridPos.col,
                item.gridPos.row + (item.gridPos.rowSpan || 1) - 1,
                item.gridPos.col + (item.gridPos.colSpan || 1) - 1);
        }
    });
    return { occupied: occupied, occupy: occupy };
}

function findFreeSlot(pageItems, rowSpan, colSpan, reservedId) {
    var map = buildOccupiedMap(pageItems, reservedId ? pageItems.find(function(i) { return i.id === reservedId; }) : null);
    var occupied = map.occupied;
    function isFree(r, c) { return !occupied[r + '_' + c]; }

    for (var row = 1; row <= TOTAL_ROWS; row++) {
        for (var col = 1; col <= TOTAL_COLS; col++) {
            if (row + rowSpan - 1 > TOTAL_ROWS || col + colSpan - 1 > TOTAL_COLS) continue;
            var fit = true;
            for (var r = 0; r < rowSpan && fit; r++) {
                for (var c = 0; c < colSpan && fit; c++) {
                    if (!isFree(row + r, col + c)) fit = false;
                }
            }
            if (fit) return { row: row, col: col, rowSpan: rowSpan, colSpan: colSpan };
        }
    }
    return null;
}

function assignGridPositions(pageItems) {
    // 清除旧的 gridPos
    pageItems.forEach(function(it) { delete it.gridPos; });

    // 先把塔罗固定到右下角
    var tarot = pageItems.find(function(it) { return it.widgetType === 'tarot'; });
    if (tarot) {
        var sizeP = (tarot.size || '1x1').split('x');
        tarot.gridPos = { row: 5, col: 3, rowSpan: parseInt(sizeP[0]) || 2, colSpan: parseInt(sizeP[1]) || 2 };
    }

    // 按顺序分配其他 items
    pageItems.forEach(function(item) {
        if (item.gridPos) return; // 塔罗已分配
        var sizeParts = (item.size || '1x1').split('x');
        var rowSpan = parseInt(sizeParts[0]) || 1;
        var colSpan = parseInt(sizeParts[1]) || 1;
        var slot = findFreeSlot(pageItems, rowSpan, colSpan, item.id);
        if (slot) {
            item.gridPos = slot;
        }
    });
}

// ========== 渲染网格 ==========
function renderDesktopGrid() {
    var items = getItems();

    ['page1', 'page2'].forEach(function(pageId, pageIndex) {
        var page = document.getElementById(pageId);
        if (!page) return;

        var shortcuts = page.querySelector('#page2Shortcuts');
        page.innerHTML = '';
        if (shortcuts) page.appendChild(shortcuts);

        var grid = document.createElement('div');
        grid.className = 'desktop-grid';
        grid.setAttribute('data-page', pageIndex);

        var pageItems = items.filter(function(item) { return (item.page || 0) === pageIndex; });

        // 分配 grid 位置
        assignGridPositions(pageItems);

        pageItems.forEach(function(item) {
            if (!item.gridPos) return;

            var cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.setAttribute('data-id', item.id);
            cell.style.gridColumn = item.gridPos.col + ' / span ' + item.gridPos.colSpan;
            cell.style.gridRow = item.gridPos.row + ' / span ' + item.gridPos.rowSpan;
            renderCellContent(cell, item);
            setupDrag(cell);
            grid.appendChild(cell);
        });

        page.appendChild(grid);
    });

    updateAllWidgetClocks();
}

function renderCellContent(cell, item) {
    if (item.type === 'app') {
        cell.innerHTML =
            '<div class="app-icon">' +
                '<div class="icon-img">' + (item.icon || '') + '</div>' +
                '<div class="icon-label">' + (item.name || '') + '</div>' +
            '</div>';
        (function(it) {
            var iconEl = cell.querySelector('.app-icon');
            if (iconEl) {
                iconEl.addEventListener('click', function(e) {
                    if (isEditing) return;
                    if (it.action && typeof window[it.action] === 'function') {
                        e.stopPropagation();
                        window[it.action]();
                    }
                });
                iconEl.style.pointerEvents = 'auto';
            }
        })(item);
    } else if (item.type === 'widget') {
        cell.innerHTML = buildWidgetHTML(item);
        var avatar = cell.querySelector('.widget-avatar');
        if (avatar) {
            (function() {
                avatar.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var inp = document.getElementById('widget-avatar-upload');
                    if (inp) inp.click();
                });
            })();
        }
        var weatherEl = cell.querySelector('.widget-weather-desc');
        if (weatherEl) {
            weatherEl.style.cursor = 'pointer';
            (function(it, el) {
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var overlay = document.createElement('div');
                    overlay.className = 'caption-modal-overlay';
                    overlay.id = 'weatherEditOverlay';
                    overlay.innerHTML =
                        '<div class="caption-modal">' +
                            '<div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">编辑地点</div>' +
                            '<input type="text" class="payment-note" id="weatherEditInput" placeholder="输入地点名称" value="' + (it.weatherDesc || '') + '">' +
                            '<div class="caption-buttons">' +
                                '<div class="payment-btn-cancel" onclick="closeWeatherEdit()">取消</div>' +
                                '<div class="payment-btn-confirm" onclick="confirmWeatherEdit(\'' + it.id + '\')">确定</div>' +
                            '</div>' +
                        '</div>';
                    document.body.appendChild(overlay);
                    overlay.onclick = function(ev) { if (ev.target === overlay) closeWeatherEdit(); };
                    window._weatherEditItem = it;
                    window._weatherEditEl = el;
                });
            })(item, weatherEl);
        }
        var sig = cell.querySelector('.widget-signature');
        if (sig) {
            sig.style.cursor = 'pointer';
            (function(it, el) {
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (isEditing) return;
                    var overlay = document.createElement('div');
                    overlay.className = 'caption-modal-overlay';
                    overlay.id = 'signEditOverlay';
                    overlay.innerHTML =
                        '<div class="caption-modal">' +
                            '<div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">编辑签名</div>' +
                            '<input type="text" class="payment-note" id="signEditInput" placeholder="输入个性签名" value="' + (it.signature || '') + '">' +
                            '<div class="caption-buttons">' +
                                '<div class="payment-btn-cancel" onclick="closeSignEdit()">取消</div>' +
                                '<div class="payment-btn-confirm" onclick="confirmSignEdit(\'' + it.id + '\')">确定</div>' +
                            '</div>' +
                        '</div>';
                    document.body.appendChild(overlay);
                    overlay.onclick = function(ev) { if (ev.target === overlay) closeSignEdit(); };
                    window._signEditItem = it;
                    window._signEditEl = el;
                });
            })(item, sig);
        }
        var sig2 = cell.querySelector('.widget-signature2');
        if (sig2) {
            sig2.style.cursor = 'pointer';
            (function(it, el) {
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (isEditing) return;
                    var overlay = document.createElement('div');
                    overlay.className = 'caption-modal-overlay';
                    overlay.id = 'sign2EditOverlay';
                    overlay.innerHTML =
                        '<div class="caption-modal">' +
                            '<div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">编辑签名</div>' +
                            '<input type="text" class="payment-note" id="sign2EditInput" placeholder="输入个性签名" value="' + (it.signature2 || '') + '">' +
                            '<div class="caption-buttons">' +
                                '<div class="payment-btn-cancel" onclick="closeSign2Edit()">取消</div>' +
                                '<div class="payment-btn-confirm" onclick="confirmSign2Edit(\'' + it.id + '\')">确定</div>' +
                            '</div>' +
                        '</div>';
                    document.body.appendChild(overlay);
                    overlay.onclick = function(ev) { if (ev.target === overlay) closeSign2Edit(); };
                    window._sign2EditItem = it;
                    window._sign2EditEl = el;
                });
            })(item, sig2);
        }
    }
}

function buildWidgetHTML(item) {
    if (item.widgetType === 'tarot') {
        return '<div class="desktop-widget grid-widget tarot-widget" onclick="openTarot()">'
            + '<div class="tarot-cards-preview">'
            + '<div class="tarot-mini-card card1"></div>'
            + '<div class="tarot-mini-card card2"></div>'
            + '</div>'
            + '<div class="tarot-label">Tarot Divination</div>'
            + '</div>';
    }
    if (item.widgetType === 'countdown') {
        var countdowns = getCountdowns();
        var cd = null;
        for (var ci = 0; ci < countdowns.length; ci++) {
            if (countdowns[ci].id === item.countdownId) { cd = countdowns[ci]; break; }
        }
        if (!cd) return '<div class="desktop-widget grid-widget" style="display:flex;align-items:center;justify-content:center;color:rgba(0,0,0,0.3);">倒数日已删除</div>';

        var targetDate = new Date(cd.date);
        var now = new Date();
        var diffDays = Math.floor((targetDate - now) / (1000 * 60 * 60 * 24));
        var displayDays = Math.abs(diffDays);
        var suffix;
        if (diffDays > 0) { suffix = '还有'; }
        else if (diffDays < 0) { suffix = '已经'; }
        else { suffix = '在今天'; }

        return '<div class="desktop-widget grid-widget countdown-widget" style="' + (cd.bg ? 'background-image:url(' + cd.bg + ');background-size:cover;background-position:center;' : '') + '" onclick="openCountdownEditor(\'' + cd.id + '\')">'
            + '<div class="countdown-title">' + cd.title + suffix + '</div>'
            + '<div class="countdown-days">' + (suffix === '今天' ? '今天' : displayDays) + '</div>'
            + '<div class="countdown-date">' + cd.date + '</div>'
            + '</div>';
    }
    if (item.widgetType === 'custom') {
        return '<div class="desktop-widget grid-widget" style="padding:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;border:none;box-shadow:none;">' +
            '<div style="width:100%;height:100%;background-image:url(' + (item.image || '') + ');background-size:cover;background-position:center;border-radius:18px;"></div>' +
            '</div>';
    }
    var avatarSrc = item.avatar || '';
    var avatarHTML = avatarSrc
        ? '<div class="widget-avatar" style="background-image:url(' + avatarSrc + ');background-size:cover;background-position:center;"></div>'
        : '<div class="widget-avatar">+</div>';
    return '<div class="desktop-widget grid-widget">' +
        '<div class="widget-top-row">' +
            '<div class="widget-left">' +
                avatarHTML +
                '<div class="widget-time-block">' +
                    '<span class="widget-time widget-time-display">00:00</span>' +
                    '<span class="widget-date widget-date-display">1月1日 星期一</span>' +
                '</div>' +
            '</div>' +
            '<div class="widget-weather-block">' +
                '<span class="widget-temp">' + (item.temp || '24°') + '</span>' +
                '<div class="widget-weather-desc">' + (item.weatherDesc || '') + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="widget-divider"></div>' +
        '<span class="widget-signature" contenteditable="true">' + (item.signature || '') + '</span>' +
        '<span class="widget-signature2" contenteditable="true">' + (item.signature2 || '🩶✩* iwish..★행복｡◍•)♡') + '</span>' +
    '</div>';
}

function updateAllWidgetClocks() {
    var now = new Date();
    var h = now.getHours().toString().padStart(2, '0');
    var m = now.getMinutes().toString().padStart(2, '0');
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    document.querySelectorAll('.widget-time-display').forEach(function(el) { el.textContent = h + ':' + m; });
    document.querySelectorAll('.widget-date-display').forEach(function(el) { el.textContent = month + '月' + day + '日 ' + days[now.getDay()]; });
}
setInterval(updateAllWidgetClocks, 1000);

function updateWidgetField(id, field, value) {
    var items = getItems();
    var item = items.find(function(i) { return i.id === id; });
    if (item) { item[field] = value; saveItems(items); }
}

function closeWeatherEdit() {
    var o = document.getElementById('weatherEditOverlay');
    if (o) o.remove();
}

function confirmWeatherEdit(id) {
    var input = document.getElementById('weatherEditInput');
    var newVal = input ? input.value.trim() : '';
    closeWeatherEdit();
    if (newVal) {
        updateWidgetField(id, 'weatherDesc', newVal);
        if (window._weatherEditEl) window._weatherEditEl.textContent = newVal;
    }
}

function closeSignEdit() {
    var o = document.getElementById('signEditOverlay');
    if (o) o.remove();
}
function confirmSignEdit(id) {
    var input = document.getElementById('signEditInput');
    var newVal = input ? input.value.trim() : '';
    closeSignEdit();
    if (newVal !== '') {
        updateWidgetField(id, 'signature', newVal);
        if (window._signEditEl) window._signEditEl.textContent = newVal;
    }
}
function closeSign2Edit() {
    var o = document.getElementById('sign2EditOverlay');
    if (o) o.remove();
}
function confirmSign2Edit(id) {
    var input = document.getElementById('sign2EditInput');
    var newVal = input ? input.value.trim() : '';
    closeSign2Edit();
    if (newVal !== '') {
        updateWidgetField(id, 'signature2', newVal);
        if (window._sign2EditEl) window._sign2EditEl.textContent = newVal;
    }
}
function openCountdownEditor(cdId) {
    var countdowns = getCountdowns();
    var cd = null;
    for (var i = 0; i < countdowns.length; i++) {
        if (countdowns[i].id === cdId) { cd = countdowns[i]; break; }
    }
    if (!cd) return;
    
    var overlay = document.createElement('div');
    overlay.className = 'sheet-mask show';
    overlay.id = 'countdownEditorMask';
    
    overlay.innerHTML = ''
        + '<div class="half-sheet" onclick="event.stopPropagation()">'
        + '<div class="sheet-handle"><div class="handle-bar"></div></div>'
        + '<div class="sheet-scroll">'
        + '<div class="settings-section-title">倒数日</div>'
        + '<div class="glass-card">'
        + '<div style="font-size:13px;color:#8e8e93;margin-bottom:4px;">标题</div>'
        + '<input type="text" class="search-input" id="cdTitleInput" value="' + cd.title + '" placeholder="例如：玉界已经">'
        + '<div style="font-size:13px;color:#8e8e93;margin:8px 0 4px;">日期</div>'
        + '<input type="date" class="search-input" id="cdDateInput" value="' + cd.date + '">'
        + '<div style="font-size:13px;color:#8e8e93;margin:8px 0 4px;">背景图</div>'
        + '<div class="bg-preview-2x4" id="cdBgPreview" style="background-image:url(' + (cd.bg || '') + ');" onclick="document.getElementById(\'cdBgInput\').click()">' + (cd.bg ? '' : '点击更换背景图') + '</div>'
        + '<input type="file" id="cdBgInput" accept="image/*" style="display:none;" onchange="handleCDBg(event)">'
        + '<button class="black-btn" onclick="saveCountdown(\'' + cdId + '\')">保存</button>'
        + '</div>'
        + '<div style="height:30px;"></div>'
        + '</div></div>';
    
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeCountdownEditor(); };
    
    var handle = overlay.querySelector('.sheet-handle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 60) closeCountdownEditor(); });
    
    window._cdEditingBg = cd.bg || '';
}

function closeCountdownEditor() {
    var o = document.getElementById('countdownEditorMask');
    if (o) o.remove();
    window._cdEditingBg = null;
}

function handleCDBg(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        window._cdEditingBg = ev.target.result;
        var preview = document.getElementById('cdBgPreview');
        if (preview) { preview.style.backgroundImage = 'url(' + ev.target.result + ')'; preview.innerText = ''; }
    };
    reader.readAsDataURL(file);
}

function saveCountdown(cdId) {
    var title = document.getElementById('cdTitleInput').value.trim() || '倒数日';
    var date = document.getElementById('cdDateInput').value;
    if (!date) { showToast('请选择日期'); return; }
    
    var countdowns = getCountdowns();
    for (var i = 0; i < countdowns.length; i++) {
        if (countdowns[i].id === cdId) {
            countdowns[i].title = title;
            countdowns[i].date = date;
            countdowns[i].bg = window._cdEditingBg || '';
            break;
        }
    }
    saveCountdowns(countdowns);
    closeCountdownEditor();
    renderDesktopGrid();
    showToast('倒数日已更新');
}

function deleteCountdown(cdId) {
    var countdowns = getCountdowns();
    countdowns = countdowns.filter(function(c) { return c.id !== cdId; });
    saveCountdowns(countdowns);
    closeCountdownEditor();
    renderDesktopGrid();
    showToast('倒数日已删除');
}

// ========== 长按进编辑 ==========
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

// ========== 编辑模式 ==========
function enterEditMode() {
    if (isEditing) return;
    isEditing = true;
    removeAddButton();
    document.querySelectorAll('.grid-cell').forEach(function(cell) {
        cell.classList.add('editing');
        if (cell.querySelector('.delete-btn')) return;
        var delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.textContent = '×';
        var itemId = cell.getAttribute('data-id');
        delBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteItem(itemId);
        });
        cell.appendChild(delBtn);
    });
}

function exitEditMode() {
    isEditing = false;
    document.querySelectorAll('.grid-cell').forEach(function(cell) {
        cell.classList.remove('editing');
        var btn = cell.querySelector('.delete-btn');
        if (btn) btn.remove();
    });
}

// ========== 确认删除 ==========
var pendingDeleteId = null;

function deleteItem(id) {
    pendingDeleteId = id;
    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'confirmDeleteOverlay';
    overlay.innerHTML =
        '<div class="confirm-dialog">' +
            '<p>确认删除？</p>' +
            '<div class="confirm-buttons">' +
                '<div class="confirm-btn-cancel" onclick="cancelDelete()">取消</div>' +
                '<div class="confirm-btn-delete" onclick="executeDelete()">确定</div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}

function cancelDelete() {
    pendingDeleteId = null;
    var o = document.getElementById('confirmDeleteOverlay');
    if (o) o.remove();
}

function executeDelete() {
    if (!pendingDeleteId) return;
    var items = getItems().filter(function(i) { return i.id !== pendingDeleteId; });
    saveItems(items);
    pendingDeleteId = null;
    var o = document.getElementById('confirmDeleteOverlay');
    if (o) o.remove();
    exitEditMode();
    renderDesktopGrid();
}

// ========== ★★★ 真机级实时拖拽避让 ★★★ ==========
// dragState = {
//   cell: DOM元素,
//   itemId: string,
//   startX/Y: 触摸起点,
//   origRect: getBoundingClientRect(),
//   dragRow/Col: 当前所在grid位置,
//   rowSpan/colSpan: 尺寸,
//   ghost: 拖拽幽灵元素,
//   gridItems: 当前页所有item的gridPos快照
// }

function setupDrag(cell) {
    // 长按检测
    var pressTimer = null;
    var pressStartX = 0, pressStartY = 0;
    var isLongPress = false;

    cell.addEventListener('touchstart', function(e) {
        if (isEditing) return;
        pressStartX = e.touches[0].clientX;
        pressStartY = e.touches[0].clientY;
        isLongPress = false;
        pressTimer = setTimeout(function() {
            isLongPress = true;
            startDragSession(cell, e);
        }, 400);
    }, { passive: true });

    cell.addEventListener('touchmove', function(e) {
        if (isEditing) return;
        var dx = Math.abs(e.touches[0].clientX - pressStartX);
        var dy = Math.abs(e.touches[0].clientY - pressStartY);
        if (dx > 8 || dy > 8) {
            clearTimeout(pressTimer);
        }
        // 如果已经进入拖拽状态
        if (dragState && dragState.cell === cell) {
            continueDrag(e);
        }
    }, { passive: false });

    cell.addEventListener('touchend', function(e) {
        clearTimeout(pressTimer);
        if (dragState && dragState.cell === cell) {
            endDragSession(e);
        }
    }, { passive: true });

    cell.addEventListener('mousedown', function(e) {
        if (isEditing) return;
        pressStartX = e.clientX;
        pressStartY = e.clientY;
        isLongPress = false;
        pressTimer = setTimeout(function() {
            isLongPress = true;
            startDragSession(cell, e);
        }, 400);
    });
    cell.addEventListener('mousemove', function(e) {
        if (dragState && dragState.cell === cell) {
            continueDrag(e);
        }
    });
    cell.addEventListener('mouseup', function(e) {
        clearTimeout(pressTimer);
        if (dragState && dragState.cell === cell) {
            endDragSession(e);
        }
    });
    cell.addEventListener('mouseleave', function() {
        clearTimeout(pressTimer);
    });
}

function getGridCellAtPoint(clientX, clientY) {
    // 通过手指位置找到对应的 grid 格子行列
    var grid = document.querySelector('.desktop-grid');
    if (!grid) return null;
    var gridRect = grid.getBoundingClientRect();
    var cellW = gridRect.width / TOTAL_COLS;
    var cellH = gridRect.height / TOTAL_ROWS;
    var col = Math.floor((clientX - gridRect.left) / cellW) + 1;
    var row = Math.floor((clientY - gridRect.top) / cellH) + 1;
    col = Math.max(1, Math.min(col, TOTAL_COLS));
    row = Math.max(1, Math.min(row, TOTAL_ROWS));
    return { row: row, col: col };
}

function getItemsForCurrentPage() {
    var items = getItems();
    var pageIndices = [];
    ['page1', 'page2'].forEach(function(pageId, idx) {
        var page = document.getElementById(pageId);
        if (page && !page.style.display) pageIndices.push(idx);
    });
    // 找当前显示的页面
    var visiblePage = 0;
    return items.filter(function(item) { return (item.page || 0) === visiblePage; });
}

function startDragSession(cell, e) {
    if (dragState) return;
    enterEditMode();
    
    var itemId = cell.getAttribute('data-id');
    var items = getItemsForCurrentPage();
    var item = items.find(function(it) { return it.id === itemId; });
    if (!item) return;

    var rect = cell.getBoundingClientRect();
    var sizeParts = (item.size || '1x1').split('x');
    var rowSpan = parseInt(sizeParts[0]) || 1;
    var colSpan = parseInt(sizeParts[1]) || 1;
    
    // 创建幽灵元素（跟随手指）
    var ghost = cell.cloneNode(true);
    ghost.className = 'grid-cell drag-ghost';
    ghost.style.position = 'fixed';
    ghost.style.zIndex = '1000';
    ghost.style.pointerEvents = 'none';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.left = (e.clientX ? e.clientX : e.touches ? e.touches[0].clientX : 0) - rect.width / 2 + 'px';
    ghost.style.top = (e.clientY ? e.clientY : e.touches ? e.touches[0].clientY : 0) - rect.height / 2 + 'px';
    ghost.style.opacity = '0.85';
    ghost.style.transform = 'scale(1.05)';
    ghost.style.transition = 'none';
    document.body.appendChild(ghost);

    // 原 cell 变透明（占位）
    cell.style.opacity = '0.35';
    cell.style.transition = 'opacity 0.1s';

    // 记录拖拽状态
    dragState = {
        cell: cell,
        itemId: itemId,
        startX: e.clientX || (e.touches ? e.touches[0].clientX : 0),
        startY: e.clientY || (e.touches ? e.touches[0].clientY : 0),
        origRect: rect,
        rowSpan: rowSpan,
        colSpan: colSpan,
        ghost: ghost,
        currentRow: null,
        currentCol: null,
        lastSwapTime: 0
    };
}

function continueDrag(e) {
    if (!dragState) return;
    e.preventDefault();

    var clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    var clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

    // 移动幽灵
    dragState.ghost.style.left = (clientX - dragState.origRect.width / 2) + 'px';
    dragState.ghost.style.top = (clientY - dragState.origRect.height / 2) + 'px';

    // 检测当前手指落在哪个格子
    var gridPos = getGridCellAtPoint(clientX, clientY);
    if (!gridPos) return;

    // 节流：每 80ms 检测一次避让
    var now = Date.now();
    if (now - (dragState.lastSwapTime || 0) < 80) return;
    dragState.lastSwapTime = now;

    // 计算"被拖元素实际要占的格子范围"
    var targetRow = Math.min(gridPos.row, TOTAL_ROWS - dragState.rowSpan + 1);
    var targetCol = Math.min(gridPos.col, TOTAL_COLS - dragState.colSpan + 1);
    targetRow = Math.max(1, targetRow);
    targetCol = Math.max(1, targetCol);

    // 如果没变位置，跳过
    if (dragState.currentRow === targetRow && dragState.currentCol === targetCol) return;
    dragState.currentRow = targetRow;
    dragState.currentCol = targetCol;

    // 获取当前页所有 items 并计算新的布局
    var items = getItemsForCurrentPage();
    var gridItems = items.map(function(it) {
        var sizeP = (it.size || '1x1').split('x');
        return {
            id: it.id,
            rowSpan: parseInt(sizeP[0]) || 1,
            colSpan: parseInt(sizeP[1]) || 1
        };
    });

    // 在被拖元素的原位和 target 位置之间做 "挤入" 计算
    // 简化实现：把所有 items（除了被拖的）重新排列，把被拖元素放在 targetRow/targetCol
    var dragItem = gridItems.find(function(it) { return it.id === dragState.itemId; });
    if (!dragItem) return;

    // 构建一个新的 gridPos 映射，先把被拖元素放在 target 位置
    var newPositions = {};
    newPositions[dragState.itemId] = {
        row: targetRow,
        col: targetCol,
        rowSpan: dragState.rowSpan,
        colSpan: dragState.colSpan
    };

    // 其他 items 按顺序填充剩余格子
    var otherItems = gridItems.filter(function(it) { return it.id !== dragState.itemId; });
    var occupied = {};
    function occupy(r1, c1, r2, c2) {
        for (var r = r1; r <= r2; r++) {
            for (var c = c1; c <= c2; c++) { occupied[r + '_' + c] = true; }
        }
    }
    occupy(targetRow, targetCol, targetRow + dragState.rowSpan - 1, targetCol + dragState.colSpan - 1);

    otherItems.forEach(function(it) {
        var found = false;
        for (var r = 1; r <= TOTAL_ROWS && !found; r++) {
            for (var c = 1; c <= TOTAL_COLS && !found; c++) {
                if (r + it.rowSpan - 1 > TOTAL_ROWS || c + it.colSpan - 1 > TOTAL_COLS) continue;
                var fit = true;
                for (var rr = 0; rr < it.rowSpan && fit; rr++) {
                    for (var cc = 0; cc < it.colSpan && fit; cc++) {
                        if (occupied[(r + rr) + '_' + (c + cc)]) fit = false;
                    }
                }
                if (fit) {
                    occupy(r, c, r + it.rowSpan - 1, c + it.colSpan - 1);
                    newPositions[it.id] = { row: r, col: c, rowSpan: it.rowSpan, colSpan: it.colSpan };
                    found = true;
                }
            }
        }
    });

    // 应用新的 grid 位置到实际的 cell 上
    var cells = document.querySelectorAll('.grid-cell');
    cells.forEach(function(cell) {
        var id = cell.getAttribute('data-id');
        var pos = newPositions[id];
        if (!pos) return;
        if (id === dragState.itemId) return; // 被拖的 cell 保持透明占位
        cell.style.transition = 'grid-column 0.15s ease, grid-row 0.15s ease';
        cell.style.gridColumn = pos.col + ' / span ' + pos.colSpan;
        cell.style.gridRow = pos.row + ' / span ' + pos.rowSpan;
    });
}

function endDragSession(e) {
    if (!dragState) return;

    var clientX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0);
    var clientY = e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0);

    // 移除幽灵
    if (dragState.ghost && dragState.ghost.parentNode) {
        dragState.ghost.parentNode.removeChild(dragState.ghost);
    }

    // 恢复原 cell 透明度
    dragState.cell.style.opacity = '';
    dragState.cell.style.transition = '';

    // 如果拖拽过程中有最终位置，把被拖元素放到那个位置
    if (dragState.currentRow && dragState.currentCol) {
        var items = getItems();
        var pageItems = getItemsForCurrentPage();

        // 在数组中移动被拖元素到对应位置（保持数据一致性）
        var dragIdx = items.findIndex(function(it) { return it.id === dragState.itemId; });
        if (dragIdx >= 0) {
            var dragItem = items[dragIdx];
            items.splice(dragIdx, 1);
            // 把被拖元素放到数组末尾，然后重新 render 会通过 assignGridPositions 正确摆放
            items.push(dragItem);
        }
        saveItems(items);
    }

    dragState = null;
    exitEditMode();
    // 重新渲染确保位置精准
    setTimeout(function() { renderDesktopGrid(); }, 50);
}

// 点空白退出编辑
document.addEventListener('touchstart', function(e) {
    if (addButton && !addButton.contains(e.target)) removeAddButton();
    if (isEditing
        && !e.target.closest('.grid-cell')
        && !e.target.closest('.delete-btn')
        && !e.target.closest('.confirm-overlay')
        && !e.target.closest('.half-panel-overlay')) {
        exitEditMode();
    }
});

// ========== 桌面空白长按加号 ==========
function setupDesktopLongPress() {
    ['page1', 'page2'].forEach(function(pageId) {
        var page = document.getElementById(pageId);
        if (!page) return;
        page.addEventListener('touchstart', function(e) {
            if (e.target.closest('.grid-cell') || e.target.closest('.add-widget-btn')) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            longPressTimer = setTimeout(function() {
                if (isEditing) return;
                showAddButton();
            }, 500);
        }, { passive: true });
        page.addEventListener('touchend', function() { clearTimeout(longPressTimer); });
        page.addEventListener('touchmove', function(e) {
            var dx = e.touches[0].clientX - touchStartX;
            var dy = e.touches[0].clientY - touchStartY;
            if (Math.abs(dx) > 25 || Math.abs(dy) > 25) clearTimeout(longPressTimer);
        }, { passive: true });
    });
}

function showAddButton() {
    removeAddButton();
    addButton = document.createElement('div');
    addButton.className = 'add-widget-btn';
    addButton.innerHTML = '+';
    addButton.addEventListener('touchend', function(e) {
        e.stopPropagation();
        e.preventDefault();
        openHalfPanel();
        removeAddButton();
    });
    addButton.addEventListener('touchstart', function(e) { e.stopPropagation(); });
    document.getElementById('desktop').appendChild(addButton);
}

function removeAddButton() {
    if (addButton) { addButton.remove(); addButton = null; }
}

// ========== 半屏面板 ==========
function openHalfPanel() {
    if (halfPanel) halfPanel.remove();
    var overlay = document.createElement('div');
    overlay.className = 'half-panel-overlay';
    var panel = document.createElement('div');
    panel.className = 'half-panel';
    panel.innerHTML =
        '<div class="half-panel-handle"></div>' +
        '<div class="half-panel-content" id="halfPanelContent">' +
            '<div class="widget-list-item" data-target="wp-1x4"><span>1x4 小组件</span><span class="toggle-arrow">›</span></div>' +
            '<div id="wp-1x4" class="collapsible-section" style="display:none;"><div class="widget-placeholder">即将推出</div></div>' +
            '<div class="widget-list-item" data-target="wp-2x2"><span>2x2 小组件</span><span class="toggle-arrow">›</span></div>' +
            '<div id="wp-2x2" class="collapsible-section" style="display:none;">' +
                '<div class="widget-preview-card" onclick="confirmAddCountdownWidget()" style="max-width:50%;margin:8px auto;">' +
                    '<div class="widget-preview-inner" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 0;">' +
                        '<div style="font-size:11px;color:rgba(0,0,0,0.5);">玉界已经</div>' +
                        '<div style="font-size:32px;font-weight:800;color:#000;">365</div>' +
                        '<div style="font-size:10px;color:rgba(0,0,0,0.35);">2026-06-12</div>' +
                    '</div>' +
                    '<div class="widget-preview-label">倒数日小组件</div>' +
                '</div>' +
            '</div>' +
            '<div class="widget-list-item" data-target="wp-2x4"><span>2x4 小组件</span><span class="toggle-arrow">›</span></div>' +
            '<div id="wp-2x4" class="collapsible-section" style="display:none;">' +
                '<div class="widget-preview-card" onclick="confirmAddWidget(\'clock\')">' +
                    '<div class="widget-preview-inner">' +
                        '<div class="preview-top-row">' +
                            '<div class="preview-left">' +
                                '<div class="preview-avatar">+</div>' +
                                '<div class="preview-time-block"><span class="preview-time">14:30</span><span class="preview-date">6月28日 星期日</span></div>' +
                            '</div>' +
                            '<div class="preview-weather-block"><span class="preview-temp">24°</span><div class="preview-weather-desc">上海·晴</div></div>' +
                        '</div>' +
                        '<div class="preview-divider"></div>' +
                        '<div class="preview-signature">——  ..おやすみ ..——</div>' +
                    '</div>' +
                    '<div class="widget-preview-label">时钟小组件</div>' +
                '</div>' +
            '</div>' +
            '<div class="widget-list-item" data-target="wp-3x4"><span>3x4 小组件</span><span class="toggle-arrow">›</span></div>' +
            '<div id="wp-3x4" class="collapsible-section" style="display:none;"><div class="widget-placeholder">即将推出</div></div>' +
            '<div class="widget-list-item" data-target="wp-4x4"><span>4x4 小组件</span><span class="toggle-arrow">›</span></div>' +
            '<div id="wp-4x4" class="collapsible-section" style="display:none;"><div class="widget-placeholder">即将推出</div></div>' +
        '</div>';
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeHalfPanel(); });
    halfPanel = overlay;

    panel.querySelector('.half-panel-content').addEventListener('click', function(e) {
        var item = e.target.closest('.widget-list-item');
        if (!item) return;
        e.stopPropagation();
        var targetId = item.getAttribute('data-target');
        var target = document.getElementById(targetId);
        if (!target) return;
        var hidden = target.style.display === 'none';
        target.style.display = hidden ? 'block' : 'none';
        var arrow = item.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = hidden ? '∨' : '›';
    });

    var handle = panel.querySelector('.half-panel-handle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 50) closeHalfPanel(); });
    handle.addEventListener('click', function(e) { e.stopPropagation(); closeHalfPanel(); });
}

function closeHalfPanel() {
    if (halfPanel) { halfPanel.remove(); halfPanel = null; }
}

// ========== 添加小组件 ==========
function confirmAddWidget(type) {
    if (type === 'clock') {
        var items = getItems();
        if (items.find(function(i) { return i.widgetType === 'clock'; })) {
            showToast('时钟小组件已存在');
            closeHalfPanel();
            return;
        }
        items.unshift({
            id: 'widget-clock-' + Date.now(),
            type: 'widget',
            widgetType: 'clock',
            size: '2x4',
            page: 0,
            avatar: '',
            signature: '——  ..おやすみ ..——',
            signature2: '🩶✩* iwish..★행복｡◍•)♡',
            temp: '24°',
            weatherDesc: '上海·晴'
        });
        saveItems(items);
        renderDesktopGrid();
    }
    closeHalfPanel();
}

function confirmAddCountdownWidget() {
    var countdowns = getCountdowns();
    if (countdowns.length === 0) {
        showToast('没有可添加的倒数日');
        closeHalfPanel();
        return;
    }
    var items = getItems();
    var cd = countdowns[0];
    var exists = items.find(function(i) { return i.widgetType === 'countdown' && i.countdownId === cd.id; });
    if (exists) {
        showToast('该倒数日已在桌面');
        closeHalfPanel();
        return;
    }
    items.push({
        id: 'widget-countdown-' + cd.id,
        type: 'widget',
        widgetType: 'countdown',
        size: '2x2',
        page: 0,
        countdownId: cd.id
    });
    saveItems(items);
    closeHalfPanel();
    renderDesktopGrid();
    showToast('倒数日已添加');
}

// ========== 自定义小组件（美化模块调用） ==========
function addCustomWidget(imageData, size) {
    var items = getItems();
    var targetPage = 0;
    items.push({
        id: 'widget-custom-' + Date.now(),
        type: 'widget',
        widgetType: 'custom',
        size: size || '2x4',
        page: targetPage,
        image: imageData
    });
    saveItems(items);
    renderDesktopGrid();
}

// ========== 头像上传 ==========
function setupWidgetAvatarUpload() {
    var input = document.getElementById('widget-avatar-upload');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'widget-avatar-upload';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
    }
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            var items = getItems();
            var clock = items.find(function(i) { return i.widgetType === 'clock'; });
            if (clock) { clock.avatar = ev.target.result; saveItems(items); renderDesktopGrid(); }
        };
        reader.readAsDataURL(file);
    };
}

// ========== 兼容旧函数名 ==========
function renderDesktopIcons() { renderDesktopGrid(); }
function renderWidgets() { renderDesktopGrid(); }
function getWidgets() { return getItems().filter(function(i) { return i.type === 'widget'; }); }
function saveWidgets() {}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {
    addDesktopIcon({ id: 'chat', name: '聊天', icon: '<img src="https://i.ibb.co/3yN7gbxD/1782621034253.png" style="width:26px;height:26px;border-radius:8px;object-fit:cover;">', action: 'openChat' });
    addDesktopIcon({ id: 'shiyilin', name: '拾忆林', icon: '<img src="https://i.ibb.co/dwNq5VfT/1782621400981.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openShiyilin' });
    addDesktopIcon({ id: 'qianban', name: '牵绊', icon: '<img src="https://i.ibb.co/1f11jCzs/1782623493282.png" style="width:27px;height:27px;border-radius:8px;object-fit:cover;">', action: 'openQianban' });
    addDesktopIcon({ id: 'gallery', name: '映像馆', icon: '<img src="https://i.ibb.co/Dfcz9js0/1782623882994.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openGallery' });
    addDesktopIcon({ id: 'qawenda', name: '奇问妙答', icon: '<img src="https://i.ibb.co/dwTDLTcc/1782624493861.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openQawenda' });
    addDesktopIcon({ id: 'music', name: '音乐', icon: '<img src="https://i.ibb.co/Vk3LH0p/1782714962959.png" style="width:29px;height:29px;border-radius:8px;object-fit:cover;">', action: 'openMusic' });
    addDesktopIcon({ id: 'accounting', name: '记账', icon: '<img src="https://i.ibb.co/FbMqTMNr/1783095194517.png" style="width:36px;height:36px;border-radius:8px;object-fit:cover;">', action: 'openAccounting' });
    addDesktopIcon({ id: 'cardpack', name: '卡包', icon: '<img src="https://i.ibb.co/Pv2zqg00/1782715064654.png" style="width:35px;height:35px;border-radius:8px;object-fit:cover;">', action: 'openCardpack' });

    // ★ 插入塔罗小组件（如果不存在）
    var items = getItems();
    if (!items.find(function(i) { return i.id === 'widget-tarot-default'; })) {
        items.push({
            id: 'widget-tarot-default',
            type: 'widget',
            widgetType: 'tarot',
            size: '2x2',
            page: 0
        });
        saveItems(items);
    }

    renderDesktopGrid();
    setupDesktopLongPress();
    setupWidgetAvatarUpload();

    var dockBar = document.getElementById('dockBar');
    if (!dockBar) return;

    function makeDockItem(imgSrc, label, onclick) {
        var item = document.createElement('div');
        item.className = 'dock-item';
        item.innerHTML =
            '<div class="dock-icon">' +
                '<div class="dock-icon-img">' +
                    '<img src="' + imgSrc + '" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">' +
                '</div>' +
            '</div>' +
            '<div class="dock-label">' + label + '</div>';
        item.addEventListener('click', onclick);
        return item;
    }

    dockBar.appendChild(makeDockItem('https://i.ibb.co/HfZrSFgF/1782625018703.png', '设置', function() {
        openModal('settingsModal'); setTimeout(function() { renderDeviceList(); }, 100);
    }));
    dockBar.appendChild(makeDockItem('https://i.ibb.co/PzCRNBZ0/1782625096270.png', '日记', function() { openDiary(); }));
    dockBar.appendChild(makeDockItem('https://i.ibb.co/GvV3Dc17/1782625167668.png', '万象树', function() { openWorldbook(); }));
    dockBar.appendChild(makeDockItem('https://i.ibb.co/hFszQFvk/1782625229723.png', '美化', function() {
        initBeautify(); openModal('beautifyModal'); setTimeout(function() { loadCustomWidgetPreviews(); }, 500);
    }));

    window.getWidgets = getWidgets;
    window.saveWidgets = saveWidgets;
    window.renderWidgets = renderDesktopGrid;
    window.addCustomWidget = addCustomWidget;
});
