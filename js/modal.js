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
    var container = document.getElementById('modalContainer');
    if (!container) return;

    var html = '';
    var modals = window._modals;
    for (var id in modals) {
        var m = modals[id];
        html += '<div class="modal-panel" id="' + id + '">';
        html += '<div class="modal-header">';
        html += '<span class="modal-close" onclick="closeModal(\'' + id + '\')">‹</span>';
        html += '<span>' + m.title + '</span>';
        html += '</div>';
        html += '<div class="modal-body">' + m.body + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

// ===== 打开 Modal =====
function openModal(id) {
    // 强制渲染
    renderAllModals();
    
    var panel = document.getElementById(id);
    if (panel) {
        panel.classList.add('active');
    }
}

// ===== 关闭 Modal =====
function closeModal(id) {
    var panel = document.getElementById(id);
    if (panel) {
        panel.classList.remove('active');
    }
}

// ===== 翻页指示器 =====
function updatePageIndicator() {
    var pages = document.getElementById('desktopPages');
    if (!pages) return;
    var pageWidth = pages.clientWidth;
    var scrollLeft = pages.scrollLeft;
    if (pageWidth > 0) {
        var currentPage = Math.round(scrollLeft / pageWidth);
        var dots = document.querySelectorAll('.page-dot');
        for (var i = 0; i < dots.length; i++) {
            if (i === currentPage) {
                dots[i].classList.add('active');
            } else {
                dots[i].classList.remove('active');
            }
        }
    }
}

// 初始化指示器
window.addEventListener('DOMContentLoaded', function() {
    updatePageIndicator();
});
