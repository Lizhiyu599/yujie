/**
 * 玉界 - 设置软件
 * 包含：设置面板模板、API 配置（多设备）、折叠交互、导入导出、清空数据、Dock 图标注册
 */

// ========== 设备存储结构 ==========
function getDevices() {
    const raw = localStorage.getItem('api_devices');
    return raw ? JSON.parse(raw) : [];
}

function saveDevices(devices) {
    localStorage.setItem('api_devices', JSON.stringify(devices));
}

// 迁移旧版单设备数据
function migrateOldConfig() {
    const oldBase = localStorage.getItem('main_api_base_url');
    if (!oldBase) return;
    const oldKey = localStorage.getItem('main_api_key') || '';
    const oldModel = localStorage.getItem('main_api_model') || '';
    const devices = getDevices();
    if (devices.length === 0) {
        devices.push({
            id: Date.now(),
            name: '1号api',
            baseUrl: oldBase,
            apiKey: oldKey,
            model: oldModel,
            temperature: 1.0,
            stream: true
        });
        saveDevices(devices);
    }
    localStorage.removeItem('main_api_base_url');
    localStorage.removeItem('main_api_key');
    localStorage.removeItem('main_api_model');
}

// ===== 一键清除输入框 =====
function clearInputs(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const inputs = container.querySelectorAll('input[type="text"]');
        inputs.forEach(input => input.value = '');
    }
}

// ===== 旧版 API 模型拉取（副API等仍用这个） =====
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

// ===== 主设备模型拉取（可点选） =====
async function fetchModelsForDevice(deviceId) {
    const container = document.getElementById('device-' + deviceId);
    if (!container) return;
    const baseUrl = container.querySelector('.api-base-url').value.trim();
    const apiKey = container.querySelector('.api-key').value.trim();
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
            const models = data.data.map(m => m.id);
            showModelPicker(container, models);
        } else {
            alert('获取模型失败，接口返回格式不支持。');
        }
    } catch (e) {
        alert('拉取失败: 网络错误或跨域拦截 (' + e.message + ')');
    }
}

function showModelPicker(container, models) {
    const oldList = container.querySelector('.model-picker');
    if (oldList) oldList.remove();

    const input = container.querySelector('.api-model');
    const ul = document.createElement('ul');
    ul.className = 'model-picker';
    ul.style.cssText = 'list-style:none;padding:0;margin:4px 0 0;max-height:160px;overflow-y:auto;background:#fff;border:1px solid #e5e5ea;border-radius:8px;';
    
    models.forEach(m => {
        const li = document.createElement('li');
        li.textContent = m;
        li.style.cssText = 'padding:8px 12px;font-size:14px;cursor:pointer;border-bottom:1px solid #f0f0f0;';
        li.onclick = () => {
            input.value = m;
            ul.remove();
        };
        ul.appendChild(li);
    });

    input.parentNode.appendChild(ul);
}

// ===== 保存设备 =====
function saveDevice(deviceId) {
    const container = document.getElementById('device-' + deviceId);
    if (!container) return;
    const name = container.querySelector('.device-name').value.trim() || '未命名';
    const baseUrl = container.querySelector('.api-base-url').value.trim();
    const apiKey = container.querySelector('.api-key').value.trim();
    const model = container.querySelector('.api-model').value.trim();
    const tempSlider = container.querySelector('.temp-slider');
    const temperature = tempSlider ? parseFloat(tempSlider.value) : 1.0;
    const streamCheck = container.querySelector('.stream-check');
    const stream = streamCheck ? streamCheck.checked : true;

    if (!baseUrl || !apiKey || !model) {
        alert('请填写完整的 Base URL、API Key 和模型');
        return;
    }

    const devices = getDevices();
    const index = devices.findIndex(d => d.id === deviceId);
    const newDevice = { id: deviceId, name, baseUrl, apiKey, model, temperature, stream };
    
    if (index >= 0) {
        devices[index] = newDevice;
    } else {
        devices.push(newDevice);
    }
    saveDevices(devices);
    showToast('设备"' + name + '"已保存');
    renderDeviceList();
}

// ===== 删除设备 =====
function deleteDevice(deviceId) {
    if (!confirm('确定删除该设备吗？')) return;
    let devices = getDevices();
    devices = devices.filter(d => d.id !== deviceId);
    saveDevices(devices);
    renderDeviceList();
}

