/**
 * 玉界 - 桌面管理系统
 * 包含：图标/小组件渲染、长按编辑（抖动+删除）、长按空白出"+"按钮、
 *       半屏小组件选择器（折叠列表+预览卡片）、数据持久化、小组件拖动、头像上传
 *       addDesktopIcon() 供其他模块注册图标
 */

// ========== 默认数据 ==========
const DEFAULT_ICONS = [];

function getIcons() {
    const raw = localStorage.getItem('desktop_icons');
    return raw ? JSON.parse(raw) : DEFAULT_ICONS.slice();
}

function saveIcons(icons) {
    localStorage.setItem('desktop_icons', JSON.stringify(icons));
}

function addDesktopIcon(item) {
    const icons = getIcons();
    const existing = icons.findIndex(i => i.id === item.id);
    const newItem = {
        id: item.id,
        type: 'app',
        name: item.name,
        icon: item.icon || '',
        action: item.action || null
    };
    if (existing !== -1) {
        icons[existing] = newItem; // 更新已有的
    } else {
        icons.push(newItem); // 新增
    }
    saveIcons(icons);
    renderDesktopIcons();
}

// ========== 全局状态 ==========
let isEditing = false;
let longPressTimer = null;
let longPressStarted = false;
let addButton = null;
let halfPanel = null;
let touchStartX = 0, touchStartY = 0;

// ========== 渲染桌面图标 ==========
function renderDesktopIcons() {
    const container = document.getElementById('appIcons');
    if (!container) return;
    container.innerHTML = '';
    const icons = getIcons();
    icons.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'app-icon';
        el.setAttribute('data-id', item.id);
        el.setAttribute('data-index', index);
        el.innerHTML = `
            <div class="icon-img">${item.icon || ''}</div>
            <div class="icon-label">${item.name}</div>
        `;
        el.addEventListener('click', (e) => {
            if (isEditing) return;
            if (item.action && typeof window[item.action] === 'function') {
                window[item.action]();
            }
        });
        el.addEventListener('touchstart', (e) => onIconTouchStart(e));
        el.addEventListener('touchend', onIconTouchEnd);
        el.addEventListener('touchmove', onIconTouchMove);
        el.addEventListener('mousedown', (e) => onIconMouseDown(e));
        el.addEventListener('mouseup', onIconMouseUp);
        el.addEventListener('mouseleave', onIconMouseUp);
        container.appendChild(el);
    });
}

// ========== 图标长按处理 ==========
function onIconTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    longPressStarted = false;
    longPressTimer = setTimeout(() => {
        longPressStarted = true;
        enterEditMode();
    }, 500);
}

function onIconTouchEnd() {
    clearTimeout(longPressTimer);
    if (longPressStarted) {
        longPressStarted = false;
    }
}

function onIconTouchMove(e) {
    if (!longPressTimer) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
        clearTimeout(longPressTimer);
    }
}

function onIconMouseDown(e) {
    longPressTimer = setTimeout(() => {
        enterEditMode();
    }, 500);
}

function onIconMouseUp() {
    clearTimeout(longPressTimer);
}

// ========== 编辑模式 ==========
function enterEditMode() {
    if (isEditing) return;
    isEditing = true;
    clearTimeout(longPressTimer);
    removeAddButton();

    document.querySelectorAll('.app-icon').forEach(el => {
        el.classList.add('editing');
        if (!el.querySelector('.delete-btn')) {
            const delBtn = document.createElement('div');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = 'X';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteIcon(el);
            };
            el.appendChild(delBtn);
        }
    });
}

function exitEditMode() {
    isEditing = false;
    document.querySelectorAll('.app-icon').forEach(el => {
        el.classList.remove('editing');
        const btn = el.querySelector('.delete-btn');
        if (btn) btn.remove();
    });
}

function deleteIcon(el) {
    const id = el.getAttribute('data-id');
    let icons = getIcons();
    icons = icons.filter(i => i.id !== id);
    saveIcons(icons);
    renderDesktopIcons();
    setTimeout(() => {
        if (isEditing) enterEditMode();
    }, 50);
}

