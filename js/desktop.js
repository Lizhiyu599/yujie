/**
 * 玉界 - 桌面管理系统 v3.2
 * 图标与小组件统一网格混排
 * 4列x6行网格，塔罗默认固定右下角，可通过拖拽换位
 */

// ========== 全局状态 ==========
var isEditing = false;
var longPressTimer = null;
var addButton = null;
var halfPanel = null;
var touchStartX = 0, touchStartY = 0;

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
    
    // 倒数日小组件
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
        page: item.page || 0
    };
    if (existing >= 0) {
        items[existing] = newItem;
    } else {
        items.push(newItem);
    }
    saveItems(items);
}

// ========== 渲染网格 ==========
function renderDesktopGrid() {
    var items = getItems();

    ['page1', 'page2'].forEach(function(pageId, pageIndex) {
    var page = document.getElementById(pageId);
    if (!page) return;

    page.innerHTML = '';

    var grid = document.createElement('div');
       
    grid.className = 'desktop-grid';
        grid.setAttribute('data-page', pageIndex);

        var pageItems = items.filter(function(item) { return (item.page || 0) === pageIndex; });

        // 分离塔罗和其他
        var tarotItems = pageItems.filter(function(it) { return it.widgetType === 'tarot'; });
        var normalItems = pageItems.filter(function(it) { return it.widgetType !== 'tarot'; });
        normalItems.sort(function(a, b) {
    var aSize = (a.size || '1x1').split('x');
    var bSize = (b.size || '1x1').split('x');
    var aArea = (parseInt(aSize[0]) || 1) * (parseInt(aSize[1]) || 1);
    var bArea = (parseInt(bSize[0]) || 1) * (parseInt(bSize[1]) || 1);
    return bArea - aArea;
});
        var tarotMoved = localStorage.getItem('tarot_moved') === '1';

        // 6x4 网格占用记录
        var TOTAL_ROWS = 6, TOTAL_COLS = 4;
        var occupied = {};
        function occupy(r1, c1, r2, c2) {
            for (var r = r1; r <= r2; r++) {
                for (var c = c1; c <= c2; c++) { occupied[r + '_' + c] = true; }
            }
        }
        function isFree(r, c) { return !occupied[r + '_' + c]; }

        var cursor = { row: 1, col: 1 };
        function nextSlot(rowSpan, colSpan) {
            while (cursor.row <= TOTAL_ROWS) {
                var canFit = (cursor.col + colSpan - 1 <= TOTAL_COLS) && (cursor.row + rowSpan - 1 <= TOTAL_ROWS);
                if (canFit) {
                    for (var r = 0; r < rowSpan && canFit; r++) {
                        for (var c = 0; c < colSpan && canFit; c++) {
                            if (!isFree(cursor.row + r, cursor.col + c)) canFit = false;
                        }
                    }
                }
                if (canFit) {
                    var pos = { row: cursor.row, col: cursor.col };
                    occupy(pos.row, pos.col, pos.row + rowSpan - 1, pos.col + colSpan - 1);
                    cursor.col += colSpan;
                    if (cursor.col > TOTAL_COLS) { cursor.col = 1; cursor.row++; }
                    return pos;
                }
                cursor.col++;
                if (cursor.col > TOTAL_COLS) { cursor.col = 1; cursor.row++; }
            }
            return null;
        }

        // 预留塔罗占位（如果没被移动过）
        if (!tarotMoved && tarotItems.length > 0) {
            occupy(5, 3, 6, 4);
        }

        // 渲染普通 items
        normalItems.forEach(function(item) {
    var sizeParts = (item.size || '1x1').split('x');
    var rowSpan = parseInt(sizeParts[0]) || 1;
    var colSpan = parseInt(sizeParts[1]) || 1;

    var cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.setAttribute('data-id', item.id);

    if (item.gridPos) {
        occupy(item.gridPos.row, item.gridPos.col, item.gridPos.row + item.gridPos.rowSpan - 1, item.gridPos.col + item.gridPos.colSpan - 1);
        cell.style.gridColumn = item.gridPos.col + ' / span ' + item.gridPos.colSpan;
        cell.style.gridRow = item.gridPos.row + ' / span ' + item.gridPos.rowSpan;
    } else {
        var pos = nextSlot(rowSpan, colSpan);
        if (!pos) return;
        cell.style.gridColumn = pos.col + ' / span ' + colSpan;
        cell.style.gridRow = pos.row + ' / span ' + rowSpan;
    }
        renderCellContent(cell, item);
            setupCellLongPress(cell);
            setupDrag(cell);
            grid.appendChild(cell);
        });

        // 渲染塔罗
        tarotItems.forEach(function(item) {
            var sizeParts = (item.size || '1x1').split('x');
            var rowSpan = parseInt(sizeParts[0]) || 1;
            var colSpan = parseInt(sizeParts[1]) || 1;

            var cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.setAttribute('data-id', item.id);

            if (item.gridPos) {
                cell.style.gridColumn = item.gridPos.col + ' / span ' + item.gridPos.colSpan;
                cell.style.gridRow = item.gridPos.row + ' / span ' + item.gridPos.rowSpan;
            } else if (!tarotMoved) {
                cell.style.gridColumn = '3 / span ' + colSpan;
                cell.style.gridRow = '5 / span ' + rowSpan;
            } else {
                var pos = nextSlot(rowSpan, colSpan);
                cell.style.gridColumn = (pos ? pos.col : 1) + ' / span ' + colSpan;
                cell.style.gridRow = (pos ? pos.row : 1) + ' / span ' + rowSpan;
            }
            renderCellContent(cell, item);
            setupCellLongPress(cell);
            setupDrag(cell);
            grid.appendChild(cell);
        });

        page.appendChild(grid);
    });

    updateAllWidgetClocks();
}

