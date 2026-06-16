// ===== 注册设置图标到 Dock =====
window.addEventListener('DOMContentLoaded', () => {
    // 1. 注册设置面板
    if (typeof registerModal === 'function') {
        registerModal('settingsModal', '设置', settingsHTML);
    }

    // 2. 统一渲染所有已注册的 Modal
    if (typeof renderAllModals === 'function') {
        renderAllModals();
    }

    // 3. 挂载设置图标到 Dock
    const dockBar = document.getElementById('dockBar');
    if (!dockBar) return;

    const settingItem = document.createElement('div');
    settingItem.className = 'dock-item';
    settingItem.innerHTML = `
        <div class="dock-icon">设</div>
        <div>设置</div>
    `;
    settingItem.onclick = () => {
        openModal('settingsModal');
    };

    dockBar.appendChild(settingItem);
});