// ===== 连接测试（主设备） =====
async function testDevice(deviceId) {
    const container = document.getElementById('device-' + deviceId);
    if (!container) return;
    const baseUrl = container.querySelector('.api-base-url').value.trim();
    const apiKey = container.querySelector('.api-key').value.trim();
    const model = container.querySelector('.api-model').value.trim();
    const tempSlider = container.querySelector('.temp-slider');
    const temperature = tempSlider ? parseFloat(tempSlider.value) : 1.0;

    if (!baseUrl || !apiKey || !model) {
        alert('连接失败：请填写完整的 Base URL、API Key 和 模型。');
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
                max_tokens: 10,
                temperature: temperature
            })
        });

        if (response.ok) {
            showToast('连接成功！');
        } else {
            try {
                const data = await response.json();
                alert(`连接失败：${data.error?.message || response.status}`);
            } catch (e) {
                alert(`连接失败：HTTP ${response.status}`);
            }
        }
    } catch (e) {
        showToast('连接失败：网络错误');
    }
}

// ===== 语音 API 保存 =====
function saveVoiceConfig() {
    const groupId = document.getElementById('voice-group-id').value.trim();
    const apiKey = document.getElementById('voice-api-key').value.trim();
    const voiceId = document.getElementById('voice-voice-id').value.trim();

    if (!groupId || !apiKey || !voiceId) {
        alert('请填写完整的语音 API 配置');
        return;
    }

    localStorage.setItem('voice_group_id', groupId);
    localStorage.setItem('voice_api_key', apiKey);
    localStorage.setItem('voice_voice_id', voiceId);
    showToast('语音API已保存');
}

