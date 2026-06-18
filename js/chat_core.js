/**
 * 玉界 - 聊天核心
 * 包含：消息收发、API 对接、系统提示拼接、状态栏更新、翻译、时间戳、上下文记忆
 */

// ========== 聊天状态 ==========
window.ChatState = window.ChatState || {
    currentContactId: null,
    isAITyping: false,
    quotedMsg: null,
    lastMessageTime: null
};

// ========== 翻译缓存 ==========
window._translateCache = window._translateCache || {};

// ========== 构建系统提示 ==========
function buildSystemPrompt(contactId) {
    let prompt = '';

    // 最高优先级：状态栏 JSON 强制要求
    prompt += '【最高优先级·状态更新】你的每次回复，必须在最后一行附加一段完整的JSON状态信息，格式严格如下（不要省略任何字段，不要嵌套在其他内容里，必须单独一行）：\n{"mood":"心情(10字内)","favorability":好感度数字(0-100),"action":"动作(20字内)","thought":"内心想法(30字内)"}\n这是强制要求，每次回复都必须包含此JSON，否则系统无法正确运行。\n\n';

    // 回复条数限制
    const replyMax = (window.ChatConfig && window.ChatConfig.settings && window.ChatConfig.settings.replyMax) || 3;
    prompt += '【回复条数限制】每次回复最多' + replyMax + '条消息。用两个换行符\\n\\n分隔不同的消息气泡。一句话不超过30字。\n\n';

    prompt += '【语言规则】你的所有回复正文和旁白内容，必须且只能使用简体中文。禁止使用繁体中文、日语、英语、韩语等任何其他语言。这是最高优先级的硬性规则，不可违反。\n\n';

    if (typeof getFullSystemPrompt === 'function') {
        prompt += getFullSystemPrompt();
    }

    const contact = getContactById(contactId);
    if (contact && contact.persona) {
        prompt += '\n\n【当前角色人设】\n' + contact.persona;
    }

    const narrationEnabled = ChatConfig?.settings?.onlineNarration !== false;
    if (narrationEnabled) {
        prompt += '\n\n【旁白模式】开启。请在回复中用括号（）包含旁白内容，用于描写环境、动作、心理活动等。旁白必须且只能使用简体中文，严禁使用日语、英语、繁体中文等任何非简体中文语言。';
    } else {
        prompt += '\n\n【旁白模式】关闭。不需要写旁白。';
    }

    return prompt;
}

// ========== 获取联系人 ==========
function getContactById(contactId) {
    if (!window.ChatConfig || !window.ChatConfig.contacts) return null;
    return window.ChatConfig.contacts.find(c => c.id === contactId) || null;
}

// ========== 获取当前 API 配置 ==========
function getActiveAPIConfig() {
    if (typeof getDevices === 'function') {
        const devices = getDevices();
        const configured = devices.find(d => d.baseUrl && d.apiKey && d.model);
        if (configured) {
            return {
                baseUrl: configured.baseUrl,
                apiKey: configured.apiKey,
                model: configured.model,
                temperature: configured.temperature || 1.0,
                stream: false
            };
        }
    }
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');
    if (baseUrl && apiKey && model) {
        return { baseUrl, apiKey, model, temperature: 1.0, stream: false };
    }
    return null;
}

// ========== 发送消息 ==========
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;
    if (window.ChatState.isAITyping) return;

    const text = input.value.trim();
    const contactId = window.ChatState.currentContactId || 'c1';
    const contact = getContactById(contactId);
    const contactName = contact ? contact.name : 'AI';

    const isUserNarration = /^[\(\（].*[\)\）]$/.test(text);
    if (isUserNarration) {
        appendMessage('narration', text);
        input.value = '';
        saveChatHistory(contactId);
        return;
    }

    appendMessage('user', text);
    input.value = '';

    window.ChatState.isAITyping = true;
    const titleEl = document.getElementById('chatTitle');
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中…</span>';

    saveChatHistory(contactId);

    const systemPrompt = buildSystemPrompt(contactId);
    let userMessage = text;

    if (window.ChatState.quotedMsg) {
        userMessage = '【引用】' + window.ChatState.quotedMsg.n + '说：' + window.ChatState.quotedMsg.t + '\n\n【回复】' + userMessage;
        window.ChatState.quotedMsg = null;
        const qv = document.getElementById('quotePreview');
        if (qv) qv.style.display = 'none';
    }

    const historyMessages = getRecentHistory(contactId, 20);
    const allMessages = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage }
    ];

    try {
        const reply = await callChatAPI(allMessages);
        processAIReply(reply, contactName, contactId);
    } catch (error) {
        appendMessage('assistant', '抱歉，消息发送失败：' + error.message);
        if (titleEl) titleEl.textContent = contactName;
        window.ChatState.isAITyping = false;
    }
}

