/**
 * 玉界 - 记账软件
 * 独立模块，不依赖聊天软件
 */

var _acTab = 'home';
var _acContactId = null;
var _acMessages = {};

// ========== 打开/关闭 ==========
function openAccounting() {
    var appWindow = document.getElementById('accountingAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'accountingAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    _acTab = 'home';
    _acContactId = null;
    _acRender();
    appWindow.style.display = 'flex';
}

function closeAccounting() {
    var appWindow = document.getElementById('accountingAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 获取联系人 ==========
function _acGetContacts() {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    return contacts.filter(function(c) { return c.id !== 'c1'; });
}

function _acGetMsgs(contactId) {
    if (!_acMessages[contactId]) _acMessages[contactId] = [];
    return _acMessages[contactId];
}

function _acSaveMsg(contactId, role, text) {
    if (!_acMessages[contactId]) _acMessages[contactId] = [];
    _acMessages[contactId].push({ role: role, text: text, time: Date.now() });
}

// ========== 主渲染 ==========
function _acRender() {
    var appWindow = document.getElementById('accountingAppWindow');
    if (!appWindow) return;

    var title = _acTab === 'home' ? '记账' : '账本';
    if (_acContactId && _acTab === 'home') {
        var contact = _acGetContacts().find(function(c) { return c.id === _acContactId; });
        title = contact ? contact.name : '记账';
    }

    var tabBarHTML = _acContactId ? '' : ''
        + '<div class="ac-tab-bar">'
        + '<span class="ac-tab ' + (_acTab === 'home' ? 'active' : '') + '" onclick="_acSwitchTab(\'home\')">首页</span>'
        + '<span class="ac-tab ' + (_acTab === 'book' ? 'active' : '') + '" onclick="_acSwitchTab(\'book\')">记账</span>'
        + '</div>';

    appWindow.innerHTML = ''
        + '<div class="accounting-app">'
        + '<div class="ac-nav">'
        + '<div class="ac-nav-back" onclick="_acGoBack()">‹</div>'
        + '<div class="ac-nav-title">' + title + '</div>'
        + '<div class="ac-nav-spacer"></div>'
        + '</div>'
        + _acRenderBody()
        + tabBarHTML
        + '</div>';
}

function _acGoBack() {
    if (_acContactId && _acTab === 'home') {
        _acContactId = null;
        _acRender();
    } else {
        closeAccounting();
    }
}

function _acSwitchTab(tab) {
    _acTab = tab;
    _acContactId = null;
    _acRender();
}

function _acRenderBody() {
    if (_acTab === 'home') {
        if (_acContactId) return _acRenderChat();
        return _acRenderList();
    }
    return _acRenderBook();
}

// ========== 对话列表 ==========
function _acRenderList() {
    var contacts = _acGetContacts();
    if (contacts.length === 0) {
        return '<div class="ac-empty">暂无角色，请先在聊天软件中添加</div>';
    }
    var html = '<div class="ac-body"><div class="ac-chat-list">';
    contacts.forEach(function(c) {
        var avatarHTML = c.avatarData 
            ? '<div class="ac-chat-avatar" style="background-image:url(' + c.avatarData + ');"></div>'
            : '<div class="ac-chat-avatar">' + c.name.charAt(0) + '</div>';
        var msgs = _acGetMsgs(c.id);
        var preview = msgs.length > 0 ? msgs[msgs.length - 1].text : '开始记账吧';
        html += ''
            + '<div class="ac-chat-item" onclick="_acEnterChat(\'' + c.id + '\')">'
            + avatarHTML
            + '<div class="ac-chat-info">'
            + '<div class="ac-chat-name">' + c.name + '</div>'
            + '<div class="ac-chat-preview">' + preview + '</div>'
            + '</div>'
            + '<div class="ac-chat-arrow">›</div>'
            + '</div>';
    });
    html += '</div></div>';
    return html;
}

function _acEnterChat(contactId) {
    _acContactId = contactId;
    _acRender();
}

// ========== iMessage聊天页 ==========
function _acRenderChat() {
    var contact = _acGetContacts().find(function(c) { return c.id === _acContactId; });
    if (!contact) return '<div class="ac-empty">角色不存在</div>';
    
    var msgs = _acGetMsgs(_acContactId);
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
                msgsHTML += '<div class="ac-bill-row-nav" onclick="_acOpenBill(\'' + _acContactId + '\', ' + m.index + ')">' + m.text + ' ›</div>';
            }
        });
    }
    
    return ''
        + '<div class="ac-chat-shell">'
        + '<div class="ac-chat-messages" id="acChatMessages">' + msgsHTML + '</div>'
        + '<div class="ac-chat-input-bar">'
        + '<input type="text" class="ac-chat-input" id="acChatInput" placeholder="请输入花销收入…" onkeypress="if(event.key===\'Enter\')_acSendMsg()">'
        + '<span class="ac-send-btn" onclick="_acSendMsg()">'
        + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'
        + '</span>'
        + '</div>'
        + '</div>';
}