// ========== 桌面空白处长按 ==========
function setupDesktopLongPress() {
    ['page1', 'page2'].forEach(pageId => {
        const desktopPage = document.getElementById(pageId);
        if (!desktopPage) return;

        desktopPage.addEventListener('touchstart', (e) => {
            if (e.target.closest('.app-icon') || e.target.closest('.add-widget-btn') || e.target.closest('.desktop-widget')) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            longPressTimer = setTimeout(() => {
                if (isEditing) return;
                showAddButton();
            }, 500);
        }, { passive: true });

        desktopPage.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });

        desktopPage.addEventListener('touchmove', (e) => {
            if (!longPressTimer) return;
            const dx = e.touches[0].clientX - touchStartX;
            const dy = e.touches[0].clientY - touchStartY;
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

    addButton.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        openHalfPanel();
        removeAddButton();
    });

    addButton.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    });

    document.getElementById('desktop').appendChild(addButton);
}

function removeAddButton() {
    if (addButton) {
        addButton.remove();
        addButton = null;
    }
}

document.addEventListener('touchstart', (e) => {
    if (addButton && !addButton.contains(e.target)) {
        removeAddButton();
    }
    if (isEditing && !e.target.closest('.app-icon') && !e.target.closest('.add-widget-btn') && !e.target.closest('.delete-btn') && !e.target.closest('.half-panel-overlay')) {
        exitEditMode();
    }
});

// ========== 半屏面板 ==========
function openHalfPanel() {
    if (halfPanel) halfPanel.remove();

    const overlay = document.createElement('div');
    overlay.className = 'half-panel-overlay';

    const panel = document.createElement('div');
    panel.className = 'half-panel';
    panel.innerHTML = `
        <div class="half-panel-handle"></div>
        <div class="half-panel-content" id="halfPanelContent">
            <div class="widget-list-item" data-target="widget-2x2">
                <span>2x2 小组件</span>
                <span class="toggle-arrow">&gt;</span>
            </div>
            <div id="widget-2x2" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">2x2 占位</div>
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
                <div class="widget-placeholder">3x4 占位</div>
            </div>
            <div class="widget-list-item" data-target="widget-4x4">
                <span>4x4 小组件</span>
                <span class="toggle-arrow">&gt;</span>
            </div>
            <div id="widget-4x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">4x4 占位</div>
            </div>
        </div>
    `;
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeHalfPanel();
        }
    });

    halfPanel = overlay;

    const content = panel.querySelector('.half-panel-content');
    content.addEventListener('click', function(e) {
        const item = e.target.closest('.widget-list-item');
        if (!item) return;
        e.stopPropagation();
        const targetId = item.getAttribute('data-target');
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;
        const isHidden = target.style.display === 'none';
        target.style.display = isHidden ? 'block' : 'none';
        const arrow = item.querySelector('.toggle-arrow');
        if (arrow) arrow.textContent = isHidden ? 'v' : '>';
    });

    const handle = panel.querySelector('.half-panel-handle');
    let startY = 0;
    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });
    handle.addEventListener('touchmove', (e) => {
        if (e.touches[0].clientY - startY > 50) {
            closeHalfPanel();
        }
    });
    handle.addEventListener('click', (e) => {
        e.stopPropagation();
        closeHalfPanel();
    });
}

function closeHalfPanel() {
    if (halfPanel) {
        halfPanel.remove();
        halfPanel = null;
    }
}

// ========== 小组件系统 ==========
const DEFAULT_WIDGETS = [
    {
        id: 'widget-clock-1',
        type: 'clock',
        page: 0,
        avatar: '',
        signature: '——  ..おやすみ ..——',
        temp: '24°',
        weatherDesc: '上海·晴'
    }
];

function getWidgets() {
    const raw = localStorage.getItem('desktop_widgets');
    return raw ? JSON.parse(raw) : DEFAULT_WIDGETS.slice();
}

function saveWidgets(widgets) {
    localStorage.setItem('desktop_widgets', JSON.stringify(widgets));
}

