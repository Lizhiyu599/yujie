/**
 * 玉界 - 聊天核心
 * 包含：消息收发、API 对接、系统提示拼接、状态栏更新、翻译、时间戳、上下文记忆、
 *       自动发消息、自动发动态、红包转账状态处理、语音消息处理、图片消息处理
 */

// ========== 聊天状态 ==========
window.ChatState = window.ChatState || {
    currentContactId: null,
    isAITyping: false,
    quotedMsg: null,
    lastMessageTime: null
};

// ========== 构建系统提示 ==========
function buildSystemPrompt(contactId) {
    let prompt = '';

    prompt += '【最高优先级·状态更新】你的每次回复，必须在最后一行附加一段完整的JSON状态信息，格式严格如下（不要省略任何字段，不要嵌套在其他内容里，必须单独一行）：\n{"mood":"心情(10字内)","favorability":好感度数字(0-100),"action":"动作(20字内)","thought":"内心想法(30字内)"}\n这是强制要求，每次回复都必须包含此JSON，否则系统无法正确运行。\n\n';

    prompt += '【语言规则】你的所有回复正文和旁白内容，必须且只能使用简体中文。禁止使用繁体中文、日语、英语、韩语等任何其他语言。禁止使用双引号\u201c\u201d。不要在消息前加换行。这是最高优先级的硬性规则，不可违反。\n\n';

    const replyMax = (window.ChatConfig && window.ChatConfig.settings && window.ChatConfig.settings.replyMax) || 3;
    prompt += '【回复条数限制】每次回复最多' + replyMax + '条消息。用两个换行符\\n\\n分隔不同的消息气泡。一句话不超过30字。\n\n';

    if (typeof getFullSystemPrompt === 'function') {
        prompt += getFullSystemPrompt();
    }

    const contact = getContactById(contactId);
    if (contact && contact.persona) {
        prompt += '\n\n【当前角色人设】\n' + contact.persona;
    }

    const narrationEnabled = ChatConfig?.settings?.onlineNarration !== false;
    if (narrationEnabled) {
        prompt += '\n\n【旁白模式】开启。请在回复中用括号（）包含旁白内容，用于描写环境、动作、心理活动等。旁白必须且只能使用简体中文。';
    } else {
        prompt += '\n\n【旁白模式】关闭。不需要写旁白。';
    }

prompt += '\n\n【记忆连续性】你必须记住和用户之前聊过的所有内容。称呼要前后一致，不能上一句叫姐姐下一句又改口。认真阅读聊天历史，保持对话连贯。';
var now = new Date();
var timeStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
prompt += '\n\n【当前时间】' + timeStr + '。你可以根据时间自然调整对话。比如深夜会关心用户怎么还不睡，早上会问早安。用户可能用旁白修改时间，以用户旁白为准。\n';

var summaryText = '';
try {
    var rawSL = localStorage.getItem('shiyilin_books');
    if (rawSL) {
        var summaryBooks = JSON.parse(rawSL);
        for (var si = 0; si < summaryBooks.length; si++) {
            if (summaryBooks[si].contactId === contactId && summaryBooks[si].summary) {
                summaryText = summaryBooks[si].summary;
                break;
            }
        }
    }
} catch(e) {}
if (summaryText) {
    prompt += '\n\n【拾忆林记忆】以下是关于你们过去互动的总结，你可以在聊天中自然地回忆起这些内容。不要生硬地背诵，而是在相关话题出现时像活人一样自然地联想起来：\n' + summaryText + '\n';
}    

prompt += '\n\n【红包和转账-最高优先级·严格遵守】\n用户让你发红包时，只发红包。格式：（给用户发了一个红包，金额X元）\n用户让你发转账时，只发转账。格式：（给用户转账X元，备注：...）\n红包和转账是不同的东西，不要混淆。用户说"红包"就发红包，用户说"转账"就发转账，不要自己替换。\n用户说"发两个转账"就发两个转账，不要发红包。\n金额必须大于0。红包金额上限200元，转账金额上限20000元。\n不要解释、不要模拟、不要说"发送成功"。只发格式正确的旁白。\n\n如果你决定接收用户的红包或转账，在旁白中说"接收了红包"或"收下了转账"。如果要退还转账，在旁白中说"退还了转账"。\n\n重要：接收红包/转账时，必须在旁白中写清楚金额。例如：（接收了红包，金额10元）或（收下了转账，金额50元）。';

prompt += '\n\n【语音消息】你可以给用户发语音消息。发语音时用旁白表示：（发了一条语音消息：内容）。系统会自动生成语音气泡。';

prompt += '\n\n【发送图片】你可以给用户发送图片。当用户说想看你、想看你的样子、想看你的手、想看周围环境等，你可以发图片。发图片时用旁白表示：（发了一张图片：描述文字）。描述文字用于生成图片，要详细描写画面内容，包括外貌、穿着、场景、动作、光线等。';

var emojiList = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
var bannedEmojis = JSON.parse(localStorage.getItem('banned_emojis') || '[]');
var emojiNotes = [];
for (var ei = 0; ei < emojiList.length; ei++) {
    if (emojiList[ei].note && bannedEmojis.indexOf(ei) < 0) {
        emojiNotes.push(emojiList[ei].note);
    }
}
if (emojiNotes.length > 0) {
    prompt += '\n\n【发送表情包】你可以给用户发表情包。发表情包时用旁白表示：（发送了表情包：备注文字）。以下是你可以使用的表情包备注列表：' + emojiNotes.join('、') + '。根据你的性格和聊天情境自主选择合适的表情包。活泼角色可以多用，高冷角色少用或不用。';
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

    const bracketMatch = text.match(/^[\(\（]([^\)\）]+)[\)\）]$/);
    if (bracketMatch) {
        const bracketContent = bracketMatch[1];
        if (bracketContent.indexOf('接收') >= 0 || bracketContent.indexOf('收下') >= 0 || bracketContent.indexOf('收啦') >= 0) {
            acceptLatestPayment();
        } else if (bracketContent.indexOf('退还') >= 0 || bracketContent.indexOf('退回') >= 0) {
            refundLatestPayment();
        }
        appendMessage('narration', text);
        input.value = '';
        saveChatHistory(contactId);

        return;
    }

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
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中...</span>';

    saveChatHistory(contactId);

    const systemPrompt = buildSystemPrompt(contactId);
    var messagesEl = document.getElementById('chatMessages');
if (messagesEl) {
    var hiddenNarrations = messagesEl.querySelectorAll('.bubble-narration[style*="display: none"]');
    hiddenNarrations.forEach(function(n) {
        var nt = n.textContent.trim();
        if (nt) {
            text = text + '\n' + nt;
        }
    });
}

    let userMessage = text;

    if (window.ChatState.quotedMsg) {
        userMessage = '【引用】' + window.ChatState.quotedMsg.n + '说：' + window.ChatState.quotedMsg.t + '\n\n【回复】' + userMessage;
        window.ChatState.quotedMsg = null;
        const qv = document.getElementById('quotePreview');
        if (qv) qv.style.display = 'none';
    }

    const memoryCount = parseInt(getContactSetting(contactId, 'memoryCount', '50'));
    const historyMessages = getRecentHistory(contactId, memoryCount);
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

// ========== 接收/退还红包转账（只处理卡片，返回 true/false） ==========
function acceptLatestPayment() {
    var cards = document.querySelectorAll('.payment-card[data-msg-id]');
    for (var i = cards.length - 1; i >= 0; i--) {
        var card = cards[i];
        var msgId = card.getAttribute('data-msg-id');
        var state = getPaymentState(msgId);
        if (state === 'pending') {
            var type = card.getAttribute('data-type');
            var amount = card.getAttribute('data-amount');
            updatePaymentCardUI(msgId, 'accepted');
            addReceivedCard('assistant', type, amount);
            saveChatHistory(window.ChatState.currentContactId);
            return true;
        }
    }
    return false;
}

function refundLatestPayment() {
    var cards = document.querySelectorAll('.payment-card[data-msg-id]');
    for (var i = cards.length - 1; i >= 0; i--) {
        var card = cards[i];
        var msgId = card.getAttribute('data-msg-id');
        var state = getPaymentState(msgId);
        var type = card.getAttribute('data-type');
        if (state === 'pending' && type === '转账') {
            var amount = card.getAttribute('data-amount');
            updatePaymentCardUI(msgId, 'refunded');
            addRefundedCard('assistant', amount);
            saveChatHistory(window.ChatState.currentContactId);
            return true;
        }
    }
    return false;
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
    const timeout = setTimeout(() => controller.abort(), 300000);

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
        
        if (data.usage && data.usage.total_tokens) {
            if (!window.ChatConfig) window.ChatConfig = { settings: { api: {} } };
            if (!window.ChatConfig.settings) window.ChatConfig.settings = { api: {} };
            if (!window.ChatConfig.settings.api) window.ChatConfig.settings.api = {};
            
            const api = window.ChatConfig.settings.api;
            api.total = (api.total || 0) + data.usage.total_tokens;
            api.online = (api.online || 0) + data.usage.total_tokens;
            localStorage.setItem('api_total', api.total);
            localStorage.setItem('api_online', api.online);
            
            const totalEl = document.getElementById('apiTotal');
            const onlineEl = document.getElementById('apiOnline');
            if (totalEl) totalEl.textContent = api.total + ' token';
            if (onlineEl) onlineEl.textContent = api.online + ' token';
        }
        
        return data.choices?.[0]?.message?.content || '';
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('请求超时（300秒），请检查网络或尝试重试');
        }
        throw error;
    }
}