// ★ 单元格内容渲染（提取函数复用）
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
    if (item.widgetType === 'calendar') {
    var now = new Date();
    var calYear = now.getFullYear();
    var calMonth = now.getMonth() + 1;
    var calToday = now.getDate();
    var daysInMonth = new Date(calYear, calMonth, 0).getDate();
    var firstDay = new Date(calYear, calMonth - 1, 1).getDay();
    var dayNames = ['日','一','二','三','四','五','六'];
    var gridHTML = '';
    dayNames.forEach(function(d) { gridHTML += '<div class="cal-widget-day-name">' + d + '</div>'; });
    for (var i = 0; i < firstDay; i++) gridHTML += '<div class="cal-widget-day"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
        var isToday = d === calToday ? ' today' : '';
        gridHTML += '<div class="cal-widget-day' + isToday + '">' + d + '</div>';
    }
    return '<div class="calendar-widget" onclick="openCalendar()">'
    + '<div class="cal-widget-header" style="padding-top:6px;margin-bottom:14px;">' + calYear + '年' + calMonth + '月</div>'
    + '<div class="cal-widget-grid" style="flex:1;align-content:center;">' + gridHTML + '</div>'
    + '</div>';
    }
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
if (diffDays > 0) {
    suffix = '还有';
} else if (diffDays < 0) {
    suffix = '已经';
} else {
    suffix = '在今天';
}

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
        + '<input type="text" class="search-input" id="cdTitleInput" value="' + cd.title + '" placeholder="例如：毕业">'
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

function setupCellLongPress(cell) {
    var startX, startY, timer;
    cell.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        timer = setTimeout(function() { enterEditMode(); }, 500);
    }, { passive: true });
    cell.addEventListener('touchmove', function(e) {
        var dx = e.touches[0].clientX - startX;
        var dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) clearTimeout(timer);
    }, { passive: true });
    cell.addEventListener('touchend', function() { clearTimeout(timer); });
    cell.addEventListener('mousedown', function() { timer = setTimeout(function() { enterEditMode(); }, 500); });
    cell.addEventListener('mouseup', function() { clearTimeout(timer); });
    cell.addEventListener('mouseleave', function() { clearTimeout(timer); });
}

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

// ========== 拖拽换位（真机级实时避让 v2） ==========
var dragTarget = null;
var dragStartX = 0, dragStartY = 0;
var dragOrigLeft = 0, dragOrigTop = 0;
var dragOrigWidth = 0, dragOrigHeight = 0;
var dragStarted = false;
var dragLongPressed = false;
var dragTimer = null;
var dragGhost = null;
var dragLastSwapKey = '';
var dragTargetGridPos = null;

function setupDrag(cell) {
    cell.addEventListener('touchstart', function(e) {
        if (isEditing && !cell.querySelector('.delete-btn')) return;
        dragTarget = cell;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        var rect = cell.getBoundingClientRect();
        dragOrigLeft = rect.left;
        dragOrigTop = rect.top;
        dragOrigWidth = rect.width;
        dragOrigHeight = rect.height;
        dragStarted = false;
        dragLongPressed = false;
        dragLastSwapKey = '';
        dragTargetGridPos = null;
        dragTimer = setTimeout(function() {
            dragLongPressed = true;
            if (!isEditing) enterEditMode();
        }, 500);
    }, { passive: true });

    cell.addEventListener('touchmove', function(e) {
        var dx = e.touches[0].clientX - dragStartX;
        var dy = e.touches[0].clientY - dragStartY;
        if (dragLongPressed && !dragStarted && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
            dragStarted = true;
            createDragGhost(cell, e.touches[0].clientX, e.touches[0].clientY);
            cell.style.opacity = '0';
            cell.style.pointerEvents = 'none';
        }
        if (dragStarted) {
            e.preventDefault();
            if (dragGhost) {
                dragGhost.style.left = (e.touches[0].clientX - dragOrigWidth / 2) + 'px';
                dragGhost.style.top = (e.touches[0].clientY - dragOrigHeight / 2) + 'px';
            }
            liveRearrange(e.touches[0].clientX, e.touches[0].clientY, cell);
        }
    }, { passive: false });

    cell.addEventListener('touchend', function(e) {
        clearTimeout(dragTimer);
        if (dragStarted) {
            endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        } else {
            if (dragGhost) { dragGhost.remove(); dragGhost = null; }
            dragLongPressed = false;
            dragTarget = null;
        }
    });
}

