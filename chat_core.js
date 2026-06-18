/**
 * 玉界 - 聊天核心
 * 包含：消息收发、API 对接、系统提示拼接、状态栏更新、翻译
 */

// ========== 聊天状态 ==========
window.ChatState = window.ChatState || {
    currentContactId: null,
    isAITyping: false,
    quotedMsg: null
};

// ========== 翻译缓存（不重复翻译相同内容） ==========
window._translateCache = window._translateCache || {};

// ========== 构建系统提示 ==========
function buildSystemPrompt(contactId) {
    let prompt = '';

    // 1. 万象树核心规则 + 用户预设
    if (typeof getFullSystemPrompt === 'function') {
        prompt += getFullSystemPrompt();
    }

    // 2. 角色人设（从联系人数据读取）
    const contact = getContactById(contactId);
    if (contact && contact.persona) {
        prompt += '\n\n【当前角色人设】\n' + contact.persona;
    }

    // 3. 旁白开关
    const narrationEnabled = ChatConfig?.settings?.onlineNarration !== false;
    if (narrationEnabled) {
        prompt += '\n\n【旁白模式】开启。请在回复中用括号（）包含旁白内容，用于描写环境、动作、心理活动等。';
    } else {
        prompt += '\n\n【旁白模式】关闭。不需要写旁白。';
    }

    // 4. 实时状态要求
    prompt += '\n\n【实时状态】每次回复必须在末尾附加一段严格的JSON格式状态信息，格式必须为：\n{"mood":"心情(10字内)","favorability":好感度数字(0-100),"action":"动作(20字内)","thought":"内心想法(30字内)"}\n该JSON将在前端解析为心理状态窗，不会显示给用户。';

    return prompt;
}

// ========== 获取联系人 ==========
function getContactById(contactId) {
    if (!window.ChatConfig || !window.ChatConfig.contacts) return null;
    return window.ChatConfig.contacts.find(c => c.id === contactId) || null;
}

// ========== 获取当前 API 配置 ==========
function getActiveAPIConfig() {
    // 从设置的多设备中取第一个已配置的设备
    if (typeof getDevices === 'function') {
        const devices = getDevices();
        const configured = devices.find(d => d.baseUrl && d.apiKey && d.model);
        if (configured) return configured;
    }
    // fallback：旧版单设备 localStorage
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');
    if (baseUrl && apiKey && model) {
        return { baseUrl, apiKey, model, temperature: 1.0, stream: true };
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

    // 追加用户消息到界面
    appendMessage('user', text);

    input.value = '';

    // 显示输入中
    window.ChatState.isAITyping = true;
    const titleEl = document.getElementById('chatTitle');
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中…</span>';

    // 保存历史
    saveChatHistory(contactId);

    // 构建消息
    const systemPrompt = buildSystemPrompt(contactId);
    let userMessage = text;

    // 如果有引用消息，拼接到前面
    if (window.ChatState.quotedMsg) {
        userMessage = '【引用】' + window.ChatState.quotedMsg.n + '说：' + window.ChatState.quotedMsg.t + '\n\n【回复】' + userMessage;
        window.ChatState.quotedMsg = null;
        // 隐藏引用预览
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
            stream: config.stream !== false
        })
    });

    if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
            const errData = await response.json();
            errMsg = errData.error?.message || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
    }

    // 处理流式或非流式响应
    if (config.stream !== false) {
        return await handleStreamResponse(response);
    } else {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }
}

// ========== 处理流式响应 ==========
async function handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;
            try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) fullContent += content;
            } catch (e) {}
        }
    }

    return fullContent;
}

// ========== 处理 AI 回复 ==========
function processAIReply(rawContent, contactName, contactId) {
    const titleEl = document.getElementById('chatTitle');

    // 1. 提取状态栏 JSON
    const jsonMatch = rawContent.match(/\{[\s\S]*"mood"[\s\S]*\}/);
    let cleanContent = rawContent;
    if (jsonMatch) {
        try {
            const mentalData = JSON.parse(jsonMatch[0]);
            updateMentalState(mentalData);
            cleanContent = rawContent.replace(jsonMatch[0], '').trim();
        } catch (e) {
            // JSON 解析失败，保留原文
        }
    }

    // 2. 分离旁白和正文
    const narrationRegex = /[\(\（]([^\)\）]+)[\)\）]/g;
    const narrations = [];
    let mainText = cleanContent.replace(narrationRegex, (match, content) => {
        narrations.push(content);
        return '';
    }).trim();

    // 3. 渲染旁白
    narrations.forEach(n => {
        appendMessage('narration', n);
    });

    // 4. 渲染正文
    if (mainText) {
        appendMessage('assistant', mainText);
    }

    // 5. 恢复标题
    if (titleEl) titleEl.textContent = contactName;
    window.ChatState.isAITyping = false;

    // 6. 保存历史
    saveChatHistory(contactId);

    // 7. 自动翻译（如果开启了非简体中文自动翻译）
    if (ChatConfig?.settings?.autoTranslate && mainText) {
        autoTranslateLastAssistant(contactId);
    }
}

// ========== 追加消息到界面 ==========
function appendMessage(role, text) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (role === 'user') {
        bubble.classList.add('bubble-user');
    } else if (role === 'assistant') {
        bubble.classList.add('bubble-assistant');
    } else if (role === 'narration') {
        bubble.classList.add('bubble-narration');
    }

    bubble.textContent = text;
    bubble.id = 'msg-' + Date.now();
    messages.appendChild(bubble);
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

    // 更新心理状态窗（如果正在显示）
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
    const bubbles = messages.querySelectorAll('.bubble-assistant');
    if (bubbles.length === 0) return;
    const lastBubble = bubbles[bubbles.length - 1];
    const text = lastBubble.textContent;

    // 检测是否非简体中文
    if (!needsTranslation(text)) return;

    // 检查缓存
    if (window._translateCache[text]) {
        appendTranslation(lastBubble, window._translateCache[text]);
        return;
    }

    // 调用翻译 API
    try {
        const translated = await translateText(text);
        window._translateCache[text] = translated;
        appendTranslation(lastBubble, translated);
    } catch (e) {
        // 翻译失败静默处理
    }
}

// ========== 检测是否需要翻译 ==========
function needsTranslation(text) {
    // 检测是否包含中文字符（简体中文范围）
    const chineseRegex = /[\u4e00-\u9fff]/;
    const hasChinese = chineseRegex.test(text);

    // 如果包含中文但全是简体中文常用字，不需要翻译
    // 如果不包含任何中文，需要翻译
    if (!hasChinese) return true;

    // 包含中文时，检测是否混入了非中文内容超过 40%
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

// ========== 追加翻译气泡 ==========
function appendTranslation(originalBubble, translatedText) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    // 检查是否已有翻译气泡
    const next = originalBubble.nextElementSibling;
    if (next && next.classList.contains('translate-bubble')) {
        next.textContent = translatedText;
        return;
    }

    const transBubble = document.createElement('div');
    transBubble.className = 'bubble translate-bubble';
    transBubble.style.cssText = 'align-self:flex-start;background:rgba(255,255,255,0.3);backdrop-filter:blur(15px);font-size:13px;color:#3a3a3c;margin-top:-4px;margin-bottom:8px;border-radius:12px;padding:8px 12px;max-width:70%;';
    transBubble.textContent = translatedText;

    originalBubble.parentNode.insertBefore(transBubble, originalBubble.nextSibling);
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
