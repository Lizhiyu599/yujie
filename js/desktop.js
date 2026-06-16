/**
 * 玉界 - 桌面管理系统
 * 包含：图标/小组件渲染、长按编辑（抖动+删除）、长按空白出“+”按钮、
 *       半屏小组件选择器（折叠列表）、数据持久化
 */

// ========== 默认数据 ==========
const DEFAULT_ICONS = [
    { id: 'app1', type: 'app', name: '聊天', icon: '💬', action: 'openChat' },
    { id: 'app2', type: 'app', name: '日记', icon: '📔', action: 'openDiary' },
    { id: 'app3', type: 'app', name: '动态', icon: '🌐', action: 'openFeed' },
    { id: 'app4', type: 'app', name: '论坛', icon: '📋', action: 'openForum' },
    { id: 'app5', type: 'app', name: '游戏', icon: '🎮', action: 'openGame' },
    { id: 'app6', type: 'app', name: '商城', icon: '🛒', action: 'openShop' },
    { id: 'app7', type: 'app', name: '相册', icon: '🖼️', action: 'openAlbum' },
    { id: 'app8', type: 'app', name: '音乐', icon: '🎵', action: 'openMusic' }
];

// 桌面数据（只管理第一页图标，第二页小组件后续按需扩展）
function getIcons() {
    const raw = localStorage.getItem('desktop_icons');
    return raw ? JSON.parse(raw) : DEFAULT_ICONS.slice();
}

function saveIcons(icons) {
    localStorage.setItem('desktop_icons', JSON.stringify(icons));
}

