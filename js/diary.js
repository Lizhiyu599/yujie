/**
 * 玉界 - 日记软件
 * 包含：日记本 UI 渲染、翻页动画、日历跳转、日记设置、数据持久化、角色选择
 * 支持长日记自动分页，左右翻页翻阅
 */

// ========== 日记数据存储 ==========
function getDiaries() {
    var contactId = getDiarySelectedChar();
    var key = contactId ? 'diary_entries_' + contactId : 'diary_entries';
    var raw = localStorage.getItem(key);
    if (!raw && contactId) {
        raw = localStorage.getItem('diary_entries');
    }
    return raw ? JSON.parse(raw) : [];
}

function saveDiaries(diaries) {
    var contactId = getDiarySelectedChar();
    var key = contactId ? 'diary_entries_' + contactId : 'diary_entries';
    localStorage.setItem(key, JSON.stringify(diaries));
}

function getDiaryFontSettings() {
    const raw = localStorage.getItem('diary_font_settings');
    return raw ? JSON.parse(raw) : {
        size: 0,
        color: '#999999',
        fontFamily: ''
    };
}

function saveDiaryFontSettings(settings) {
    localStorage.setItem('diary_font_settings', JSON.stringify(settings));
}

// ========== 当前状态 ==========
let isDiaryGenerating = false;
let diaryLoadingToast = null;
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

    const diaries = getDiaries();

    appWindow.innerHTML = `
        <div class="diary-app">
            <div class="diary-top-bar">
                <div class="diary-back-btn" onclick="closeDiary()">‹</div>
                <div class="diary-top-title">日 记</div>
                <div class="diary-top-actions">
                    <div class="diary-btn-refresh" onclick="generateDiary()" title="手动生成日记">↻</div>
                    <div class="diary-btn-calendar" onclick="openDiaryCalendar()" title="日历视图">📅</div>
                    <div class="diary-btn-settings" onclick="openDiarySettings()" title="日记设置">○</div>
                </div>
            </div>

            <div class="diary-shelf">
                <div class="diary-book" id="diaryBook">
                    <div class="diary-cover ${isCoverOpen ? 'open' : ''}" id="diaryCover" onclick="openCover()">
                        <div class="cover-ornament">✦ DIARY ✦</div>
                        <div class="cover-title">日 记</div>
                        <div class="cover-subtitle">翻开新的一页</div>
                    </div>
                </div>
            </div>

            <div class="diary-bottom-bar">
                <button class="diary-nav-btn" id="prevBtn" onclick="prevPage()" ${!isCoverOpen || currentPageIndex === 0 ? 'disabled' : ''}>‹ 上一页</button>
                <button class="diary-nav-btn" id="nextBtn" onclick="nextPage()">${isCoverOpen ? '下一页 ›' : '翻开'}</button>
            </div>
        </div>
    `;

    renderDiaryPages();
    updateBottomBar();
}

// ========== 获取所有页面数据 ==========
function getAllPagesData() {
    const diaries = getDiaries();
    const allPages = [];
    const charsPerPage = 190;

    diaries.forEach((diary, diaryIndex) => {
        const paragraphs = diary.content.split(/\n{2,}/).filter(p => p.trim());
        const subPages = [];

        paragraphs.forEach(para => {
            if (!subPages.length || (subPages[subPages.length - 1].length + para.length) > charsPerPage) {
                if (para.length > charsPerPage) {
                    let remaining = para;
                    while (remaining.length > 0) {
                        const chunk = remaining.substring(0, charsPerPage);
                        remaining = remaining.substring(charsPerPage);
                        subPages.push(chunk);
                    }
                } else {
                    subPages.push(para);
                }
            } else {
                subPages[subPages.length - 1] += '\n\n' + para;
            }
        });

        if (subPages.length === 0) subPages.push(diary.content);

        subPages.forEach((pageContent, subIndex) => {
            allPages.push({
                diaryIndex: diaryIndex,
                subIndex: subIndex,
                totalSubPages: subPages.length,
                date: diary.date,
                content: pageContent
            });
        });
    });
    return allPages;
}

