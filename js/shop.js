/**
 * 玉界 - 商城
 * 推荐 / 外卖 / 购物车
 */

var _shopTab = 'recommend';
var _shopItems = [];
var _shopCart = [];

function _shopLoad() {
    localStorage.removeItem('shop_items');
    try { _shopItems = JSON.parse(localStorage.getItem('shop_items') || '[]'); } catch(e) { _shopItems = []; }
    if (_shopItems.length === 0) {
        _shopItems = [
            { name: '黑白玫瑰冷香', price: '859', desc: '极简黑白玫瑰调，冷淡中透出高级感', img: 'https://i.ibb.co/vCQBBd0X/1784027231656.png', tab: 'recommend' },
            { name: '雏菊珍珠', price: '650', desc: '清新雏菊花香，缀以珍珠光泽瓶身', img: 'https://i.ibb.co/DfDpH5cG/1784027203695.png', tab: 'recommend' },
            { name: '鸭舌帽', price: '27', desc: '帽子带有英文印花，帽檐清新的绿色', img: 'https://i.ibb.co/pvzk4rqH/Free-Front-View-Cap-Mockup-1536x1025.jpg', tab: 'recommend' },
            { name: '2024年日记本', price: '18', desc: '一本棕色复古版很有质感的日记本', img: 'https://i.ibb.co/pB9hkCM1/Leather-Notebook-Mockup-1536x1152.jpg', tab: 'recommend' },
            { name: '迪奥Dior魅惑丰唇蜜', price: '380', desc: '018乌龙奶茶6ml唇釉口红滋润显色', img: 'https://i.ibb.co/DfpCnN8x/Screenshot-2026-07-15-09-12-32-05-4fbb30eb7b7166119bd25e41eddeee2f.jpg', tab: 'recommend' },
            { name: '迪奥Dior烈艳蓝金口红', price: '420', desc: '720哑光唇膏口红滋润显色', img: 'https://i.ibb.co/Hf12JxHb/Screenshot-2026-07-15-09-15-12-59-4fbb30eb7b7166119bd25e41eddeee2f.jpg', tab: 'recommend' },
            { name: '香奈儿(CHANEL)女包白包', price: '25580', desc: '白色荔枝牛皮金球金扣链条零钱腰包斜挎', img: 'https://i.ibb.co/XxMZhb0n/Screenshot-2026-07-15-09-20-28-04-4fbb30eb7b7166119bd25e41eddeee2f.jpg', tab: 'recommend' },
            { name: '香奈儿（CHANEL）女包粉包', price: '53000', desc: '经典cf mini handle手柄浅粉色樱花粉手提单肩斜挎包', img: 'https://i.ibb.co/1YrCQNCP/Screenshot-2026-07-15-09-22-01-09-4fbb30eb7b7166119bd25e41eddeee2f.jpg', tab: 'recommend' },
            { name: '爱因斯坦的脑子', price: '250', desc: '购买之后自动获取如爱因斯坦般的大脑思考能力，购买后拒绝任何理由退货', img: 'https://i.ibb.co/CFK3Fxh/Screenshot-2026-07-15-09-43-17-93-e41039de8eaacf222a951c16e0560c66.jpg', tab: 'recommend' },
            { name: '臭宝柳州螺蛳粉', price: '99', desc: '高性价比浓汤大腐竹330g*11袋', img: 'https://i.ibb.co/sJmpHsVS/5c3d522df909e329d59b421a249628b8.jpg', tab: 'food' },
            { name: '美式快餐三件套', price: '35', desc: '经典汉堡+薯条+可乐', img: 'https://i.ibb.co/vx5Md2Sn/Fast-Food-Packaging-Mockup-1536x1152.jpg', tab: 'food' },
            { name: '轻食蔬菜沙拉', price: '23', desc: '新鲜时蔬搭配低脂酱汁', img: 'https://i.ibb.co/q3Y1cm8V/Square-Salad-Container-Mockup-1536x1536.jpg', tab: 'food' }
        ];
        _shopSave();
    }
    try { _shopCart = JSON.parse(localStorage.getItem('shop_cart') || '[]'); } catch(e) { _shopCart = []; }
}
function _shopSave() { localStorage.setItem('shop_items', JSON.stringify(_shopItems)); }
function _shopSaveCart() { localStorage.setItem('shop_cart', JSON.stringify(_shopCart)); }