function createDragGhost(cell, clientX, clientY) {
    if (dragGhost) { dragGhost.remove(); dragGhost = null; }
    dragGhost = cell.cloneNode(true);
    var delBtn = dragGhost.querySelector('.delete-btn');
    if (delBtn) delBtn.remove();
    dragGhost.classList.remove('editing');
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.position = 'fixed';
    dragGhost.style.zIndex = '9999';
    dragGhost.style.left = (clientX - dragOrigWidth / 2) + 'px';
    dragGhost.style.top = (clientY - dragOrigHeight / 2) + 'px';
    dragGhost.style.width = dragOrigWidth + 'px';
    dragGhost.style.height = dragOrigHeight + 'px';
    dragGhost.style.opacity = '0.9';
    dragGhost.style.transform = 'scale(1.05)';
    dragGhost.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)';
    dragGhost.style.transition = 'none';
    document.body.appendChild(dragGhost);
}

function liveRearrange(clientX, clientY, dragCell) {
    var grid = dragCell.parentNode;
    if (!grid || grid.className !== 'desktop-grid') return;
    var gridRect = grid.getBoundingClientRect();
    var cellW = gridRect.width / 4;
    var cellH = gridRect.height / 6;
    var col = Math.floor((clientX - gridRect.left) / cellW) + 1;
    var row = Math.floor((clientY - gridRect.top) / cellH) + 1;
    col = Math.max(1, Math.min(4, col));
    row = Math.max(1, Math.min(6, row));
    var dragId = dragCell.getAttribute('data-id');
    var items = getItems();
    var dragItem = items.find(function(i) { return i.id === dragId; });
    if (!dragItem) return;
    var sizeP = (dragItem.size || '1x1').split('x');
    var rowSpan = parseInt(sizeP[0]) || 1;
    var colSpan = parseInt(sizeP[1]) || 1;
    var targetCol = Math.min(col, 4 - colSpan + 1);
    var targetRow = Math.min(row, 6 - rowSpan + 1);
    targetCol = Math.max(1, targetCol);
    targetRow = Math.max(1, targetRow);
    var swapKey = targetRow + '_' + targetCol;
    if (swapKey === dragLastSwapKey) return;
    dragLastSwapKey = swapKey;
    var dragPage = parseInt(grid.getAttribute('data-page') || '0');
    var pageItems = items.filter(function(it) { return (it.page || 0) === dragPage && it.widgetType !== 'tarot'; });
    var occupied = {};
    function occupy(r1, c1, r2, c2) {
        for (var r = r1; r <= r2; r++) for (var c = c1; c <= c2; c++) occupied[r + '_' + c] = true;
    }
    occupy(targetRow, targetCol, targetRow + rowSpan - 1, targetCol + colSpan - 1);
    var newPositions = {};
    newPositions[dragId] = { row: targetRow, col: targetCol, rowSpan: rowSpan, colSpan: colSpan };
    pageItems.forEach(function(it) {
        if (it.id === dragId) return;
        if (newPositions[it.id]) return;
        var sp = (it.size || '1x1').split('x');
        var rs = parseInt(sp[0]) || 1;
        var cs = parseInt(sp[1]) || 1;
        var placed = false;
        for (var r = 1; r <= 6 && !placed; r++) {
            for (var c = 1; c <= 4 && !placed; c++) {
                if (r + rs - 1 > 6 || c + cs - 1 > 4) continue;
                var fit = true;
                for (var rr = 0; rr < rs && fit; rr++)
                    for (var cc = 0; cc < cs && fit; cc++)
                        if (occupied[(r + rr) + '_' + (c + cc)]) fit = false;
                if (fit) {
                    occupy(r, c, r + rs - 1, c + cs - 1);
                    newPositions[it.id] = { row: r, col: c, rowSpan: rs, colSpan: cs };
                    placed = true;
                }
            }
        }
    });
    grid.querySelectorAll('.grid-cell').forEach(function(c) {
        var id = c.getAttribute('data-id');
        if (id === dragId) return;
        var pos = newPositions[id];
        if (!pos) return;
        c.style.transition = 'grid-column 0.18s ease, grid-row 0.18s ease';
        c.style.gridColumn = pos.col + ' / span ' + pos.colSpan;
        c.style.gridRow = pos.row + ' / span ' + pos.rowSpan;
    });
    dragTargetGridPos = { row: targetRow, col: targetCol, rowSpan: rowSpan, colSpan: colSpan };
}

