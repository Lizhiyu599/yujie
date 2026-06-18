/**
 * 玉界 - 聊天核心
 * 包含：消息收发、API 对接、系统提示拼接、状态栏更新、翻译、时间戳
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

    prompt += '【最高优先级】每次回复必须在末尾附加一段JSON状态信息，格式严格为：\n{"mood":"心情(10字内)","favorability":好感度数字(0-100),"action":"动作(20字内)","thought":"内心想法(30字内)"}\n该JSON必须放在回复的最后面，不能省略。\n\n';

    prompt += '【重要】每条消息气泡单独发送，不要合并。一句话不超过30字。如果需要说多句话，请分成多条消息发送，每条消息用两个换行符\\n\\n分隔。这样每条消息会显示为独立气泡。\n\n';

    if (typeof getFullSystemPrompt === 'function') {
        prompt += getFullSystemPrompt();
    }

    const contact = getContactById(contactId);
    if (contact && contact.persona) {
        prompt += '\n\n【当前角色人设】\n' + contact.persona;
    }

    const narrationEnabled = ChatConfig?.settings?.onlineNarration !== false;
    if (narrationEnabled) {
        prompt += '\n\n【旁白模式】开启。请在回复中用括号（）包含旁白内容，用于描写环境、动作、心理活动等。';
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

    try {
        const reply = await callChatAPI(systemPrompt, userMessage);
        processAIReply(reply, contactName, contactId);
    } catch (error) {
        appendMessage('assistant', '抱歉，消息发送失败：' + error.message);
        if (titleEl) titleEl.textContent = contactName;
        window.ChatState.isAITyping = false;
    }
}

// ========== 调用聊天 API ==========
async function callChatAPI(systemPrompt, userMessage) {
    const config = getActiveAPIConfig();
    if (!config) {
        throw new Error('请先在设置中配置 API');
    }

    let endpoint = config.baseUrl;
    if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];

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

    const jsonMatch = rawContent.match(/\{[\s\S]*"mood"[\s\S]*\}/);
    let cleanContent = rawContent;
    if (jsonMatch) {
        try {
            const mentalData = JSON.parse(jsonMatch[0]);
            updateMentalState(mentalData);
            cleanContent = rawContent.replace(jsonMatch[0], '').trim();
        } catch (e) {}
    }

    // 分离旁白
    const narrationRegex = /[\(\（]([^\)\）]+)[\)\）]/g;
    const narrations = [];
    let mainText = cleanContent.replace(narrationRegex, (match, content) => {
        narrations.push(content);
        return '';
    }).trim();

    // 先渲染旁白
    narrations.forEach(n => {
        appendMessage('narration', n);
    });

    // 按双换行符拆分成多条消息，分别显示为独立气泡
    if (mainText) {
        const parts = mainText.split(/\n{2,}/).filter(p => p.trim());
        parts.forEach(part => {
            appendMessage('assistant', part.trim());
        });
        if (parts.length === 0 && mainText.trim()) {
            appendMessage('assistant', mainText.trim());
        }
    }

    if (titleEl) titleEl.textContent = contactName;
    window.ChatState.isAITyping = false;

    saveChatHistory(contactId);

    // 自动翻译检查（检查最后一条）
    if (ChatConfig?.settings?.autoTranslate && mainText) {
        autoTranslateLastAssistant(contactId);
    }
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
    if (!messages) return;

    const now = new Date();

    const shouldShowTime = !window.ChatState.lastMessageTime || 
        (now - window.ChatState.lastMessageTime) > 3 * 60 * 1000;

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
    } else {
        const row = document.createElement('div');
        row.className = 'bubble-row ' + (role === 'user' ? 'user' : 'assistant');

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
    }
    messages.scrollTop = messages.scrollHeight;
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

// ========== 自动翻译 ==========
async function autoTranslateLastAssistant(contactId) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const rows = messages.querySelectorAll('.bubble-row.assistant');
    if (rows.length === 0) return;
    const lastRow = rows[rows.length - 1];
    const bubble = lastRow.querySelector('.bubble-assistant');
    if (!bubble) return;
    const text = bubble.textContent;

    if (!needsTranslation(text)) return;

    if (window._translateCache[text]) {
        appendTranslationRow(lastRow, window._translateCache[text]);
        return;
    }

    try {
        const translated = await translateText(text);
        window._translateCache[text] = translated;
        appendTranslationRow(lastRow, translated);
    } catch (e) {}
}

// ========== 检测是否需要翻译 ==========
function needsTranslation(text) {
    const chineseRegex = /[\u4e00-\u9fff]/;
    const hasChinese = chineseRegex.test(text);
    if (!hasChinese) return true;

    const nonChineseChars = text.replace(/[\u4e00-\u9fff]/g, '').replace(/\s/g, '').length;
    const totalChars = text.replace(/\s/g, '').length;
    if (totalChars > 0 && nonChineseChars / totalChars > 0.4) return true;

    return false;
}

// ========== 翻译文本 ==========
async function translateText(text) {
    const config = getActiveAPIConfig();
    if (!config) throw new Error('未配置 API');

    let endpoint = config.baseUrl;
    if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: 'system', content: '你是一个翻译助手。请将以下内容翻译成简体中文。只返回翻译结果，不要任何解释。' },
                { role: 'user', content: text }
            ],
            temperature: 0.3,
            stream: false
        })
    });

    if (!response.ok) throw new Error('翻译请求失败');
    const data = await response.json();
    return data.choices?.[0]?.message?.content || text;
}

// ========== 追加翻译行（在气泡行下方） ==========
function appendTranslationRow(originalRow, translatedText) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    const next = originalRow.nextElementSibling;
    if (next && next.classList.contains('translate-row')) {
        next.querySelector('.bubble').textContent = translatedText;
        next.style.display = 'flex';
        return;
    }

    const transRow = document.createElement('div');
    transRow.className = 'translate-row';
    transRow.style.cssText = 'display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;padding-left:48px;';
    transRow.innerHTML = `
        <div class="bubble" style="background:rgba(255,255,255,0.35);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);font-size:13px;color:#3a3a3c;border-radius:14px;padding:8px 12px;max-width:70%;">${translatedText}</div>
    `;

    originalRow.parentNode.insertBefore(transRow, originalRow.nextSibling);
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