function renderWidgets() {
    const widgets = getWidgets();
    document.querySelectorAll('.desktop-widget').forEach(el => el.remove());

    widgets.forEach(widget => {
        const page = document.querySelectorAll('.desktop-page')[widget.page];
        if (!page) return;

        const el = document.createElement('div');
        el.className = 'desktop-widget';
        el.setAttribute('data-widget-id', widget.id);
        el.setAttribute('data-widget-type', widget.type);
        el.setAttribute('data-widget-page', widget.page);

        if (widget.type === 'custom') {
            el.style.padding = '0';
            el.style.overflow = 'visible';
            el.style.background = 'transparent';
            el.style.backdropFilter = 'none';
            el.style.webkitBackdropFilter = 'none';
            el.style.border = 'none';
            el.style.boxShadow = 'none';
            if (widget.size === '2x2') {
                el.style.maxWidth = 'calc(50% - 10px)';
                el.style.minHeight = '120px';
            } else {
                el.style.maxWidth = '100%';
                el.style.minHeight = '160px';
            }
            el.innerHTML = `
                <div style="width:100%; height:100%; min-height:${widget.size === '2x2' ? '120px' : '160px'}; background-image:url(${widget.image}); background-size:cover; background-position:center; border-radius:18px;"></div>
                <div class="widget-delete-btn" onclick="event.stopPropagation(); confirmDeleteWidget('${widget.id}')">×</div>
            `;
        } else {
            const avatarSrc = widget.avatar || '';
            const avatarContent = avatarSrc
                ? `<div class="widget-avatar" style="background-image:url(${avatarSrc});" onclick="event.stopPropagation(); document.getElementById('widget-avatar-upload').click()"></div>`
                : `<div class="widget-avatar" onclick="event.stopPropagation(); document.getElementById('widget-avatar-upload').click()">+</div>`;

            el.innerHTML = `
                <div class="widget-top-row">
                    <div class="widget-left">
                        ${avatarContent}
                        <div class="widget-time-block">
                            <span class="widget-time widget-time-display">00:00</span>
                            <span class="widget-date widget-date-display">1月1日 星期一</span>
                        </div>
                    </div>
                    <div class="widget-weather-block">
                        <span class="widget-temp">${widget.temp}</span>
                        <div class="widget-weather-desc">${widget.weatherDesc}</div>
                    </div>
                </div>
                <div class="widget-divider"></div>
                <span class="widget-signature" contenteditable="true" 
                      onblur="updateWidgetSignature('${widget.id}', this.innerText)" 
                      onclick="event.stopPropagation();"
                      onfocus="if(this.innerText==='——  ..おやすみ ..——'){this.innerText=''}">${widget.signature}</span>
                <div class="widget-delete-btn" onclick="event.stopPropagation(); confirmDeleteWidget('${widget.id}')">×</div>
            `;
        }

        el.addEventListener('touchstart', (e) => onWidgetTouchStart(e, el));
        el.addEventListener('touchend', onWidgetTouchEnd);
        el.addEventListener('touchmove', (e) => onWidgetTouchMove(e, el));
        el.addEventListener('mousedown', (e) => onWidgetMouseDown(e, el));
        el.addEventListener('mouseup', onWidgetMouseUp);
        el.addEventListener('mouseleave', onWidgetMouseUp);

        const iconsGrid = page.querySelector('.desktop-icons');
        if (iconsGrid) {
            page.insertBefore(el, iconsGrid);
        } else {
            page.appendChild(el);
        }
    });

    updateAllWidgetClocks();
}

function updateAllWidgetClocks() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayName = days[now.getDay()];

    document.querySelectorAll('.desktop-widget').forEach(el => {
        const timeEl = el.querySelector('.widget-time-display');
        const dateEl = el.querySelector('.widget-date-display');
        if (timeEl) timeEl.textContent = h + ':' + m;
        if (dateEl) dateEl.textContent = month + '月' + day + '日 ' + dayName;
    });
}

setInterval(updateAllWidgetClocks, 1000);

function updateWidgetSignature(widgetId, value) {
    const widgets = getWidgets();
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
        widget.signature = value;
        saveWidgets(widgets);
    }
}

// ========== 小组件长按与拖动 ==========
let widgetLongPressTimer = null;
let widgetLongPressStarted = false;
let widgetDragTarget = null;
let widgetDragStartX = 0;
let widgetDragStartY = 0;
let widgetStartLeft = 0;
let widgetStartTop = 0;
let widgetDragStarted = false;

