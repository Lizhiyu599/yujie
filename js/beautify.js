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
            <div class="beautify-box-2x4" id="b-wallpaper-preview" onclick="document.getElementById('wallpaperFileInput').click()">
                点击选择壁纸 (9:16)
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
            <!-- 预览气泡 -->
            <div style="background:#f2f2f7; border-radius:16px; padding:16px; margin-bottom:16px; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:flex-end;">
                    <div class="css-preview-bubble css-preview-user">咋样我的美化？</div>
                </div>
                <div style="display:flex; justify-content:flex-start;">
                    <div class="css-preview-bubble css-preview-bot">绝了女神！好崇拜。</div>
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
    <div class="list-header" onclick="toggleSection('b-widget-sec', this)">
        <span>小组件</span>
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="b-widget-sec" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <div style="font-size:12px; color:#8e8e93; margin-bottom:8px;">自定义小组件</div>
            <div style="display:flex; gap:12px; margin-bottom:12px;">
                <div class="beautify-box-2x2" onclick="alert('选择图库图片')">2x2</div>
                <div class="beautify-box-2x2" onclick="alert('选择图库图片')">2x2</div>
            </div>
            <div class="beautify-box-2x4" onclick="alert('选择图库图片')">2x4</div>
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

// ===== 当前已注册的应用图标数据（供美化面板展示） =====
let registeredAppIcons = [];

function registerAppIconForBeautify(id, name, label) {
    registeredAppIcons.push({ id, name, label });
}

// ===== 渲染美化面板中的应用图标网格 =====
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

// ===== 更换应用图标 =====
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

// ===== 恢复默认图标 =====
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

// ===== 加载已保存的图标 =====
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
                preview.innerText = '';
            }
        };
        reader.readAsDataURL(selectedWallpaperFile);
    }
}

function applyWallpaperFromFile() {
    if (!selectedWallpaperFile) {
        alert('请先选择壁纸图片');
        return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.style.backgroundImage = `url(${ev.target.result})`;
        }
        localStorage.setItem('beautify_wallpaper', ev.target.result);
        alert('壁纸应用成功');
    };
    reader.readAsDataURL(selectedWallpaperFile);
}

function loadSavedWallpaper() {
    const saved = localStorage.getItem('beautify_wallpaper');
    if (saved) {
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.style.backgroundImage = `url(${saved})`;
        }
    }
}

function clearWallpaper() {
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.style.backgroundImage = '';
    }
    localStorage.removeItem('beautify_wallpaper');
    alert('壁纸已清除');
}

// ===== 字体相关 =====
function updateFontPreview(val) {
    const valEl = document.getElementById('font-size-val');
    if (valEl) valEl.innerText = val;
    const preview = document.getElementById('font-preview-text');
    if (preview) {
        const baseSize = 16;
        preview.style.fontSize = (baseSize + parseInt(val) / 5) + 'px';
    }
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
    const fontSize = document.getElementById('font-size-val').innerText;
    localStorage.setItem('beautify_font_size', fontSize);
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
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'beautify-custom-css';
        document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = css || '';
}

// ===== 导出美化配置 =====
function exportBeautify() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('beautify_')) {
            data[key] = localStorage.getItem(key);
        }
    }
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yujie_beautify_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('美化配置已导出。');
}

// ===== 导入美化配置 =====
function importBeautify() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                for (const key in data) {
                    localStorage.setItem(key, data[key]);
                }
                alert('美化配置已导入，即将刷新。');
                setTimeout(() => location.reload(), 500);
            } catch (err) {
                alert('导入失败：文件格式不正确。');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===== 清空美化（双重确认） =====
let clearBeautifyClicks = 0;

function handleClearBeautify() {
    const btn = document.getElementById('clearBeautifyBtn');
    if (clearBeautifyClicks === 0) {
        clearBeautifyClicks++;
        btn.innerText = "确认清空美化？(再次点击)";
        btn.style.backgroundColor = "#ff3b30";
        btn.style.color = "#fff";
        setTimeout(() => {
            if (clearBeautifyClicks === 1) {
                clearBeautifyClicks = 0;
                btn.innerText = "清空所有美化";
                btn.style.backgroundColor = "#fff";
                btn.style.color = "#ff3b30";
            }
        }, 3000);
    } else {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('beautify_')) keys.push(key);
        }
        keys.forEach(k => localStorage.removeItem(k));
        const desktop = document.getElementById('desktop');
        if (desktop) desktop.style.backgroundImage = '';
        registeredAppIcons.forEach((_, idx) => resetAppIcon(idx));
        clearBeautifyClicks = 0;
        btn.innerText = "清空所有美化";
        btn.style.backgroundColor = "#fff";
        btn.style.color = "#ff3b30";
        alert("所有美化已清空。");
    }
}