// ========== 调用聊天 API ==========
async function callChatAPI(messages) {
    const config = getActiveAPIConfig();
    if (!config) {
        throw new Error('请先在设置中配置 API');
    }

    let endpoint = config.baseUrl;
    if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                temperature: config.temperature || 1.0,
                stream: false
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            let errMsg = `HTTP ${response.status}`;
            try {
                const errData = await response.json();
                errMsg = errData.error?.message || errMsg;
            } catch (e) {}
            throw new Error(errMsg);
        }

        const data = await response.json();
        
        // 更新 API 消耗
        if (data.usage && data.usage.total_tokens) {
            if (!window.ChatConfig) window.ChatConfig = { settings: { api: {} } };
            if (!window.ChatConfig.settings) window.ChatConfig.settings = { api: {} };
            if (!window.ChatConfig.settings.api) window.ChatConfig.settings.api = {};
            
            const api = window.ChatConfig.settings.api;
            api.total = (api.total || 0) + data.usage.total_tokens;
            api.online = (api.online || 0) + data.usage.total_tokens;
            localStorage.setItem('api_total', api.total);
            localStorage.setItem('api_online', api.online);
            
            // 更新 UI 显示
            const totalEl = document.getElementById('apiTotal');
            const onlineEl = document.getElementById('apiOnline');
            if (totalEl) totalEl.textContent = api.total + ' token';
            if (onlineEl) onlineEl.textContent = api.online + ' token';
        }
        
        return data.choices?.[0]?.message?.content || '';
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('请求超时（120秒），模型可能正在深度思考中，请重试');
        }
        throw error;
    }
}

