/**
 * 玉界 - 美化软件
 * 包含：美化面板模板、壁纸/图标/字体/小组件/CSS、导出导入、清空美化、顶部状态栏时钟、Dock 图标注册
 * 配套样式：css/beautify.css
 */

// ===== 美化面板 HTML 模板 =====
const beautifyHTML = `
<div class="settings-container">

    <!-- 桌面壁纸 -->
    <div class="list-header" onclick="toggleSection('b-wallpaper-sec', this)">
        <span>桌面壁纸更改</span>
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="b-wallpaper-sec" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <div style="position:relative; display:inline-block; width:100%;">
                <div class="beautify-box-2x4" id="b-wallpaper-preview" onclick="document.getElementById('wallpaperFileInput').click()"
                     style="background-image:url(${localStorage.getItem('beautify_wallpaper') || ''}); background-size:cover; background-position:center; background-repeat:no-repeat;">
                    ${localStorage.getItem('beautify_wallpaper') ? '' : '点击选择壁纸 (9:16)'}
                </div>
                <div class="wallpaper-delete-btn" id="wallpaperDeleteBtn" 
                     style="display:${localStorage.getItem('beautify_wallpaper') ? 'flex' : 'none'};"
                     onclick="event.stopPropagation(); confirmClearWallpaper()">×</div>
            </div>
            <input type="file" id="wallpaperFileInput" accept="image/*" style="display:none" onchange="handleWallpaperPreview(event)">
            <button class="ios-btn-black" onclick="applyWallpaperFromFile()">保存设置</button>
        </div>
    </div>

    <!-- 应用图标 -->
    <div class="list-header" onclick="toggleSection('b-icon-sec', this)">
        <span>应用图标</span>
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="b-icon-sec" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px; background:#f9f9f9; border:1px solid #e5e5ea;">
            <div style="font-size:11px; color:#8e8e93; margin-bottom:12px; text-align:center;">
                提示：点击一下图标，更改图标，点击两下删除图标
            </div>
            <div id="beautifyAppIconsGrid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; text-align:center;"></div>
        </div>
    </div>

    <!-- 信息栏 -->
    <div class="list-header" onclick="toggleSection('b-info-sec', this)">
        <span>信息栏</span>
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="b-info-sec" class="collapsible-section" style="display:none;">
        <div class="ios-group">
            <div class="ios-row">
                <span>开启顶部信息</span>
                <input type="checkbox" class="ios-switch" id="sw-top-info" checked onchange="toggleTopInfo()">
            </div>
            <div id="top-info-options">
                <div class="ios-row">
                    <span>12小时制</span>
                    <input type="checkbox" class="ios-switch" id="sw-12hr" onchange="updateClockDisplay()">
                </div>
            </div>
        </div>
    </div>

    <!-- 字体 -->
    <div class="list-header" onclick="toggleSection('b-font-sec', this)">
        <span>字体</span>
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="b-font-sec" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <div style="height:120px; border:1px solid #e5e5ea; border-radius:12px; display:flex; align-items:center; justify-content:center; background:#f2f2f7; margin-bottom:16px;">
                <span id="font-preview-text" style="background:#007aff; color:#fff; padding:10px 16px; border-radius:18px; font-size:16px;">
                    效果预览
                </span>
            </div>
            <label class="ios-label" style="display:flex; justify-content:space-between;">
                <span>字体大小</span>
                <span id="font-size-val">0</span>
            </label>
            <input type="range" min="-50" max="50" value="0" class="ios-slider" oninput="updateFontPreview(this.value)">

            <label class="ios-label" style="margin-top:16px;">字体上传</label>
            <div class="beautify-box-2x4" style="height:80px; cursor:pointer;" onclick="document.getElementById('fontFileInput').click()">
                点击上传字体文件
            </div>
            <input type="file" id="fontFileInput" accept=".ttf,.otf" style="display:none;" onchange="handleFontUpload(event)">

            <label class="ios-label" style="margin-top:16px;">URL字体</label>
            <input type="text" class="ios-input" placeholder="例如: https://.../font.ttf">

            <button class="ios-btn-black" onclick="saveFontSettings()">保存字体</button>
        </div>
    </div>

    <!-- 自定义css -->
<div class="list-header" onclick="toggleSection('b-css-sec', this)">
    <span>自定义css</span>
    <span class="toggle-arrow" style="color:#8e8e93;">›</span>
</div>
<div id="b-css-sec" class="collapsible-section" style="display:none;">
    <div class="ios-group" style="padding:16px;">
        <div style="background:#f2f2f7; border-radius:16px; padding:16px; margin-bottom:16px; display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:flex-end;">
                <div class="bubble bubble-user">咋样我的美化？</div>
            </div>
            <div style="display:flex; justify-content:flex-start;">
                <div class="bubble bubble-assistant">绝了女神！好崇拜。</div>
            </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <label class="ios-label">CSS代码</label>
            <span style="font-size:13px; color:#ff3b30; cursor:pointer; margin-bottom:6px;" onclick="document.getElementById('custom-css-input').value=''">
                一键清除
            </span>
        </div>
        <textarea id="custom-css-input" class="ios-input" style="height:120px; resize:none;" placeholder="输入css代码..."></textarea>
        <button class="ios-btn-black" onclick="saveCustomCSS()">保存css</button>
    </div>
</div>

    <!-- 小组件 -->
    <div class="list-header" onclick="toggleSection('b-widget-sec', this); setTimeout(function(){ loadCustomWidgetPreviews(); }, 300);">
        <span>小组件</span>
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="b-widget-sec" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <div style="font-size:12px; color:#8e8e93; margin-bottom:8px;">自定义小组件</div>
            <div style="display:flex; gap:12px; margin-bottom:12px;">
                <div style="position:relative; flex:1; overflow:visible;">
                    <label for="custom-widget-upload-2x2_0"
                           class="beautify-box-2x2 custom-widget-box" id="custom-widget-2x2-0"
                           style="display:flex; background-size:cover; background-position:center; background-repeat:no-repeat;"
                           onclick="if(localStorage.getItem('beautify_custom_widget_2x2_0')){event.preventDefault();handleCustomWidgetClick('2x2_0','2x2');}">
                        <span class="custom-widget-placeholder">2x2</span>
                    </label>
                    <div class="custom-widget-delete-btn" id="custom-del-2x2-0" style="display:none;"
                         onclick="event.stopPropagation(); confirmDeleteCustomWidget('2x2_0')">×</div>
                    <input type="file" id="custom-widget-upload-2x2_0" accept="image/*"
                           style="position:absolute;width:0;height:0;overflow:hidden;opacity:0;"
                           onchange="handleCustomWidgetImage(event, '2x2_0', '2x2')">
                </div>
                <div style="position:relative; flex:1; overflow:visible;">
                    <label for="custom-widget-upload-2x2_1"
                           class="beautify-box-2x2 custom-widget-box" id="custom-widget-2x2-1"
                           style="display:flex; background-size:cover; background-position:center; background-repeat:no-repeat;"
                           onclick="if(localStorage.getItem('beautify_custom_widget_2x2_1')){event.preventDefault();handleCustomWidgetClick('2x2_1','2x2');}">
                        <span class="custom-widget-placeholder">2x2</span>
                    </label>
                    <div class="custom-widget-delete-btn" id="custom-del-2x2-1" style="display:none;"
                         onclick="event.stopPropagation(); confirmDeleteCustomWidget('2x2_1')">×</div>
                    <input type="file" id="custom-widget-upload-2x2_1" accept="image/*"
                           style="position:absolute;width:0;height:0;overflow:hidden;opacity:0;"
                           onchange="handleCustomWidgetImage(event, '2x2_1', '2x2')">
                </div>
            </div>
            <div style="position:relative; overflow:visible;">
                <label for="custom-widget-upload-2x4_0"
                       class="beautify-box-2x4 custom-widget-box" id="custom-widget-2x4-0"
                       style="display:flex; background-size:cover; background-position:center; background-repeat:no-repeat;"
                       onclick="if(localStorage.getItem('beautify_custom_widget_2x4_0')){event.preventDefault();handleCustomWidgetClick('2x4_0','2x4');}">
                    <span class="custom-widget-placeholder">2x4</span>
                </label>
                <div class="custom-widget-delete-btn" id="custom-del-2x4-0" style="display:none;"
                     onclick="event.stopPropagation(); confirmDeleteCustomWidget('2x4_0')">×</div>
                <input type="file" id="custom-widget-upload-2x4_0" accept="image/*"
                       style="position:absolute;width:0;height:0;overflow:hidden;opacity:0;"
                       onchange="handleCustomWidgetImage(event, '2x4_0', '2x4')">
            </div>
        </div>
    </div>

    <!-- 危险区 -->
    <div class="list-header danger-zone-header" onclick="toggleSection('b-danger-sec', this)">
        <span>危险区</span>
        <span class="toggle-arrow" style="color:#ff3b30;">›</span>
    </div>
    <div id="b-danger-sec" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px; background:#fff0f0; border:1px solid #ffd6d6;">
            <button class="ios-btn-white" style="margin-top:0;" onclick="exportBeautify()">全局美化导出</button>
            <button class="ios-btn-black" onclick="importBeautify()">全局美化导入</button>
            <button class="ios-btn-white" id="clearBeautifyBtn" onclick="handleClearBeautify()" style="border-color:#ff3b30; color:#ff3b30;">
                清空所有美化
            </button>
        </div>
    </div>
</div>
`;