// ========== 处理 AI 回复（红包旁白统一渲染） ==========
function processAIReply(rawContent, contactName, contactId) {
    const titleEl = document.getElementById('chatTitle');

    let jsonMatch = rawContent.match(/\{[^{}]*"mood"[^{}]*\}/);
    if (!jsonMatch) {
        jsonMatch = rawContent.match(/\{[^}]*"mood"\s*:\s*"[^"]*"[^}]*\}/);
    }
    if (jsonMatch) {
        try {
            const mentalData = JSON.parse(jsonMatch[0]);
            updateMentalState(mentalData);
        } catch (e) {
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
        }
    }

    let cleanContent = rawContent.replace(/^[\n]+/, '').replace(/\u201c|\u201d/g, '');
    if (jsonMatch) {
        cleanContent = cleanContent.replace(jsonMatch[0], '').trim();
    }

    // ===== 检测角色旁白接收红包/转账（只处理卡片，不渲染旁白） =====
    var acceptMatch = cleanContent.match(/[\(\（]([^\)\）]*)(接收了红包|收下了红包|收下了转账|接收了转账|收啦|收了红包|收了转账)[^\)\）]*[\)\）]/);
    var accepted = false;
    if (acceptMatch) {
        accepted = acceptLatestPayment();
        cleanContent = cleanContent.replace(acceptMatch[0], '');
    }

    // ===== 检测角色旁白退还转账（只处理卡片，不渲染旁白） =====
    var refundMatch = cleanContent.match(/[\(\（]([^\)\）]*)(退还了转账|退回了转账|退还转账|退回转账|退还了红包)[^\)\）]*[\)\）]/);
    var refunded = false;
    if (refundMatch) {
        refunded = refundLatestPayment();
        cleanContent = cleanContent.replace(refundMatch[0], '');
    }

    // ===== 检测角色旁白发红包 → 角色侧卡片 =====
