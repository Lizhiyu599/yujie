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
    // 确保面板已渲染
    if (!document.getElementById(id)) {
        renderAllModals();
    }
    const panel = document.getElementById(id);
    if (panel) {
        // 使用 setTimeout 确保 DOM 渲染完毕后再添加动画类名，否则可能没有平滑弹出的动画
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
    // 加上安全判断，防止除以0
    if (pageWidth > 0) {
        const currentPage = Math.round(scrollLeft / pageWidth);
        const dots = document.querySelectorAll('.page-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPage);
        });
    }
}