function onWidgetTouchStart(e, el) {
    if (isEditing) return;
    widgetDragTarget = el;
    widgetDragStartX = e.touches[0].clientX;
    widgetDragStartY = e.touches[0].clientY;
    const rect = el.getBoundingClientRect();
    widgetStartLeft = rect.left;
    widgetStartTop = rect.top;
    widgetLongPressStarted = false;
    widgetDragStarted = false;

    widgetLongPressTimer = setTimeout(() => {
        widgetLongPressStarted = true;
    }, 500);
}

function onWidgetTouchEnd(e) {
    clearTimeout(widgetLongPressTimer);

    if (widgetLongPressStarted && !widgetDragStarted) {
        enterWidgetEditMode(widgetDragTarget);
    }

    if (widgetDragStarted) {
        endWidgetDrag();
    }

    widgetLongPressStarted = false;
    widgetDragStarted = false;
    widgetDragTarget = null;
}

function onWidgetTouchMove(e, el) {
    if (!widgetLongPressTimer && !widgetDragStarted) return;

    const dx = e.touches[0].clientX - widgetDragStartX;
    const dy = e.touches[0].clientY - widgetDragStartY;

    if (widgetLongPressStarted && !widgetDragStarted && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        widgetDragStarted = true;
        startWidgetDrag(el, e.touches[0].clientX, e.touches[0].clientY);
    }

    if (widgetDragStarted) {
        moveWidgetDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
}

function onWidgetMouseDown(e, el) {
    if (isEditing) return;
    widgetDragTarget = el;
    const rect = el.getBoundingClientRect();
    widgetDragStartX = e.clientX;
    widgetDragStartY = e.clientY;
    widgetStartLeft = rect.left;
    widgetStartTop = rect.top;
    widgetLongPressStarted = false;
    widgetDragStarted = false;

    widgetLongPressTimer = setTimeout(() => {
        widgetLongPressStarted = true;
    }, 500);
}

function onWidgetMouseUp() {
    clearTimeout(widgetLongPressTimer);

    if (widgetLongPressStarted && !widgetDragStarted && widgetDragTarget) {
        enterWidgetEditMode(widgetDragTarget);
    }

    if (widgetDragStarted) {
        endWidgetDrag();
    }

    widgetLongPressStarted = false;
    widgetDragStarted = false;
    widgetDragTarget = null;
}

function startWidgetDrag(el, clientX, clientY) {
    el.classList.add('dragging');
    el.style.position = 'fixed';
    el.style.zIndex = '150';
    el.style.left = widgetStartLeft + 'px';
    el.style.top = widgetStartTop + 'px';
    el.style.width = el.offsetWidth + 'px';
    el.style.margin = '0';
    el.style.pointerEvents = 'none';
}

function moveWidgetDrag(clientX, clientY) {
    if (!widgetDragTarget) return;
    const dx = clientX - widgetDragStartX;
    const dy = clientY - widgetDragStartY;
    widgetDragTarget.style.left = (widgetStartLeft + dx) + 'px';
    widgetDragTarget.style.top = (widgetStartTop + dy) + 'px';

    const screenWidth = window.innerWidth;
    const pages = document.getElementById('desktopPages');
    if (clientX > screenWidth - 30 && pages) {
        const currentScroll = pages.scrollLeft;
        const pageWidth = pages.clientWidth;
        const targetPage = Math.min(Math.floor(currentScroll / pageWidth) + 1, pages.children.length - 1);
        pages.scrollTo({ left: targetPage * pageWidth, behavior: 'smooth' });
    } else if (clientX < 30 && pages) {
        const currentScroll = pages.scrollLeft;
        const pageWidth = pages.clientWidth;
        const targetPage = Math.max(Math.floor(currentScroll / pageWidth) - 1, 0);
        pages.scrollTo({ left: targetPage * pageWidth, behavior: 'smooth' });
    }
}

function endWidgetDrag() {
    if (!widgetDragTarget) return;

    const rect = widgetDragTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const pages = document.getElementById('desktopPages');
    const pageWidth = pages.clientWidth;
    const scrollLeft = pages.scrollLeft;
    const targetPage = Math.round((centerX + scrollLeft) / pageWidth);
    const clampedPage = Math.max(0, Math.min(targetPage, pages.children.length - 1));

    const widgetId = widgetDragTarget.getAttribute('data-widget-id');
    const widgets = getWidgets();
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
        widget.page = clampedPage;
        saveWidgets(widgets);
    }

    widgetDragTarget.classList.remove('dragging');
    widgetDragTarget.style.position = '';
    widgetDragTarget.style.zIndex = '';
    widgetDragTarget.style.left = '';
    widgetDragTarget.style.top = '';
    widgetDragTarget.style.width = '';
    widgetDragTarget.style.margin = '';
    widgetDragTarget.style.pointerEvents = '';

    renderWidgets();
}

