/**
 * 玉界 - 记账软件
 * 包含：角色选择、记账聊天、账单详情、账本管理
 */

var acCurrentTab = 'home';
var acCurrentContactId = null;
var acCurrentBookType = null;

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
    renderAccounting();
    appWindow.style.display = 'flex';
}

function closeAccounting() {
    var appWindow = document.getElementById('accountingAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 主渲染 ==========
function renderAccounting() {
    var appWindow = document.getElementById('accountingAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = ''
        + '<div class="accounting-app">'
        + '<div class="ac-nav">'
        + '<div class="ac-nav-back" onclick="closeAccounting()">‹</div>'
        + '<div class="ac-nav-title">' + (acCurrentTab === 'home' ? '首页' : '记账') + '</div>'
        + '<div class="ac-nav-spacer"></div>'
        + '</div>'
        + '<div class="ac-body" id="acBody">' + renderACBody() + '</div>'
        + '<div class="ac-tab-bar">'
        + '<span class="ac-tab ' + (acCurrentTab === 'home' ? 'active' : '') + '" onclick="switchACTab(\'home\')">首页</span>'
        + '<span class="ac-tab ' + (acCurrentTab === 'book' ? 'active' : '') + '" onclick="switchACTab(\'book\')">记账</span>'
        + '</div>'
        + '</div>';
}

function switchACTab(tab) {
    acCurrentTab = tab;
    renderAccounting();
}

function renderACBody() {
    if (acCurrentTab === 'home') {
        return renderHomePage();
    }
    return renderBookPage();
}

// ========== 首页 ==========
function renderHomePage() {
    if (acCurrentContactId) {
        return renderChatPage();
    }
    return renderContactSelect();
}

function renderContactSelect() {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var html = '<div style="padding:20px 0;">';
    html += '<div style="font-size:15px;font-weight:600;color:#000;margin-bottom:12px;">请选择角色</div>';
    
    if (contacts.length === 0) {
        html += '<div class="ac-select-btn" onclick="enterAccountingChat(null)" style="padding:14px;background:#000;color:#fff;border-radius:12px;text-align:center;cursor:pointer;font-size:15px;">直接进入</div>';
    } else {
        contacts.forEach(function(c) {
            html += '<div class="ac-select-btn" onclick="enterAccountingChat(\'' + c.id + '\')" style="padding:14px;background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:12px;margin-bottom:8px;cursor:pointer;font-size:15px;color:#000;">' + c.name + '</div>';
        });
    }
    
    html += '</div>';
    return html;
}

function enterAccountingChat(contactId) {
    acCurrentContactId = contactId;
    renderAccounting();
}

function renderChatPage() {
    var contact = null;
    if (acCurrentContactId) {
        var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
        contact = contacts.find(function(c) { return c.id === acCurrentContactId; });
    }
    var contactName = contact ? contact.name : '记账助手';
    
    var html = ''
        + '<div class="ac-chat-messages" id="acChatMessages">'
        + '<div style="text-align:center;color:#c7c7cc;font-size:13px;margin-top:20px;">开始记账吧</div>'
        + '</div>'
        + '<div class="ac-chat-input-bar">'
        + '<input type="text" class="ac-chat-input" id="acChatInput" placeholder="请输入花销收入…" onkeypress="if(event.key===\'Enter\')sendACMessage()">'
        + '<span class="ac-send-btn" onclick="sendACMessage()">'
        + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'
        + '</span>'
        + '</div>';
    
    return html;
}

var acMessages = [];

function sendACMessage() {
    var input = document.getElementById('acChatInput');
    if (!input || !input.value.trim()) return;
    var text = input.value.trim();
    input.value = '';
    
    // 添加用户消息
    acMessages.push({ role: 'user', text: text });
    renderACMessages();
    
    // TODO: 调用AI回复
    setTimeout(function() {
        acMessages.push({ role: 'assistant', text: '已记录：' + text });
        renderACMessages();
    }, 500);
}

function renderACMessages() {
    var container = document.getElementById('acChatMessages');
    if (!container) return;
    
    var html = '';
    acMessages.forEach(function(m) {
        if (m.role === 'user') {
            html += '<div class="ac-msg-row user"><div class="ac-bubble user">' + m.text + '</div></div>';
        } else {
            html += '<div class="ac-msg-row assistant"><div class="ac-bubble assistant">' + m.text + '</div></div>';
        }
    });
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// ========== 记账 ==========
function renderBookPage() {
    return '<div style="padding:20px 0;text-align:center;color:#8e8e93;">记账页面开发中...</div>';
}