var redPacketMatch = cleanContent.match(/[\(\（]([^\)\）]*)(红包|发红包|给红包)[^\)\）]*?(\d+\.?\d*)[^\)\）]*[\)\）]/);
if (redPacketMatch) {
    var redAmount = Math.max(0.01, Math.min(parseFloat(redPacketMatch[3]), 200));
    if (redAmount >= 0.01) {
        sendBotPaymentCard('红包', redAmount, '');
        cleanContent = cleanContent.replace(redPacketMatch[0], '');
    }
}

    // ===== 检测角色旁白发转账 → 角色侧卡片 =====
var transferMatch = cleanContent.match(/[\(\（]([^\)\）]*?)(\d+\.?\d*)\s*元?[^\)\）]*[\)\）]/);
if (transferMatch) {
    var transferAmount = parseFloat(transferMatch[2]);
    if (transferAmount >= 0.01 && cleanContent.indexOf('转账') >= 0) {
        var noteMatch = cleanContent.match(/转账[^\)\）]*备注[：:]\s*([^\)\）]+)/);
        var note = noteMatch ? noteMatch[1].trim() : '';
        sendBotPaymentCard('转账', transferAmount, note);
        cleanContent = cleanContent.replace(transferMatch[0], '');
    }
}
    
    // ===== 检测角色旁白发语音 =====
    var voiceMatch = cleanContent.match(/[\(\（]([^\)\）]*)发了一条语音消息[：:]\s*([^\)\）]+)[\)\）]/);
    if (voiceMatch && voiceMatch[2]) {
        sendVoiceBubble('assistant', voiceMatch[2].trim(), null, false);
        cleanContent = cleanContent.replace(voiceMatch[0], '');
    }

    // ===== 检测角色旁白发表情包 =====
