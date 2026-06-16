/**
 * 玉界 - 设置软件
 * 包含：设置面板模板、API 配置、折叠交互、双重确认清空、Dock 图标注册
 */

// ===== 一键清除输入框 =====
function clearInputs(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const inputs = container.querySelectorAll('input[type="text"]');
        inputs.forEach(input => input.value = '');
    }
}

// ===== API 模型拉取 =====
async function fetchModels(baseUrlId, keyId, modelInputId) {
    const baseUrl = document.getElementById(baseUrlId).value.trim();
    const apiKey = document.getElementById(keyId).value.trim();
    if (!baseUrl || !apiKey) {
        alert('请先填写完整的 Base URL 和 API Key');
        return;
    }
    let endpoint = baseUrl;
    if (endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace('/chat/completions', '');
    }
    endpoint = endpoint.replace(/\/+$/, '') + '/models';

    try {
        const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await res.json();
        if (data && data.data && Array.isArray(data.data)) {
            const models = data.data.map(m => m.id).join('\n');
            const chosen = prompt('获取到以下模型，请手动输入你要使用的模型名称:\n\n' + models);
            if (chosen) document.getElementById(modelInputId).value = chosen;
        } else {
            alert('获取模型失败，接口返回格式不支持。');
        }
    } catch (e) {
        alert('拉取失败: 网络错误或跨域拦截 (' + e.message + ')');
    }
}

// ===== 保存与加载主 API 配置 =====
function saveMainAPI() {
    const baseUrl = document.getElementById('api-base-url-1').value.trim();
    const apiKey = document.getElementById('api-key-1').value.trim();
    const model = document.getElementById('api-model-1').value.trim();
    localStorage.setItem('main_api_base_url', baseUrl);
    localStorage.setItem('main_api_key', apiKey);
    localStorage.setItem('main_api_model', model);
    alert('主API配置已保存到本地。');
}

function loadSettings() {
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');
    if (baseUrl) {
        const el = document.getElementById('api-base-url-1');
        if (el) el.value = baseUrl;
    }
    if (apiKey) {
        const el = document.getElementById('api-key-1');
        if (el) el.value = apiKey;
    }
    if (model) {
        const el = document.getElementById('api-model-1');
        if (el) el.value = model;
    }
}

// ===== 连接测试 =====
async function testMainAPI() {
    const baseUrl = document.getElementById('api-base-url-1').value.trim();
    const apiKey = document.getElementById('api-key-1').value.trim();
    const model = document.getElementById('api-model-1').value.trim();

    if (!baseUrl || !apiKey || !model) {
        alert('连接失败：详细原因 - 请填写完整的 Base URL、API Key 和 模型。');
        return;
    }

    let endpoint = baseUrl;
    if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'hello' }],
                max_tokens: 10
            })
        });

        if (response.ok) {
            alert('连接成功！API配置有效。');
        } else {
            const data = await response.json();
            alert(`连接失败：详细原因 - ${data.error?.message || response.status}`);
        }
    } catch (e) {
        alert(`连接失败：详细原因 - 网络错误或跨域拦截 (${e.message})`);
    }
}

// ===== 折叠区块 =====
function toggleSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ===== 清空数据（双重确认） =====
let clearClicks = 0;

function handleClearData() {
    const btn = document.getElementById('clearDataBtn');
    if (clearClicks === 0) {
        clearClicks++;
        btn.innerText = "确认清空数据？(再次点击)";
        btn.style.backgroundColor = "#ff3b30";
        btn.style.color = "#fff";
        setTimeout(() => {
            if (clearClicks === 1) {
                clearClicks = 0;
                btn.innerText = "清空所有数据";
                btn.style.backgroundColor = "#fff";
                btn.style.color = "#ff3b30";
            }
        }, 3000);
    } else {
        alert("所有数据已清空。");
        clearClicks = 0;
        btn.innerText = "清空所有数据";
        btn.style.backgroundColor = "#fff";
        btn.style.color = "#ff3b30";
    }
}