function openShop() {
    var appWindow = document.getElementById('shopAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'shopAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    _shopLoad();
    _shopTab = 'recommend';
    _shopRender();
    appWindow.style.display = 'flex';
}
function closeShop() { var appWindow = document.getElementById('shopAppWindow'); if (appWindow) appWindow.style.display = 'none'; }

function _shopRender() {
    var appWindow = document.getElementById('shopAppWindow');
    if (!appWindow) return;
    var titles = { recommend: '推荐', food: '外卖', cart: '购物车' };
    var bodyHTML = _shopTab === 'cart' ? _shopRenderCart() : _shopRenderList();
    var addBtnHTML = (_shopTab === 'recommend' || _shopTab === 'food') ? '<div class="shop-nav-add" onclick="_shopAddItem()" style="position:absolute;right:16px;top:calc(50% + 4px);transform:translateY(-50%);font-size:22px;color:#000;cursor:pointer;padding:4px 8px;">+</div>' : '';
    appWindow.innerHTML = '<div class="shop-app">'
        + '<div class="shop-nav"><div class="shop-nav-back" onclick="closeShop()">‹</div><div class="shop-nav-title">' + titles[_shopTab] + '</div>' + addBtnHTML + '</div>'
        + bodyHTML
        + '<div class="shop-tab-bar">'
        + '<span class="shop-tab ' + (_shopTab === 'recommend' ? 'active' : '') + '" onclick="_shopSwitch(\'recommend\')">推荐</span>'
        + '<span class="shop-tab ' + (_shopTab === 'food' ? 'active' : '') + '" onclick="_shopSwitch(\'food\')">外卖</span>'
        + '<span class="shop-tab ' + (_shopTab === 'cart' ? 'active' : '') + '" onclick="_shopSwitch(\'cart\')">购物车</span>'
        + '</div></div>';

    var body = appWindow.querySelector('.shop-body');
    if (body) {
        var lastScroll = 0;
        body.addEventListener('scroll', function() {
            var tabBar = appWindow.querySelector('.shop-tab-bar');
            if (!tabBar) return;
            var scrollTop = body.scrollTop;
            if (scrollTop > lastScroll && scrollTop > 60) { tabBar.style.display = 'none'; }
            else { tabBar.style.display = ''; }
            lastScroll = scrollTop;
        });
    }
}

function _shopSwitch(tab) { _shopTab = tab; _shopRender(); }

function _shopRenderList() {
    var items = _shopItems.filter(function(item) { return item.tab === _shopTab || !item.tab; });
    var html = '<div class="shop-body"><div class="shop-grid">';
    items.forEach(function(item, i) {
        var realIndex = _shopItems.indexOf(item);
        html += '<div class="shop-item" onclick="_shopAddToCart(' + realIndex + ')">'
            + (item.img ? '<div class="shop-item-img" style="background-image:url(' + item.img + ');"></div>' : '<div class="shop-item-img"></div>')
            + '<div class="shop-item-info"><div class="shop-item-name">' + item.name + '</div><div class="shop-item-price">¥' + item.price + '</div><div class="shop-item-desc">' + (item.desc || '') + '</div></div>'
            + '</div>';
    });
    html += '</div></div>';
    return html;
}

function _shopAddToCart(index) {
    _shopCart.push(_shopItems[index]);
    _shopSaveCart();
    showToast('已加入购物车');
}

function _shopRenderCart() {
    var html = '<div class="shop-body">';
    if (_shopCart.length === 0) {
        html += '<div style="text-align:center;color:#8e8e93;padding:40px 0;">购物车是空的</div>';
    } else {
        _shopCart.forEach(function(item, i) {
            html += '<div class="shop-cart-item">'
                + (item.img ? '<div class="shop-cart-img" style="background-image:url(' + item.img + ');"></div>' : '<div class="shop-cart-img"></div>')
                + '<div class="shop-cart-info"><div class="shop-cart-name">' + item.name + '</div><div class="shop-cart-price">¥' + item.price + '</div></div>'
                + '<button class="shop-cart-send" onclick="event.stopPropagation();_shopSendToChar(' + i + ')">发给角色</button>'
                + '<div class="shop-cart-del" onclick="event.stopPropagation();_shopRemoveCart(' + i + ')">×</div>'
                + '</div>';
        });
    }
    html += '</div>';
    return html;
}

function _shopRemoveCart(index) { _shopCart.splice(index, 1); _shopSaveCart(); _shopRender(); }

function _shopSendToChar(index) {
    var item = _shopCart[index];
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.length === 0) { showToast('暂无联系人'); return; }
    var overlay = document.createElement('div');
    overlay.className = 'sheet-mask show';
    overlay.id = 'shopSendOverlay';
    var listHTML = '';
    contacts.forEach(function(c) {
        listHTML += '<div class="music-menu-item" onclick="_shopConfirmSend(\'' + c.id + '\',' + index + ')"><span>' + c.name + '</span></div>';
    });
    overlay.innerHTML = '<div class="half-sheet" onclick="event.stopPropagation();"><div class="sheet-handle"><div class="handle-bar"></div></div><div class="sheet-scroll"><div class="settings-section-title">发给谁买单</div>' + listHTML + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) _shopCloseSend(); };
    var handle = overlay.querySelector('.sheet-handle');
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 60) _shopCloseSend(); });
}
function _shopCloseSend() { var o = document.getElementById('shopSendOverlay'); if (o) o.remove(); }
function _shopConfirmSend(contactId, index) {
    _shopCloseSend();
    var item = _shopCart[index];
    var contact = window.ChatConfig.contacts.find(function(c) { return c.id === contactId; });
    var contactName = contact ? contact.name : '角色';

    // 先尝试直接发卡片
    var prevId = window.ChatState && window.ChatState.currentContactId;
    if (window.ChatState) window.ChatState.currentContactId = contactId;
    if (typeof sendShopCard === 'function') {
        sendShopCard(contactId, item);
    }
    if (window.ChatState) window.ChatState.currentContactId = prevId;

    // 同时存到localStorage，下次角色回复时通过系统提示读取
    var notices = JSON.parse(localStorage.getItem('shop_pending_notices') || '[]');
    notices.push({ contactId: contactId, contactName: contactName, name: item.name, price: item.price, desc: item.desc || '', time: Date.now() });
    localStorage.setItem('shop_pending_notices', JSON.stringify(notices));

    showToast('已发送给' + contactName);
}

