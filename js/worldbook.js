/**
 * 玉界 - 万象树（世界书）
 * 包含：角色预设管理、全局/局部分支、CRUD、数据持久化
 */

// ========== 预设数据存储 ==========
function getPresets() {
    const raw = localStorage.getItem('worldbook_presets');
    return raw ? JSON.parse(raw) : [];
}

function savePresets(presets) {
    localStorage.setItem('worldbook_presets', JSON.stringify(presets));
}

// 内置预设
const BUILTIN_PRESETS = [
    {
        id: 'builtin-1',
        name: '禁止恋爱',
        type: 'global',
        content: '角色禁止对用户产生爱情或恋爱倾向。始终保持朋友或助手的关系边界。'
    },
    {
        id: 'builtin-2',
        name: '禁止暴力',
        type: 'global',
        content: '角色禁止使用暴力或威胁性语言。面对冲突时优先选择和平解决方案。'
    },
    {
        id: 'builtin-3',
        name: '学术严谨',
        type: 'local',
        content: '角色在涉及学术、科学、技术话题时必须保持严谨准确，引用可靠来源。'
    },
    {
        id: 'builtin-4',
        name: '幽默风格',
        type: 'local',
        content: '角色在回复中适当加入幽默元素，保持轻松愉快的对话氛围。'
    }
];

// ========== 初始化内置预设 ==========
function initPresets() {
    const existing = getPresets();
    if (existing.length === 0) {
        savePresets(BUILTIN_PRESETS);
    }
}

// ========== 当前视图 ==========
let wbCurrentFilter = 'all'; // 'all' | 'global' | 'local'

