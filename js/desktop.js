/**
 * 玉界 - 桌面管理系统
 * 包含：图标/小组件渲染、长按编辑（抖动+删除）、长按空白出"+"按钮、
 *       半屏小组件选择器（折叠列表）、数据持久化
 *       addDesktopIcon() 供其他模块注册图标
 */

// ========== 默认数据（初始为空，图标由各功能模块动态注册） ==========
const DEFAULT_ICONS = [];

// 桌面数据
function getIcons() {
    const raw = localStorage.getItem('desktop_icons');
    return raw ? JSON.parse(raw) : DEFAULT_ICONS.slice();
}

function saveIcons(icons) {
    localStorage.setItem('desktop_icons', JSON.stringify(icons));
}

// ===== 供外部调用的注册函数 =====
function addDesktopIcon(item) {
    const icons = getIcons();
    if (icons.find(i => i.id === item.id)) return;
    icons.push({
        id: item.id,
        type: 'app',
        name: item.name,
        icon: item.icon || '',
        action: item.action || null
    });
    saveIcons(icons);
    renderDesktopIcons();
}

// ========== 全局状态 ==========
let isEditing = false;
let longPressTimer = null;
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
    longPressTimer = setTimeout(() => {
        enterEditMode();
    }, 400);
}

function onIconTouchEnd() {
    clearTimeout(longPressTimer);
}

function onIconTouchMove(e) {
    if (!longPressTimer) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        clearTimeout(longPressTimer);
    }
}

function onIconMouseDown(e) {
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    longPressTimer = setTimeout(() => {
        enterEditMode();
    }, 400);
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
    setTimeout(() => {
        if (isEditing) enterEditMode();
    }, 50);
}

// ========== 桌面空白处长按 ==========
function setupDesktopLongPress() {
    const desktopPage = document.getElementById('page1');
    if (!desktopPage) return;

    desktopPage.addEventListener('touchstart', (e) => {
        if (e.target.closest('.app-icon')) return;
        startBlankLongPress();
    });

    desktopPage.addEventListener('mousedown', (e) => {
        if (e.target.closest('.app-icon')) return;
        startBlankLongPress();
    });
}

function startBlankLongPress() {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
        if (isEditing) return;
        showAddButton();
    }, 400);
}

document.addEventListener('touchmove', () => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}, { passive: true });

document.addEventListener('mousemove', () => {
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

document.addEventListener('click', (e) => {
    if (addButton && !addButton.contains(e.target)) {
        removeAddButton();
    }
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
                <div class="widget-placeholder">2×2 占位</div>
            </div>
            <div class="widget-list-item" onclick="toggleWidgetSection('widget-2x4', this)">
                <span>2×4 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-2x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">2×4 占位</div>
            </div>
            <div class="widget-list-item" onclick="toggleWidgetSection('widget-3x4', this)">
                <span>3×4 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-3x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">3×4 占位</div>
            </div>
            <div class="widget-list-item" onclick="toggleWidgetSection('widget-4x4', this)">
                <span>4×4 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-4x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">4×4 占位</div>
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

function toggleWidgetSection(id, headerEl) {
    const el = document.getElementById(id);
    if (!el) return;
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    const arrow = headerEl.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = isHidden ? '∨' : '›';
}

// 半屏手柄交互
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.half-panel-handle')) {
            closeHalfPanel();
        }
    });
    let startY = 0;
    document.body.addEventListener('touchstart', (e) => {
        if (e.target.closest('.half-panel-handle')) {
            startY = e.touches[0].clientY;
        }
    });
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.closest('.half-panel-handle')) {
            if (e.touches[0].clientY - startY > 60) {
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