// ========== 处理 AI 回复 ==========
function processAIReply(rawContent, contactName, contactId) {
    const titleEl = document.getElementById('chatTitle');

    // 更宽松的 JSON 提取——先尝试完整匹配，失败后尝试逐字段提取
    let jsonMatch = rawContent.match(/\{[^{}]*"mood"[^{}]*"favorability"[^{}]*"action"[^{}]*"thought"[^{}]*\}/);
    let cleanContent = rawContent;
    
    if (jsonMatch) {
        try {
            const mentalData = JSON.parse(jsonMatch[0]);
            updateMentalState(mentalData);
            cleanContent = rawContent.replace(jsonMatch[0], '').trim();
        } catch (e) {
            // JSON 解析失败，尝试从 rawContent 中提取各个字段
            const moodMatch = rawContent.match(/"mood"\s*:\s*"([^"]+)"/);
            const favMatch = rawContent.match(/"favorability"\s*:\s*(\d+)/);
            const actMatch = rawContent.match(/"action"\s*:\s*"([^"]+)"/);
            const thtMatch = rawContent.match(/"thought"\s*:\s*"([^"]+)"/);
            
            if (moodMatch || favMatch || actMatch || thtMatch) {
                updateMentalState({
                    mood: moodMatch ? moodMatch[1] : (window.ChatConfig?.mental?.mood || '未知'),
                    favorability: favMatch ? parseInt(favMatch[1]) : (window.ChatConfig?.mental?.favorability || 0),
                    action: actMatch ? actMatch[1] : (window.ChatConfig?.mental?.action || '无'),
                    thought: thtMatch ? thtMatch[1] : (window.ChatConfig?.mental?.thought || '无')
                });
            }
            // 清理内容时去掉所有可能的 JSON 残留
            cleanContent = rawContent.replace(/\{[^{}]*"mood"[^{}]*\}/g, '').replace(/\{[^{}]*"favorability"[^{}]*\}/g, '').trim();
        }
    } else {
        // 完全没找到 JSON，尝试逐字段提取
        const moodMatch = rawContent.match(/"mood"\s*:\s*"([^"]+)"/);
        const favMatch = rawContent.match(/"favorability"\s*:\s*(\d+)/);
        const actMatch = rawContent.match(/"action"\s*:\s*"([^"]+)"/);
        const thtMatch = rawContent.match(/"thought"\s*:\s*"([^"]+)"/);
        
        if (moodMatch || favMatch || actMatch || thtMatch) {
            updateMentalState({
                mood: moodMatch ? moodMatch[1] : (window.ChatConfig?.mental?.mood || '未知'),
                favorability: favMatch ? parseInt(favMatch[1]) : (window.ChatConfig?.mental?.favorability || 0),
                action: actMatch ? actMatch[1] : (window.ChatConfig?.mental?.action || '无'),
                thought: thtMatch ? thtMatch[1] : (window.ChatConfig?.mental?.thought || '无')
            });
        }
        cleanContent = rawContent;
    }

    const narrationRegex = /[\(\（]([^\)\）]+)[\)\）]/g;
    const narrations = [];
    let mainText = cleanContent.replace(narrationRegex, (match, content) => {
        narrations.push(content);
        return '';
    }).trim();

    narrations.forEach(n => {
        appendMessage('narration', n);
    });

    if (mainText) {
        const parts = mainText.split(/\n{2,}/).filter(p => p.trim());
        parts.forEach(part => {
            const trimmed = part.trim().replace(/^[\n]+/, '');
            const row = appendMessage('assistant', trimmed);
            if (ChatConfig?.settings?.autoTranslate && needsTranslation(trimmed)) {
                appendTranslationRow(row, '翻译中…');
                translateText(trimmed).then(translated => {
                    window._translateCache[trimmed] = translated;
                    appendTranslationRow(row, translated);
                    saveChatHistory(contactId);
                }).catch(() => {
                    appendTranslationRow(row, '翻译失败');
                });
            }
        });
        if (parts.length === 0 && mainText.trim()) {
            const trimmed = mainText.trim().replace(/^[\n]+/, '');
            const row = appendMessage('assistant', trimmed);
            if (ChatConfig?.settings?.autoTranslate && needsTranslation(trimmed)) {
                appendTranslationRow(row, '翻译中…');
                translateText(trimmed).then(translated => {
                    window._translateCache[trimmed] = translated;
                    appendTranslationRow(row, translated);
                    saveChatHistory(contactId);
                }).catch(() => {
                    appendTranslationRow(row, '翻译失败');
                });
            }
        }
    }

    if (titleEl) titleEl.textContent = contactName;
    window.ChatState.isAITyping = false;

    saveChatHistory(contactId);
}

// ========== 格式化时间 ==========
function formatChatTime(date) {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const period = h < 12 ? '上午' : '下午';
    const displayH = h % 12 || 12;
    return period + ' ' + displayH + ':' + m;
}

// ========== 追加消息到界面 ==========
function appendMessage(role, text) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return null;

    const now = new Date();

    const shouldShowTime = !window.ChatState.lastMessageTime || 
        (now - window.ChatState.lastMessageTime) > 6 * 60 * 1000;

    if (shouldShowTime && role !== 'narration') {
        const timeStamp = document.createElement('div');
        timeStamp.className = 'chat-time-stamp';
        timeStamp.textContent = formatChatTime(now);
        messages.appendChild(timeStamp);
        window.ChatState.lastMessageTime = now;
    }

    if (role === 'narration') {
        const bubble = document.createElement('div');
        bubble.className = 'bubble bubble-narration';
        bubble.textContent = text;
        messages.appendChild(bubble);
        return null;
    } else {
        const row = document.createElement('div');
        row.className = 'bubble-row ' + (role === 'user' ? 'user' : 'assistant');
        row.setAttribute('data-role', role);

        const avatar = document.createElement('div');
        avatar.className = 'bubble-avatar ' + (role === 'user' ? 'user-avatar' : 'bot-avatar');
        avatar.textContent = role === 'user' ? '我' : (getContactById(window.ChatState.currentContactId)?.avatar || 'AI');

        const bubble = document.createElement('div');
        bubble.className = 'bubble bubble-' + role;
        bubble.textContent = text;
        bubble.id = 'msg-' + Date.now();

        row.appendChild(avatar);
        row.appendChild(bubble);
        messages.appendChild(row);
        messages.scrollTop = messages.scrollHeight;
        return row;
    }
}

