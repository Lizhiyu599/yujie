/**
 * 玉界 - 桌面管理系统 v2.0
 * 统一网格布局：图标1x1，小组件支持1x2/2x2/2x4/3x4/4x4
 * 支持拖拽排序、长按编辑、位置持久化
 */

// ========== 全局状态 ==========
let isEditing = false;
let longPressTimer = null;
let longPressStarted = false;
let addButton = null;
let halfPanel = null;
let touchStartX = 0, touchStartY = 0;

// ========== 统一网格数据 ==========
// 存储格式：{ id, type: 'app'|'widget', name, icon?, action?, widgetType?, size?, page, x, y }
// page: 0=第一页, 1=第二页
// x: 列(0-3), y: 行
// size: '1x1'|'1x2'|'2x2'|'2x4'|'3x4'|'4x4'

const DEFAULT_GRID = [];

function getGridItems() {
    var raw = localStorage.getItem('desktop_grid');
    return raw ? JSON.parse(raw) : DEFAULT_GRID.slice();
}

function saveGridItems(items) {
    localStorage.setItem('desktop_grid', JSON.stringify(items));
}

// 兜底：没有任何小组件时创建默认时钟
var hasWidget = items.some(function(i) { return i.type === 'widget'; });
if (!hasWidget) {
    items.push({
        id: 'widget-clock-1',
        type: 'widget',
        widgetType: 'clock',
        size: '2x4',
        page: 0,
        x: 0,
        y: 0,
        avatar: '',
        signature: '——  ..おやすみ ..——',
        temp: '24°',
        weatherDesc: '上海·晴'
    });
}

// 兼容旧数据迁移
function migrateOldData() {
    if (localStorage.getItem('desktop_grid')) return;
    var items = [];
    // 迁移图标
    var oldIcons = localStorage.getItem('desktop_icons');
    if (oldIcons) {
        try {
            var icons = JSON.parse(oldIcons);
            icons.forEach(function(icon, i) {
                items.push({
                    id: icon.id,
                    type: 'app',
                    name: icon.name,
                    icon: icon.icon || '',
                    action: icon.action || null,
                    size: '1x1',
                    page: 0,
                    x: i % 4,
                    y: Math.floor(i / 4)
                });
            });
        } catch(e) {}
    }
    // 迁移小组件
    var oldWidgets = localStorage.getItem('desktop_widgets');
    if (oldWidgets) {
        try {
            var widgets = JSON.parse(oldWidgets);
            widgets.forEach(function(w) {
                var size = w.size || (w.type === 'clock' ? '2x4' : '2x2');
                items.push({
                    id: w.id,
                    type: 'widget',
                    widgetType: w.type || 'custom',
                    size: size,
                    page: w.page || 0,
                    x: 0,
                    y: items.filter(function(it) { return it.page === (w.page || 0); }).length,
                    image: w.image || '',
                    avatar: w.avatar || '',
                    signature: w.signature || '',
                    temp: w.temp || '24°',
                    weatherDesc: w.weatherDesc || '上海·晴'
                });
            });
        } catch(e) {}
    }
    saveGridItems(items);
}

function addDesktopIcon(item) {
    var items = getGridItems();
    var existing = items.findIndex(function(i) { return i.id === item.id; });
    var newItem = {
        id: item.id,
        type: 'app',
        name: item.name,
        icon: item.icon || '',
        action: item.action || null,
        size: '1x1',
        page: 0,
        x: items.length % 4,
        y: Math.floor(items.length / 4)
    };
    if (existing >= 0) {
        items[existing] = newItem;
    } else {
        items.push(newItem);
    }
    saveGridItems(items);
    renderDesktopGrid();
}

