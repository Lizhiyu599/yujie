/**
 * 玉界 - 日记软件
 * 包含：日记本 UI 渲染、翻页动画、日历跳转、日记设置、数据持久化
 */

// ========== 日记数据存储 ==========
function getDiaries() {
    const raw = localStorage.getItem('diary_entries');
    return raw ? JSON.parse(raw) : [];
}

function saveDiaries(diaries) {
    localStorage.setItem('diary_entries', JSON.stringify(diaries));
}

function getDiaryFontSettings() {
    const raw = localStorage.getItem('diary_font_settings');
    return raw ? JSON.parse(raw) : {
        size: 0,
        color: '#cccccc',
        fontFamily: ''
    };
}

function saveDiaryFontSettings(settings) {
    localStorage.setItem('diary_font_settings', JSON.stringify(settings));
}

// ========== 当前状态 ==========
let currentPageIndex = 0;
let isCoverOpen = false;
let diaryCalendarDate = new Date();

// ========== 打开日记软件 ==========
function openDiary() {
    let appWindow = document.getElementById('diaryAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'diaryAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#0d0d0d;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    isCoverOpen = false;
    currentPageIndex = 0;
    diaryCalendarDate = new Date();
    renderDiaryApp();
    appWindow.style.display = 'flex';
}

function closeDiary() {
    const appWindow = document.getElementById('diaryAppWindow');
    if (appWindow) appWindow.style.display = 'none';
    isCoverOpen = false;
}

// ========== 渲染日记应用完整 UI ==========
function renderDiaryApp() {
    const appWindow = document.getElementById('diaryAppWindow');
    if (!appWindow) return;

    const fontSettings = getDiaryFontSettings();
    const diaries = getDiaries();

    appWindow.innerHTML = `
        <div class="diary-app">
            <!-- 顶部栏 -->
            <div class="diary-top-bar">
                <div class="diary-back-btn" onclick="closeDiary()">‹</div>
                <div class="diary-top-title">日 记</div>
                <div class="diary-top-actions">
                    <div class="diary-btn-refresh" onclick="generateDiary()" title="手动生成日记">↻</div>
                    <div class="diary-btn-calendar" onclick="openDiaryCalendar()" title="日历视图">📅</div>
                    <div class="diary-btn-settings" onclick="openDiarySettings()" title="日记设置">○</div>
                </div>
            </div>

            <!-- 书架背景 -->
            <div class="diary-shelf">
                <div class="diary-book" id="diaryBook">
                    <!-- 封面 -->
                    <div class="diary-cover ${isCoverOpen ? 'open' : ''}" id="diaryCover" onclick="openCover()">
                        <div class="cover-ornament">✦ DIARY ✦</div>
                        <div class="cover-title">日 记</div>
                        <div class="cover-subtitle">翻开新的一页</div>
                    </div>
                </div>
            </div>

            <!-- 底部工具栏 -->
            <div class="diary-bottom-bar">
                <button class="diary-nav-btn" onclick="prevPage()" ${!isCoverOpen || currentPageIndex === 0 ? 'disabled' : ''}>‹ 上一页</button>
                <button class="diary-nav-btn" onclick="nextPage()">${isCoverOpen ? '下一页 ›' : '翻开'}</button>
            </div>
        </div>
    `;

    // 渲染内页
    renderDiaryPages();
    updateBottomBar();
}

// ========== 渲染日记内页 ==========
function renderDiaryPages() {
    const book = document.getElementById('diaryBook');
    if (!book) return;

    const diaries = getDiaries();
    const fontSettings = getDiaryFontSettings();

    // 清除旧页面（保留封面）
    const oldPages = book.querySelectorAll('.diary-page');
    oldPages.forEach(p => p.remove());

    if (diaries.length === 0) return;

    diaries.forEach((diary, index) => {
        const page = document.createElement('div');
        page.className = 'diary-page';
        page.style.zIndex = diaries.length - index + 10;

        if (!isCoverOpen) {
            page.classList.add('behind');
        }

        // 生成6个活页孔
        let holesHTML = '';
        for (let h = 0; h < 6; h++) {
            holesHTML += '<div class="page-hole"></div>';
        }

        page.innerHTML = `
            <div class="binding-edge"></div>
            <div class="page-holes">${holesHTML}</div>
            <div class="page-number left-num">${index * 2 + 1}</div>
            <div class="page-number right-num">${index * 2 + 2}</div>
            <div class="diary-page-content">
                <div class="diary-entry-date">${diary.date}</div>
                <div class="diary-entry-text" style="
                    font-size: ${17 + parseInt(fontSettings.size) / 5}px;
                    color: ${fontSettings.color};
                    ${fontSettings.fontFamily ? 'font-family: ' + fontSettings.fontFamily + ';' : ''}
                ">${diary.content}</div>
            </div>
        `;

        book.appendChild(page);
    });

    updatePageVisibility();
}

// ========== 更新页面翻页状态 ==========
function updatePageVisibility() {
    const pages = document.querySelectorAll('.diary-page');
    pages.forEach((page, index) => {
        page.classList.remove('flipped', 'current', 'behind');
        if (index < currentPageIndex) {
            page.classList.add('flipped');
        } else if (index === currentPageIndex) {
            page.classList.add('current');
        } else {
            page.classList.add('behind');
        }
    });
}

// ========== 更新底部工具栏 ==========
function updateBottomBar() {
    const diaries = getDiaries();
    const prevBtn = document.querySelector('.diary-bottom-bar .diary-nav-btn:first-child');
    const nextBtn = document.querySelector('.diary-bottom-bar .diary-nav-btn:last-child');

    if (prevBtn) {
        prevBtn.disabled = !isCoverOpen || currentPageIndex === 0;
    }
    if (nextBtn) {
        nextBtn.textContent = isCoverOpen ? '下一页 ›' : '翻开';
        if (isCoverOpen && currentPageIndex >= diaries.length - 1) {
            nextBtn.disabled = true;
        } else if (!isCoverOpen) {
            nextBtn.disabled = false;
        }
    }
}

// ========== 翻开封面 ==========
function openCover() {
    if (isCoverOpen) return;
    const cover = document.getElementById('diaryCover');
    if (!cover) return;
    cover.classList.add('open');
    isCoverOpen = true;
    currentPageIndex = 0;

    const diaries = getDiaries();
    if (diaries.length === 0) {
        const now = new Date();
        const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
        diaries.push({
            date: dateStr,
            content: '今天翻开日记本，准备记录生活的点滴。\n\n窗外的光线透过百叶窗洒进来，一切安静而美好。'
        });
        saveDiaries(diaries);
    }

    renderDiaryPages();
    updateBottomBar();
}

// ========== 翻页 ==========
function prevPage() {
    if (!isCoverOpen) return;
    if (currentPageIndex > 0) {
        currentPageIndex--;
        updatePageVisibility();
        updateBottomBar();
    }
}

function nextPage() {
    const diaries = getDiaries();
    if (!isCoverOpen) {
        openCover();
        return;
    }
    if (currentPageIndex < diaries.length - 1) {
        currentPageIndex++;
        updatePageVisibility();
        updateBottomBar();
    }
}

// ========== 日历视图 ==========
function openDiaryCalendar() {
    const overlay = document.createElement('div');
    overlay.className = 'diary-calendar-overlay';
    overlay.id = 'diaryCalendarOverlay';
    overlay.innerHTML = `
        <div class="diary-calendar-panel">
            <div class="diary-calendar-header">
                <span onclick="diaryCalendarChangeMonth(-1)">‹</span>
                <span class="diary-calendar-month" id="diaryCalendarMonth"></span>
                <span onclick="diaryCalendarChangeMonth(1)">›</span>
            </div>
            <div class="diary-calendar-grid" id="diaryCalendarGrid"></div>
            <div class="diary-calendar-close" onclick="closeDiaryCalendar()">关闭</div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.onclick = function(e) {
        if (e.target === overlay) closeDiaryCalendar();
    };

    renderDiaryCalendarGrid();
}

function closeDiaryCalendar() {
    const overlay = document.getElementById('diaryCalendarOverlay');
    if (overlay) overlay.remove();
}

function diaryCalendarChangeMonth(delta) {
    diaryCalendarDate.setMonth(diaryCalendarDate.getMonth() + delta);
    renderDiaryCalendarGrid();
}

function renderDiaryCalendarGrid() {
    const monthEl = document.getElementById('diaryCalendarMonth');
    const gridEl = document.getElementById('diaryCalendarGrid');
    if (!monthEl || !gridEl) return;

    const year = diaryCalendarDate.getFullYear();
    const month = diaryCalendarDate.getMonth();
    monthEl.textContent = year + '年' + (month + 1) + '月';

    const diaries = getDiaries();
    const diaryDates = {};
    diaries.forEach((d, index) => {
        diaryDates[d.date] = index;
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayKey = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';

    let html = '';
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    dayNames.forEach(d => {
        html += '<div class="diary-calendar-day-name">' + d + '</div>';
    });

    for (let i = 0; i < firstDay; i++) {
        html += '<div></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = year + '年' + (month + 1) + '月' + d + '日';
        const hasDiary = diaryDates[dateKey] !== undefined;
        const isToday = dateKey === todayKey;

        let cls = 'diary-calendar-day';
        if (hasDiary) cls += ' has-diary';
        if (isToday) cls += ' today';

        if (hasDiary) {
            html += '<div class="' + cls + '" onclick="jumpToDiary(' + diaryDates[dateKey] + ')">' + d + '</div>';
        } else {
            html += '<div class="' + cls + '">' + d + '</div>';
        }
    }

    gridEl.innerHTML = html;
}

function jumpToDiary(index) {
    closeDiaryCalendar();
    if (!isCoverOpen) {
        openCover();
        // 等待封面动画完成后再跳转
        setTimeout(() => {
            currentPageIndex = index;
            updatePageVisibility();
            updateBottomBar();
        }, 500);
    } else {
        currentPageIndex = index;
        updatePageVisibility();
        updateBottomBar();
    }
}

// ========== 手动生成日记（占位） ==========
function generateDiary() {
    showToast('角色日记生成功能即将上线');
}

// ========== 日记设置面板 ==========
function openDiarySettings() {
    const fontSettings = getDiaryFontSettings();

    const overlay = document.createElement('div');
    overlay.className = 'diary-settings-overlay';
    overlay.id = 'diarySettingsOverlay';
    overlay.innerHTML = `
        <div class="diary-settings-panel">
            <div class="diary-settings-handle"></div>
            <div class="diary-settings-title">日记设置</div>

            <!-- 自动日记 -->
            <div class="diary-auto-row">
                <span>自动日记</span>
                <input type="checkbox" class="ios-switch" id="diaryAutoSwitch" onchange="toggleDiaryAuto()">
            </div>
            <div class="diary-auto-hint">提示：开启后角色会自己写日记，一天最多写两篇日记。</div>

            <!-- 字体设置 -->
            <div class="diary-font-header" onclick="toggleDiaryFontSection()">
                <span>日记字体</span>
                <span class="arrow" id="diaryFontArrow">∨</span>
            </div>
            <div class="diary-font-body" id="diaryFontBody">
                <div style="font-size:11px; color:#555; margin-bottom:6px;">提示：此字体仅用来表示角色的日记字体，不填写则默认字体。</div>

                <!-- 字体预览 -->
                <div class="diary-font-preview" id="diaryFontPreview" style="
                    font-size: ${18 + parseInt(fontSettings.size) / 5}px;
                    color: ${fontSettings.color};
                    ${fontSettings.fontFamily ? 'font-family: ' + fontSettings.fontFamily + ';' : ''}
                ">用户你好呀</div>

                <!-- 字体大小 -->
                <div class="diary-font-slider-row">
                    <span>字体大小</span>
                    <span id="diaryFontSizeVal">${fontSettings.size}</span>
                </div>
                <input type="range" min="-50" max="50" value="${fontSettings.size}" class="diary-font-slider"
                       oninput="document.getElementById('diaryFontSizeVal').innerText=this.value; document.getElementById('diaryFontPreview').style.fontSize=${18 + parseInt(fontSettings.size) / 5} + 'px';">

                <!-- 字体颜色 -->
                <div style="font-size:13px; color:#666; margin:10px 0 6px;">字体颜色</div>
                <div class="diary-color-row">
                    <div class="diary-color-dot" style="background:#cccccc;" onclick="previewDiaryFontColor('#cccccc')"></div>
                    <div class="diary-color-dot" style="background:#ffffff;" onclick="previewDiaryFontColor('#ffffff')"></div>
                    <div class="diary-color-dot" style="background:#999999;" onclick="previewDiaryFontColor('#999999')"></div>
                    <div class="diary-color-dot" style="background:#bbbbbb;" onclick="previewDiaryFontColor('#bbbbbb')"></div>
                    <div class="diary-color-dot" style="background:#dddddd;" onclick="previewDiaryFontColor('#dddddd')"></div>
                    <input type="color" class="diary-color-picker" onchange="previewDiaryFontColor(this.value)">
                </div>

                <!-- 字体上传 -->
                <div style="font-size:13px; color:#666; margin:10px 0 6px;">字体上传</div>
                <div class="diary-upload-box" onclick="document.getElementById('diaryFontFileInput').click()">
                    点击上传字体文件
                </div>
                <input type="file" id="diaryFontFileInput" accept=".ttf,.otf,.woff,.woff2" style="display:none;" onchange="handleDiaryFontUpload(event)">

                <div style="font-size:13px; color:#666; margin:8px 0 6px;">URL字体</div>
                <input type="text" class="diary-url-input" id="diaryFontUrl" placeholder="https://.../font.ttf" value="${fontSettings.fontUrl || ''}">
                <div style="font-size:10px; color:#555; margin-bottom:10px;">支持 .ttf / .otf / .woff / .woff2 用于日记字体。</div>

                <!-- 保存字体 -->
                <button class="diary-btn-save-font" onclick="saveDiaryFont()">保存字体</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.onclick = function(e) {
        if (e.target === overlay) closeDiarySettings();
    };
}

function closeDiarySettings() {
    const overlay = document.getElementById('diarySettingsOverlay');
    if (overlay) overlay.remove();
}

// ========== 字体颜色预览 ==========
let diaryPreviewColor = '#cccccc';
function previewDiaryFontColor(color) {
    diaryPreviewColor = color;
    const preview = document.getElementById('diaryFontPreview');
    if (preview) preview.style.color = color;

    document.querySelectorAll('.diary-color-dot').forEach(dot => dot.classList.remove('active'));
}

// ========== 字体上传 ==========
function handleDiaryFontUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        localStorage.setItem('diary_custom_font', ev.target.result);
        localStorage.setItem('diary_custom_font_name', file.name);
        showToast('字体已上传：' + file.name);
    };
    reader.readAsDataURL(file);
}

