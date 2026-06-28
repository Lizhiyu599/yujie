/**
 * 玉界 - 桌面管理系统 v3.1
 * 图标与小组件统一网格混排
 * 4列网格，size格式：行x列，如2x4=2行4列占满全宽
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
    return [{
        id: 'widget-clock-default',
        type: 'widget',
        widgetType: 'clock',
        size: '2x4',
        page: 0,
        avatar: '',
        signature: '——  ..おやすみ ..——',
        temp: '24°',
        weatherDesc: '上海·晴'
    }];
}

function saveItems(items) {
    localStorage.setItem('desktop_items_v3', JSON.stringify(items));
}

function addDesktopIcon(item) {
    var items = getItems();
    var existing = items.findIndex(function(i) { return i.id === item.id; });
    var page0Count = items.filter(function(i) { return (i.page || 0) === 0; }).length;
    var newItem = {
        id: item.id,
        type: 'app',
        name: item.name,
        icon: item.icon || '',
        action: item.action || null,
        size: '1x1',
        page: page0Count >= 8 ? 1 : 0
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

        var shortcuts = page.querySelector('#page2Shortcuts');
        page.innerHTML = '';
        if (shortcuts) page.appendChild(shortcuts);

        var grid = document.createElement('div');
        grid.className = 'desktop-grid';
        grid.setAttribute('data-page', pageIndex);

        var pageItems = items.filter(function(item) { return (item.page || 0) === pageIndex; });

        // 小组件永远排前面
        pageItems.sort(function(a, b) {
            if (a.type === 'widget' && b.type !== 'widget') return -1;
            if (a.type !== 'widget' && b.type === 'widget') return 1;
            return 0;
        });

        pageItems.forEach(function(item) {
            var cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.setAttribute('data-id', item.id);

            // size格式：行x列
            var sizeParts = (item.size || '1x1').split('x');
            var rowSpan = parseInt(sizeParts[0]) || 1;
            var colSpan = parseInt(sizeParts[1]) || 1;
            cell.style.gridColumn = 'span ' + colSpan;
            cell.style.gridRow = 'span ' + rowSpan;

            if (item.type === 'app') {
                cell.innerHTML =
                    '<div class="app-icon">' +
                        '<div class="icon-img">' + (item.icon || '') + '</div>' +
                        '<div class="icon-label">' + (item.name || '') + '</div>' +
                    '</div>';
                (function(it) {
                    cell.querySelector('.app-icon').addEventListener('click', function() {
                        if (isEditing) return;
                        if (it.action && typeof window[it.action] === 'function') window[it.action]();
                    });
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
                var sig = cell.querySelector('.widget-signature');
                if (sig) {
                    (function(it) {
                        sig.addEventListener('blur', function() { updateWidgetField(it.id, 'signature', sig.innerText); });
                        sig.addEventListener('focus', function() { if (sig.innerText === '——  ..おやすみ ..——') sig.innerText = ''; });
                        sig.addEventListener('click', function(e) { e.stopPropagation(); });
                    })(item);
                }
            }

            setupCellLongPress(cell);
            setupDrag(cell);
            grid.appendChild(cell);
        });

        page.appendChild(grid);
    });

    updateAllWidgetClocks();
}

function buildWidgetHTML(item) {
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

// ========== 长按进编辑 ==========
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

// ========== 拖拽换位 ==========
var dragTarget = null;
var dragStartX = 0, dragStartY = 0;
var dragOrigLeft = 0, dragOrigTop = 0;
var dragOrigWidth = 0, dragOrigHeight = 0;
var dragStarted = false;
var dragLongPressed = false;
var dragTimer = null;

function setupDrag(cell) {
    cell.addEventListener('touchstart', function(e) {
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
        dragTimer = setTimeout(function() { dragLongPressed = true; }, 500);
    }, { passive: true });

    cell.addEventListener('touchmove', function(e) {
        var dx = e.touches[0].clientX - dragStartX;
        var dy = e.touches[0].clientY - dragStartY;
        if (dragLongPressed && !dragStarted && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
            dragStarted = true;
            cell.style.position = 'fixed';
            cell.style.zIndex = '500';
            cell.style.left = dragOrigLeft + 'px';
            cell.style.top = dragOrigTop + 'px';
            cell.style.width = dragOrigWidth + 'px';
            cell.style.height = dragOrigHeight + 'px';
            cell.style.opacity = '0.65';
            cell.style.pointerEvents = 'none';
        }
        if (dragStarted) {
            e.preventDefault();
            cell.style.left = (dragOrigLeft + dx) + 'px';
            cell.style.top = (dragOrigTop + dy) + 'px';
        }
    }, { passive: false });

    cell.addEventListener('touchend', function(e) {
        clearTimeout(dragTimer);
        if (dragStarted) endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        dragStarted = false;
        dragLongPressed = false;
        dragTarget = null;
    });
}

function endDrag(clientX, clientY) {
    if (!dragTarget) return;
    dragTarget.style.position = '';
    dragTarget.style.zIndex = '';
    dragTarget.style.left = '';
    dragTarget.style.top = '';
    dragTarget.style.width = '';
    dragTarget.style.height = '';
    dragTarget.style.opacity = '';
    dragTarget.style.pointerEvents = '';
    dragTarget.style.transform = '';
    dragTarget.style.margin = '';

    var cells = document.querySelectorAll('.grid-cell');
    var targetCell = null;
    cells.forEach(function(c) {
        if (c === dragTarget) return;
        var rect = c.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
            targetCell = c;
        }
    });

    if (targetCell) {
        var dragId = dragTarget.getAttribute('data-id');
        var targetId = targetCell.getAttribute('data-id');
        var items = getItems();
        var di = items.findIndex(function(i) { return i.id === dragId; });
        var ti = items.findIndex(function(i) { return i.id === targetId; });
        if (di >= 0 && ti >= 0) {
            var tmp = items[di]; items[di] = items[ti]; items[ti] = tmp;
            saveItems(items);
            exitEditMode();
            renderDesktopGrid();
            dragTarget = null;
            setTimeout(function() { if (isEditing) enterEditMode(); }, 100);
        }
    }
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
            '<div id="wp-2x2" class="collapsible-section" style="display:none;"><div class="widget-placeholder">即将推出</div></div>' +
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
            temp: '24°',
            weatherDesc: '上海·晴'
        });
        saveItems(items);
        renderDesktopGrid();
    }
    closeHalfPanel();
}

// ========== 自定义小组件（美化模块调用） ==========
function addCustomWidget(imageData, size) {
    var items = getItems();
    // 确定新组件应该放在哪一页（默认第0页，如果有其他逻辑可以改这里）
    var targetPage = 0;
    items.push({
        id: 'widget-custom-' + Date.now(),
        type: 'widget',
        widgetType: 'custom',
        size: size || '2x4',
        page: targetPage,  // 使用正确页面
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
    // 注册图标（先存数据，最后统一渲染一次）
    addDesktopIcon({ id: 'chat', name: '聊天', icon: '<img src="https://i.ibb.co/3yN7gbxD/1782621034253.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openChat' });
    addDesktopIcon({ id: 'shiyilin', name: '拾忆林', icon: '<img src="https://i.ibb.co/dwNq5VfT/1782621400981.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openShiyilin' });
    addDesktopIcon({ id: 'qianban', name: '牵绊', icon: '<img src="https://i.ibb.co/1f11jCzs/1782623493282.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openQianban' });
    addDesktopIcon({ id: 'gallery', name: '映像馆', icon: '<img src="https://i.ibb.co/Dfcz9js0/1782623882994.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openGallery' });
    addDesktopIcon({ id: 'qawenda', name: '奇问妙答', icon: '<img src="https://i.ibb.co/dwTDLTcc/1782624493861.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openQawenda' });

    // 统一渲染一次
    renderDesktopGrid();
    setupDesktopLongPress();
    setupWidgetAvatarUpload();

    // Dock栏
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