// ========== 渲染统一桌面网格 ==========
function renderDesktopGrid() {
    migrateOldData();
    var items = getGridItems();
    
    ['page1', 'page2'].forEach(function(pageId, pageIndex) {
        var page = document.getElementById(pageId);
        if (!page) return;
        
        // 清空页面
        page.innerHTML = '';
        
        // 创建grid容器
        var grid = document.createElement('div');
        grid.className = 'desktop-grid';
        grid.setAttribute('data-page', pageIndex);
        
        var pageItems = items.filter(function(item) { return item.page === pageIndex; });
        
        pageItems.forEach(function(item, index) {
            var cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.setAttribute('data-id', item.id);
            cell.setAttribute('data-index', index);
            
            // 设置占格
            var sizeParts = (item.size || '1x1').split('x');
            var colSpan = parseInt(sizeParts[0]) || 1;
            var rowSpan = parseInt(sizeParts[1]) || 1;
            cell.style.gridColumn = 'span ' + colSpan;
            cell.style.gridRow = 'span ' + rowSpan;
            
            if (item.type === 'app') {
                // 图标
                cell.innerHTML = `
                    <div class="app-icon">
                        <div class="icon-img">${item.icon || ''}</div>
                        <div class="icon-label">${item.name}</div>
                    </div>
                `;
                cell.querySelector('.app-icon').addEventListener('click', function(e) {
                    if (isEditing) return;
                    if (item.action && typeof window[item.action] === 'function') {
                        window[item.action]();
                    }
                });
            } else {
                // 小组件
                var widgetHTML = '';
                if (item.widgetType === 'custom') {
                    widgetHTML = `
                        <div class="desktop-widget grid-widget custom-widget" style="padding:0;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;border:none;box-shadow:none;">
                            <div style="width:100%;height:100%;min-height:${item.size === '2x2' ? '120px' : '160px'};background-image:url(${item.image});background-size:cover;background-position:center;border-radius:18px;"></div>
                        </div>
                    `;
                } else if (item.widgetType === 'clock') {
                    var avatarSrc = item.avatar || '';
                    var avatarContent = avatarSrc
                        ? `<div class="widget-avatar" style="background-image:url(${avatarSrc});"></div>`
                        : `<div class="widget-avatar">+</div>`;
                    widgetHTML = `
                        <div class="desktop-widget grid-widget">
                            <div class="widget-top-row">
                                <div class="widget-left">
                                    ${avatarContent}
                                    <div class="widget-time-block">
                                        <span class="widget-time widget-time-display">00:00</span>
                                        <span class="widget-date widget-date-display">1月1日 星期一</span>
                                    </div>
                                </div>
                                <div class="widget-weather-block">
                                    <span class="widget-temp">${item.temp}</span>
                                    <div class="widget-weather-desc">${item.weatherDesc}</div>
                                </div>
                            </div>
                            <div class="widget-divider"></div>
                            <span class="widget-signature" contenteditable="true" 
                                  onblur="updateWidgetSignature('${item.id}', this.innerText)"
                                  onfocus="if(this.innerText==='——  ..おやすみ ..——'){this.innerText=''}">${item.signature}</span>
                        </div>
                    `;
                }
                cell.innerHTML = widgetHTML;
            }
            
            grid.appendChild(cell);
        });
        
        page.appendChild(grid);
    });
    
    updateAllWidgetClocks();
}

function updateAllWidgetClocks() {
    var now = new Date();
    var h = now.getHours().toString().padStart(2, '0');
    var m = now.getMinutes().toString().padStart(2, '0');
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    var dayName = days[now.getDay()];

    document.querySelectorAll('.grid-widget').forEach(function(el) {
        var timeEl = el.querySelector('.widget-time-display');
        var dateEl = el.querySelector('.widget-date-display');
        if (timeEl) timeEl.textContent = h + ':' + m;
        if (dateEl) dateEl.textContent = month + '月' + day + '日 ' + dayName;
    });
}
setInterval(updateAllWidgetClocks, 1000);