// ===== 设置面板 HTML 模板 =====
const settingsHTML = `
<div class="settings-container">

    <div class="list-header" onclick="toggleSection('api-section')">
        <span>API</span> 
        <span style="color:#8e8e93; font-weight:400; font-size:14px;">展开/折叠</span>
    </div>
    <div id="api-section" class="collapsible-section" style="display:none;">
        <div style="font-size:12px; color:#8e8e93; margin:0 16px 8px;">API预设 (数量无限制)</div>
        <button class="ios-btn-white" style="margin: 0 16px; width: calc(100% - 32px); color:#007aff;">+ 添加新设备</button>

        <div class="ios-group">
            <div class="ios-row" onclick="toggleSection('api-edit-1')" style="cursor:pointer;">
                <div>
                    <div style="font-size:16px; font-weight:500; color:#000;">1号api</div>
                    <div style="font-size:13px; color:#8e8e93; margin-top:2px;">当前模型配置</div>
                </div>
                <span style="color:#c6c6c8; font-size:24px; line-height:1;">›</span>
            </div>
            
            <div id="api-edit-1" style="display:none; padding:16px; border-top:1px solid #e5e5ea; background:#fafafa;">
                <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                    <label class="ios-label">配置名称</label>
                    <span style="font-size:13px; color:#ff3b30; cursor:pointer; margin-bottom:6px;" onclick="clearInputs('api-edit-1')">一键清除配置</span>
                </div>
                <input type="text" class="ios-input" placeholder="例如：1号api" value="1号api">

                <label class="ios-label">API地址 (Base URL)</label>
                <input type="text" id="api-base-url-1" class="ios-input" placeholder="例如：https://.../v1">

                <label class="ios-label">API密钥 (Key)</label>
                <input type="text" id="api-key-1" class="ios-input" placeholder="例如：sk-...">

                <label class="ios-label">模型</label>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="text" id="api-model-1" class="ios-input" placeholder="手动输入或拉取" style="flex:1;">
                    <button class="ios-btn-white" style="width:auto; margin:0; padding:12px 16px;" onclick="fetchModels('api-base-url-1', 'api-key-1', 'api-model-1')">拉取</button>
                </div>

                <label class="ios-label" style="display:flex; justify-content:space-between; margin-top:20px;">
                    <span>API温度</span> <span id="temp-val-1">1.0</span>
                </label>
                <input type="range" min="0" max="2" step="0.1" value="1.0" class="ios-slider" oninput="document.getElementById('temp-val-1').innerText=this.value">

                <div style="font-size:11px; color:#8e8e93; margin-top:4px;">提示：越低越收敛越高越大胆</div>

                <div class="ios-row" style="padding:16px 0 0 0; border:none; background:transparent;">
                    <span style="font-weight:500; font-size:15px;">流式输出</span>
                    <input type="checkbox" class="ios-switch" checked>
                </div>

                <button class="ios-btn-black" onclick="saveMainAPI()">保存配置</button>
                <button class="ios-btn-white" onclick="testMainAPI()">连接测试</button>
            </div>
        </div>
    </div>

    <div class="list-header" onclick="toggleSection('subapi-section')">
        <span>副API</span> 
        <span style="color:#8e8e93; font-weight:400; font-size:14px;">展开/折叠</span>
    </div>
    <div id="subapi-section" class="collapsible-section" style="display:none;">
        <div style="font-size:12px; color:#8e8e93; margin:0 16px 8px;">仅保存一个配置</div>
        <div class="ios-group" id="subapi-group" style="padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                <label class="ios-label">配置名称</label>
                <span style="font-size:13px; color:#ff3b30; cursor:pointer; margin-bottom:6px;" onclick="clearInputs('subapi-group')">一键清除配置</span>
            </div>
            <input type="text" class="ios-input" placeholder="例如：1号api">

            <label class="ios-label">API地址 (Base URL)</label>
            <input type="text" id="api-base-url-2" class="ios-input" placeholder="例如：https://.../v1">

            <label class="ios-label">API密钥 (Key)</label>
            <input type="text" id="api-key-2" class="ios-input" placeholder="例如：sk-...">

            <label class="ios-label">模型</label>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="api-model-2" class="ios-input" placeholder="手动输入或拉取" style="flex:1;">
                <button class="ios-btn-white" style="width:auto; margin:0; padding:12px 16px;" onclick="fetchModels('api-base-url-2', 'api-key-2', 'api-model-2')">拉取</button>
            </div>

            <label class="ios-label" style="display:flex; justify-content:space-between; margin-top:20px;">
                <span>API温度</span> <span id="temp-val-2">1.0</span>
            </label>
            <input type="range" min="0" max="2" step="0.1" value="1.0" class="ios-slider" oninput="document.getElementById('temp-val-2').innerText=this.value">

            <div style="font-size:11px; color:#8e8e93; margin-top:4px;">提示：越低越收敛越高越大胆</div>

            <div class="ios-row" style="padding:16px 0 0 0; border:none; background:transparent;">
                <span style="font-weight:500; font-size:15px;">流式输出</span>
                <input type="checkbox" class="ios-switch">
            </div>

            <button class="ios-btn-black">保存配置</button>
            <button class="ios-btn-white" onclick="alert('连接失败：密钥为空')">连接测试</button>
        </div>
        
        <div style="margin: 24px 16px 8px; font-size:13px; color:#8e8e93;">副API用途 (没开默认用主API)</div>
        <div class="ios-group">
            <div class="ios-row"><span>日记</span> <input type="checkbox" class="ios-switch"></div>
            <div class="ios-row"><span>动态</span> <input type="checkbox" class="ios-switch"></div>
            <div class="ios-row"><span>论坛</span> <input type="checkbox" class="ios-switch"></div>
            <div class="ios-row"><span>查手机</span> <input type="checkbox" class="ios-switch"></div>
            <div class="ios-row"><span>聊天总结</span> <input type="checkbox" class="ios-switch"></div>
            <div class="ios-row"><span>商城物流</span> <input type="checkbox" class="ios-switch"></div>
            <div class="ios-row"><span>游戏中心</span> <input type="checkbox" class="ios-switch"></div>
        </div>
    </div>

    <div class="list-header" onclick="toggleSection('voice-section')">
        <span>语音API</span> 
        <span style="color:#8e8e93; font-weight:400; font-size:14px;">展开/折叠</span>
    </div>
    <div id="voice-section" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <div style="font-weight:600; margin-bottom:16px; font-size:16px;">MiniMax API 配置</div>
            
            <label class="ios-label">Group ID</label>
            <input type="text" class="ios-input" placeholder="输入MiniMax Group ID">

            <label class="ios-label">API Key</label>
            <input type="text" class="ios-input" placeholder="输入MiniMax API Key">

            <label class="ios-label">音色 (VOICE ID)</label>
            <select class="ios-input" style="height:46px; background:#f2f2f7;">
                <option value="" disabled selected>选择ID或输入</option>
                <option value="male-1">青涩青年</option>
                <option value="male-2">成熟大叔</option>
            </select>

            <button class="ios-btn-black">保存配置</button>
            <button class="ios-btn-white" onclick="alert('连接失败：请配置完整的语音API')">连接测试</button>
        </div>
    </div>

    <div class="list-header" onclick="toggleSection('image-section')">
        <span>生图API</span> 
        <span style="color:#8e8e93; font-weight:400; font-size:14px;">展开/折叠</span>
    </div>
    <div id="image-section" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <label class="ios-label">API地址 (Base URL)</label>
            <input type="text" id="api-base-url-img" class="ios-input" placeholder="例如：https://.../v1">

            <label class="ios-label">API密钥 (Key)</label>
            <input type="text" id="api-key-img" class="ios-input" placeholder="例如：sk-...">

            <label class="ios-label">模型</label>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="api-model-img" class="ios-input" placeholder="手动输入或拉取" style="flex:1;">
                <button class="ios-btn-white" style="width:auto; margin:0; padding:12px 16px;" onclick="fetchModels('api-base-url-img', 'api-key-img', 'api-model-img')">拉取</button>
            </div>

            <button class="ios-btn-black">保存配置</button>
            <button class="ios-btn-white" onclick="alert('连接失败：详细原因 - 未检测到有效的API密钥')">连接测试</button>
        </div>
    </div>

    <div class="list-header" onclick="toggleSection('weather-section')">
        <span>天气API</span> 
        <span style="color:#8e8e93; font-weight:400; font-size:14px;">展开/折叠</span>
    </div>
    <div id="weather-section" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <label class="ios-label">API地址 (Base URL)</label>
            <input type="text" id="api-base-url-weather" class="ios-input" placeholder="例如：https://.../v1">

            <label class="ios-label">API密钥 (Key)</label>
            <input type="text" id="api-key-weather" class="ios-input" placeholder="例如：sk-...">

            <label class="ios-label">城市名</label>
            <input type="text" class="ios-input" placeholder="例如：上海">

            <label class="ios-label">剧情城市名</label>
            <div style="font-size:11px; color:#8e8e93; margin-bottom:6px;">提示：不填写剧情城市名则默认真实城市名。</div>
            <input type="text" class="ios-input" placeholder="例如：xx市">

            <label class="ios-label">模型</label>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="api-model-weather" class="ios-input" placeholder="手动输入或拉取" style="flex:1;">
                <button class="ios-btn-white" style="width:auto; margin:0; padding:12px 16px;" onclick="fetchModels('api-base-url-weather', 'api-key-weather', 'api-model-weather')">拉取</button>
            </div>

            <button class="ios-btn-black">保存配置</button>
            <button class="ios-btn-white" onclick="alert('连接失败：详细原因 - 城市信息或密钥不完整')">连接测试</button>
        </div>
    </div>

    <div class="list-header danger-zone-header" onclick="toggleSection('danger-section')">
        <span>危险区</span> 
        <span style="color:#ff3b30; font-weight:400; font-size:14px;">展开/折叠</span>
    </div>
    <div id="danger-section" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px; background:#fff0f0; border:1px solid #ffd6d6;">
            <button class="ios-btn-white" style="margin-top:0;">导出数据</button>
            <button class="ios-btn-black">导入数据</button>
            <button class="ios-btn-white" id="clearDataBtn" onclick="handleClearData()" style="border-color:#ff3b30; color:#ff3b30;">清空所有数据</button>
        </div>
    </div>
</div>
`;

// ===== 注册设置图标到 Dock =====
window.addEventListener('DOMContentLoaded', () => {
    // 1. 注册设置面板到 Modal 系统
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

    // 清空现有 Dock 栏内容，防止重复加载
    dockBar.innerHTML = '';

    const settingItem = document.createElement('div');
    settingItem.className = 'dock-item';
    settingItem.innerHTML = `
        <div class="dock-icon">设</div>
        <div>设置</div>
    `;
    settingItem.onclick = () => {
        openModal('settingsModal');
    };

    // 将设置图标添加到 Dock 栏中
    dockBar.appendChild(settingItem);
    
    // 如果之后有其他3个软件，你可以用类似 dockBar.appendChild(...) 添加在后面
});