function enterWidgetEditMode(el) {
    if (isEditing) return;
    exitEditMode();
    el.classList.add('editing');
}

document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.desktop-widget') && !e.target.closest('.confirm-dialog')) {
        document.querySelectorAll('.desktop-widget.editing').forEach(el => {
            el.classList.remove('editing');
        });
    }
});

// ========== 确认删除小组件弹窗 ==========
let pendingDeleteWidgetId = null;

function confirmDeleteWidget(widgetId) {
    pendingDeleteWidgetId = widgetId;

    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'confirmDeleteOverlay';
    overlay.innerHTML = `
        <div class="confirm-dialog">
            <p>确认删除当前小组件？</p>
            <div class="confirm-buttons">
                <div class="confirm-btn-cancel" onclick="cancelDeleteWidget()">取消</div>
                <div class="confirm-btn-delete" onclick="executeDeleteWidget()">确定</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function cancelDeleteWidget() {
    pendingDeleteWidgetId = null;
    const overlay = document.getElementById('confirmDeleteOverlay');
    if (overlay) overlay.remove();
}

function executeDeleteWidget() {
    if (!pendingDeleteWidgetId) return;
    let widgets = getWidgets();
    widgets = widgets.filter(w => w.id !== pendingDeleteWidgetId);
    saveWidgets(widgets);
    pendingDeleteWidgetId = null;
    const overlay = document.getElementById('confirmDeleteOverlay');
    if (overlay) overlay.remove();
    renderWidgets();
}

// ========== 确认添加小组件弹窗 ==========
let pendingAddWidgetType = null;

function confirmAddWidget(type) {
    pendingAddWidgetType = type;

    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'confirmAddOverlay';
    overlay.innerHTML = `
        <div class="confirm-dialog">
            <p>添加当前小组件？</p>
            <div class="confirm-buttons">
                <div class="confirm-btn-cancel" onclick="cancelAddWidget()">取消</div>
                <div class="confirm-btn-delete" onclick="executeAddWidget()">确定</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function cancelAddWidget() {
    pendingAddWidgetType = null;
    const overlay = document.getElementById('confirmAddOverlay');
    if (overlay) overlay.remove();
}

function executeAddWidget() {
    if (!pendingAddWidgetType) return;

    if (pendingAddWidgetType === 'clock') {
        const widgets = getWidgets();
        if (widgets.find(w => w.type === 'clock')) {
            alert('时钟小组件已存在');
        } else {
            widgets.push({
                id: 'widget-clock-' + Date.now(),
                type: 'clock',
                page: 0,
                avatar: '',
                signature: '——  ..おやすみ ..——',
                temp: '24°',
                weatherDesc: '上海·晴'
            });
            saveWidgets(widgets);
            renderWidgets();
        }
    }

    pendingAddWidgetType = null;
    const overlay = document.getElementById('confirmAddOverlay');
    if (overlay) overlay.remove();
    closeHalfPanel();
}

// ========== 小组件头像上传 ==========
function setupWidgetAvatarUpload() {
    let input = document.getElementById('widget-avatar-upload');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'widget-avatar-upload';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.onchange = handleWidgetAvatarChange;
        document.body.appendChild(input);
    }
}

function handleWidgetAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const result = ev.target.result;
        const widgets = getWidgets();
        const clockWidget = widgets.find(w => w.type === 'clock');
        if (clockWidget) {
            clockWidget.avatar = result;
            saveWidgets(widgets);
            renderWidgets();
        }
    };
    reader.readAsDataURL(file);
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', () => {
    renderDesktopIcons();
    setupDesktopLongPress();
    setupWidgetAvatarUpload();
    renderWidgets();

    // 注册聊天图标到桌面第一页
    addDesktopIcon({ id: 'chat', name: '聊天', icon: '<svg width="28" height="28" viewBox="0 0 100 100" fill="none" stroke="#555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 25 L80 25 L80 70 L55 70 L40 82 L40 70 L20 70Z"/><circle cx="38" cy="48" r="3"/><circle cx="50" cy="48" r="3"/><circle cx="62" cy="48" r="3"/></svg>', action: 'openChat' });
    addDesktopIcon({ id: 'shiyilin', name: '拾忆林', icon: '<svg width="28" height="28" viewBox="0 0 100 100" fill="none" stroke="#555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M50 16 L38 36 L62 36Z"/><path d="M50 30 L32 52 L68 52Z"/><path d="M50 44 L34 64 L66 64Z"/><line x1="50" y1="62" x2="50" y2="78"/></svg>', action: 'openShiyilin' });
    
    const dockBar = document.getElementById('dockBar');
    if (!dockBar) return;

    // 日记图标
const diaryItem = document.createElement('div');
diaryItem.className = 'dock-item';
diaryItem.innerHTML = `
    <div class="dock-icon">
        <div class="dock-icon-img">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" stroke="#555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M50 26 L78 20 L78 80 L50 74Z"/>
                <path d="M50 26 L22 20 L22 80 L50 74Z"/>
                <line x1="22" y1="20" x2="78" y2="20"/>
                <line x1="30" y1="34" x2="42" y2="34"/>
                <line x1="30" y1="44" x2="42" y2="44"/>
                <line x1="30" y1="64" x2="42" y2="64"/>
                <line x1="30" y1="74" x2="42" y2="74"/>
                <line x1="58" y1="34" x2="70" y2="34"/>
                <line x1="58" y1="44" x2="70" y2="44"/>
                <line x1="58" y1="64" x2="70" y2="64"/>
                <line x1="58" y1="74" x2="70" y2="74"/>
            </svg>
        </div>
    </div>
    <div class="dock-label">日记</div>
`;
diaryItem.onclick = () => { openDiary(); };
dockBar.appendChild(diaryItem);
    
// 万象树图标
const worldbookItem = document.createElement('div');
worldbookItem.className = 'dock-item';
worldbookItem.innerHTML = `
    <div class="dock-icon">
        <div class="dock-icon-img">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" stroke="#555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M50 18 L34 42 L66 42Z"/>
                <path d="M50 36 L30 62 L70 62Z"/>
                <line x1="50" y1="58" x2="50" y2="78"/>
            </svg>
        </div>
    </div>
    <div class="dock-label">万象树</div>
`;
worldbookItem.onclick = () => { openWorldbook(); };
dockBar.appendChild(worldbookItem);

// 美化图标
const beautifyItem = document.createElement('div');
beautifyItem.className = 'dock-item';
beautifyItem.innerHTML = `
    <div class="dock-icon">
        <div class="dock-icon-img">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" stroke="#555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <g transform="rotate(-15 50 50)">
                    <line x1="50" y1="68" x2="50" y2="86"/>
                    <polygon points="50,12 56,32 78,34 60,48 66,68 50,56 34,68 40,48 22,34 44,32"/>
                    <circle cx="76" cy="22" r="1.5"/>
                    <circle cx="24" cy="20" r="1.5"/>
                </g>
            </svg>
        </div>
    </div>
    <div class="dock-label">美化</div>
`;
beautifyItem.onclick = () => {
    initBeautify();
    openModal('beautifyModal');
    setTimeout(() => { loadCustomWidgetPreviews(); }, 500);
};
dockBar.appendChild(beautifyItem);
    
// ========== 暴露到全局，供 beautify.js 调用 ==========
window.getWidgets = getWidgets;
window.saveWidgets = saveWidgets;
window.renderWidgets = renderWidgets;
});
