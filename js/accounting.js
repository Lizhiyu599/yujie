/**
 * 玉界 - 记账软件
 * 包含：对话列表、iMessage聊天、账单详情、账本管理
 */

var acCurrentTab = 'home';
var acCurrentContactId = null;
var acCurrentBookType = null;
var acMessages = {};

// ========== 打开/关闭 ==========
function openAccounting() {
    var appWindow = document.getElementById('accountingAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'accountingAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    acCurrentTab = 'home';
    acCurrentContactId = null;
    renderAccounting();
    appWindow.style.display = 'flex';
}

function closeAccounting() {
    var appWindow = document.getElementById('accountingAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 获取联系人 ==========
function getACContacts() {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    // 过滤掉测试小助手
    return contacts.filter(function(c) { return c.id !== 'c1'; });
}

// ========== 获取聊天记录 ==========
function getACMessages(contactId) {
    if (!acMessages[contactId]) acMessages[contactId] = [];
    return acMessages[contactId];
}

function saveACMessage(contactId, role, text) {
    if (!acMessages[contactId]) acMessages[contactId] = [];
    acMessages[contactId].push({ role: role, text: text, time: Date.now() });
}

// ========== 主渲染 ==========
function renderAccounting() {
    var appWindow = document.getElementById('accountingAppWindow');
    if (!appWindow) return;

    var title = acCurrentTab === 'home' ? '记账' : '账本';
    if (acCurrentContactId && acCurrentTab === 'home') {
        var contact = getACContacts().find(function(c) { return c.id === acCurrentContactId; });
        title = contact ? contact.name : '记账';
    }

    appWindow.innerHTML = ''
        + '<div class="accounting-app">'
        + '<div class="ac-nav">'
        + '<div class="ac-nav-back" onclick="acGoBack()">‹</div>'
        + '<div class="ac-nav-title">' + title + '</div>'
        + '<div class="ac-nav-spacer"></div>'
        + '</div>'
        + '<div class="ac-body" id="acBody">' + renderACBody() + '</div>'
        + '<div class="ac-tab-bar">'
        + '<span class="ac-tab ' + (acCurrentTab === 'home' ? 'active' : '') + '" onclick="switchACTab(\'home\')">首页</span>'
        + '<span class="ac-tab ' + (acCurrentTab === 'book' ? 'active' : '') + '" onclick="switchACTab(\'book\')">记账</span>'
        + '</div>'
        + '</div>';
}

function acGoBack() {
    if (acCurrentContactId && acCurrentTab === 'home') {
        acCurrentContactId = null;
        renderAccounting();
    } else {
        closeAccounting();
    }
}

function switchACTab(tab) {
    acCurrentTab = tab;
    acCurrentContactId = null;
    renderAccounting();
}

function renderACBody() {
    if (acCurrentTab === 'home') {
        if (acCurrentContactId) {
            return renderChatPage();
        }
        return renderChatList();
    }
    return renderBookPage();
}

// ========== 对话列表 ==========
function renderChatList() {
    var contacts = getACContacts();
    if (contacts.length === 0) {
        return '<div class="ac-empty">暂无角色，请先在聊天软件中添加</div>';
    }
    var html = '<div class="ac-chat-list">';
    contacts.forEach(function(c) {
        var avatarHTML = c.avatarData 
            ? '<div class="ac-chat-avatar" style="background-image:url(' + c.avatarData + ');"></div>'
            : '<div class="ac-chat-avatar">' + c.name.charAt(0) + '</div>';
        var msgs = getACMessages(c.id);
        var preview = msgs.length > 0 ? msgs[msgs.length - 1].text : '开始记账吧';
        html += ''
            + '<div class="ac-chat-item" onclick="enterACChat(\'' + c.id + '\')">'
            + avatarHTML
            + '<div class="ac-chat-info">'
            + '<div class="ac-chat-name">' + c.name + '</div>'
            + '<div class="ac-chat-preview">' + preview + '</div>'
            + '</div>'
            + '<div class="ac-chat-arrow">›</div>'
            + '</div>';
    });
    html += '</div>';
    return html;
}

function enterACChat(contactId) {
    acCurrentContactId = contactId;
    renderAccounting();
}

// ========== iMessage聊天页 ==========
function renderChatPage() {
    var contact = getACContacts().find(function(c) { return c.id === acCurrentContactId; });
    if (!contact) return '<div class="ac-empty">角色不存在</div>';
    
    var msgs = getACMessages(acCurrentContactId);
    var msgsHTML = '';
    if (msgs.length === 0) {
        msgsHTML = '<div style="text-align:center;color:#c7c7cc;font-size:13px;padding-top:20px;">开始记账吧</div>';
    } else {
        msgs.forEach(function(m) {
            if (m.role === 'user') {
                msgsHTML += '<div class="ac-msg-row user"><div class="ac-bubble user">' + m.text + '</div></div>';
            } else if (m.role === 'assistant') {
                msgsHTML += '<div class="ac-msg-row assistant"><div class="ac-bubble assistant">' + m.text + '</div></div>';
            } else if (m.role === 'bill-link') {
                msgsHTML += '<div class="ac-row-nav" onclick="openBillDetail(\'' + acCurrentContactId + '\', ' + m.index + ')">' + m.text + ' ›</div>';
            }
        });
    }
    
    return ''
        + '<div class="ac-chat-messages" id="acChatMessages">' + msgsHTML + '</div>'
        + '<div class="ac-chat-input-bar">'
        + '<input type="text" class="ac-chat-input" id="acChatInput" placeholder="请输入花销收入…" onkeypress="if(event.key===\'Enter\')sendACMessage()">'
        + '<span class="ac-send-btn" onclick="sendACMessage()">'
        + '<svg width="20" height="20" viewBox="0 0 24 24" fill="#007AFF" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'
        + '</span>'
        + '</div>';
}

// ========== 发送消息 & AI回复 ==========
function sendACMessage() {
    var input = document.getElementById('acChatInput');
    if (!input || !input.value.trim()) return;
    if (!acCurrentContactId) return;
    
    var text = input.value.trim();
    input.value = '';
    
    saveACMessage(acCurrentContactId, 'user', text);
    renderChatMessages();
    
    // 调用AI分类回复
    callACAI(text);
}

function renderChatMessages() {
    var container = document.getElementById('acChatMessages');
    if (!container) return;
    
    var msgs = getACMessages(acCurrentContactId);
    var html = '';
    msgs.forEach(function(m) {
        if (m.role === 'user') {
            html += '<div class="ac-msg-row user"><div class="ac-bubble user">' + m.text + '</div></div>';
        } else if (m.role === 'assistant') {
            html += '<div class="ac-msg-row assistant"><div class="ac-bubble assistant">' + m.text + '</div></div>';
        } else if (m.role === 'bill-link') {
            html += '<div class="ac-row-nav" onclick="openBillDetail(\'' + acCurrentContactId + '\', ' + m.index + ')">' + m.text + ' ›</div>';
        }
    });
    container.innerHTML = html || '<div style="text-align:center;color:#c7c7cc;font-size:13px;padding-top:20px;">开始记账吧</div>';
    container.scrollTop = container.scrollHeight;
}

function buildAccountingPrompt(contactId) {
    var contact = getACContacts().find(function(c) { return c.id === contactId; });
    var persona = contact ? (contact.persona || '') : '';
    var worldbookPrompt = typeof getFullSystemPrompt === 'function' ? getFullSystemPrompt() : '';
    
    var prompt = '【记账软件·角色扮演】\n';
    prompt += '你是一个记账助手，同时也是用户创建的角色。\n';
    if (persona) prompt += '【你的角色人设】\n' + persona + '\n';
    if (worldbookPrompt) prompt += '\n【万象树规则】\n' + worldbookPrompt + '\n';
    
    prompt += '\n【记账规则】\n';
    prompt += '1. 用户发来消费或收入信息时，你需要：\n';
    prompt += '   - 先用人设口吻简短回应（不超过20字，不超过3句话）\n';
    prompt += '   - 然后自动分类，格式：>分类/备注 -金额¥\n';
    prompt += '   - 支出金额前加"-"，收入金额前加"+"\n';
    prompt += '2. 如果用户没有说明具体金额或分类，你可以根据上下文推测\n';
    prompt += '3. 分类可选：餐饮、购物、交通、居家、娱乐、医疗、学习、办公、育儿、人情往来、职业收入、经营收入、保险理财、资金往来、二手买卖、生活费、投股、其他\n';
    prompt += '4. 家庭账本模式下，你也可以主动汇报自己的支出收入\n';
    prompt += '5. 绝对禁止使用emoji表情符号\n';
    prompt += '6. 禁止使用旁白括号()\n';
    
    return prompt;
}

function callACAI(userText) {
    var contact = getACContacts().find(function(c) { return c.id === acCurrentContactId; });
    var contactName = contact ? contact.name : '记账助手';
    
    var systemPrompt = buildAccountingPrompt(acCurrentContactId);
    var msgs = getACMessages(acCurrentContactId);
    var historyMessages = [];
    for (var i = Math.max(0, msgs.length - 10); i < msgs.length - 1; i++) {
        var m = msgs[i];
        if (m.role !== 'bill-link') {
            historyMessages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
        }
    }
    
    var allMessages = [{ role: 'system', content: systemPrompt }];
    historyMessages.forEach(function(m) { allMessages.push(m); });
    allMessages.push({ role: 'user', content: userText });
    
    if (typeof callChatAPI !== 'function') {
        mockACReply(userText, contactName);
        return;
    }
    
    callChatAPI(allMessages).then(function(reply) {
        processACReply(reply, contactName);
    }).catch(function() {
        mockACReply(userText, contactName);
    });
}

function processACReply(reply, contactName) {
    var cleanReply = reply.replace(/\{[^}]*\}/g, '').trim();
    cleanReply = cleanReply.replace(/[\(\（][^\)\）]*[\)\）]/g, '').trim();
    
    // 分离对话和分类行
    var lines = cleanReply.split('\n');
    var chatLines = [];
    var billLine = '';
    
    lines.forEach(function(line) {
        line = line.trim();
        if (!line) return;
        if (line.indexOf('>') === 0 || line.match(/^[>\-\+]/)) {
            billLine = line;
        } else {
            chatLines.push(line);
        }
    });
    
    // 限制3句话
    chatLines = chatLines.slice(0, 3);
    
    // 发送角色回复
    chatLines.forEach(function(l) {
        if (l.length > 20) l = l.substring(0, 20);
        saveACMessage(acCurrentContactId, 'assistant', l);
    });
    
    // 发送分类行项导航
    if (billLine) {
        var msgs = getACMessages(acCurrentContactId);
        saveACMessage(acCurrentContactId, 'bill-link', billLine);
    }
    
    renderChatMessages();
}

function mockACReply(userText, contactName) {
    // 无API时的模拟回复
    var amountMatch = userText.match(/(\d+\.?\d*)\s*元?/);
    var amount = amountMatch ? amountMatch[1] : '?';
    var isIncome = userText.indexOf('收入') >= 0 || userText.indexOf('工资') >= 0 || userText.indexOf('收到') >= 0;
    
    saveACMessage(acCurrentContactId, 'assistant', '嗯，已记录');
    saveACMessage(acCurrentContactId, 'bill-link', '>其他/' + (isIncome ? '+' : '-') + amount + '¥');
    renderChatMessages();
}

// ========== 记账 ==========
function renderBookPage() {
    return '<div class="ac-empty">记账功能开发中...</div>';
}

// ========== 账单详情页 ==========
function openBillDetail(contactId, msgIndex) {
    var msgs = getACMessages(contactId);
    if (!msgs[msgIndex]) return;
    
    var billText = msgs[msgIndex].text;
    var contact = getACContacts().find(function(c) { return c.id === contactId; });
    var contactName = contact ? contact.name : '记账助手';
    
    // 解析 >分类/备注 -金额¥ 或 +金额¥
    var parts = billText.replace('>', '').split('/');
    var category = parts[0] || '其他';
    var rest = parts[1] || '';
    var amountMatch = rest.match(/([\-\+]?\d+\.?\d*)/);
    var amount = amountMatch ? amountMatch[1] : '0';
    var isExpense = amount.indexOf('-') >= 0;
    var absAmount = amount.replace(/[\-\+]/g, '');
    var note = rest.replace(amount, '').replace(/[¥\-\+]/g, '').trim() || category;
    
    var now = new Date();
    var timeStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    var appWindow = document.getElementById('accountingAppWindow');
    if (!appWindow) return;
    
    appWindow.innerHTML = ''
        + '<div class="accounting-app">'
        + '<div class="ac-bill-header">'
        + '<div class="ac-nav-back" onclick="renderAccounting()">‹</div>'
        + '<div style="font-size:17px;font-weight:600;color:#000;">账单详情</div>'
        + '<div style="width:36px;"></div>'
        + '</div>'
        + '<div class="ac-bill-page">'
        + '<div class="ac-bill-merchant">' + note + '</div>'
        + '<div class="ac-bill-amount ' + (isExpense ? 'expense' : 'income') + '">' + (isExpense ? '-' : '+') + '¥' + absAmount + '</div>'
        + '<div class="ac-bill-detail-list">'
        + '<div class="ac-bill-row"><span class="ac-bill-label">当前状态</span><span class="ac-bill-value">支付成功</span></div>'
        + '<div class="ac-bill-row"><span class="ac-bill-label">支付时间</span><span class="ac-bill-value">' + timeStr + '</span></div>'
        + '<div class="ac-bill-row"><span class="ac-bill-label">商品/备注</span><span class="ac-bill-value">' + note + '</span></div>'
        + '<div class="ac-bill-row"><span class="ac-bill-label">收单机构</span><span class="ac-bill-value">' + contactName + '</span></div>'
        + '<div class="ac-bill-row"><span class="ac-bill-label">支付方式</span><span class="ac-bill-value">零钱</span></div>'
        + '<div class="ac-bill-row"><span class="ac-bill-label">交易分类</span><span class="ac-bill-value">' + category + '</span></div>'
        + '</div>'
        + '</div>'
        + '</div>';
         }