// ========== 渲染日记内页 ==========
function renderDiaryPages() {
    const book = document.getElementById('diaryBook');
    if (!book) return;

    const diaries = getDiaries();
    const fontSettings = getDiaryFontSettings();
    const allPages = getAllPagesData();

    const oldPages = book.querySelectorAll('.diary-page');
    oldPages.forEach(p => p.remove());

    if (allPages.length === 0) return;

    const currentPage = allPages[currentPageIndex];
    const currentDiaryIndex = currentPage ? currentPage.diaryIndex : 0;

    allPages.forEach((pageData, index) => {
        const page = document.createElement('div');
        page.className = 'diary-page';
        page.style.zIndex = allPages.length - index + 10;

        if (!isCoverOpen) {
            page.classList.add('behind');
        }

        let holesHTML = '';
        for (let h = 0; h < 6; h++) {
            holesHTML += '<div class="page-hole"></div>';
        }

        const globalPageNum = index + 1;
        const isLeftPage = index % 2 === 0;

        page.innerHTML = `
            <div class="binding-edge"></div>
            <div class="page-holes">${holesHTML}</div>
            <div class="page-number left-num">${isLeftPage ? globalPageNum : ''}</div>
            <div class="page-number right-num">${isLeftPage ? '' : globalPageNum}</div>
            <div class="diary-page-content">
                <div class="diary-entry-date">${pageData.date}${pageData.totalSubPages > 1 ? ' (' + (pageData.subIndex + 1) + '/' + pageData.totalSubPages + ')' : ''}</div>
                <div class="diary-entry-text" style="
                    font-size: ${17 + parseInt(fontSettings.size) / 5}px;
                    color: ${fontSettings.color};
                    ${fontSettings.fontFamily ? 'font-family: ' + fontSettings.fontFamily + ';' : ''}
                ">${pageData.content}</div>
            </div>
        `;

        book.appendChild(page);
    });

    // 翻页状态
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        document.querySelectorAll('.diary-page').forEach((page, index) => {
            page.classList.remove('flipped', 'current', 'behind');
            if (index < currentPageIndex) {
                page.classList.add('flipped');
            } else if (index === currentPageIndex) {
                page.classList.add('current');
            } else {
                page.classList.add('behind');
            }
        });
    });
});

// ========== 更新底部工具栏 ==========
function updateBottomBar() {
    const allPages = getAllPagesData();
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.disabled = !isCoverOpen || currentPageIndex === 0;
    }
    if (nextBtn) {
        if (!isCoverOpen) {
            nextBtn.textContent = '翻开';
            nextBtn.disabled = false;
        } else if (currentPageIndex >= allPages.length - 1) {
            nextBtn.textContent = '下一篇 ›';
            nextBtn.disabled = true;
        } else {
            const nextPage = allPages[currentPageIndex + 1];
            if (nextPage && nextPage.diaryIndex !== allPages[currentPageIndex].diaryIndex) {
                nextBtn.textContent = '下一篇 ›';
            } else {
                nextBtn.textContent = '翻页 ›';
            }
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
        renderDiaryPages();
        updateBottomBar();
    }
}

