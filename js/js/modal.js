/**
 * 玉界 - 桌面交互总管
 * 包含：Modal 打开/关闭、翻页指示器
 */

// ===== Modal 注册表 =====
// 各软件模块在这里注册自己的面板
window._modals = {};

function registerModal(id, title, bodyHTML) {
    window._modals[id] = { title, body: bodyHTML };
}

// ===== 渲染 Modal 容器 =====
function renderModalContainer() {
    const container = document.getElementById('modalContainer');
    if (!container) return;

    container.innerHTML = Object.entries(window._modals).map(([id, modal]) => `
        <div class="modal-panel" id="${id}">
            <div class="modal-header">
                <span class="modal-close" onclick="closeModal('${id}')">‹</span>
                <span>${modal.title}</span>
            </div>
            <div class="modal-body">${modal.body}</div>
        </div>
    `).join('');
}

// ===== 打开 Modal =====
function openModal(id) {
    // 先渲染容器
    renderModalContainer();
    // 显示对应面板
    const panel = document.getElementById(id);
    if (panel) {
        panel.classList.add('active');
    }
}

// ===== 关闭 Modal =====
function closeModal(id) {
    const panel = document.getElementById(id);
    if (panel) {
        panel.classList.remove('active');
    }
}

// ===== 翻页指示器 =====
function updatePageIndicator() {
    const pages = document.getElementById('desktopPages');
    if (!pages) return;
    const pageWidth = pages.clientWidth;
    const scrollLeft = pages.scrollLeft;
    const currentPage = Math.round(scrollLeft / pageWidth);

    const dots = document.querySelectorAll('.page-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPage);
    });
}

// ===== 初始化 =====
window.addEventListener('DOMContentLoaded', () => {
    // 绑定翻页事件
    const pages = document.getElementById('desktopPages');
    if (pages) {
        pages.addEventListener('scroll', updatePageIndicator);
    }
});