// ========== 发送消息 ==========
function _acSendMsg() {
    var input = document.getElementById('acChatInput');
    if (!input || !input.value.trim()) return;
    if (!_acContactId) return;
    
    var text = input.value.trim();
    input.value = '';
    
    _acSaveMsg(_acContactId, 'user', text);
    _acRefreshChat();
    
    _acMockReply(text);
}

function _acRefreshChat() {
    var container = document.getElementById('acChatMessages');
    if (!container) return;
    
    var msgs = _acGetMsgs(_acContactId);
    var html = '';
    msgs.forEach(function(m) {
        if (m.role === 'user') {
            html += '<div class="ac-msg-row user"><div class="ac-bubble user">' + m.text + '</div></div>';
        } else if (m.role === 'assistant') {
            html += '<div class="ac-msg-row assistant"><div class="ac-bubble assistant">' + m.text + '</div></div>';
        } else if (m.role === 'bill-link') {
            html += '<div class="ac-bill-row-nav" onclick="_acOpenBill(\'' + _acContactId + '\', ' + m.index + ')">' + m.text + ' ›</div>';
        }
    });
    container.innerHTML = html || '<div style="text-align:center;color:#c7c7cc;font-size:13px;padding-top:20px;">开始记账吧</div>';
    container.scrollTop = container.scrollHeight;
}

function _acMockReply(userText) {
    // 有API就用API，没API用模拟
    if (typeof callChatAPI !== 'function') {
        _acFallbackReply(userText);
        return;
    }
    
    var contact = _acGetContacts().find(function(c) { return c.id === _acContactId; });
    var contactName = contact ? contact.name : '记账助手';
    
    // 构建系统提示
    var persona = contact ? (contact.persona || '') : '';
    var worldbookPrompt = typeof getFullSystemPrompt === 'function' ? getFullSystemPrompt() : '';
    var systemPrompt = '【记账助手】你是' + contactName + '。\n';
    if (persona) systemPrompt += '人设：' + persona + '\n';
    if (worldbookPrompt) systemPrompt += '规则：' + worldbookPrompt + '\n';
    systemPrompt += '用户发来消费或收入，你用人设口吻回应（不超20字，不超3句），然后自动分类格式：>分类/备注 -金额¥（支出）或 >分类/备注 +金额¥（收入）。禁用emoji和旁白括号。分类：餐饮/购物/交通/居家/娱乐/医疗/学习/办公/育儿/人情往来/职业收入/经营收入/保险理财/资金往来/二手买卖/生活费/投股/其他。';
    
    var msgs = _acGetMsgs(_acContactId);
    var history = [];
    for (var i = Math.max(0, msgs.length - 10); i < msgs.length - 1; i++) {
        var m = msgs[i];
        if (m.role !== 'bill-link') {
            history.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
        }
    }
    
    callChatAPI([
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userText }
    ]).then(function(reply) {
        var clean = reply.replace(/\{[^}]*\}/g, '').replace(/[\(\（][^\)\）]*[\)\）]/g, '').trim();
        var lines = clean.split('\n');
        var chatLines = [];
        var billLine = '';
        lines.forEach(function(l) {
            l = l.trim();
            if (!l) return;
            if (l.indexOf('>') === 0 || l.match(/^[>\-\+]/)) billLine = l;
            else chatLines.push(l);
        });
        chatLines = chatLines.slice(0, 3);
        chatLines.forEach(function(l) {
            if (l.length > 20) l = l.substring(0, 20);
            _acSaveMsg(_acContactId, 'assistant', l);
        });
        if (billLine) _acSaveMsg(_acContactId, 'bill-link', billLine);
        _acRefreshChat();
    }).catch(function() {
        _acFallbackReply(userText);
    });
}

function _acFallbackReply(userText) {
    var amountMatch = userText.match(/(\d+\.?\d*)/);
    var amount = amountMatch ? amountMatch[1] : '?';
    var isIncome = userText.indexOf('收入') >= 0 || userText.indexOf('工资') >= 0 || userText.indexOf('收到') >= 0;
    _acSaveMsg(_acContactId, 'assistant', '嗯，已记录');
    _acSaveMsg(_acContactId, 'bill-link', '>其他/' + (isIncome ? '+' : '-') + amount + '¥');
    _acRefreshChat();
}

// ========== 账单详情 ==========
function _acOpenBill(contactId, msgIndex) {
    var msgs = _acGetMsgs(contactId);
    if (!msgs[msgIndex]) return;
    
    var billText = msgs[msgIndex].text;
    var contact = _acGetContacts().find(function(c) { return c.id === contactId; });
    var contactName = contact ? contact.name : '记账助手';
    
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
        + '<div class="ac-nav-back" onclick="_acRender()">‹</div>'
        + '<div style="font-size:17px;font-weight:600;color:#000;">账单详情</div>'
        + '<div style="width:36px;"></div>'
        + '</div>'
        + '<div class="ac-bill-page">'
        + '<div class="ac-bill-merchant">' + note + '</div>'
        + '<div class="ac-bill-amount">' + (isExpense ? '-' : '+') + '¥' + absAmount + '</div>'
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

// ========== 记账标签页 ==========
function _acRenderBook() {
    return '<div class="ac-body"><div class="ac-empty">记账功能开发中...</div></div>';
        }