var emojiAllow = (ChatConfig && ChatConfig.settings && ChatConfig.settings.emojiAllow) !== false;
var emojiMatch = cleanContent.match(/[\(\（]([^\)\）]*)发送了表情包[：:]\s*([^\)\）]+)[\)\）]/);
if (emojiAllow && emojiMatch && emojiMatch[2]) {
    var emojiNote = emojiMatch[2].trim();
    var emojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    var banned = JSON.parse(localStorage.getItem('banned_emojis') || '[]');
    var found = null;
    for (var ei = 0; ei < emojis.length; ei++) {
        if (emojis[ei].note && emojiNote.indexOf(emojis[ei].note) >= 0 && banned.indexOf(ei) < 0) {
            found = emojis[ei];
            break;
        }
    }
    if (found) {
        sendStickerFromBot(found.src, emojiNote);
    }
    cleanContent = cleanContent.replace(/[\(\（]\s*发送了表情包[：:]\s*[^\)\）]+[\)\）]/g, '');
}
    
    // ===== 检测角色旁白发图片 =====
    var imageMatch = cleanContent.match(/[\(\（]([^\)\）]*)发了一张图片[：:]\s*([^\)\）]+)[\)\）]/);
    if (imageMatch && imageMatch[2]) {
        var imageDesc = imageMatch[2].trim();
        cleanContent = cleanContent.replace(imageMatch[0], '');
        var hasImageAPI = localStorage.getItem('image_base_url') && localStorage.getItem('image_api_key') && localStorage.getItem('image_model');
        if (hasImageAPI) {
            callImageAPI(imageDesc).then(function(generatedUrl) {
                if (generatedUrl) {
                    var botRow = document.createElement('div');
                    botRow.className = 'bubble-row assistant';
                    var botAvatar = document.createElement('div');
                    botAvatar.className = 'bubble-avatar bot-avatar';
                    botAvatar.textContent = getContactById(contactId)?.avatar || 'AI';
                    var botBubble = document.createElement('div');
                    botBubble.className = 'bubble bubble-assistant';
                    botBubble.style.backgroundImage = 'url(' + generatedUrl + ')';
                    botBubble.style.backgroundSize = 'cover';
                    botBubble.style.backgroundPosition = 'center';
                    botBubble.style.width = '140px';
                    botBubble.style.height = '140px';
                    botBubble.style.padding = '0';
                    botBubble.style.borderRadius = '12px';
                    botBubble.textContent = '';
                    botBubble.onclick = function() { openImageViewer(generatedUrl); };
                    botRow.appendChild(botAvatar);
                    botRow.appendChild(botBubble);
                    document.getElementById('chatMessages').appendChild(botRow);
                    saveChatHistory(contactId);
                }
            });
        } else {
            appendMessage('narration', imageDesc);
        }
    }

    // ===== 通用旁白处理 =====
    const narrationRegex = /[\(\（]([^\)\）]+)[\)\）]/g;
    const narrations = [];
    let mainText = cleanContent.replace(narrationRegex, (match, content) => {
        narrations.push(content);
        return '';
    }).trim();

    narrations.forEach(n => {
        appendMessage('narration', n);
    });

    // ===== 红包/转账旁白在通用旁白之后统一追加 =====
    if (accepted) {
        appendMessage('narration', contactName + '已接收');
    }
    if (refunded) {
        appendMessage('narration', contactName + '已退还');
    }

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