function endDrag(clientX, clientY) {
    if (!dragTarget) return;
    if (dragGhost) { dragGhost.remove(); dragGhost = null; }
    dragTarget.style.opacity = '';
    dragTarget.style.pointerEvents = '';
    dragTarget.style.transition = '';
    if (dragTargetGridPos) {
        dragTarget.style.transition = 'grid-column 0.18s ease, grid-row 0.18s ease';
        dragTarget.style.gridColumn = dragTargetGridPos.col + ' / span ' + dragTargetGridPos.colSpan;
        dragTarget.style.gridRow = dragTargetGridPos.row + ' / span ' + dragTargetGridPos.rowSpan;
    }
    if (dragTargetGridPos) {
        var items = getItems();
        var dragId = dragTarget.getAttribute('data-id');
        var dragItem = items.find(function(i) { return i.id === dragId; });
        if (dragItem) {
            dragItem.gridPos = {
                row: dragTargetGridPos.row,
                col: dragTargetGridPos.col,
                rowSpan: dragTargetGridPos.rowSpan,
                colSpan: dragTargetGridPos.colSpan
            };
        }
        saveItems(items);
    }
    setTimeout(function() {
    exitEditMode();
    renderDesktopGrid();
    dragTarget = null;
    dragStarted = false;
    dragLongPressed = false;
    dragTargetGridPos = null;
    dragLastSwapKey = '';
}, 200);
}

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
                '<div style="display:flex;gap:8px;">' +
                '<div class="widget-preview-card" onclick="confirmAddCountdownWidget()" style="flex:1;margin:8px 0;">' +
                    '<div class="widget-preview-inner" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 0;">' +
                        '<div style="font-size:11px;color:rgba(0,0,0,0.5);">玉界已经</div>' +
                        '<div style="font-size:32px;font-weight:800;color:#000;">365</div>' +
                        '<div style="font-size:10px;color:rgba(0,0,0,0.35);">2026-06-12</div>' +
                    '</div>' +
                    '<div class="widget-preview-label">倒数日小组件</div>' +
                '</div>' +
                '<div class="widget-preview-card" onclick="confirmAddTarotWidget()" style="flex:1;margin:8px 0;">' +
                    '<div class="widget-preview-inner" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 0;">' +
                        '<div style="position:relative;width:36px;height:48px;">' +
                            '<div style="position:absolute;width:28px;height:42px;background:#1a1a1a;border:1px solid rgba(255,255,255,0.2);border-radius:2px;top:0;left:0;transform:rotate(-6deg);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:10px;">✦</div>' +
                            '<div style="position:absolute;width:28px;height:42px;background:#1a1a1a;border:1px solid rgba(255,255,255,0.2);border-radius:2px;top:2px;left:8px;transform:rotate(4deg);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:10px;">✦</div>' +
                        '</div>' +
                        '<div style="font-size:11px;color:rgba(0,0,0,0.5);">Tarot</div>' +
                    '</div>' +
                    '<div class="widget-preview-label">塔罗小组件</div>' +
                '</div>' +
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

function confirmAddTarotWidget() {
    var items = getItems();
    if (items.find(function(i) { return i.id === 'widget-tarot-default'; })) {
        showToast('塔罗小组件已在桌面');
        closeHalfPanel();
        return;
    }
    items.push({
        id: 'widget-tarot-default',
        type: 'widget',
        widgetType: 'tarot',
        size: '2x2',
        page: 0
    });
    saveItems(items);
    closeHalfPanel();
    renderDesktopGrid();
    showToast('塔罗小组件已添加');
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

// ========== 重置塔罗位置 ==========
function resetTarotPosition() {
    localStorage.removeItem('tarot_moved');
    renderDesktopGrid();
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
    addDesktopIcon({ id: 'creation', name: '创作', icon: '<img src="https://i.ibb.co/sd7V4xcN/1784007234536.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openCreation', page: 1 });

    var items = getItems();
    if (!items.find(function(i) { return i.id === 'widget-tarot-default'; })) {
        items.push({ id: 'widget-tarot-default', type: 'widget', widgetType: 'tarot', size: '2x2', page: 0 });
        saveItems(items);
    }
    if (!items.find(function(i) { return i.id === 'widget-calendar-default'; })) {
        items.push({ id: 'widget-calendar-default', type: 'widget', widgetType: 'calendar', size: '4x4', page: 1 });
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
    window.resetTarotPosition = resetTarotPosition;
});