// ========== 更新心理状态 ==========
function updateMentalState(mentalData) {
    if (!window.ChatConfig) window.ChatConfig = {};
    window.ChatConfig.mental = {
        mood: mentalData.mood || '未知',
        favorability: mentalData.favorability || 0,
        action: mentalData.action || '无',
        thought: mentalData.thought || '无'
    };

    const moodEl = document.getElementById('m-mood');
    const favEl = document.getElementById('m-fav');
    const actEl = document.getElementById('m-act');
    const thtEl = document.getElementById('m-tht');
    if (moodEl) moodEl.textContent = window.ChatConfig.mental.mood;
    if (favEl) favEl.textContent = window.ChatConfig.mental.favorability;
    if (actEl) actEl.textContent = window.ChatConfig.mental.action;
    if (thtEl) thtEl.textContent = window.ChatConfig.mental.thought;
}

// ========== 检测是否需要翻译（包含繁体中文） ==========
function needsTranslation(text) {
    if (!text) return false;
    const simplifiedOnlyRegex = /^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s\d\w\p{P}]+$/u;
    if (!simplifiedOnlyRegex.test(text)) return true;
    const traditionalChars = /[爲豈雲歷麗倫眾麼專業義達對號與臺灣區風龍龜]/;
    if (traditionalChars.test(text)) return true;
    const chineseChars = text.match(/[\u4e00-\u9fff]/g);
    if (!chineseChars) return true;
    const nonChinese = text.replace(/[\u4e00-\u9fff\s\d\w]/g, '').length;
    const total = text.replace(/\s/g, '').length;
    if (total > 0 && nonChinese / total > 0.4) return true;
    return false;
}

// ========== 翻译文本（Google 免费接口） ==========
async function translateText(text) {
    try {
        const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=' + encodeURIComponent(text);
        const response = await fetch(url);
        const data = await response.json();
        if (data && data[0]) {
            let result = '';
            data[0].forEach(part => { result += part[0]; });
            return result || text;
        }
        return text;
    } catch (e) {
        return text;
    }
}

// ========== 追加翻译行（紧贴气泡行下方） ==========
function appendTranslationRow(originalRow, translatedText) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    const next = originalRow.nextElementSibling;
    if (next && next.classList.contains('translate-row')) {
        next.querySelector('.bubble').textContent = translatedText;
        next.style.display = 'flex';
        return;
    }

    if (originalRow) originalRow.style.marginBottom = '0';

    const transRow = document.createElement('div');
    transRow.className = 'translate-row';
    transRow.style.cssText = 'display:flex;align-items:flex-start;gap:8px;margin-top:0;margin-bottom:8px;padding-left:48px;';
    transRow.innerHTML = `
        <div class="bubble" style="background:rgba(255,255,255,0.35);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);font-size:13px;color:#3a3a3c;border-radius:14px;padding:8px 12px;max-width:70%;">${translatedText}</div>
    `;

    originalRow.parentNode.insertBefore(transRow, originalRow.nextSibling);
}

// ========== 提取最近 N 条历史消息（用于上下文记忆） ==========
function getRecentHistory(contactId, maxCount) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return [];

    const result = [];
    const rows = messages.querySelectorAll('.bubble-row');
    const total = rows.length;
    const start = Math.max(0, total - maxCount);

    for (let i = start; i < total; i++) {
        const row = rows[i];
        const bubble = row.querySelector('.bubble');
        if (!bubble) continue;
        const role = row.classList.contains('user') ? 'user' : 'assistant';
        result.push({ role: role, content: bubble.textContent });
    }

    return result;
}

// ========== 聊天历史存储 ==========
function saveChatHistory(contactId) {
    const messages = document.getElementById('chatMessages');
    if (messages) {
        localStorage.setItem('chat_history_' + contactId, messages.innerHTML);
    }
}

function loadChatHistory(contactId) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const saved = localStorage.getItem('chat_history_' + contactId);
    if (saved) {
        messages.innerHTML = saved;
        messages.scrollTop = messages.scrollHeight;
    }
}