// ===== 自动日记检测 =====
var diaryAuto = localStorage.getItem('diary_auto_enabled') === 'true';
var diaryChar = localStorage.getItem('diary_selected_char');
if (diaryAuto && diaryChar === contactId && typeof generateDiaryContent === 'function') {
    var mental = window.ChatConfig && window.ChatConfig.mental;
    var prevFav = parseInt(localStorage.getItem('diary_last_fav_' + contactId) || mental.favorability);
    var favChange = Math.abs(mental.favorability - prevFav);
    if (favChange >= 10) {
        localStorage.setItem('diary_last_fav_' + contactId, mental.favorability);
        generateDiaryContent(contactId).then(function(content) {
            if (content) {
                var now = new Date();
                var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
                var diaries = getDiaries ? getDiaries() : [];
                diaries.push({ date: dateStr, content: content });
                if (typeof saveDiaries === 'function') saveDiaries(diaries);
            }
        }).catch(function() {});
    }
}

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

    if (shouldShowTime) {
        const timeStamp = document.createElement('div');
        timeStamp.className = 'chat-time-stamp';
        timeStamp.textContent = formatChatTime(now);
        messages.appendChild(timeStamp);
    }
    window.ChatState.lastMessageTime = now;

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

// ========== 检测是否需要翻译 ==========
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

// ========== 翻译文本 ==========
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

// ========== 追加翻译行 ==========
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

// ========== 提取最近 N 条历史消息 ==========
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

function saveChatHistory(contactId) {
    var messages = document.getElementById('chatMessages');
    if (messages) {
        var html = messages.innerHTML;
        if (html.length > 300000) {
            html = html.slice(html.length - 300000);
        }
        try {
            localStorage.setItem('chat_history_' + contactId, html);
        } catch (e) {
            // 存储满了，清掉最旧的聊天记录
            var keys = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k.startsWith('chat_history_')) keys.push(k);
            }
            if (keys.length > 0) {
                localStorage.removeItem(keys[0]);
                try { localStorage.setItem('chat_history_' + contactId, html); } catch (e2) {}
            }
        }
    }
}

// ========== 恢复红包卡片状态 ==========
function restorePaymentCardStates() {
    var cards = document.querySelectorAll('.payment-card[data-msg-id]');
    cards.forEach(function(card) {
        var msgId = card.getAttribute('data-msg-id');
        var state = getPaymentState(msgId);
        if (state === 'accepted') {
            var label = card.querySelector('.payment-status-label');
            var amountHidden = card.querySelector('.payment-amount-hidden');
            var noteText = card.querySelector('.payment-note-text');
            if (label) { label.textContent = '已接收'; label.style.display = 'block'; label.style.color = '#34c759'; }
            if (amountHidden) { amountHidden.style.display = 'block'; }
            if (noteText) noteText.style.display = 'none';
        } else if (state === 'refunded') {
            var label = card.querySelector('.payment-status-label');
            var noteText = card.querySelector('.payment-note-text');
            if (label) { label.textContent = '已退还'; label.style.display = 'block'; label.style.color = '#ff3b30'; }
            if (noteText) noteText.style.display = 'none';
        }
    });
}