function _shopAddItem() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'shopAddOverlay';
    overlay.innerHTML = '<div class="caption-modal"><div class="shop-add-form">'
        + '<div style="font-size:15px;font-weight:600;color:#000;">添加商品</div>'
        + '<div class="shop-add-img-preview" id="shopAddImgPreview" onclick="document.getElementById(\'shopAddImgInput\').click()">+</div>'
        + '<input type="file" id="shopAddImgInput" accept="image/*" style="display:none;" onchange="_shopPreviewImg(event)">'
        + '<input type="text" id="shopAddName" placeholder="商品名称">'
        + '<input type="number" id="shopAddPrice" placeholder="价格" step="0.01">'
        + '<textarea id="shopAddDesc" placeholder="商品描述" rows="2"></textarea>'
        + '<div class="caption-buttons"><div class="payment-btn-cancel" onclick="_shopCloseAdd()">取消</div><div class="payment-btn-confirm" onclick="_shopConfirmAdd()">添加</div></div>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) _shopCloseAdd(); };
    window._shopAddImg = '';
}
function _shopCloseAdd() { var o = document.getElementById('shopAddOverlay'); if (o) o.remove(); }
function _shopPreviewImg(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        window._shopAddImg = ev.target.result;
        var preview = document.getElementById('shopAddImgPreview');
        if (preview) { preview.style.backgroundImage = 'url(' + ev.target.result + ')'; preview.innerText = ''; }
    };
    reader.readAsDataURL(file);
}
function _shopConfirmAdd() {
    var name = document.getElementById('shopAddName').value.trim();
    var price = document.getElementById('shopAddPrice').value.trim();
    var desc = document.getElementById('shopAddDesc').value.trim();
    _shopCloseAdd();
    if (!name || !price) { showToast('请填写名称和价格'); return; }
    _shopItems.push({ name: name, price: price, desc: desc, img: window._shopAddImg || '', tab: _shopTab === 'food' ? 'food' : 'recommend' });
    _shopSave();
    _shopRender();
    showToast('商品已添加');
}