// ===== 当前已注册的应用图标数据 =====
let registeredAppIcons = [];

function registerAppIconForBeautify(id, name, label) {
    registeredAppIcons.push({ id, name, label });
}

function renderBeautifyIcons() {
    const grid = document.getElementById('beautifyAppIconsGrid');
    if (!grid) return;
    grid.innerHTML = registeredAppIcons.map((icon, idx) => `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;"
             ondblclick="resetAppIcon(${idx})"
             onclick="document.getElementById('b-icon-upload-${idx}').click()">
            <div id="b-icon-img-${idx}"
                 style="width:50px; height:50px; background:#e5e5ea; border-radius:12px;
                        display:flex; align-items:center; justify-content:center;
                        font-size:20px; color:#000; background-size:cover;
                        background-position:center; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                ${icon.label}
            </div>
            <div style="font-size:10px; margin-top:6px; color:#8e8e93;">${icon.name}</div>
            <input type="file" id="b-icon-upload-${idx}" accept="image/*" style="display:none;"
                   onchange="changeAppIcon(event, ${idx})">
        </div>
    `).join('');
}

function changeAppIcon(e, idx) {
    if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = ev => {
            const target = document.getElementById('b-icon-img-' + idx);
            if (target) {
                target.style.backgroundImage = `url(${ev.target.result})`;
                target.innerText = '';
            }
            const desktopIcon = document.getElementById('desktop-icon-img-' + idx);
            if (desktopIcon) {
                desktopIcon.style.backgroundImage = `url(${ev.target.result})`;
                desktopIcon.innerText = '';
            }
            localStorage.setItem('beautify_icon_' + idx, ev.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
    }
}

function resetAppIcon(idx) {
    const target = document.getElementById('b-icon-img-' + idx);
    const icon = registeredAppIcons[idx];
    if (target && icon) {
        target.style.backgroundImage = 'none';
        target.innerText = icon.label;
    }
    const desktopIcon = document.getElementById('desktop-icon-img-' + idx);
    if (desktopIcon && icon) {
        desktopIcon.style.backgroundImage = 'none';
        desktopIcon.innerText = icon.label;
    }
    localStorage.removeItem('beautify_icon_' + idx);
}

function loadSavedIcons() {
    registeredAppIcons.forEach((icon, idx) => {
        const saved = localStorage.getItem('beautify_icon_' + idx);
        if (saved) {
            const target = document.getElementById('b-icon-img-' + idx);
            if (target) {
                target.style.backgroundImage = `url(${saved})`;
                target.innerText = '';
            }
            const desktopIcon = document.getElementById('desktop-icon-img-' + idx);
            if (desktopIcon) {
                desktopIcon.style.backgroundImage = `url(${saved})`;
                desktopIcon.innerText = '';
            }
        }
    });
}

// ===== 壁纸相关 =====
let selectedWallpaperFile = null;

function handleWallpaperPreview(e) {
    if (e.target.files[0]) {
        selectedWallpaperFile = e.target.files[0];
        const reader = new FileReader();
        reader.onload = ev => {
            const preview = document.getElementById('b-wallpaper-preview');
            if (preview) {
                preview.style.backgroundImage = `url(${ev.target.result})`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                preview.style.backgroundRepeat = 'no-repeat';
                preview.innerText = '';
            }
            const delBtn = document.getElementById('wallpaperDeleteBtn');
            if (delBtn) delBtn.style.display = 'flex';
        };
        reader.readAsDataURL(selectedWallpaperFile);
    }
}

function applyWallpaperFromFile() {
    if (!selectedWallpaperFile) { alert('请先选择壁纸图片'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
        const result = ev.target.result;
        const desktop = document.getElementById('desktop');
        if (desktop) desktop.style.backgroundImage = `url(${result})`;
        localStorage.setItem('beautify_wallpaper', result);
        showToast('已更换壁纸');
    };
    reader.readAsDataURL(selectedWallpaperFile);
}

function loadSavedWallpaper() {
    const saved = localStorage.getItem('beautify_wallpaper');
    if (saved) {
        const desktop = document.getElementById('desktop');
        if (desktop) desktop.style.backgroundImage = `url(${saved})`;
    }
}

function confirmClearWallpaper() {
    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'confirmClearWallpaperOverlay';
    overlay.innerHTML = '<div class="confirm-dialog"><p>确认清除当前背景图？</p><div class="confirm-buttons"><div class="confirm-btn-cancel" onclick="cancelClearWallpaper()">取消</div><div class="confirm-btn-delete" onclick="executeClearWallpaper()">确定</div></div></div>';
    document.body.appendChild(overlay);
}

function cancelClearWallpaper() {
    var overlay = document.getElementById('confirmClearWallpaperOverlay');
    if (overlay) overlay.remove();
}

function executeClearWallpaper() {
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.style.backgroundImage = '';
    localStorage.removeItem('beautify_wallpaper');
    selectedWallpaperFile = null;
    const preview = document.getElementById('b-wallpaper-preview');
    if (preview) { preview.style.backgroundImage = ''; preview.innerText = '点击选择壁纸 (9:16)'; }
    const delBtn = document.getElementById('wallpaperDeleteBtn');
    if (delBtn) delBtn.style.display = 'none';
    cancelClearWallpaper();
    showToast('已清除背景图');
}

// ===== 自定义小组件 =====
function handleCustomWidgetClick(key, size) {
    var src = localStorage.getItem('beautify_custom_widget_' + key);
    if (src) {
        confirmAddCustomWidget(key, size);
    } else {
        var uploadEl = document.getElementById('custom-widget-upload-' + key);
        if (uploadEl) uploadEl.click();
    }
}

function handleCustomWidgetImage(e, key, size) {
    if (e.target.files && e.target.files[0]) {
        var reader = new FileReader();
        reader.onload = function(ev) {
            localStorage.setItem('beautify_custom_widget_' + key, ev.target.result);
            updateCustomWidgetPreview(key);
            showToast('图片已就绪，点击框可添加到桌面');
        };
        reader.readAsDataURL(e.target.files[0]);
    }
}

function updateCustomWidgetPreview(key) {
    var parts = key.split('_');
    var boxId = 'custom-widget-' + parts[0] + '-' + parts[1];
    var box = document.getElementById(boxId);
    var src = localStorage.getItem('beautify_custom_widget_' + key);
    if (box && src) {
        box.style.backgroundImage = 'url(' + src + ')';
        box.style.backgroundSize = 'cover';
        box.style.backgroundPosition = 'center';
        box.style.backgroundRepeat = 'no-repeat';
        var placeholder = box.querySelector('.custom-widget-placeholder');
        if (placeholder) placeholder.style.display = 'none';
    }
    var delBtn = document.getElementById('custom-del-' + parts[0] + '-' + parts[1]);
    if (delBtn) {
        delBtn.style.setProperty('display', src ? 'flex' : 'none', 'important');
        var parent = delBtn.parentElement;
        if (parent) parent.style.overflow = 'visible';
    }
}

function loadCustomWidgetPreviews() {
    var keys = ['2x2_0', '2x2_1', '2x4_0'];
    for (var i = 0; i < keys.length; i++) {
        updateCustomWidgetPreview(keys[i]);
    }
}

// ===== 确认添加自定义小组件 =====
function confirmAddCustomWidget(key, size) {
    var old = document.getElementById('confirmAddCustomWidgetOverlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'confirmAddCustomWidgetOverlay';
    overlay.style.zIndex = '9999';
    
    var dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = '<p>添加当前小组件？</p>';
    
    var buttons = document.createElement('div');
    buttons.className = 'confirm-buttons';
    
    var cancelBtn = document.createElement('div');
    cancelBtn.className = 'confirm-btn-cancel';
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = function(e) {
        e.stopPropagation();
        cancelAddCustomWidget();
    };
    
    var confirmBtn = document.createElement('div');
    confirmBtn.className = 'confirm-btn-delete';
    confirmBtn.textContent = '确定';
    confirmBtn.onclick = function(e) {
        e.stopPropagation();
        executeAddCustomWidget(key, size);
    };
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(confirmBtn);
    dialog.appendChild(buttons);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    overlay.onclick = function(e) {
        if (e.target === overlay) cancelAddCustomWidget();
    };
}

function cancelAddCustomWidget() {
    var overlay = document.getElementById('confirmAddCustomWidgetOverlay');
    if (overlay) overlay.remove();
}

function executeAddCustomWidget(key, size) {
    var imageSrc = localStorage.getItem('beautify_custom_widget_' + key);
    if (!imageSrc) {
        showToast('图片数据丢失，请重新选择');
        cancelAddCustomWidget();
        return;
    }
    var widgets = typeof window.getWidgets === 'function' ? window.getWidgets() : [];
    widgets.push({ id: 'widget-custom-' + Date.now(), type: 'custom', page: 0, size: size, image: imageSrc });
    if (typeof window.saveWidgets === 'function') window.saveWidgets(widgets);
    cancelAddCustomWidget();
    showToast('已添加到桌面');
    if (typeof window.renderWidgets === 'function') window.renderWidgets();
}

// ===== 删除自定义小组件图片 =====
let pendingDeleteCustomKey = null;

function confirmDeleteCustomWidget(key) {
    pendingDeleteCustomKey = key;
    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'confirmDeleteCustomOverlay';
    overlay.innerHTML = '<div class="confirm-dialog"><p>确认清除当前小组件？</p><div class="confirm-buttons"><div class="confirm-btn-cancel" id="cancelDeleteCustomWidgetBtn">取消</div><div class="confirm-btn-delete" id="confirmDeleteCustomWidgetBtn">确定</div></div></div>';
    document.body.appendChild(overlay);
    
    document.getElementById('cancelDeleteCustomWidgetBtn').onclick = cancelDeleteCustomWidget;
    document.getElementById('confirmDeleteCustomWidgetBtn').onclick = executeDeleteCustomWidget;
    overlay.onclick = function(e) {
        if (e.target === overlay) cancelDeleteCustomWidget();
    };
}

function cancelDeleteCustomWidget() {
    pendingDeleteCustomKey = null;
    var overlay = document.getElementById('confirmDeleteCustomOverlay');
    if (overlay) overlay.remove();
}

function executeDeleteCustomWidget() {
    if (!pendingDeleteCustomKey) return;
    localStorage.removeItem('beautify_custom_widget_' + pendingDeleteCustomKey);
    var key = pendingDeleteCustomKey;
    pendingDeleteCustomKey = null;
    var overlay = document.getElementById('confirmDeleteCustomOverlay');
    if (overlay) overlay.remove();
    updateCustomWidgetPreview(key);
    var parts = key.split('_');
    var boxId = 'custom-widget-' + parts[0] + '-' + parts[1];
    var box = document.getElementById(boxId);
    if (box) {
        box.style.backgroundImage = '';
        var placeholder = box.querySelector('.custom-widget-placeholder');
        if (placeholder) placeholder.style.display = '';
    }
    var delBtn = document.getElementById('custom-del-' + key);
    if (delBtn) delBtn.style.display = 'none';
    showToast('已删除');
}

// ===== 顶部提示弹窗 =====
let toastTimer = null;
let toastStartX = 0;
let toastStartY = 0;

function showToast(message) {
    const old = document.getElementById('globalToast');
    if (old) old.remove();
    if (toastTimer) clearTimeout(toastTimer);
    const toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'global-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.addEventListener('touchstart', (e) => { toastStartX = e.touches[0].clientX; toastStartY = e.touches[0].clientY; });
    toast.addEventListener('touchmove', (e) => { if (Math.abs(e.touches[0].clientX - toastStartX) > 50 || Math.abs(e.touches[0].clientY - toastStartY) > 50) dismissToast(toast); });
    toastTimer = setTimeout(() => dismissToast(toast), 3000);
}

function dismissToast(el) {
    if (!el || el.classList.contains('toast-hiding')) return;
    el.classList.add('toast-hiding');
    setTimeout(() => { if (el.parentNode) el.remove(); }, 300);
}

// ===== 字体相关 =====
function updateFontPreview(val) {
    const valEl = document.getElementById('font-size-val');
    if (valEl) valEl.innerText = val;
    const preview = document.getElementById('font-preview-text');
    if (preview) preview.style.fontSize = (16 + parseInt(val) / 5) + 'px';
}

function handleFontUpload(e) {
    if (e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = ev => {
            localStorage.setItem('beautify_font', ev.target.result);
            localStorage.setItem('beautify_font_name', file.name);
            alert('字体文件已上传：' + file.name);
        };
        reader.readAsDataURL(file);
    }
}

function saveFontSettings() {
    localStorage.setItem('beautify_font_size', document.getElementById('font-size-val').innerText);
    alert('字体设置已保存');
}

// ===== 信息栏 =====
function toggleTopInfo() {
    const isChecked = document.getElementById('sw-top-info').checked;
    const options = document.getElementById('top-info-options');
    if (options) options.style.display = isChecked ? 'block' : 'none';
    localStorage.setItem('beautify_top_info', isChecked);
    applyTopBarVisibility();
}

// ===== 自定义 CSS =====
function saveCustomCSS() {
    const css = document.getElementById('custom-css-input').value;
    localStorage.setItem('beautify_custom_css', css);
    alert('CSS已保存');
    applyCustomCSS();
}

function applyCustomCSS() {
    const css = localStorage.getItem('beautify_custom_css');
    let styleEl = document.getElementById('beautify-custom-css');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'beautify-custom-css'; document.head.appendChild(styleEl); }
    styleEl.innerHTML = css || '';
}

// ===== 导出美化配置 =====
function exportBeautify() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('beautify_')) data[key] = localStorage.getItem(key);
    }
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'yujie_beautify_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    alert('美化配置已导出。');
}