function updateWidgetSignature(widgetId, value) {
    var items = getGridItems();
    var item = items.find(function(i) { return i.id === widgetId; });
    if (item) {
        item.signature = value;
        saveGridItems(items);
    }
}

// 兼容旧函数名
function renderDesktopIcons() { renderDesktopGrid(); }
function renderWidgets() { renderDesktopGrid(); }
function getWidgets() { return getGridItems().filter(function(i) { return i.type === 'widget'; }); }
function saveWidgets(w) {}

// ========== 编辑模式 ==========
function enterEditMode() {
    if (isEditing) return;
    isEditing = true;
    clearTimeout(longPressTimer);
    removeAddButton();

    document.querySelectorAll('.grid-cell').forEach(function(cell) {
        cell.classList.add('editing');
        var itemId = cell.getAttribute('data-id');
        
        var oldBtn = cell.querySelector('.delete-btn');
        if (oldBtn) oldBtn.remove();
        
        var delBtn = document.createElement('div');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = 'X';
        delBtn.style.cssText = 'position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:#ff3b30;color:#fff;border-radius:50%;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:5;';
        delBtn.onclick = function(e) {
            e.stopPropagation();
            deleteGridItem(itemId);
        };
        cell.style.position = 'relative';
        cell.appendChild(delBtn);
    });
}

function exitEditMode() {
    isEditing = false;
    document.querySelectorAll('.grid-cell').forEach(function(cell) {
        cell.classList.remove('editing');
    });
    document.querySelectorAll('.delete-btn, .widget-delete-btn').forEach(function(btn) {
        btn.remove();
    });
}

function deleteGridItem(id) {
    var items = getGridItems();
    items = items.filter(function(i) { return i.id !== id; });
    saveGridItems(items);
    renderDesktopGrid();
    setTimeout(function() {
        if (isEditing) enterEditMode();
    }, 50);
}

// ========== 桌面空白处长按 ==========
function setupDesktopLongPress() {
    ['page1', 'page2'].forEach(function(pageId) {
        var desktopPage = document.getElementById(pageId);
        if (!desktopPage) return;

        desktopPage.addEventListener('touchstart', function(e) {
            if (e.target.closest('.grid-cell') || e.target.closest('.add-widget-btn')) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            longPressTimer = setTimeout(function() {
                if (isEditing) return;
                showAddButton();
            }, 500);
        }, { passive: true });

        desktopPage.addEventListener('touchend', function() {
            clearTimeout(longPressTimer);
        });

        desktopPage.addEventListener('touchmove', function(e) {
            if (!longPressTimer) return;
            var dx = e.touches[0].clientX - touchStartX;
            var dy = e.touches[0].clientY - touchStartY;
            if (Math.abs(dx) > 25 || Math.abs(dy) > 25) {
                clearTimeout(longPressTimer);
            }
        }, { passive: true });
    });
}

// ========== 加号按钮 ==========
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
    addButton.addEventListener('touchstart', function(e) {
        e.stopPropagation();
    });
    document.getElementById('desktop').appendChild(addButton);
}

function removeAddButton() {
    if (addButton) { addButton.remove(); addButton = null; }
}

document.addEventListener('touchstart', function(e) {
    if (addButton && !addButton.contains(e.target)) removeAddButton();
    if (isEditing && !e.target.closest('.grid-cell') && !e.target.closest('.add-widget-btn') && !e.target.closest('.delete-btn') && !e.target.closest('.widget-delete-btn') && !e.target.closest('.half-panel-overlay')) {
        exitEditMode();
    }
});

