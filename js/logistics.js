/**
 * 玉界 - 物流
 * 快递订单 + 外卖订单
 */

var _logiCat = 'express';
var _logiSubTab = 'all';

function _logiGetOrders() {
    try { return JSON.parse(localStorage.getItem('logistics_orders') || '[]'); } catch(e) { return []; }
}
function _logiSaveOrders(orders) { localStorage.setItem('logistics_orders', JSON.stringify(orders)); }

function openLogistics() {
    var appWindow = document.getElementById('logisticsAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'logisticsAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    _logiCat = 'express';
    _logiSubTab = 'all';
    _logiRender();
    appWindow.style.display = 'flex';
}
function closeLogistics() { var appWindow = document.getElementById('logisticsAppWindow'); if (appWindow) appWindow.style.display = 'none'; }

function _logiRender() {
    var appWindow = document.getElementById('logisticsAppWindow');
    if (!appWindow) return;

    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeMask = masks.length > 0 ? masks[0] : null;
    var userName = activeMask ? activeMask.name : '用户';
    var userAvatar = activeMask && activeMask.avatar ? activeMask.avatar : '';

    var subTabs = _logiCat === 'express'
        ? ['全部订单','待发货','待收货','待评价']
        : ['全部订单','待收货','待评价','退款售后'];

    var html = '<div class="logi-app">'
        + '<div class="logi-nav"><div class="logi-nav-back" onclick="closeLogistics()">‹</div><div class="logi-nav-title">物流</div></div>'
        + '<div class="logi-body">'
        + '<div class="logi-user-card">'
        + (userAvatar ? '<div class="logi-user-avatar" style="background-image:url(' + userAvatar + ');"></div>' : '<div class="logi-user-avatar"></div>')
        + '<div class="logi-user-name">' + userName + '</div>'
        + '</div>'
        + '<div class="logi-cat-tabs">'
        + '<div class="logi-cat-tab ' + (_logiCat === 'express' ? 'active' : '') + '" onclick="_logiSwitchCat(\'express\')">快递订单</div>'
        + '<div class="logi-cat-tab ' + (_logiCat === 'food' ? 'active' : '') + '" onclick="_logiSwitchCat(\'food\')">外卖订单</div>'
        + '</div>'
        + '<div class="logi-sub-tabs">';
    subTabs.forEach(function(t) {
        var key = t === '全部订单' ? 'all' : (t === '待发货' ? 'pending' : (t === '待收货' ? 'shipping' : (t === '待评价' ? 'done' : 'refund')));
        html += '<div class="logi-sub-tab ' + (_logiSubTab === key ? 'active' : '') + '" onclick="_logiSwitchSub(\'' + key + '\')">' + t + '</div>';
    });
    html += '</div>' + _logiRenderOrders() + '</div></div>';
    appWindow.innerHTML = html;
}

function _logiSwitchCat(cat) { _logiCat = cat; _logiSubTab = 'all'; _logiRender(); }
function _logiSwitchSub(tab) { _logiSubTab = tab; _logiRender(); }

function _logiRenderOrders() {
    var orders = _logiGetOrders().filter(function(o) { return o.cat === _logiCat; });
    if (_logiSubTab === 'pending') orders = orders.filter(function(o) { return o.status === 'pending'; });
    else if (_logiSubTab === 'shipping') orders = orders.filter(function(o) { return o.status === 'shipping'; });
    else if (_logiSubTab === 'done') orders = orders.filter(function(o) { return o.status === 'done'; });

    if (orders.length === 0) return '<div class="logi-empty">暂无订单</div>';

    var statusLabels = { pending: '待发货', shipping: '待收货', done: '已收货' };
    var html = '';
    orders.forEach(function(o, i) {
        html += '<div class="logi-order-card">'
            + '<div class="logi-order-header">'
            + '<span style="font-size:12px;color:#8e8e93;">' + (o.time || '') + '</span>'
            + '<span class="logi-order-status ' + o.status + '">' + (statusLabels[o.status] || o.status) + '</span>'
            + '</div>'
            + '<div class="logi-order-info">'
            + (o.img ? '<div class="logi-order-img" style="background-image:url(' + o.img + ');"></div>' : '<div class="logi-order-img"></div>')
            + '<div class="logi-order-detail"><div class="logi-order-name">' + o.name + '</div><div class="logi-order-price">¥' + o.price + '</div></div>'
            + '</div>'
            + '<div class="logi-order-actions">';
        if (o.status === 'shipping') {
            html += '<button class="logi-order-btn primary" onclick="_logiShareToChar(' + i + ')">分享给角色</button>';
        }
        if (o.status === 'shipping' || o.status === 'pending') {
            html += '<button class="logi-order-btn" onclick="_logiMarkDone(' + i + ')">确认收货</button>';
        }
        html += '</div></div>';
    });
    return html;
}

function _logiShareToChar(index) {
    var orders = _logiGetOrders();
    var o = orders.filter(function(ord) { return ord.cat === _logiCat; })[index];
    if (!o) return;
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var overlay = document.createElement('div');
    overlay.className = 'sheet-mask show';
    overlay.innerHTML = '<div class="half-sheet" onclick="event.stopPropagation();"><div class="sheet-handle"><div class="handle-bar"></div></div><div class="sheet-scroll"><div class="settings-section-title">让谁去取快递</div>'
        + contacts.map(function(c) { return '<div class="music-menu-item" onclick="_logiConfirmShare(\'' + c.id + '\',' + index + ')"><span>' + c.name + '</span></div>'; }).join('')
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) { var ov = document.querySelector('.sheet-mask.show'); if (ov) ov.remove(); } };
}
function _logiConfirmShare(contactId, index) {
    var ov = document.querySelector('.sheet-mask.show'); if (ov) ov.remove();
    var orders = _logiGetOrders();
    var o = orders.filter(function(ord) { return ord.cat === _logiCat; })[index];
    if (!o) return;
    var msg = '（快递到了：' + o.name + '，¥' + o.price + '，帮我去取一下）';
    var prevId = window.ChatState && window.ChatState.currentContactId;
    if (window.ChatState) window.ChatState.currentContactId = contactId;
    if (typeof appendMessage === 'function') { appendMessage('narration', msg); if (typeof saveChatHistory === 'function') saveChatHistory(contactId); }
    if (window.ChatState) window.ChatState.currentContactId = prevId;
    showToast('已分享');
}

function _logiMarkDone(index) {
    var orders = _logiGetOrders();
    var filtered = orders.filter(function(o) { return o.cat === _logiCat; });
    var realIndex = orders.indexOf(filtered[index]);
    if (realIndex >= 0) { orders[realIndex].status = 'done'; _logiSaveOrders(orders); _logiRender(); }
}