// ===== 顶部状态栏时钟 =====
let topBarClockInterval = null;

function updateTopBarClock() {
    const el = document.getElementById('topStatusBar');
    if (!el) return;
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const is12 = localStorage.getItem('beautify_12hr') === 'true';
    if (is12) {
        h = h % 12 || 12;
    }
    el.textContent = h.toString().padStart(2, '0') + ':' + m;
}

function startTopBarClock() {
    if (topBarClockInterval) clearInterval(topBarClockInterval);
    updateTopBarClock();
    topBarClockInterval = setInterval(updateTopBarClock, 1000);
}

function applyTopBarVisibility() {
    const el = document.getElementById('topStatusBar');
    const visible = localStorage.getItem('beautify_top_info');
    if (el) {
        el.style.display = (visible === 'false') ? 'none' : 'block';
    }
}

function updateClockDisplay() {
    const is12 = document.getElementById('sw-12hr').checked;
    localStorage.setItem('beautify_12hr', is12);
    updateTopBarClock();
}

// ===== 初始化美化面板 =====
function initBeautify() {
    renderBeautifyIcons();
    loadSavedIcons();
    loadSavedWallpaper();
}

// ===== 注册美化图标到 Dock =====
window.addEventListener('DOMContentLoaded', () => {
    if (typeof registerModal === 'function') {
        registerModal('beautifyModal', '美化', beautifyHTML);
    }

    if (typeof renderAllModals === 'function') {
        renderAllModals();
    }

    // 启动状态栏时钟
    startTopBarClock();
    applyTopBarVisibility();

    // 加载已保存的壁纸
    loadSavedWallpaper();

    // 加载已保存的自定义 CSS
    applyCustomCSS();

    const dockBar = document.getElementById('dockBar');
    if (!dockBar) return;

    const beautifyItem = document.createElement('div');
    beautifyItem.className = 'dock-item';
    beautifyItem.innerHTML = `
        <div class="dock-icon">
            <div class="dock-icon-img">美</div>
        </div>
        <div class="dock-label">美化</div>
    `;
    beautifyItem.onclick = () => {
        initBeautify();
        openModal('beautifyModal');
    };

    // ========== 小组件系统 ==========

// 小组件默认数据
const DEFAULT_WIDGETS = [
    {
        id: 'widget-clock-1',
        type: 'clock',
        page: 0, // 第1页
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

// ========== 渲染小组件 ==========
function renderWidgets() {
    const widgets = getWidgets();

    // 清除所有页面上的旧小组件
    document.querySelectorAll('.desktop-widget').forEach(el => el.remove());

    widgets.forEach(widget => {
        const page = document.querySelectorAll('.desktop-page')[widget.page];
        if (!page) return;

        const el = document.createElement('div');
        el.className = 'desktop-widget';
        el.setAttribute('data-widget-id', widget.id);
        el.setAttribute('data-widget-type', widget.type);
        el.setAttribute('data-widget-page', widget.page);

        const avatarSrc = widget.avatar || '';
        const avatarContent = avatarSrc
            ? `<div class="widget-avatar" style="background-image:url(${avatarSrc});" onclick="event.stopPropagation(); document.getElementById('widget-avatar-upload').click()"></div>`
            : `<div class="widget-avatar" onclick="event.stopPropagation(); document.getElementById('widget-avatar-upload').click()">+</div>`;

        el.innerHTML = `
            <div class="widget-top-row">
                <div class="widget-left">
                    ${avatarContent}
                    <div class="widget-time-block">
                        <span class="widget-time" id="widget-time-display">00:00</span>
                        <span class="widget-date" id="widget-date-display">1月1日 星期一</span>
                    </div>
                </div>
                <div class="widget-weather-block">
                    <span class="widget-temp">${widget.temp}</span>
                    <div class="widget-weather-desc">${widget.weatherDesc}</div>
                </div>
            </div>
            <div class="widget-divider"></div>
            <input type="text" class="widget-signature" value="${widget.signature}" placeholder="——  ..おやすみ ..——" 
                   onchange="updateWidgetSignature('${widget.id}', this.value)" 
                   onclick="event.stopPropagation();">
            <div class="widget-delete-btn" onclick="event.stopPropagation(); confirmDeleteWidget('${widget.id}')">×</div>
        `;

        // 小组件事件
        el.addEventListener('touchstart', (e) => onWidgetTouchStart(e, el));
        el.addEventListener('touchend', onWidgetTouchEnd);
        el.addEventListener('touchmove', (e) => onWidgetTouchMove(e, el));
        el.addEventListener('mousedown', (e) => onWidgetMouseDown(e, el));
        el.addEventListener('mouseup', onWidgetMouseUp);
        el.addEventListener('mouseleave', onWidgetMouseUp);

        // 插入到页面第一位（在图标网格之前）
        const iconsGrid = page.querySelector('.desktop-icons');
        if (iconsGrid) {
            page.insertBefore(el, iconsGrid);
        } else {
            page.appendChild(el);
        }
    });

    updateAllWidgetClocks();
}

// ========== 更新小组件时钟 ==========
function updateAllWidgetClocks() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayName = days[now.getDay()];

    document.querySelectorAll('.desktop-widget').forEach(el => {
        const timeEl = el.querySelector('#widget-time-display');
        const dateEl = el.querySelector('#widget-date-display');
        if (timeEl) timeEl.textContent = h + ':' + m;
        if (dateEl) dateEl.textContent = month + '月' + day + '日 ' + dayName;
    });
}

// 每秒更新
setInterval(updateAllWidgetClocks, 1000);

// ========== 小组件签名更新 ==========
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
let widgetPlaceholder = null;
let widgetClone = null;

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
        // 长按不拖动 → 进入编辑模式
        enterWidgetEditMode(widgetDragTarget);
    }

    if (widgetDragStarted) {
        endWidgetDrag();
    }

    widgetLongPressStarted = false;
    widgetDragStarted = false;
    widgetDragTarget = null;
}

let widgetDragStarted = false;

function onWidgetTouchMove(e, el) {
    if (!widgetLongPressTimer && !widgetDragStarted) return;

    const dx = e.touches[0].clientX - widgetDragStartX;
    const dy = e.touches[0].clientY - widgetDragStartY;

    if (widgetLongPressStarted && !widgetDragStarted && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        // 开始拖动
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

// ========== 小组件拖动实现 ==========
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

    // 检测是否拖到屏幕边缘 → 翻页
    const screenWidth = window.innerWidth;
    const pages = document.getElementById('desktopPages');
    if (clientX > screenWidth - 30 && pages) {
        // 拖到右边缘，翻到下一页
        const currentScroll = pages.scrollLeft;
        const pageWidth = pages.clientWidth;
        const targetPage = Math.min(Math.floor(currentScroll / pageWidth) + 1, pages.children.length - 1);
        pages.scrollTo({ left: targetPage * pageWidth, behavior: 'smooth' });
    } else if (clientX < 30 && pages) {
        // 拖到左边缘，翻到上一页
        const currentScroll = pages.scrollLeft;
        const pageWidth = pages.clientWidth;
        const targetPage = Math.max(Math.floor(currentScroll / pageWidth) - 1, 0);
        pages.scrollTo({ left: targetPage * pageWidth, behavior: 'smooth' });
    }
}

function endWidgetDrag() {
    if (!widgetDragTarget) return;

    // 获取当前小组件中心点，判断落在哪个页面
    const rect = widgetDragTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const pages = document.getElementById('desktopPages');
    const pageWidth = pages.clientWidth;
    const scrollLeft = pages.scrollLeft;
    const targetPage = Math.round((centerX + scrollLeft) / pageWidth);
    const clampedPage = Math.max(0, Math.min(targetPage, pages.children.length - 1));

    // 更新小组件数据
    const widgetId = widgetDragTarget.getAttribute('data-widget-id');
    const widgets = getWidgets();
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
        widget.page = clampedPage;
        saveWidgets(widgets);
    }

    // 清理拖动状态
    widgetDragTarget.classList.remove('dragging');
    widgetDragTarget.style.position = '';
    widgetDragTarget.style.zIndex = '';
    widgetDragTarget.style.left = '';
    widgetDragTarget.style.top = '';
    widgetDragTarget.style.width = '';
    widgetDragTarget.style.margin = '';
    widgetDragTarget.style.pointerEvents = '';

    // 重新渲染
    renderWidgets();
}

// ========== 小组件编辑模式 ==========
function enterWidgetEditMode(el) {
    if (isEditing) return;
    // 先退出图标编辑
    exitEditMode();
    el.classList.add('editing');
}

// 点击桌面其他地方退出小组件编辑
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

// ========== 小组件头像上传 ==========
function setupWidgetAvatarUpload() {
    // 创建全局隐藏的文件上传input
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
        // 更新第一个时钟小组件的头像
        const clockWidget = widgets.find(w => w.type === 'clock');
        if (clockWidget) {
            clockWidget.avatar = result;
            saveWidgets(widgets);
            renderWidgets();
        }
    };
    reader.readAsDataURL(file);
}

// ========== 初始化小组件 ==========
window.addEventListener('DOMContentLoaded', () => {
    setupWidgetAvatarUpload();
    renderWidgets();
});
    
    dockBar.appendChild(beautifyItem);
});