// ========== 半屏面板 ==========
function openHalfPanel() {
    if (halfPanel) halfPanel.remove();

    var overlay = document.createElement('div');
    overlay.className = 'half-panel-overlay';

    var panel = document.createElement('div');
    panel.className = 'half-panel';
    panel.innerHTML = `
        <div class="half-panel-handle"></div>
        <div class="half-panel-content" id="halfPanelContent">
            <div class="widget-list-item" data-target="widget-1x2">
                <span>1x2 小组件</span>
                <span class="toggle-arrow">&gt;</span>
            </div>
            <div id="widget-1x2" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">1x2 占位（即将推出）</div>
            </div>
            <div class="widget-list-item" data-target="widget-2x2">
                <span>2x2 小组件</span>
                <span class="toggle-arrow">&gt;</span>
            </div>
            <div id="widget-2x2" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">2x2 占位（即将推出）</div>
            </div>
            <div class="widget-list-item" data-target="widget-2x4">
                <span>2x4 小组件</span>
                <span class="toggle-arrow">&gt;</span>
            </div>
            <div id="widget-2x4" class="collapsible-section" style="display:none;">
                <div class="widget-preview-card" data-widget-type="clock" onclick="confirmAddWidget('clock')">
                    <div class="widget-preview-inner">
                        <div class="preview-top-row">
                            <div class="preview-left">
                                <div class="preview-avatar">+</div>
                                <div class="preview-time-block">
                                    <span class="preview-time">14:30</span>
                                    <span class="preview-date">6月17日 星期二</span>
                                </div>
                            </div>
                            <div class="preview-weather-block">
                                <span class="preview-temp">24°</span>
                                <div class="preview-weather-desc">上海·晴</div>
                            </div>
                        </div>
                        <div class="preview-divider"></div>
                        <div class="preview-signature">——  ..おやすみ ..——</div>
                    </div>
                    <div class="widget-preview-label">时钟小组件</div>
                </div>
            </div>
            <div class="widget-list-item" data-target="widget-3x4">
                <span>3x4 小组件</span>
                <span class="toggle-arrow">&gt;</span>
            </div>
            <div id="widget-3x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">3x4 占位（即将推出）</div>
            </div>
            <div class="widget-list-item" data-target="widget-4x4">
                <span>4x4 小组件</span>
                <span class="toggle-arrow">&gt;</span>
            </div>
            <div id="widget-4x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">4x4 占位（即将推出）</div>
            </div>
        </div>
    `;
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeHalfPanel();
    });

    halfPanel = overlay;

    var content = panel.querySelector('.half-panel-content');
    content.addEventListener('click', function(e) {
        var item = e.target.closest('.widget-list-item');
        if (!item) return;
        e.stopPropagation();
        var targetId = item.getAttribute('data-target');
        if (!targetId) return;
        var target = document.getElementById(targetId);
        if (!target) return;
        var isHidden = target.style.display === 'none';
        target.style.display = isHidden ? 'block' : 'none';
        var arrow = item.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = isHidden ? 'v' : '>';
    });

    var handle = panel.querySelector('.half-panel-handle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) {
        if (e.touches[0].clientY - startY > 50) closeHalfPanel();
    });
    handle.addEventListener('click', function(e) {
        e.stopPropagation();
        closeHalfPanel();
    });
}

function closeHalfPanel() {
    if (halfPanel) { halfPanel.remove(); halfPanel = null; }
}

// ========== 确认添加时钟小组件 ==========
function confirmAddWidget(type) {
    if (type === 'clock') {
        var items = getGridItems();
        if (items.find(function(i) { return i.widgetType === 'clock'; })) {
            alert('时钟小组件已存在');
            closeHalfPanel();
            return;
        }
        items.push({
            id: 'widget-clock-' + Date.now(),
            type: 'widget',
            widgetType: 'clock',
            size: '2x4',
            page: 0,
            x: 0,
            y: items.filter(function(i) { return i.page === 0; }).length,
            avatar: '',
            signature: '——  ..おやすみ ..——',
            temp: '24°',
            weatherDesc: '上海·晴'
        });
        saveGridItems(items);
        renderDesktopGrid();
    }
    closeHalfPanel();
}