function importBeautify() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                for (const key in data) localStorage.setItem(key, data[key]);
                alert('美化配置已导入，即将刷新。');
                setTimeout(() => location.reload(), 500);
            } catch (err) { alert('导入失败：文件格式不正确。'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===== 清空美化 =====
let clearBeautifyClicks = 0;
function handleClearBeautify() {
    const btn = document.getElementById('clearBeautifyBtn');
    if (clearBeautifyClicks === 0) {
        clearBeautifyClicks++;
        btn.innerText = "确认清空美化？(再次点击)"; btn.style.backgroundColor = "#ff3b30"; btn.style.color = "#fff";
        setTimeout(() => { if (clearBeautifyClicks === 1) { clearBeautifyClicks = 0; btn.innerText = "清空所有美化"; btn.style.backgroundColor = "#fff"; btn.style.color = "#ff3b30"; } }, 3000);
    } else {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key.startsWith('beautify_')) keys.push(key); }
        keys.forEach(k => localStorage.removeItem(k));
        const desktop = document.getElementById('desktop'); if (desktop) desktop.style.backgroundImage = '';
        registeredAppIcons.forEach((_, idx) => resetAppIcon(idx));
        clearBeautifyClicks = 0; btn.innerText = "清空所有美化"; btn.style.backgroundColor = "#fff"; btn.style.color = "#ff3b30";
        alert("所有美化已清空。");
    }  
}