// ===== 语音 API 连接测试 =====
async function testVoice() {
    const groupId = document.getElementById('voice-group-id').value.trim();
    const apiKey = document.getElementById('voice-api-key').value.trim();

    if (!groupId || !apiKey) {
        alert('请填写 Group ID 和 API Key');
        return;
    }

    try {
        const response = await fetch(`https://api.minimax.chat/v1/text/chatcompletion_v2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'abab5.5-chat',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 5
            })
        });

        if (response.ok) {
            showToast('语音API连接成功！');
        } else {
            const data = await response.json();
            alert(`连接失败：${data.error?.message || response.status}`);
        }
    } catch (e) {
        showToast('连接失败：网络错误');
    }
}

// ===== 生图 API 保存 =====
function saveImageConfig() {
    const baseUrl = document.getElementById('img-base-url').value.trim();
    const apiKey = document.getElementById('img-api-key').value.trim();
    const model = document.getElementById('img-model').value.trim();

    if (!baseUrl || !apiKey || !model) {
        alert('请填写完整的生图 API 配置');
        return;
    }

    localStorage.setItem('image_base_url', baseUrl);
    localStorage.setItem('image_api_key', apiKey);
    localStorage.setItem('image_model', model);
    showToast('生图API已保存');
}

// ===== 生图 API 连接测试 =====
async function testImage() {
    const baseUrl = document.getElementById('img-base-url').value.trim();
    const apiKey = document.getElementById('img-api-key').value.trim();
    const model = document.getElementById('img-model').value.trim();

    if (!baseUrl || !apiKey || !model) {
        alert('请填写完整的生图 API 配置');
        return;
    }

    let endpoint = baseUrl;
    if (!endpoint.endsWith('/images/generations')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/images/generations';
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
                prompt: 'test',
                n: 1,
                size: '256x256'
            })
        });

        if (response.ok) {
            showToast('生图API连接成功！');
        } else {
            const data = await response.json();
            alert(`连接失败：${data.error?.message || response.status}`);
        }
    } catch (e) {
        showToast('连接失败：网络错误');
    }
}

// ===== 天气 API 保存 =====
function saveWeatherConfig() {
    const baseUrl = document.getElementById('weather-base-url').value.trim();
    const apiKey = document.getElementById('weather-api-key').value.trim();
    const city = document.getElementById('weather-city').value.trim();
    const storyCity = document.getElementById('weather-story-city').value.trim();

    if (!baseUrl || !apiKey || !city) {
        alert('请填写 API 地址、密钥和城市名');
        return;
    }

    localStorage.setItem('weather_base_url', baseUrl);
    localStorage.setItem('weather_api_key', apiKey);
    localStorage.setItem('weather_city', city);
    localStorage.setItem('weather_story_city', storyCity);
    showToast('天气API已保存');
}

// ===== 天气 API 连接测试 =====
async function testWeather() {
    const baseUrl = document.getElementById('weather-base-url').value.trim();
    const apiKey = document.getElementById('weather-api-key').value.trim();
    const city = document.getElementById('weather-city').value.trim();

    if (!baseUrl || !apiKey || !city) {
        alert('请填写 API 地址、密钥和城市名');
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
                model: document.getElementById('weather-model').value.trim() || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: `当前城市：${city}，请返回今天的天气` }],
                max_tokens: 20
            })
        });

        if (response.ok) {
            showToast('天气API连接成功！');
        } else {
            const data = await response.json();
            alert(`连接失败：${data.error?.message || response.status}`);
        }
    } catch (e) {
        showToast('连接失败：网络错误');
    }
}

// ===== 折叠区块（带箭头切换） =====
function toggleSection(id, headerEl) {
    const el = document.getElementById(id);
    if (!el) return;
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    if (headerEl) {
        const arrow = headerEl.querySelector('.toggle-arrow');
        if (arrow) {
            arrow.textContent = isHidden ? '∨' : '›';
        }
    }
}

// ===== 添加新设备 =====
function addNewDevice() {
    const devices = getDevices();
    const newId = Date.now();
    devices.push({
        id: newId,
        name: '',
        baseUrl: '',
        apiKey: '',
        model: '',
        temperature: 1.0,
        stream: true
    });
    saveDevices(devices);
    renderDeviceList();
    setTimeout(() => {
        toggleDeviceEdit(newId);
    }, 100);
}

function toggleDeviceEdit(deviceId) {
    const edit = document.getElementById('device-' + deviceId);
    if (edit) {
        edit.style.display = edit.style.display === 'none' ? 'block' : 'none';
    }
}

// ===== 渲染设备列表 =====
function renderDeviceList() {
    const listContainer = document.getElementById('device-list');
    if (!listContainer) return;
    const devices = getDevices();
    listContainer.innerHTML = '';

    devices.forEach(device => {
        const item = document.createElement('div');
        item.className = 'ios-group';
        item.style.margin = '8px 16px';
        item.innerHTML = `
            <div class="ios-row" onclick="toggleDeviceEdit(${device.id})" style="cursor:pointer;">
                <div>
                    <div style="font-size:16px; font-weight:500;">${device.name || '未命名设备'}</div>
                    <div style="font-size:13px; color:#8e8e93;">${device.model || '未配置模型'}</div>
                </div>
                <span style="color:#c6c6c8; font-size:24px;">›</span>
            </div>
            <div id="device-${device.id}" style="display:none; padding:16px; border-top:1px solid #e5e5ea; background:#fafafa;" class="device-edit">
                <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                    <label class="ios-label">配置名称</label>
                    <span style="font-size:13px; color:#ff3b30; cursor:pointer;" onclick="deleteDevice(${device.id})">删除设备</span>
                </div>
                <input type="text" class="ios-input device-name" placeholder="例如：1号api" value="${device.name}">

                <label class="ios-label">API地址 (Base URL)</label>
                <input type="text" class="ios-input api-base-url" placeholder="例如：https://.../v1" value="${device.baseUrl}">

                <label class="ios-label">API密钥 (Key)</label>
                <input type="text" class="ios-input api-key" placeholder="例如：sk-..." value="${device.apiKey}">

                <label class="ios-label">模型</label>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <input type="text" class="ios-input api-model" placeholder="手动输入或拉取" style="flex:1;" value="${device.model}">
                    <button class="ios-btn-white" style="width:auto; margin:0; padding:12px 16px;" onclick="fetchModelsForDevice(${device.id})">拉取</button>
                </div>

                <label class="ios-label" style="display:flex; justify-content:space-between; margin-top:20px;">
                    <span>API温度</span> <span class="temp-display">${device.temperature}</span>
                </label>
                <input type="range" min="0" max="2" step="0.1" value="${device.temperature}" class="ios-slider temp-slider" oninput="this.parentNode.querySelector('.temp-display').innerText=this.value">

                <div style="font-size:11px; color:#8e8e93; margin-top:4px;">提示：越低越收敛越高越大胆</div>

                <div class="ios-row" style="padding:16px 0 0 0; border:none; background:transparent;">
                    <span style="font-weight:500; font-size:15px;">流式输出</span>
                    <input type="checkbox" class="ios-switch stream-check" ${device.stream ? 'checked' : ''}>
                </div>

                <button class="ios-btn-black" onclick="saveDevice(${device.id})">保存设备</button>
                <button class="ios-btn-white" onclick="testDevice(${device.id})">连接测试</button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

// ===== 导出数据 =====
function exportData() {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        allData[key] = localStorage.getItem(key);
    }
    const jsonStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yujie_backup_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('数据已导出。');
}

// ===== 导入数据 =====
function importData() {
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
                const count = Object.keys(data).length;
                for (const key in data) {
                    localStorage.setItem(key, data[key]);
                }
                alert('成功导入 ' + count + ' 条数据，即将刷新页面。');
                setTimeout(() => location.reload(), 500);
            } catch (err) {
                alert('导入失败：文件格式不正确。');
            }
        };
        reader.readAsText(file);
    };
    input.click();
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
        localStorage.clear();
        alert("所有数据已清空，即将刷新页面。");
        clearClicks = 0;
        setTimeout(() => location.reload(), 500);
    }
}