function nextPage() {
    if (!isCoverOpen) {
        openCover();
        return;
    }
    const allPages = getAllPagesData();
    if (currentPageIndex < allPages.length - 1) {
        currentPageIndex++;
        renderDiaryPages();
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
    const allPages = getAllPagesData();
    let targetPage = 0;
    for (let i = 0; i < allPages.length; i++) {
        if (allPages[i].diaryIndex === index) {
            targetPage = i;
            break;
        }
    }
    if (!isCoverOpen) {
        openCover();
        setTimeout(() => {
            currentPageIndex = targetPage;
            renderDiaryPages();
            updateBottomBar();
        }, 500);
    } else {
        currentPageIndex = targetPage;
        renderDiaryPages();
        updateBottomBar();
    }
}

// ========== 日记设置面板 ==========
function openDiarySettings() {
    const fontSettings = getDiaryFontSettings();

    const overlay = document.createElement('div');
    overlay.className = 'diary-settings-overlay';
    overlay.id = 'diarySettingsOverlay';
    overlay.innerHTML = `
        <div class="diary-settings-panel" id="diarySettingsPanel">
            <div class="diary-settings-handle" id="diarySettingsHandle"></div>
            <div class="diary-settings-title">日记设置</div>

            <div class="diary-auto-row">
                <span>自动日记</span>
                <input type="checkbox" class="ios-switch" id="diaryAutoSwitch" onchange="toggleDiaryAuto()">
            </div>
            <div class="diary-auto-hint">提示：开启后角色会自己写日记，一天最多写两篇日记。</div>

            <div class="diary-font-header" onclick="toggleDiaryCharSection()">
                <span>选择当前角色</span>
                <span class="arrow" id="diaryCharArrow">></span>
            </div>
            <div class="diary-font-body" id="diaryCharBody">
                <div id="diaryCharList"></div>
                <button class="diary-btn-save-font" onclick="saveDiaryChar()">保存该角色</button>
            </div>

            <div class="diary-font-header" onclick="toggleDiaryFontSection()">
                <span>日记字体</span>
                <span class="arrow" id="diaryFontArrow">∨</span>
            </div>
            <div class="diary-font-body" id="diaryFontBody">
                <div style="font-size:11px; color:#555; margin-bottom:6px;">提示：此字体仅用来表示角色的日记字体，不填写则默认字体。</div>

                <div class="diary-font-preview" id="diaryFontPreview" style="
                    font-size: ${18 + parseInt(fontSettings.size) / 5}px;
                    color: ${fontSettings.color};
                    ${fontSettings.fontFamily ? 'font-family: ' + fontSettings.fontFamily + ';' : ''}
                ">用户你好呀</div>

                <div class="diary-font-slider-row">
                    <span>字体大小</span>
                    <span id="diaryFontSizeVal">${fontSettings.size}</span>
                </div>
                <input type="range" min="-50" max="50" value="${fontSettings.size}" class="diary-font-slider"
                       oninput="document.getElementById('diaryFontSizeVal').innerText=this.value; document.getElementById('diaryFontPreview').style.fontSize=${18 + parseInt(fontSettings.size) / 5} + 'px';">

                <div style="font-size:13px; color:#666; margin:10px 0 6px;">字体颜色</div>
                <div class="diary-color-row">
                    <div class="diary-color-dot" style="background:#999;" onclick="previewDiaryFontColor('#999999')"></div>
                    <div class="diary-color-dot" style="background:#bbb;" onclick="previewDiaryFontColor('#bbbbbb')"></div>
                    <div class="diary-color-dot" style="background:#ddd;" onclick="previewDiaryFontColor('#dddddd')"></div>
                    <div class="diary-color-dot" style="background:#fff;" onclick="previewDiaryFontColor('#ffffff')"></div>
                    <div class="diary-color-dot" style="background:#777;" onclick="previewDiaryFontColor('#777777')"></div>
                    <input type="color" class="diary-color-picker" onchange="previewDiaryFontColor(this.value)">
                </div>

                <div style="font-size:13px; color:#666; margin:10px 0 6px;">字体上传</div>
                <div class="diary-upload-box" onclick="document.getElementById('diaryFontFileInput').click()">
                    点击上传字体文件
                </div>
                <input type="file" id="diaryFontFileInput" accept=".ttf,.otf,.woff,.woff2" style="display:none;" onchange="handleDiaryFontUpload(event)">

                <div style="font-size:13px; color:#666; margin:8px 0 6px;">URL字体</div>
                <input type="text" class="diary-url-input" id="diaryFontUrl" placeholder="https://.../font.ttf" value="${fontSettings.fontUrl || ''}">
                <div style="font-size:10px; color:#555; margin-bottom:10px;">支持 .ttf / .otf / .woff / .woff2 用于日记字体。</div>

                <button class="diary-btn-save-font" onclick="saveDiaryFont()">保存字体</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.onclick = function(e) {
        if (e.target === overlay) closeDiarySettings();
    };

    const handle = document.getElementById('diarySettingsHandle');
    let startY = 0;

    handle.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
    });

    handle.addEventListener('touchmove', function(e) {
        if (e.touches[0].clientY - startY > 40) {
            closeDiarySettings();
        }
    });

    handle.addEventListener('click', function(e) {
        e.stopPropagation();
        closeDiarySettings();
    });
}

function closeDiarySettings() {
    const overlay = document.getElementById('diarySettingsOverlay');
    if (overlay) overlay.remove();
}

// ========== 字体颜色预览 ==========
let diaryPreviewColor = '#999999';
function previewDiaryFontColor(color) {
    diaryPreviewColor = color;
    const preview = document.getElementById('diaryFontPreview');
    if (preview) preview.style.color = color;
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

// ========== 自动日记开关 ==========
function toggleDiaryAuto() {
    const isChecked = document.getElementById('diaryAutoSwitch').checked;
    localStorage.setItem('diary_auto_enabled', isChecked);
    showToast(isChecked ? '自动日记已开启' : '自动日记已关闭');
}

// ========== 角色选择 ==========
function getDiarySelectedChar() {
    return localStorage.getItem('diary_selected_char') || '';
}

function toggleDiaryCharSection() {
    var body = document.getElementById('diaryCharBody');
    var arrow = document.getElementById('diaryCharArrow');
    if (body && arrow) {
        var isOpen = body.classList.toggle('open');
        arrow.classList.toggle('open', isOpen);
        if (isOpen) renderDiaryCharList();
    }
}

function renderDiaryCharList() {
    var list = document.getElementById('diaryCharList');
    if (!list) return;
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var selected = getDiarySelectedChar();
    var html = '';
    contacts.forEach(function(c) {
        var isActive = c.id === selected;
        var badge = isActive ? '<span style="font-size:10px;color:#fff;background:#1d1d1f;padding:2px 6px;border-radius:4px;margin-left:6px;">当前角色</span>' : '';
        html += '<div class="diary-char-item' + (isActive ? ' active' : '') + '" onclick="selectDiaryChar(\'' + c.id + '\')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;margin-bottom:4px;background:rgba(255,255,255,0.06);border:1px solid ' + (isActive ? '#fff' : '#333') + ';border-radius:10px;cursor:pointer;font-size:14px;color:' + (isActive ? '#fff' : '#aaa') + ';">' + c.name + badge + '</div>';
    });
    list.innerHTML = html || '<div style="color:#555;font-size:13px;">暂无角色，请先在聊天软件中创建</div>';
}

function selectDiaryChar(id) {
    localStorage.setItem('diary_selected_char', id);
    renderDiaryCharList();
}

function saveDiaryChar() {
    var selected = getDiarySelectedChar();
    if (selected) {
        showToast('角色已保存');
    } else {
        showToast('请选择一个角色');
    }
}

// ========== 手动生成日记（接入AI） ==========
function generateDiary() {
    if (isDiaryGenerating) {
        showToast('日记正在生成中，请稍候');
        return;
    }
    isDiaryGenerating = true;
    
    // 显示持续加载弹窗
    if (diaryLoadingToast) diaryLoadingToast.remove();
    diaryLoadingToast = document.createElement('div');
    diaryLoadingToast.className = 'global-toast';
    diaryLoadingToast.textContent = '正在生成日记…';
    diaryLoadingToast.style.background = 'rgba(0,0,0,0.75)';
    diaryLoadingToast.style.color = '#fff';
    document.body.appendChild(diaryLoadingToast);
    
    var contactId = getDiarySelectedChar();
    if (!contactId) {
        if (diaryLoadingToast) diaryLoadingToast.remove();
        diaryLoadingToast = null;
        isDiaryGenerating = false;
        showToast('请先在日记设置中选择角色');
        return;
    }

    if (typeof generateDiaryContent === 'function') {
        generateDiaryContent(contactId).then(function(content) {
            if (diaryLoadingToast) diaryLoadingToast.remove();
            diaryLoadingToast = null;
            isDiaryGenerating = false;
            
            if (!content) {
                showToast('日记生成失败，请重试');
                return;
            }
            var now = new Date();
            var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
            var diaries = getDiaries();
            diaries = diaries.filter(function(d) { return d.content.indexOf('今天翻开日记本') < 0; });
            diaries.push({ date: dateStr, content: content });
            saveDiaries(diaries);
            showToast('日记已生成');
            currentPageIndex = 0;
            isCoverOpen = false;
            renderDiaryApp();
        }).catch(function() {
            if (diaryLoadingToast) diaryLoadingToast.remove();
            diaryLoadingToast = null;
            isDiaryGenerating = false;
            showToast('日记生成失败，请重试');
        });
    } else {
        if (diaryLoadingToast) diaryLoadingToast.remove();
        diaryLoadingToast = null;
        isDiaryGenerating = false;
        showToast('生成功能暂未接入，请等待后续更新');
    }
}