// ===== 顶部状态栏时钟 =====
let topBarClockInterval = null;
function updateTopBarClock() {
    const el = document.getElementById('topStatusBar'); if (!el) return;
    const now = new Date(); let h = now.getHours(); const m = now.getMinutes().toString().padStart(2, '0');
    if (localStorage.getItem('beautify_12hr') === 'true') h = h % 12 || 12;
    el.textContent = h.toString().padStart(2, '0') + ':' + m;
}
function startTopBarClock() { if (topBarClockInterval) clearInterval(topBarClockInterval); updateTopBarClock(); topBarClockInterval = setInterval(updateTopBarClock, 1000); }
function applyTopBarVisibility() {
    var el = document.getElementById('topStatusBar');
    var right = document.getElementById('topStatusRight');
    var hidden = localStorage.getItem('beautify_top_info') === 'false';
    if (el) el.style.display = hidden ? 'none' : 'block';
    if (right) right.style.display = hidden ? 'none' : 'flex';
}
function updateClockDisplay() { localStorage.setItem('beautify_12hr', document.getElementById('sw-12hr').checked); updateTopBarClock(); }

// ===== 电量实时更新 =====
function updateBatteryFill() {
    var fill = document.querySelector('.battery-fill');
    var percent = document.getElementById('batteryPercent');
    var icon = document.getElementById('batteryIcon');
    if (!fill || !percent) return;

    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            var level = Math.round(battery.level * 100);
            fill.style.width = level + '%';
            percent.textContent = level;

            if (battery.charging) {
                icon.classList.add('charging');
                icon.classList.remove('low');
            } else if (level <= 20) {
                icon.classList.remove('charging');
                icon.classList.add('low');
            } else {
                icon.classList.remove('charging', 'low');
            }

            battery.addEventListener('levelchange', updateBatteryFill);
            battery.addEventListener('chargingchange', updateBatteryFill);
        }).catch(function() {
            fill.style.width = '80%';
            percent.textContent = '80';
        });
    } else {
        fill.style.width = '80%';
        percent.textContent = '80';
    }
}

var _origStartTopBarClock = startTopBarClock;
startTopBarClock = function() {
    _origStartTopBarClock();
    updateBatteryFill();
    setInterval(updateBatteryFill, 30000);
};

// ===== 初始化美化面板 =====
function initBeautify() { renderBeautifyIcons(); loadSavedIcons(); loadSavedWallpaper(); }

// ===== 注册美化面板 =====
if (typeof registerModal === 'function') {
    registerModal('beautifyModal', '美化', beautifyHTML);
}

startTopBarClock();
loadSavedWallpaper();