// ========== 语音 TTS 调用（MiniMax） ==========
async function callTTS(text) {
    const groupId = localStorage.getItem('voice_group_id');
    const apiKey = localStorage.getItem('voice_api_key');
    const voiceId = localStorage.getItem('voice_voice_id') || 'male-qn-qingse';

    if (!groupId || !apiKey) return null;

    try {
        const response = await fetch('https://api.minimax.chat/v1/t2a_v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: 'speech-01',
                text: text,
                voice_setting: {
                    voice_id: voiceId,
                    speed: 1.0,
                    vol: 1.0,
                    pitch: 0
                },
                audio_setting: {
                    sample_rate: 16000,
                    format: 'mp3'
                }
            })
        });

        const data = await response.json();
        if (data.audio && data.audio.audio_data) {
            return 'data:audio/mp3;base64,' + data.audio.audio_data;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ========== 检查是否配置了语音API ==========
function hasVoiceAPI() {
    const groupId = localStorage.getItem('voice_group_id');
    const apiKey = localStorage.getItem('voice_api_key');
    return !!(groupId && apiKey);
}

// ========== 角色发语音 ==========
async function sendBotVoice(text) {
    if (hasVoiceAPI()) {
        const voiceUrl = await callTTS(text);
        if (voiceUrl) {
            sendVoiceBubble('assistant', text, voiceUrl, true);
            return;
        }
    }
    sendVoiceBubble('assistant', text, null, false);
}

// ========== 自动发消息系统 ==========
window._autoMsgTimer = null;
window._autoMsgLastContact = null;

function startAutoMsg() {
    stopAutoMsg();
    const settings = window.ChatConfig?.settings;
    if (!settings || !settings.autoMsg) return;
    const freqVal = settings.autoMsgFreq || 0;
    const intervals = [3600000, 18000000, 36000000, 86400000];
    const interval = intervals[freqVal] || 3600000;
    window._autoMsgTimer = setInterval(() => { triggerAutoMsg(); }, interval);
    setTimeout(() => { triggerAutoMsg(); }, 10000);
}

function stopAutoMsg() {
    if (window._autoMsgTimer) { clearInterval(window._autoMsgTimer); window._autoMsgTimer = null; }
}

async function triggerAutoMsg() {
    if (window.ChatState?.isAITyping) return;
    const contactId = window._autoMsgLastContact || getRandomContactId();
    if (!contactId) return;
    window._autoMsgLastContact = contactId;
    const contact = getContactById(contactId);
    if (!contact) return;
    const systemPrompt = buildSystemPrompt(contactId);
    const autoPrompts = [
        '（突然想起一件事，想跟对方说）',
        '（刚刚发生了点事，想分享给对方）',
        '（闲着没事，想找对方聊聊天）',
        '（有点无聊，主动发个消息）',
        '（看到有趣的东西，想告诉对方）',
        '（想关心一下对方在做什么）'
    ];
    const prompt = autoPrompts[Math.floor(Math.random() * autoPrompts.length)];
    try {
        const reply = await callChatAPI([{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]);
        const cleanReply = reply.replace(/\{[^}]*\}/g, '').trim();
        saveAutoMsgToHistory(contactId, contact.name, reply);
        addUnreadCount(contactId);
        if (window.ChatConfig?.contacts) {
            const c = window.ChatConfig.contacts.find(c => c.id === contactId);
            if (c) { c.preview = cleanReply.substring(0, 30); saveContactsToStorage(); }
        }
        showAutoMsgNotification(contact.name, contactId, cleanReply);
        if (typeof renderChatList === 'function') {
            const listView = document.getElementById('chatListView');
            if (listView && listView.offsetParent !== null) { renderChatList(); }
        }
    } catch (e) {}
}

function getRandomContactId() {
    const contacts = window.ChatConfig?.contacts;
    if (!contacts || contacts.length === 0) return null;
    return contacts[Math.floor(Math.random() * contacts.length)].id;
}

function saveAutoMsgToHistory(contactId, contactName, rawContent) {
    const storageKey = 'chat_history_' + contactId;
    const saved = localStorage.getItem(storageKey);
    let container;
    if (saved) { container = document.createElement('div'); container.innerHTML = saved; }
    const now = new Date();
    const h = now.getHours(); const m = now.getMinutes().toString().padStart(2, '0');
    const period = h < 12 ? '上午' : '下午'; const displayH = h % 12 || 12;
    const timeStr = period + ' ' + displayH + ':' + m;
    let cleanContent = rawContent.replace(/\{[^}]*\}/g, '').trim();
    let htmlToAdd = '<div class="chat-time-stamp">' + timeStr + '</div>';
    const parts = cleanContent.split(/\n{2,}/).filter(p => p.trim());
    parts.forEach(part => {
        htmlToAdd += '<div class="bubble-row assistant" data-role="assistant"><div class="bubble-avatar bot-avatar">' + (contactName.charAt(0) || 'AI') + '</div><div class="bubble bubble-assistant">' + part.trim() + '</div></div>';
    });
    if (saved && container) { container.innerHTML += htmlToAdd; localStorage.setItem(storageKey, container.innerHTML); }
    else { const newContainer = document.createElement('div'); newContainer.innerHTML = htmlToAdd; localStorage.setItem(storageKey, newContainer.innerHTML); }
    if (window.ChatConfig?.contacts) {
        const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
        if (contact) { contact.preview = cleanContent.substring(0, 30); saveContactsToStorage(); }
    }
}

