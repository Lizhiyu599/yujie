/**
 * 玉界 - 桌面管理系统
 * 包含：图标/小组件渲染、长按编辑（抖动+删除）、长按空白出"+"按钮、
 *       半屏小组件选择器（折叠列表）、数据持久化
 *       addDesktopIcon() 供其他模块注册图标
 */

// ========== 默认数据（初始为空，图标由各功能模块动态注册） ==========
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
let longPressStarted = false;   // 防止 touchend 误触发
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
    // 如果长按已触发，阻止后续 click
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

    // 只监听整个桌面的 touchstart，判断是否在空白处
    desktopPage.addEventListener('touchstart', (e) => {
        if (e.target.closest('.app-icon') || e.target.closest('.add-widget-btn')) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        longPressTimer = setTimeout(() => {
            if (isEditing) return;
            showAddButton();
        }, 500);
    });

    // touchend 取消
    desktopPage.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });

    // touchmove 超过阈值取消
    desktopPage.addEventListener('touchmove', (e) => {
        if (!longPressTimer) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
            clearTimeout(longPressTimer);
        }
    });
}

// ========== 加号按钮 ==========
function showAddButton() {
    removeAddButton();
    addButton = document.createElement('div');
    addButton.className = 'add-widget-btn';
    addButton.innerHTML = '+';
    // 阻止点击冒泡到桌面
    addButton.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
    });
    addButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        openHalfPanel();
        removeAddButton();
    });
    document.getElementById('desktop').appendChild(addButton);
}

function removeAddButton() {
    if (addButton) {
        addButton.remove();
        addButton = null;
    }
}

// 点击桌面其他地方关闭加号（加号本身已阻止冒泡所以不会被自己关掉）
document.addEventListener('touchstart', (e) => {
    if (addButton && !addButton.contains(e.target)) {
        removeAddButton();
    }
    // 点击非图标区域退出编辑模式
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
                <span>2×2 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-2x2" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">2×2 占位</div>
            </div>
            <div class="widget-list-item" data-target="widget-2x4">
                <span>2×4 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-2x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">2×4 占位</div>
            </div>
            <div class="widget-list-item" data-target="widget-3x4">
                <span>3×4 小组件</span>
                <span class="toggle-arrow">›</span>
            </div>
            <div id="widget-3x4" class="collapsible-section" style="display:none;">
                <div class="widget-placeholder">3×4 占位</div>
            </div>
            <div class="widget-list-item" data-target="widget-4x4">
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

    // 点击遮罩层关闭（点面板本身不关闭）
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeHalfPanel();
        }
    });

    halfPanel = overlay;

    // 委托事件：点击折叠项切换展开/关闭
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
        if (arrow) arrow.textContent = isHidden ? '∨' : '›';
    });

    // 手柄交互
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

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', () => {
    renderDesktopIcons();
    setupDesktopLongPress();
});