// ===== 设置面板 HTML 模板 =====
const settingsHTML = `
<div class="settings-container">

    <div class="list-header" onclick="toggleSection('api-section', this)">
        <span>API</span> 
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="api-section" class="collapsible-section" style="display:none;">
        <div style="font-size:12px; color:#8e8e93; margin:0 16px 8px;">API配置</div>
        <button class="ios-btn-white" style="margin: 0 16px; width: calc(100% - 32px); color:#000;" onclick="addNewDevice()">+ 添加新设备</button>
        <div id="device-list"></div>
    </div>

    <div class="list-header" onclick="toggleSection('subapi-section', this)">
        <span>副API</span> 
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
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

    <div class="list-header" onclick="toggleSection('voice-section', this)">
        <span>语音API</span> 
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="voice-section" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <div style="font-weight:600; margin-bottom:16px; font-size:16px;">MiniMax API 配置</div>
            <label class="ios-label">Group ID</label>
            <input type="text" id="voice-group-id" class="ios-input" placeholder="输入MiniMax Group ID">
            <label class="ios-label">API Key</label>
            <input type="text" id="voice-api-key" class="ios-input" placeholder="输入MiniMax API Key">
            <label class="ios-label">音色 (VOICE ID)</label>
            <select id="voice-voice-id" class="ios-input" style="height:46px; background:#f2f2f7;">
                <option value="" disabled selected>选择ID或输入</option>
                <option value="male-qn-qingse">青涩青年</option>
                <option value="male-qn-jingying">精英男士</option>
                <option value="female-shaonv">少女</option>
                <option value="female-yujie">御姐</option>
            </select>
            <button class="ios-btn-black" onclick="saveVoiceConfig()">保存配置</button>
            <button class="ios-btn-white" onclick="testVoice()">连接测试</button>
        </div>
    </div>

    <div class="list-header" onclick="toggleSection('image-section', this)">
        <span>生图API</span> 
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="image-section" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <label class="ios-label">API地址 (Base URL)</label>
            <input type="text" id="img-base-url" class="ios-input" placeholder="例如：https://.../v1">
            <label class="ios-label">API密钥 (Key)</label>
            <input type="text" id="img-api-key" class="ios-input" placeholder="例如：sk-...">
            <label class="ios-label">模型</label>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="img-model" class="ios-input" placeholder="手动输入或拉取" style="flex:1;">
                <button class="ios-btn-white" style="width:auto; margin:0; padding:12px 16px;" onclick="fetchModels('img-base-url', 'img-api-key', 'img-model')">拉取</button>
            </div>
            <button class="ios-btn-black" onclick="saveImageConfig()">保存配置</button>
            <button class="ios-btn-white" onclick="testImage()">连接测试</button>
        </div>
    </div>

    <div class="list-header" onclick="toggleSection('weather-section', this)">
        <span>天气API</span> 
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="weather-section" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px;">
            <label class="ios-label">API地址 (Base URL)</label>
            <input type="text" id="weather-base-url" class="ios-input" placeholder="例如：https://.../v1">
            <label class="ios-label">API密钥 (Key)</label>
            <input type="text" id="weather-api-key" class="ios-input" placeholder="例如：sk-...">
            <label class="ios-label">城市名</label>
            <input type="text" id="weather-city" class="ios-input" placeholder="例如：上海">
            <label class="ios-label">剧情城市名</label>
            <div style="font-size:11px; color:#8e8e93; margin-bottom:6px;">提示：不填写剧情城市名则默认真实城市名。</div>
            <input type="text" id="weather-story-city" class="ios-input" placeholder="例如：xx市">
            <label class="ios-label">模型</label>
            <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="weather-model" class="ios-input" placeholder="手动输入或拉取" style="flex:1;">
                <button class="ios-btn-white" style="width:auto; margin:0; padding:12px 16px;" onclick="fetchModels('weather-base-url', 'weather-api-key', 'weather-model')">拉取</button>
            </div>
            <button class="ios-btn-black" onclick="saveWeatherConfig()">保存配置</button>
            <button class="ios-btn-white" onclick="testWeather()">连接测试</button>
        </div>
    </div>

    <div class="list-header danger-zone-header" onclick="toggleSection('danger-section', this)">
        <span>危险区</span> 
        <span class="toggle-arrow" style="color:#8e8e93;">›</span>
    </div>
    <div id="danger-section" class="collapsible-section" style="display:none;">
        <div class="ios-group" style="padding:16px; background:#fff0f0; border:1px solid #ffd6d6;">
            <button class="ios-btn-white" style="margin-top:0;" onclick="exportData()">导出数据</button>
            <button class="ios-btn-black" onclick="importData()">导入数据</button>
            <button class="ios-btn-white" id="clearDataBtn" onclick="handleClearData()" style="border-color:#ff3b30; color:#ff3b30;">清空所有数据</button>
        </div>
    </div>
</div>
`;

