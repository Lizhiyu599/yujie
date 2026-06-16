/**
 * 玉界 - 桌面交互总管
 * 包含：Modal 打开/关闭、翻页指示器
 */

// ===== Modal 注册表 =====
window._modals = {};

function registerModal(id, title, bodyHTML) {
    window._modals[id] = { title, body: bodyHTML };
}

// ===== 初始化渲染所有 Modal =====
function renderAllModals() {
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
    // 强制重新渲染，确保 Modal 一定存在于 DOM 中
    renderAllModals();
    
    const panel = document.getElementById(id);
    if (panel) {
        setTimeout(() => {
            panel.classList.add('active');
        }, 10);
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
    if (pageWidth > 0) {
        const currentPage = Math.round(scrollLeft / pageWidth);
        const dots = document.querySelectorAll('.page-dot');
        dots.forEach((dot, index) => {
            if (index === currentPage) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// 页面加载完成后初始化指示器
window.addEventListener('DOMContentLoaded', () => {
    updatePageIndicator();
});
