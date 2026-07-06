/**
 * 玉界 - 卡包
 */

var _cpCards = [];

function openCardpack() {
    var appWindow = document.getElementById('cardpackAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'cardpackAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    _cpLoadCards();
    _cpRender();
    appWindow.style.display = 'flex';
}

function closeCardpack() {
    var appWindow = document.getElementById('cardpackAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

function _cpLoadCards() {
    try {
        var raw = localStorage.getItem('cardpack_cards');
        _cpCards = raw ? JSON.parse(raw) : [];
    } catch(e) { _cpCards = []; }
}

function _cpSaveCards() {
    localStorage.setItem('cardpack_cards', JSON.stringify(_cpCards));
}

// ========== 渲染 ==========
function _cpRender() {
    var appWindow = document.getElementById('cardpackAppWindow');
    if (!appWindow) return;

    var cardsHTML = '';
    if (_cpCards.length === 0) {
        cardsHTML = '<div class="cp-empty">暂无卡片</div>';
    } else {
        _cpCards.forEach(function(card, i) {
            var fromLabel = card.from === 'user' ? '我的卡' : (card.fromName || '角色赠送');
            var toLabel = card.toName ? '赠给 ' + card.toName : '';
            cardsHTML += ''
                + '<div class="cp-card">'
                + '<div class="cp-card-bank">BLACK CARD</div>'
                + '<div class="cp-card-balance">¥' + card.balance.toFixed(2) + '</div>'
                + '<div class="cp-card-label">可用额度</div>'
                + '<div class="cp-card-info">'
                + '<span>' + fromLabel + '</span>'
                + (toLabel ? '<span>' + toLabel + '</span>' : '<span class="cp-card-btn" onclick="_cpSendCard(' + i + ')">赠送</span>')
                + '</div>'
                + '</div>';
        });
    }

    appWindow.innerHTML = ''
        + '<div class="cp-app">'
        + '<div class="cp-nav">'
        + '<div class="cp-nav-back" onclick="closeCardpack()">‹</div>'
        + '<div class="cp-nav-title">卡包</div>'
        + '</div>'
        + '<div class="cp-body">' + cardsHTML + '</div>'
        + '<div class="cp-fab" onclick="_cpCreateCard()"></div>'
        + '</div>';
}

// ========== 创建卡 ==========
function _cpCreateCard() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'cpCreateOverlay';
    overlay.innerHTML = ''
        + '<div class="caption-modal">'
        + '<div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">创建黑卡</div>'
        + '<input type="number" class="payment-note" id="cpBalanceInput" placeholder="请输入额度" step="0.01" min="0.01">'
        + '<div class="caption-buttons">'
        + '<div class="payment-btn-cancel" onclick="_cpCloseCreate()">取消</div>'
        + '<div class="payment-btn-confirm" onclick="_cpConfirmCreate()">确定</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) _cpCloseCreate(); };
}

function _cpCloseCreate() {
    var o = document.getElementById('cpCreateOverlay');
    if (o) o.remove();
}

function _cpConfirmCreate() {
    var input = document.getElementById('cpBalanceInput');
    var balance = parseFloat(input ? input.value : 0);
    _cpCloseCreate();
    if (!balance || balance <= 0) { showToast('请输入有效额度'); return; }
    _cpCards.unshift({
        id: 'card_' + Date.now(),
        balance: balance,
        from: 'user',
        fromName: null,
        toName: null,
        toId: null
    });
    _cpSaveCards();
    _cpRender();
    showToast('黑卡已创建');
}

// ========== 赠送卡 ==========
function _cpSendCard(index) {
    if (_cpCards[index] && _cpCards[index].from !== 'user') {
        showToast('角色赠送的卡不能转赠');
        return;
    }
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.length === 0) { showToast('暂无联系人'); return; }

    var overlay = document.createElement('div');
    overlay.className = 'music-share-overlay';
    overlay.style.zIndex = '9999';
    overlay.id = 'cpSendOverlay';
    var listHTML = '';
    contacts.forEach(function(c) {
        var avatarHTML = c.avatarData
            ? '<div class="music-share-avatar" style="background-image:url(' + c.avatarData + ');"></div>'
            : '<div class="music-share-avatar">' + c.name.charAt(0) + '</div>';
        listHTML += '<div class="music-share-item" onclick="_cpConfirmSend(' + index + ', \'' + c.id + '\', \'' + c.name + '\')">' + avatarHTML + '<span class="music-share-name">' + c.name + '</span></div>';
    });
    overlay.innerHTML = ''
        + '<div class="music-share-panel" onclick="event.stopPropagation()">'
        + '<div class="music-menu-handle"></div>'
        + '<div class="music-share-title">赠送给</div>'
        + '<div class="music-share-list">' + listHTML + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) _cpCloseSend(); };
}

function _cpCloseSend() {
    var o = document.getElementById('cpSendOverlay');
    if (o) o.remove();
}

function _cpConfirmSend(index, contactId, contactName) {
    _cpCloseSend();
    if (!_cpCards[index]) return;
    _cpCards[index].toName = contactName;
    _cpCards[index].toId = contactId;
    _cpSaveCards();

    var notices = JSON.parse(localStorage.getItem('cp_pending_notices') || '[]');
    notices.push({
        contactId: contactId,
        contactName: contactName,
        balance: _cpCards[index].balance,
        time: Date.now()
    });
    localStorage.setItem('cp_pending_notices', JSON.stringify(notices));
    
    _cpRender();
    
    var cardMsg = '（赠送了一张黑卡，额度¥' + _cpCards[index].balance.toFixed(2) + '）';
    if (typeof appendMessage === 'function') {
        var prevContactId = window.ChatState && window.ChatState.currentContactId;
        if (window.ChatState) window.ChatState.currentContactId = contactId;
        appendMessage('narration', cardMsg);
        if (typeof saveChatHistory === 'function') saveChatHistory(contactId);
        if (window.ChatState) window.ChatState.currentContactId = prevContactId;
    }
    
    showToast('已赠送给 ' + contactName);
}