// ========== 小组件头像上传 ==========
function setupWidgetAvatarUpload() {
    var input = document.getElementById('widget-avatar-upload');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'widget-avatar-upload';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                var items = getGridItems();
                var clockItem = items.find(function(i) { return i.widgetType === 'clock'; });
                if (clockItem) {
                    clockItem.avatar = ev.target.result;
                    saveGridItems(items);
                    renderDesktopGrid();
                }
            };
            reader.readAsDataURL(file);
        };
        document.body.appendChild(input);
    }
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {
    migrateOldData();
    renderDesktopGrid();
    setupDesktopLongPress();
    setupWidgetAvatarUpload();

    // 注册聊天图标
    addDesktopIcon({ id: 'chat', name: '聊天', icon: '<img src="https://i.ibb.co/3yN7gbxD/1782621034253.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openChat' });  
    addDesktopIcon({ id: 'shiyilin', name: '拾忆林', icon: '<img src="https://i.ibb.co/dwNq5VfT/1782621400981.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openShiyilin' });
    addDesktopIcon({ id: 'qianban', name: '牵绊', icon: '<img src="https://i.ibb.co/1f11jCzs/1782623493282.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openQianban' });
    addDesktopIcon({ id: 'gallery', name: '映像馆', icon: '<img src="https://i.ibb.co/Dfcz9js0/1782623882994.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openGallery' });
    addDesktopIcon({ id: 'qawenda', name: '奇问妙答', icon: '<img src="https://i.ibb.co/dwTDLTcc/1782624493861.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">', action: 'openQawenda' });

    var dockBar = document.getElementById('dockBar');
    if (!dockBar) return;

    var settingItem = document.createElement('div');
    settingItem.className = 'dock-item';
    var diaryItem = document.createElement('div');
    diaryItem.className = 'dock-item';
    var worldbookItem = document.createElement('div');
    worldbookItem.className = 'dock-item';
    var beautifyItem = document.createElement('div');
    beautifyItem.className = 'dock-item';

    settingItem.innerHTML = `
        <div class="dock-icon">
            <div class="dock-icon-img">
                <img src="https://i.ibb.co/HfZrSFgF/1782625018703.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">
            </div>
        </div>
        <div class="dock-label">设置</div>
    `;
    settingItem.onclick = function() {
        openModal('settingsModal');
        setTimeout(function() { renderDeviceList(); }, 100);
    };
    dockBar.appendChild(settingItem);

    diaryItem.innerHTML = `
        <div class="dock-icon">
            <div class="dock-icon-img">
                <img src="https://i.ibb.co/PzCRNBZ0/1782625096270.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">
            </div>
        </div>
        <div class="dock-label">日记</div>
    `;
    diaryItem.onclick = function() { openDiary(); };
    dockBar.appendChild(diaryItem);

    worldbookItem.innerHTML = `
        <div class="dock-icon">
            <div class="dock-icon-img">
                <img src="https://i.ibb.co/GvV3Dc17/1782625167668.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">
            </div>
        </div>
        <div class="dock-label">万象树</div>
    `;
    worldbookItem.onclick = function() { openWorldbook(); };
    dockBar.appendChild(worldbookItem);

    beautifyItem.innerHTML = `
        <div class="dock-icon">
            <div class="dock-icon-img">
                <img src="https://i.ibb.co/hFszQFvk/1782625229723.png" style="width:28px;height:28px;border-radius:8px;object-fit:cover;">
            </div>
        </div>
        <div class="dock-label">美化</div>
    `;
    beautifyItem.onclick = function() {
        initBeautify();
        openModal('beautifyModal');
        setTimeout(function() { loadCustomWidgetPreviews(); }, 500);
    };
    dockBar.appendChild(beautifyItem);

    // 暴露到全局
    window.getWidgets = function() { return getGridItems().filter(function(i) { return i.type === 'widget'; }); };
    window.saveWidgets = function(w) {};
    window.renderWidgets = renderDesktopGrid;
});