// ===== 初始化设置面板 =====
function initSettings() {
    migrateOldConfig();
    renderDeviceList();
    // 加载已保存的语音API配置
    const voiceGroupId = localStorage.getItem('voice_group_id');
    const voiceApiKey = localStorage.getItem('voice_api_key');
    const voiceVoiceId = localStorage.getItem('voice_voice_id');
    if (voiceGroupId) document.getElementById('voice-group-id').value = voiceGroupId;
    if (voiceApiKey) document.getElementById('voice-api-key').value = voiceApiKey;
    if (voiceVoiceId) document.getElementById('voice-voice-id').value = voiceVoiceId;
    // 加载已保存的生图API配置
    const imgBaseUrl = localStorage.getItem('image_base_url');
    const imgApiKey = localStorage.getItem('image_api_key');
    const imgModel = localStorage.getItem('image_model');
    if (imgBaseUrl) document.getElementById('img-base-url').value = imgBaseUrl;
    if (imgApiKey) document.getElementById('img-api-key').value = imgApiKey;
    if (imgModel) document.getElementById('img-model').value = imgModel;
    // 加载已保存的天气API配置
    const weatherBaseUrl = localStorage.getItem('weather_base_url');
    const weatherApiKey = localStorage.getItem('weather_api_key');
    const weatherCity = localStorage.getItem('weather_city');
    const weatherStoryCity = localStorage.getItem('weather_story_city');
    if (weatherBaseUrl) document.getElementById('weather-base-url').value = weatherBaseUrl;
    if (weatherApiKey) document.getElementById('weather-api-key').value = weatherApiKey;
    if (weatherCity) document.getElementById('weather-city').value = weatherCity;
    if (weatherStoryCity) document.getElementById('weather-story-city').value = weatherStoryCity;
}

// ===== 注册设置图标到 Dock（插入到最左侧第一位） =====
window.addEventListener('DOMContentLoaded', () => {
    if (typeof registerModal === 'function') {
        registerModal('settingsModal', '设置', settingsHTML);
    }

    if (typeof renderAllModals === 'function') {
        renderAllModals();
    }

    initSettings();

    const dockBar = document.getElementById('dockBar');
    if (!dockBar) return;

    const settingItem = document.createElement('div');
    settingItem.className = 'dock-item';
    settingItem.innerHTML = `
        <div class="dock-icon">
            <div class="dock-icon-img">设</div>
        </div>
        <div class="dock-label">设置</div>
    `;
    settingItem.onclick = () => {
        renderDeviceList();
        openModal('settingsModal');
    };

    dockBar.prepend(settingItem);
});