// ========== 全局状态 ==========
let isEditing = false;
let longPressTimer = null;
let addButton = null;
let halfPanel = null;

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
            <div class="icon-img">${item.icon}</div>
            <div class="icon-label">${item.name}</div>
        `;
        // 点击打开（非编辑模式）
        el.addEventListener('click', (e) => {
            if (isEditing) return;
            if (item.action && typeof window[item.action] === 'function') {
                window[item.action]();
            }
        });
        // 长按事件
        el.addEventListener('touchstart', (e) => onIconTouchStart(e, el, item));
        el.addEventListener('touchend', onIconTouchEnd);
        el.addEventListener('touchmove', onIconTouchMove);
        el.addEventListener('mousedown', (e) => onIconMouseDown(e, el, item));
        el.addEventListener('mouseup', onIconMouseUp);
        el.addEventListener('mouseleave', onIconMouseUp);
        container.appendChild(el);
    });
}

// ========== 图标长按处理 ==========
function onIconTouchStart(e, el, item) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    longPressTimer = setTimeout(() => {
        enterEditMode();
    }, 500);
}

function onIconTouchEnd(e) {
    clearTimeout(longPressTimer);
}

function onIconTouchMove(e) {
    if (!longPressTimer) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        clearTimeout(longPressTimer);
    }
}

function onIconMouseDown(e, el, item) {
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    longPressTimer = setTimeout(() => {
        enterEditMode();
    }, 500);
}

function onIconMouseUp(e) {
    clearTimeout(longPressTimer);
}

// ========== 编辑模式 ==========
function enterEditMode() {
    if (isEditing) return;
    isEditing = true;
    clearTimeout(longPressTimer);
    // 移除可能存在的加号按钮
    removeAddButton();

    document.querySelectorAll('.app-icon').forEach(el => {
        el.classList.add('editing');
        if (!el.querySelector('.delete-btn')) {
            const delBtn = document.createElement('div');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = '✕';
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
    // 保持编辑模式
    setTimeout(() => {
        if (isEditing) enterEditMode();
    }, 50);
}

// ========== 桌面空白处长按 ==========
function setupDesktopLongPress() {
    const desktopPage = document.getElementById('page1'); // 第一页
    if (!desktopPage) return;

    desktopPage.addEventListener('touchstart', (e) => {
        // 忽略图标上的触摸
        if (e.target.closest('.app-icon')) return;
        startBlankLongPress(e.touches[0].clientX, e.touches[0].clientY);
    });

    desktopPage.addEventListener('mousedown', (e) => {
        if (e.target.closest('.app-icon')) return;
        startBlankLongPress(e.clientX, e.clientY);
    });
}

function startBlankLongPress(x, y) {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
        // 不进入编辑模式，而是显示加号按钮
        if (isEditing) {
            // 如果已在编辑模式，点击空白退出（之前全局点击已处理），但不显示加号
            return;
        }
        showAddButton();
    }, 500);
}

// 移动时取消长按
document.addEventListener('touchmove', (e) => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}, { passive: true });

document.addEventListener('mousemove', (e) => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
});

// ========== 加号按钮 ==========
function showAddButton() {
    removeAddButton();
    addButton = document.createElement('div');
    addButton.className = 'add-widget-btn';
    addButton.innerHTML = '+';
    addButton.onclick = (e) => {
        e.stopPropagation();
        openHalfPanel();
        removeAddButton();
    };
    // 阻止点击穿透
    addButton.addEventListener('touchstart', (e) => e.stopPropagation());
    addButton.addEventListener('mousedown', (e) => e.stopPropagation());
    document.getElementById('desktop').appendChild(addButton);
}

function removeAddButton() {
    if (addButton) {
        addButton.remove();
        addButton = null;
    }
}

// 全局点击关闭加号按钮（除自身）
document.addEventListener('click', (e) => {
    if (addButton && !addButton.contains(e.target)) {
        removeAddButton();
    }
    // 如果点击的不是图标，退出编辑模式
    if (isEditing && !e.target.closest('.app-icon') && !e.target.closest('.add-widget-btn') && !e.target.closest('.delete-btn')) {
        exitEditMode();
    }
});

// ========== 半屏面板 ==========
function openHalfPanel() {
    if (halfPanel) halfPanel.remove();

    const overlay = document.createElement('div');
    overlay.className = 'half-panel-overlay';
    overlay.onclick = closeHalfPanel;

    const panel = document.createElement('div');
    panel.className = 'half-panel';
    panel.innerHTML = `
        <div class="half-panel-handle"></div>
        <div class="half-panel-content">
            <div class="widget-list-item" onclick="toggleWidgetSection('widget-2x2', this)">
                <span>2×2 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-2x2" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder" style="width: calc(2 * var(--icon-size) + 2 * 10px); height: calc(2 * var(--icon-size) + 2 * 10px);">2×2 占位</div>
            </div>
            <div class="widget-list-item" onclick="toggleWidgetSection('widget-2x4', this)">
                <span>2×4 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-2x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder" style="width: calc(2 * var(--icon-size) + 2 * 10px); height: calc(4 * var(--icon-size) + 4 * 10px);">2×4 占位</div>
            </div>
            <div class="widget-list-item" onclick="toggleWidgetSection('widget-3x4', this)">
                <span>3×4 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-3x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder" style="width: calc(3 * var(--icon-size) + 3 * 10px); height: calc(4 * var(--icon-size) + 4 * 10px);">3×4 占位</div>
            </div>
            <div class="widget-list-item" onclick="toggleWidgetSection('widget-4x4', this)">
                <span>4×4 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-4x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder" style="width: calc(4 * var(--icon-size) + 4 * 10px); height: calc(4 * var(--icon-size) + 4 * 10px);">4×4 占位</div>
            </div>
        </div>
    `;
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    halfPanel = overlay;
}

function closeHalfPanel() {
    if (halfPanel) {
        halfPanel.remove();
        halfPanel = null;
    }
}

// 半屏内折叠切换
function toggleWidgetSection(id, headerEl) {
    const el = document.getElementById(id);
    if (!el) return;
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    const arrow = headerEl.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = isHidden ? '∨' : '›';
}

// 拖拽关闭（简单处理：点击手柄或下拉一段距离关闭）
document.addEventListener('DOMContentLoaded', () => {
    // 半屏手柄点击关闭
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.half-panel-handle')) {
            closeHalfPanel();
        }
    });
    // 下拉关闭（检测触摸移动距离）
    let startY = 0;
    document.body.addEventListener('touchstart', (e) => {
        if (e.target.closest('.half-panel-handle')) {
            startY = e.touches[0].clientY;
        }
    });
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.closest('.half-panel-handle')) {
            const delta = e.touches[0].clientY - startY;
            if (delta > 60) { // 下拉超过60px关闭
                closeHalfPanel();
            }
        }
    });
});

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', () => {
    renderDesktopIcons();
    setupDesktopLongPress();
});