// ========== 折叠字体设置 ==========
function toggleDiaryFontSection() {
    const body = document.getElementById('diaryFontBody');
    const arrow = document.getElementById('diaryFontArrow');
    if (body && arrow) {
        const isOpen = body.classList.toggle('open');
        arrow.classList.toggle('open', isOpen);
    }
}

// ========== 保存日记字体设置 ==========
function saveDiaryFont() {
    const size = document.getElementById('diaryFontSizeVal').innerText;
    const url = document.getElementById('diaryFontUrl').value.trim();

    const settings = {
        size: parseInt(size),
        color: diaryPreviewColor,
        fontFamily: '',
        fontUrl: url
    };

    const customFontName = localStorage.getItem('diary_custom_font_name');
    if (customFontName) {
        settings.fontFamily = '"' + customFontName.replace(/\.[^.]+$/, '') + '"';
    }

    saveDiaryFontSettings(settings);
    closeDiarySettings();
    renderDiaryPages();
    showToast('日记字体已保存');
}

// ========== 自动日记开关（占位） ==========
function toggleDiaryAuto() {
    const isChecked = document.getElementById('diaryAutoSwitch').checked;
    localStorage.setItem('diary_auto_enabled', isChecked);
    showToast(isChecked ? '自动日记已开启' : '自动日记已关闭');
}