// ========== 打开万象树 ==========
function openWorldbook() {
    initPresets();
    let appWindow = document.getElementById('worldbookAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'worldbookAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#0a0a0a;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    wbCurrentFilter = 'all';
    renderWorldbook();
    appWindow.style.display = 'flex';
}

function closeWorldbook() {
    const appWindow = document.getElementById('worldbookAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染主界面 ==========
function renderWorldbook() {
    const appWindow = document.getElementById('worldbookAppWindow');
    if (!appWindow) return;

    const presets = getPresets();
    const filtered = wbCurrentFilter === 'all' 
        ? presets 
        : presets.filter(p => p.type === wbCurrentFilter);

    let cardsHTML = '';
    if (filtered.length === 0) {
        cardsHTML = '<div class="wb-empty">暂无预设</div>';
    } else {
        filtered.forEach(p => {
            cardsHTML += `
                <div class="wb-preset-card" onclick="editPreset('${p.id}')">
                    <div class="wb-preset-header">
                        <span class="wb-preset-name">${p.name}</span>
                        <span class="wb-preset-badge ${p.type}">${p.type === 'global' ? '全局' : '局部'}</span>
                    </div>
                    <div class="wb-preset-desc">${p.content.substring(0, 80)}${p.content.length > 80 ? '...' : ''}</div>
                    <div class="wb-preset-actions">
                        <span class="wb-preset-action" onclick="event.stopPropagation(); togglePresetType('${p.id}')">切换分支</span>
                    </div>
                </div>
            `;
        });
    }

    appWindow.innerHTML = `
        <div class="worldbook-app">
            <div class="wb-top-bar">
                <div class="wb-back-btn" onclick="closeWorldbook()">‹</div>
                <div class="wb-top-title">万 象 树</div>
                <div class="wb-top-spacer"></div>
            </div>

            <div class="wb-body">
                <div class="wb-section-title">预设列表</div>
                ${cardsHTML}
                <button class="wb-add-btn" onclick="addNewPreset()">+ 新建预设</button>
            </div>

            <div class="wb-bottom-bar">
                <span class="wb-tab ${wbCurrentFilter === 'all' ? 'active' : ''}" onclick="filterPresets('all')">全部</span>
                <span class="wb-tab ${wbCurrentFilter === 'global' ? 'active' : ''}" onclick="filterPresets('global')">全局</span>
                <span class="wb-tab ${wbCurrentFilter === 'local' ? 'active' : ''}" onclick="filterPresets('local')">局部</span>
            </div>
        </div>
    `;
}

// ========== 筛选 ==========
function filterPresets(type) {
    wbCurrentFilter = type;
    renderWorldbook();
}

// ========== 新建预设 ==========
function addNewPreset() {
    openPresetEditor(null);
}

// ========== 编辑预设 ==========
function editPreset(id) {
    openPresetEditor(id);
}

// ========== 预设编辑器 ==========
function openPresetEditor(presetId) {
    const presets = getPresets();
    const preset = presetId ? presets.find(p => p.id === presetId) : null;
    const isNew = !preset;

    const name = preset ? preset.name : '';
    const content = preset ? preset.content : '';
    const type = preset ? preset.type : 'global';

    const overlay = document.createElement('div');
    overlay.className = 'wb-editor-overlay';
    overlay.id = 'wbEditorOverlay';
    overlay.innerHTML = `
        <div class="wb-editor-panel" id="wbEditorPanel">
            <div class="wb-editor-handle" id="wbEditorHandle"></div>
            <div class="wb-editor-title">${isNew ? '新建预设' : '编辑预设'}</div>

            <div class="wb-editor-label">预设名称</div>
            <input type="text" class="wb-editor-input" id="wbEditName" value="${name}" placeholder="输入预设名称">

            <div class="wb-editor-label">分支类型</div>
            <div class="wb-editor-segment">
                <div class="wb-segment-btn ${type === 'global' ? 'active' : ''}" id="wbSegGlobal" onclick="wbSelectType('global')">全 局</div>
                <div class="wb-segment-btn ${type === 'local' ? 'active' : ''}" id="wbSegLocal" onclick="wbSelectType('local')">局 部</div>
            </div>

            <div class="wb-editor-label">预设内容</div>
            <textarea class="wb-editor-textarea" id="wbEditContent" placeholder="描述角色的行为约束、禁止事项、风格要求等...">${content}</textarea>

            <div class="wb-editor-buttons">
                ${!isNew ? '<button class="wb-btn-delete" onclick="deletePreset(\'' + presetId + '\')">删除</button>' : ''}
                <button class="wb-btn-save" onclick="savePreset('${presetId || ''}')">保存</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.onclick = function(e) {
        if (e.target === overlay) closePresetEditor();
    };

    const handle = document.getElementById('wbEditorHandle');
    let startY = 0;
    handle.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
    });
    handle.addEventListener('touchmove', function(e) {
        if (e.touches[0].clientY - startY > 40) {
            closePresetEditor();
        }
    });
    handle.addEventListener('click', function(e) {
        e.stopPropagation();
        closePresetEditor();
    });
}

// ========== 选择分支类型 ==========
let wbEditType = 'global';
function wbSelectType(type) {
    wbEditType = type;
    document.getElementById('wbSegGlobal').classList.toggle('active', type === 'global');
    document.getElementById('wbSegLocal').classList.toggle('active', type === 'local');
}

// ========== 切换预设分支类型 ==========
function togglePresetType(id) {
    const presets = getPresets();
    const preset = presets.find(p => p.id === id);
    if (preset) {
        preset.type = preset.type === 'global' ? 'local' : 'global';
        savePresets(presets);
        renderWorldbook();
    }
}

// ========== 保存预设 ==========
function savePreset(id) {
    const name = document.getElementById('wbEditName').value.trim();
    const content = document.getElementById('wbEditContent').value.trim();

    if (!name || !content) {
        showToast('请填写预设名称和内容');
        return;
    }

    const presets = getPresets();

    if (id) {
        const index = presets.findIndex(p => p.id === id);
        if (index >= 0) {
            presets[index].name = name;
            presets[index].content = content;
            presets[index].type = wbEditType;
        }
    } else {
        presets.push({
            id: 'preset-' + Date.now(),
            name: name,
            content: content,
            type: wbEditType
        });
    }

    savePresets(presets);
    closePresetEditor();
    renderWorldbook();
    showToast('预设已保存');
}

// ========== 删除预设 ==========
function deletePreset(id) {
    let presets = getPresets();
    presets = presets.filter(p => p.id !== id);
    savePresets(presets);
    closePresetEditor();
    renderWorldbook();
    showToast('预设已删除');
}

// ========== 关闭编辑器 ==========
function closePresetEditor() {
    const overlay = document.getElementById('wbEditorOverlay');
    if (overlay) overlay.remove();
}