// ========== 未读消息计数 ==========
function getUnreadCount(contactId) { const raw = localStorage.getItem('unread_' + contactId); return raw ? parseInt(raw) : 0; }
function addUnreadCount(contactId) { const count = getUnreadCount(contactId) + 1; localStorage.setItem('unread_' + contactId, count); return count; }
function clearUnreadCount(contactId) { localStorage.removeItem('unread_' + contactId); }

// ========== 通知弹窗 ==========
function showAutoMsgNotification(contactName, contactId, message) {
    const existing = document.getElementById('autoMsgNotification');
    if (existing) existing.remove();
    let line1 = ''; let line2 = ''; const maxChars = 22;
    if (message.length <= maxChars) { line1 = message; }
    else { line1 = message.substring(0, maxChars); const remaining = message.substring(maxChars); if (remaining.length > maxChars) { line2 = remaining.substring(0, maxChars) + '...'; } else { line2 = remaining; } }
    const noti = document.createElement('div');
    noti.id = 'autoMsgNotification'; noti.className = 'auto-msg-notification';
    noti.innerHTML = '<div class="auto-msg-noti-avatar">' + contactName.charAt(0) + '</div><div class="auto-msg-noti-body"><div class="auto-msg-noti-name">' + contactName + '</div><div class="auto-msg-noti-text">' + line1 + '</div>' + (line2 ? '<div class="auto-msg-noti-text">' + line2 + '</div>' : '') + '</div>';
    noti.onclick = function() { noti.remove(); clearUnreadCount(contactId); if (typeof openChat === 'function') openChat(); setTimeout(function() { if (typeof enterChat === 'function') enterChat(contactId); }, 300); };
    document.body.appendChild(noti);
    setTimeout(function() { if (noti.parentNode) { noti.style.opacity = '0'; noti.style.transform = 'translateY(-20px)'; setTimeout(function() { if (noti.parentNode) noti.remove(); }, 300); } }, 4000);
}

// ========== 自动发动态系统 ==========
window._autoMomentTimers = {};

function startAutoMoment(contactId) {
    stopAutoMoment(contactId);
    var enabled = getContactSetting(contactId, 'autoMoment', false);
    if (!enabled) return;
    var freqVal = parseInt(getContactSetting(contactId, 'autoMomentFreq', '0'));
    var intervals = [43200000, 86400000, 129600000, 172800000];
    var interval = intervals[freqVal] || 43200000;
    window._autoMomentTimers[contactId] = setInterval(function() { triggerAutoMoment(contactId); }, interval);
    setTimeout(function() { triggerAutoMoment(contactId); }, 30000);
}

function stopAutoMoment(contactId) {
    if (window._autoMomentTimers[contactId]) { clearInterval(window._autoMomentTimers[contactId]); delete window._autoMomentTimers[contactId]; }
}

