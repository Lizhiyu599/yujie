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
    return '<div style="padding:20px 0;text-align:center;color:#8e8e93;">聊天页面开发中...</div>';
}

// ========== 记账 ==========
function renderBookPage() {
    return '<div style="padding:20px 0;text-align:center;color:#8e8e93;">记账页面开发中...</div>';
}