async function triggerAutoMoment(contactId) {
    var contact = getContactById(contactId);
    if (!contact) return;
    var systemPrompt = buildSystemPrompt(contactId);
    var momentPrompt = getRandomMomentPrompt(contact);
    try {
        var reply = await callChatAPI([{ role: 'system', content: systemPrompt }, { role: 'user', content: momentPrompt }]);
        var cleanContent = reply.replace(/\{[^}]*\}/g, '').trim();
        if (!cleanContent) return;
        var newMoment = { id: 'm_auto_' + Date.now(), userName: contact.name, userAvatar: contact.avatar, text: cleanContent, images: [], time: getRelativeTimeForMoment(Date.now()), location: '', likes: 0, comments: [], liked: false };
        var raw = localStorage.getItem('moments_data');
        var momentsData = raw ? JSON.parse(raw) : [];
        momentsData.unshift(newMoment);
        localStorage.setItem('moments_data', JSON.stringify(momentsData));
    } catch(e) {}
}

function getRandomMomentPrompt(contact) {
    var prompts = ['（分享一件今天发生的小事，发一条朋友圈）', '（突然有感而发，想发一条动态）', '（看到了有趣的东西，想分享到朋友圈）', '（心情不错，发一条动态表达一下）', '（夜深了，有些感慨想发出来）', '（最近发生了一些事，想在朋友圈说说）', '（随手发一条日常动态）', '（想分享一下此刻的心情）'];
    if (contact.persona && contact.persona.indexOf('内向') >= 0) { prompts = ['（夜深人静时，有了一些感悟，想发一条仅自己可见的动态）', '（偶尔想分享一下心情，但不想太多人看到）', '（有些话想说，发一条私密动态吧）']; }
    return prompts[Math.floor(Math.random() * prompts.length)];
}

function getRelativeTimeForMoment(timestamp) { var d = new Date(timestamp); return (d.getMonth() + 1) + '.' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'); }

// ========== 生成聊天总结 ==========
async function generateSummary(contactId) {
    var historyMessages = getRecentHistory(contactId, 100);
    if (historyMessages.length === 0) {
        return null;
    }

    var contact = getContactById(contactId);
    var contactName = contact ? contact.name : 'AI';

    var chatContent = '';
    historyMessages.forEach(function(m) {
        var roleName = m.role === 'user' ? '用户' : contactName;
        chatContent += roleName + '：' + m.content + '\n';
    });

    var summaryPrompt = '请根据以下聊天记录，用简练的中文总结今天发生的重要事件、对话要点、情感变化。以旁白口吻写，不超过200字。\n\n' + chatContent;

    try {
        var reply = await callChatAPI([
            { role: 'system', content: '你是一个擅长总结对话的助手。用简洁优美的中文总结，不要添加额外评论。' },
            { role: 'user', content: summaryPrompt }
        ]);
        return reply.replace(/\{[^}]*\}/g, '').trim();
    } catch (e) {
        return null;
    }
}

// ========== 生成角色日记 ==========
async function generateDiaryContent(contactId) {
    var contact = getContactById(contactId);
    if (!contact) return null;
    var contactName = contact.name || 'AI';

    var systemPrompt = buildSystemPrompt(contactId);

    var historyMessages = getRecentHistory(contactId, 50);
    var chatContent = '';
    historyMessages.forEach(function(m) {
        var roleName = m.role === 'user' ? '用户' : contactName;
        chatContent += roleName + '：' + m.content + '\n';
    });

    if (!chatContent.trim()) {
        chatContent = '今天还没有对话记录。';
    }

    var diaryPrompt = '请以' + contactName + '的口吻，根据今天的聊天记录写一篇日记。使用第一人称"我"。内容包含今天发生的事、心情变化、对用户的感受。语气自然，像真人写的日记。150字以内。\n\n' + chatContent;

    try {
        var reply = await callChatAPI([
            { role: 'system', content: systemPrompt + '\n\n你现在要写一篇日记。用自然的口吻写，不要加JSON状态信息，不要加旁白括号。150字以内。' },
            { role: 'user', content: diaryPrompt }
        ]);
        var cleanReply = reply.replace(/\{[^}]*\}/g, '').trim();
        return cleanReply || null;
    } catch (e) {
        return null;
    }
}
