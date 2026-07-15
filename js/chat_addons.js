/**
 * 玉界 - 聊天附加功能
 * 包含：表情包面板渲染、发送贴纸、相册、图片查看器、位置、红包、转账、链接、线下模式切换
 */

document.addEventListener('click', function(e) {
    var card = e.target.closest('.payment-card');
    if (card) {
        var msgId = card.getAttribute('data-msg-id');
        if (msgId) openPaymentModal(msgId);
    }
});

// ========== 表情包面板渲染 ==========
function renderAddPanelContent(tab) {
    const body = document.getElementById('addPanelBody');
    if (!body) return;

    // 线下模式：只显示场景设置面板
    if (window.ChatState && window.ChatState.isOfflineMode) {
        body.innerHTML = `
            <div class="offline-panel">
                <div class="offline-panel-title">场景字数设置</div>
                <div class="offline-slider-row">
                    <span>每次回复字数上限</span>
                    <span class="offline-slider-val" id="offlineWordLimitVal">${localStorage.getItem('offline_word_limit') || '300'}</span>
                </div>
                <div class="offline-preset-btns">
    <button class="offline-preset-btn" id="presetBtn100" onclick="selectOfflinePreset(100, 200, this)">100-200</button>
    <button class="offline-preset-btn" id="presetBtn200" onclick="selectOfflinePreset(200, 500, this)">200-500</button>
    <button class="offline-preset-btn" id="presetBtn500" onclick="selectOfflinePreset(500, 700, this)">500-700</button>
    <button class="offline-preset-btn" id="presetBtn700" onclick="selectOfflinePreset(700, 800, this)">700-800</button>
</div>
<div class="offline-custom-row">
    <input type="number" class="offline-custom-input" id="offlineCustomMin" placeholder="最少字" min="50" style="flex:1;">
    <input type="number" class="offline-custom-input" id="offlineCustomMax" placeholder="最多字" min="50" style="flex:1;">
    <button class="offline-custom-confirm" onclick="confirmOfflineCustom()">确定</button>
</div>
                <button class="offline-switch-btn" onclick="switchToOnline()">切换到线上</button>
            </div>
        `;
        return;
    }

    if (tab === 'emoji') {
        const savedEmojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
        let emojiItems = '';
        for (let i = savedEmojis.length - 1; i >= 0; i--) {
            const emoji = savedEmojis[i];
            emojiItems += `
                <div class="emoji-item" onclick="sendSticker(${i})" oncontextmenu="return false;"
                     ontouchstart="startEmojiLongPress(event, ${i})" ontouchend="cancelEmojiLongPress()" ontouchmove="cancelEmojiLongPress()">
                    <img src="${emoji.src}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" alt="${emoji.note || ''}">
                </div>
            `;
        }
        body.innerHTML = `
            <div class="emoji-grid">
                <div class="emoji-add-box" onclick="addCustomEmoji()">+</div>
                ${emojiItems}
            </div>
        `;
    } else if (tab === 'func') {
        body.innerHTML = `
            <div class="func-grid">
                <div class="func-item" onclick="openAlbum()">
                    <div class="func-icon">册</div>
                    <div class="func-label">相册</div>
                </div>
                <div class="func-item" onclick="openLocation()">
                    <div class="func-icon">位</div>
                    <div class="func-label">位置</div>
                </div>
                <div class="func-item" onclick="openRedPacketModal()">
                    <div class="func-icon">包</div>
                    <div class="func-label">红包</div>
                </div>
                <div class="func-item" onclick="openTransferModal()">
                    <div class="func-icon">转</div>
                    <div class="func-label">转账</div>
                </div>
                <div class="func-item" onclick="openFileSend()">
                    <div class="func-icon">链</div>
                    <div class="func-label">链接</div>
                </div>
            <div class="func-item" onclick="switchToOffline()">
    <div class="func-icon">⇲</div>
    <div class="func-label">线下</div>
</div>
        `;
    }
}

// ========== 发送贴纸 ==========
function sendSticker(idx) {
    const savedEmojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    if (savedEmojis[idx]) {
        const sticker = savedEmojis[idx];
        const row = document.createElement('div');
        row.className = 'bubble-row user';
        const avatar = document.createElement('div');
        avatar.className = 'bubble-avatar user-avatar';
        avatar.textContent = '我';
        const bubble = document.createElement('div');
        bubble.className = 'bubble bubble-user';
        bubble.style.backgroundImage = `url(${sticker.src})`;
        bubble.style.backgroundSize = 'cover';
        bubble.style.backgroundPosition = 'center';
        bubble.style.width = '100px';
        bubble.style.height = '100px';
        bubble.style.padding = '0';
        bubble.style.borderRadius = '12px';
        bubble.textContent = '';
        bubble.onclick = function() { openImageViewer(sticker.src); };
        row.appendChild(avatar);
        row.appendChild(bubble);
        document.getElementById('chatMessages').appendChild(row);

        var noteText = sticker.note ? '（发送了表情包：' + sticker.note + '）' : '（发送了一个表情包）';
        var nRow = document.createElement('div');
        nRow.className = 'bubble-narration';
        nRow.textContent = noteText;
        nRow.style.display = 'none';
        document.getElementById('chatMessages').appendChild(nRow);

        saveChatHistory(window.ChatState.currentContactId);
        toggleAddPanel();
    }
}

// ========== 表情包 ==========
function addCustomEmoji() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            window._emojiAddImage = ev.target.result;
            showEmojiNoteModal();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function showEmojiNoteModal() {
    const overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'emojiNoteOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:14px;color:#8e8e93;margin-bottom:8px;">为这个表情包添加备注</div>
            <textarea class="caption-textarea" id="emojiNoteTextarea" placeholder="输入备注，让AI知道它的含义"></textarea>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeEmojiNoteModal()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmAddEmoji()">确定</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeEmojiNoteModal(); };
}

function closeEmojiNoteModal() {
    const overlay = document.getElementById('emojiNoteOverlay');
    if (overlay) overlay.remove();
    window._emojiAddImage = null;
}

function confirmAddEmoji() {
    var src = window._emojiAddImage;
    var note = document.getElementById('emojiNoteTextarea').value.trim();
    closeEmojiNoteModal();
    if (!src) return;
    var emojiData = { src: src, note: note || '' };
    var saved = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    saved.push(emojiData);
    localStorage.setItem('custom_emojis', JSON.stringify(saved));
    showToast('表情包已添加');
    if (typeof renderAddPanelContent === 'function') {
        renderAddPanelContent('emoji');
    }
    window._emojiAddImage = null;
}

// ========== 表情包长按删除 ==========
let emojiLongPressTimer = null;
let emojiLongPressTarget = null;
let emojiLongPressElement = null;

function startEmojiLongPress(e, idx) {
    emojiLongPressTarget = idx;
    emojiLongPressElement = e.currentTarget;
    emojiLongPressTimer = setTimeout(function() {
        showEmojiDeleteBtn(idx);
    }, 600);
}

function cancelEmojiLongPress() {
    if (emojiLongPressTimer) {
        clearTimeout(emojiLongPressTimer);
        emojiLongPressTimer = null;
    }
    emojiLongPressTarget = null;
    emojiLongPressElement = null;
}

function showEmojiDeleteBtn(idx) {
    const existing = document.getElementById('emojiDeleteBtn');
    if (existing) existing.remove();
    if (!emojiLongPressElement) return;
    const rect = emojiLongPressElement.getBoundingClientRect();
    const btn = document.createElement('div');
    btn.id = 'emojiDeleteBtn';
    btn.style.cssText = 'position:fixed;z-index:9999;width:22px;height:22px;background:#ff3b30;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    btn.innerHTML = 'x';
    btn.onclick = function(e) {
        e.stopPropagation();
        deleteEmoji(idx);
    };
    btn.style.top = (rect.top - 8) + 'px';
    btn.style.left = (rect.right - 14) + 'px';
    document.body.appendChild(btn);
    setTimeout(function() {
        document.addEventListener('click', function removeBtn() {
            const b = document.getElementById('emojiDeleteBtn');
            if (b) b.remove();
            document.removeEventListener('click', removeBtn);
        }, { once: true });
    }, 10);
}

function deleteEmoji(idx) {
    const btn = document.getElementById('emojiDeleteBtn');
    if (btn) btn.remove();
    emojiLongPressElement = null;
    const saved = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    if (idx >= 0 && idx < saved.length) {
        saved.splice(idx, 1);
        localStorage.setItem('custom_emojis', JSON.stringify(saved));
        showToast('表情包已删除');
        switchAddPanelTab('emoji', document.getElementById('tabEmoji'));
    }
}

// ========== 生图 API 调用 ==========
async function callImageAPI(prompt) {
    const baseUrl = localStorage.getItem('image_base_url');
    const apiKey = localStorage.getItem('image_api_key');
    const model = localStorage.getItem('image_model');
    const style = localStorage.getItem('image_style') || '';

    if (!baseUrl || !apiKey || !model) return null;

    var finalPrompt = prompt;
    if (style) {
        finalPrompt = style + '风格，' + prompt;
    }

    let endpoint = baseUrl;
    if (!endpoint.endsWith('/images/generations')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/images/generations';
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: model,
                prompt: finalPrompt,
                n: 1,
                size: '1024x1024'
            })
        });

        const data = await response.json();
        if (data.data && data.data[0] && data.data[0].url) {
    if (typeof addGalleryImage === 'function') {
        addGalleryImage(data.data[0].url, prompt);
    }
    return data.data[0].url;
        }
        if (data.data && data.data[0] && data.data[0].b64_json) {
    var imgSrc = 'data:image/png;base64,' + data.data[0].b64_json;
    if (typeof addGalleryImage === 'function') {
        addGalleryImage(imgSrc, prompt);
    }
    return imgSrc;
        }
        return null;
    } catch (e) {
    showToast('总结失败：' + (e.message || '未知错误'));
    return null;
    }
}

// ========== 相册 ==========
function openAlbum() {
    toggleAddPanel();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const hasImageAPI = localStorage.getItem('image_base_url') && localStorage.getItem('image_api_key') && localStorage.getItem('image_model');
            if (hasImageAPI) {
                sendImageWithCaption(ev.target.result, '');
            } else {
                showCaptionModal(ev.target.result);
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function showCaptionModal(imageSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'captionModalOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:14px;color:#8e8e93;margin-bottom:8px;">请手动输入图片描述</div>
            <textarea class="caption-textarea" id="captionTextarea" placeholder="此处输入照片描述"></textarea>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeCaptionModal()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmSendImage('${imageSrc}')">发送</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeCaptionModal(); };
}

function closeCaptionModal() {
    const overlay = document.getElementById('captionModalOverlay');
    if (overlay) overlay.remove();
}

function confirmSendImage(imageSrc) {
    const caption = document.getElementById('captionTextarea').value.trim();
    closeCaptionModal();
    sendImageWithCaption(imageSrc, caption);
}

function sendImageWithCaption(imageSrc, caption) {
    const row = document.createElement('div');
    row.className = 'bubble-row user';
    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar user-avatar';
    avatar.textContent = '我';
    const bubble = document.createElement('div');
    bubble.className = 'bubble bubble-user';
    bubble.style.backgroundImage = `url(${imageSrc})`;
    bubble.style.backgroundSize = 'cover';
    bubble.style.backgroundPosition = 'center';
    bubble.style.width = '140px';
    bubble.style.height = '140px';
    bubble.style.padding = '0';
    bubble.style.borderRadius = '12px';
    bubble.textContent = '';
    bubble.onclick = function() { openImageViewer(imageSrc); };
    row.appendChild(avatar);
    row.appendChild(bubble);
    document.getElementById('chatMessages').appendChild(row);

    var nRow = document.createElement('div');
    nRow.className = 'bubble-narration';
    nRow.textContent = caption ? '（发送了一张图片：' + caption + '）' : '（发送了一张图片）';
    nRow.style.display = 'none';
    document.getElementById('chatMessages').appendChild(nRow);

    saveChatHistory(window.ChatState.currentContactId);

    if (caption) {
        callImageAPI(caption).then(function(generatedUrl) {
            if (generatedUrl) {
                var botRow = document.createElement('div');
                botRow.className = 'bubble-row assistant';
                var botAvatar = document.createElement('div');
                botAvatar.className = 'bubble-avatar bot-avatar';
                botAvatar.textContent = getContactById(window.ChatState.currentContactId)?.avatar || 'AI';
                var botBubble = document.createElement('div');
                botBubble.className = 'bubble bubble-assistant';
                botBubble.style.backgroundImage = `url(${generatedUrl})`;
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
                saveChatHistory(window.ChatState.currentContactId);
            }
        });
    }
}

// ========== 图片查看器 ==========
function openImageViewer(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function() { overlay.remove(); };
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:95%;max-height:95%;object-fit:contain;border-radius:8px;';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
}

// ========== 位置 ==========
function openLocation() {
    toggleAddPanel();
    const overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'locationModalOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#000;">发送位置</div>
            <input type="text" class="payment-note" id="locationInput" placeholder="当前地点">
            <input type="text" class="payment-note" id="distanceInput" placeholder="当前与角色相距（可不填）">
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeLocationModal()">取消</div>
                <div class="payment-btn-confirm" onclick="sendLocation()">发送</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeLocationModal(); };
}

function closeLocationModal() {
    const overlay = document.getElementById('locationModalOverlay');
    if (overlay) overlay.remove();
}

function sendLocation() {
    const location = document.getElementById('locationInput').value.trim();
    const distance = document.getElementById('distanceInput').value.trim();
    closeLocationModal();
    if (!location) return;
    const row = document.createElement('div');
    row.className = 'bubble-row user';
    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar user-avatar';
    avatar.textContent = '我';
    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(255,255,255,0.65);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:14px;padding:0;width:220px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid rgba(255,255,255,0.4);';
    card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;">
            <div style="width:56px;height:56px;background:#f2f2f7;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <div style="position:relative;width:20px;height:28px;">
                    <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:14px;height:14px;background:#1d1d1f;border-radius:50%;"></div>
                    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:14px solid #1d1d1f;"></div>
                    <div style="position:absolute;top:4px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:#fff;border-radius:50%;"></div>
                </div>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;color:#000;word-break:break-all;">${location}</div>
                ${distance ? '<div style="font-size:11px;color:#8e8e93;margin-top:2px;">相距约' + distance + '</div>' : ''}
            </div>
        </div>
    `;
    row.appendChild(avatar);
    row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);

    var nRow = document.createElement('div');
    nRow.className = 'bubble-narration';
    nRow.textContent = '（分享了一个位置：' + location + (distance ? '，距离约' + distance : '') + '）';
    nRow.style.display = 'none';
    document.getElementById('chatMessages').appendChild(nRow);

    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 红包/转账状态存储 ==========
function getPaymentState(msgId) {
    var raw = localStorage.getItem('payment_state_' + msgId);
    return raw || 'pending';
}

function setPaymentState(msgId, state) {
    localStorage.setItem('payment_state_' + msgId, state);
}

// ========== 收红包/转账弹窗 ==========
function openPaymentModal(msgId) {
    var card = document.querySelector('.payment-card[data-msg-id="' + msgId + '"]');
    if (!card) return;
    var row = card.closest('.bubble-row');
    if (row && row.classList.contains('user')) {
        showToast('不能领取自己发送的红包或转账');
        return;
    }
    var state = getPaymentState(msgId);
    if (state !== 'pending') {
        showToast('该红包/转账已处理');
        return;
    }

    var type = card.getAttribute('data-type');
    var amount = card.getAttribute('data-amount');
    var note = card.getAttribute('data-note');
    var isRedPacket = type === '红包';
    var isBlackCard = type === '黑卡';

    var overlay = document.createElement('div');
    overlay.className = 'payment-open-overlay';
    overlay.id = 'paymentOpenOverlay';
    overlay.innerHTML = ''
    + '<div class="payment-open-modal" style="' + (isBlackCard ? 'background:#1a1a1a;color:#fff;' : '') + '">'
    + (isBlackCard ? '' : '<div class="payment-open-icon"><span class="payment-open-dollar">$</span></div>')
    + '<div class="payment-open-type" style="' + (isBlackCard ? 'color:rgba(255,255,255,0.7);' : '') + '">' + (isBlackCard ? '黑卡' : (isRedPacket ? '红包' : '转账')) + '</div>'
    + (note ? '<div class="payment-open-note">' + note + '</div>' : '')
    + '<div class="payment-open-amount" id="paymentOpenAmount" style="' + (isBlackCard ? 'color:#fff;' : '') + '">' + (isRedPacket ? '?' : '$' + amount) + '</div>'
    + '<div class="payment-open-buttons">'
    + '<button class="payment-open-accept" id="paymentOpenAccept" style="' + (isBlackCard ? 'background:#fff;color:#000;' : '') + '">' + (isRedPacket ? '拆' : '接收') + '</button>'
    + (!isRedPacket && !isBlackCard ? '<button class="payment-open-refund" id="paymentOpenRefund">退还</button>' : '')
    + '</div>'
    + '</div>';
    document.body.appendChild(overlay);

    var acceptBtn = document.getElementById('paymentOpenAccept');
    if (acceptBtn) {
        acceptBtn.onclick = function(e) {
            e.stopPropagation();
            if (isRedPacket) {
                var amountEl = document.getElementById('paymentOpenAmount');
                if (amountEl) amountEl.textContent = '$' + amount;
            } else if (isBlackCard) {
                var cpCards = JSON.parse(localStorage.getItem('cardpack_cards') || '[]');
                cpCards.unshift({
                    id: 'card_' + Date.now(),
                    balance: parseFloat(amount),
                    from: getContactById(window.ChatState.currentContactId)?.name || '角色',
                    fromName: getContactById(window.ChatState.currentContactId)?.name || '角色',
                    toName: null,
                    toId: null
                });
                localStorage.setItem('cardpack_cards', JSON.stringify(cpCards));
            }
            updatePaymentCardUI(msgId, 'accepted');
            overlay.remove();
            addReceivedCard('user', type, amount);
            var narration = document.createElement('div');
            narration.className = 'bubble bubble-narration';
            narration.textContent = '已收入' + amount + '元';
            document.getElementById('chatMessages').appendChild(narration);
            saveChatHistory(window.ChatState.currentContactId);
        };
    }

    var refundBtn = document.getElementById('paymentOpenRefund');
    if (refundBtn) {
        refundBtn.onclick = function(e) {
            e.stopPropagation();
            updatePaymentCardUI(msgId, 'refunded');
            overlay.remove();
            addRefundedCard('user', amount);
            var narration = document.createElement('div');
            narration.className = 'bubble bubble-narration';
            narration.textContent = '已退还转账';
            document.getElementById('chatMessages').appendChild(narration);
            saveChatHistory(window.ChatState.currentContactId);
        };
    }

    overlay.onclick = function(e) {
        if (e.target === overlay) overlay.remove();
    };
}

// 添加已接收卡片
function addReceivedCard(side, type, amount) {
    var row = document.createElement('div');
    row.className = 'bubble-row ' + side;
    var avatar = document.createElement('div');
    avatar.className = 'bubble-avatar ' + (side === 'user' ? 'user-avatar' : 'bot-avatar');
    avatar.textContent = side === 'user' ? '我' : (getContactById(window.ChatState.currentContactId)?.avatar || 'AI');
    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:14px;padding:0;width:220px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);';
    var isRedPacket = type === '红包';
    card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:14px;">
            <div style="width:50px;height:50px;background:#1d1d1f;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="color:${isRedPacket ? '#f5c543' : '#fff'};font-size:18px;font-weight:700;">$</div></div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:13px;color:#8e8e93;margin-bottom:2px;">${type}</div>
                <div style="font-size:18px;font-weight:700;color:#000;">$` + amount + `</div>
                <div style="font-size:11px;color:#34c759;margin-top:4px;font-weight:500;">已接收</div>
            </div>
        </div>
    `;
    row.appendChild(avatar);
    row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);
}

// 添加已退还卡片
function addRefundedCard(side, amount) {
    var row = document.createElement('div');
    row.className = 'bubble-row ' + side;
    var avatar = document.createElement('div');
    avatar.className = 'bubble-avatar ' + (side === 'user' ? 'user-avatar' : 'bot-avatar');
    avatar.textContent = side === 'user' ? '我' : (getContactById(window.ChatState.currentContactId)?.avatar || 'AI');
    var card = document.createElement('div');
    card.className = 'payment-card';
    card.style.cssText = 'background:#fff;border-radius:14px;padding:0;width:220px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);';
    card.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:14px;">
            <div style="width:50px;height:50px;background:#1d1d1f;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="color:#fff;font-size:18px;font-weight:700;">$</div></div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:13px;color:#8e8e93;margin-bottom:2px;">转账</div>
                <div style="font-size:18px;font-weight:700;color:#000;">$` + amount.toFixed(2) + `</div>
                <div style="font-size:11px;color:#ff3b30;margin-top:4px;font-weight:500;">已退还</div>
            </div>
        </div>
    `;
    row.appendChild(avatar);
    row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);
}

// ========== 红包 ==========
function openRedPacketModal() { toggleAddPanel(); showPaymentModal('红包', 200); }
function openTransferModal() { toggleAddPanel(); showPaymentModal('转账', 20000); }

function showPaymentModal(type, maxAmount) {
    const overlay = document.createElement('div');
    overlay.className = 'payment-modal-overlay';
    overlay.id = 'paymentModalOverlay';
    overlay.innerHTML = `
        <div class="payment-modal">
            <div class="payment-title">发送${type}</div>
            <div class="payment-amount" id="paymentAmount" onclick="focusPaymentAmount()">00.00</div>
            <input type="number" class="payment-note" id="paymentAmountInput" placeholder="输入金额" style="display:none;" onblur="updatePaymentAmount(this.value)" oninput="updatePaymentAmount(this.value)">
            <input type="text" class="payment-note" id="paymentNoteInput" placeholder="备注，可填可不填">
            <div class="payment-method-header" onclick="togglePaymentMethod()"><span>支付方式</span><span class="arrow" id="paymentArrow">></span></div>
            <div class="payment-method-body" id="paymentMethodBody">
                <div class="payment-method-option selected" onclick="selectPaymentMethod('balance', this)">零钱</div>
                <div class="payment-method-option" onclick="selectPaymentMethod('relative', this)">亲属卡（暂未开放）</div>
            </div>
            <div class="payment-buttons">
                <div class="payment-btn-cancel" onclick="closePaymentModal()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmPayment('${type}', ${maxAmount})">确认发送</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closePaymentModal(); };
}

function focusPaymentAmount() {
    const display = document.getElementById('paymentAmount');
    const input = document.getElementById('paymentAmountInput');
    display.style.display = 'none';
    input.style.display = 'block';
    input.focus();
}
function updatePaymentAmount(val) {
    const display = document.getElementById('paymentAmount');
    if (val) { display.textContent = parseFloat(val).toFixed(2); display.classList.add('filled'); }
    else { display.textContent = '00.00'; display.classList.remove('filled'); }
}
function togglePaymentMethod() {
    const body = document.getElementById('paymentMethodBody');
    const arrow = document.getElementById('paymentArrow');
    if (body && arrow) { const show = body.classList.toggle('show'); arrow.textContent = show ? 'V' : '>'; }
}
function selectPaymentMethod(method, el) {
    el.parentElement.querySelectorAll('.payment-method-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}
function closePaymentModal() { const overlay = document.getElementById('paymentModalOverlay'); if (overlay) overlay.remove(); }
function confirmPayment(type, maxAmount) {
    const amountInput = document.getElementById('paymentAmountInput');
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) { showToast('请输入有效金额'); return; }
    if (amount < 0.01) { showToast('最低金额0.01元'); return; }
    if (amount > maxAmount) { showToast(type + '最高' + maxAmount + '元'); return; }
    const note = document.getElementById('paymentNoteInput').value.trim();
    const method = document.querySelector('.payment-method-option.selected');
    const methodText = method ? method.textContent : '零钱';

    if (methodText === '零钱') {
        var balance = typeof getWalletBalance === 'function' ? getWalletBalance() : 999999;
        if (amount > balance) { showToast('零钱余额不足，请充值'); return; }
        if (typeof setWalletBalance === 'function') {
            setWalletBalance(balance - amount);
            if (typeof addWalletRecord === 'function') addWalletRecord('send', amount, '发送' + type);
        }
    }

    closePaymentModal();
    sendPaymentCard(type, amount, note, methodText);
}
function sendPaymentCard(type, amount, note, method) {
    var msgId = 'pay_' + Date.now();
    setPaymentState(msgId, 'pending');

    const row = document.createElement('div'); row.className = 'bubble-row user';
    const avatar = document.createElement('div'); avatar.className = 'bubble-avatar user-avatar'; avatar.textContent = '我';
    const isRedPacket = type === '红包';
    const card = document.createElement('div');
    card.className = 'payment-card';
    card.setAttribute('data-msg-id', msgId);
    card.setAttribute('data-type', type);
    card.setAttribute('data-amount', amount);
    card.setAttribute('data-note', note || '');
    card.style.cssText = 'background:#fff;border-radius:14px;padding:0;width:220px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:pointer;';
    
    if (isRedPacket) {
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;padding:14px;">
                <div style="width:50px;height:58px;background:#1d1d1f;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
                    <div style="position:absolute;top:-3px;left:50%;transform:translateX(-50%);width:18px;height:10px;background:#fff;border-radius:0 0 6px 6px;"></div>
                    <div style="color:#f5c543;font-size:20px;font-weight:800;margin-top:4px;">$</div>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;color:#8e8e93;margin-bottom:2px;">红包</div>
                    <div style="font-size:14px;color:#000;font-weight:500;" class="payment-note-text">${note || '恭喜发财'}</div>
                    <div class="payment-amount-hidden" style="font-size:18px;font-weight:700;color:#000;display:none;">$` + amount.toFixed(2) + `</div>
                    <div class="payment-status-label" style="font-size:11px;color:#8e8e93;margin-top:4px;display:none;"></div>
                </div>
            </div>`;
    } else {
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;padding:14px;">
                <div style="width:50px;height:50px;background:#1d1d1f;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="color:#fff;font-size:18px;font-weight:700;">$</div></div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;color:#8e8e93;margin-bottom:2px;">转账</div>
                    <div style="font-size:18px;font-weight:700;color:#000;">$` + amount.toFixed(2) + `</div>
                    ${note ? '<div style="font-size:11px;color:#8e8e93;margin-top:2px;">' + note + '</div>' : ''}
                    <div class="payment-status-label" style="font-size:11px;color:#8e8e93;margin-top:4px;display:none;"></div>
                </div>
            </div>`;
    }
    row.appendChild(avatar); row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);

    var nRow = document.createElement('div');
    nRow.className = 'bubble-narration';
    if (type === '红包') {
    nRow.textContent = '（发了一个红包，金额' + amount.toFixed(2) + '元）';
} else {
    nRow.textContent = '（转账' + amount.toFixed(2) + '元）';
    }
    nRow.style.display = 'none';
    document.getElementById('chatMessages').appendChild(nRow);

    saveChatHistory(window.ChatState.currentContactId);
}

function updatePaymentCardUI(msgId, state) {
    setPaymentState(msgId, state);
    var card = document.querySelector('.payment-card[data-msg-id="' + msgId + '"]');
    if (!card) return;
    var type = card.getAttribute('data-type');
    var isRedPacket = type === '红包';
    var label = card.querySelector('.payment-status-label');
    var amountHidden = card.querySelector('.payment-amount-hidden');
    var noteText = card.querySelector('.payment-note-text');

    if (state === 'accepted') {
        if (label) { label.textContent = '已接收'; label.style.display = 'block'; label.style.color = '#34c759'; }
        if (isRedPacket && amountHidden) { amountHidden.style.display = 'block'; }
        if (noteText) noteText.style.display = 'none';
    } else if (state === 'refunded') {
        if (label) { label.textContent = '已退还'; label.style.display = 'block'; label.style.color = '#ff3b30'; }
        if (noteText) noteText.style.display = 'none';
    }
}

// ========== 角色发送红包/转账卡片 ==========
function sendBotPaymentCard(type, amount, note) {
    var msgId = 'pay_bot_' + Date.now();
    setPaymentState(msgId, 'pending');
    var row = document.createElement('div'); row.className = 'bubble-row assistant';
    var avatar = document.createElement('div'); avatar.className = 'bubble-avatar bot-avatar';
    avatar.textContent = getContactById(window.ChatState.currentContactId)?.avatar || 'AI';
    var isRedPacket = type === '红包';
    var card = document.createElement('div');
    card.className = 'payment-card';
    card.setAttribute('data-msg-id', msgId);
    card.setAttribute('data-type', type);
    card.setAttribute('data-amount', amount);
    card.setAttribute('data-note', note || '');
    card.style.cssText = 'background:#fff;border-radius:14px;padding:0;width:220px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:pointer;';
    if (isRedPacket) {
        card.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:14px;width:220px;max-width:220px;box-sizing:border-box;">
            <div style="width:50px;height:58px;background:#1d1d1f;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;">
                    <div style="position:absolute;top:-3px;left:50%;transform:translateX(-50%);width:18px;height:10px;background:#fff;border-radius:0 0 6px 6px;"></div>
                    <div style="color:#f5c543;font-size:20px;font-weight:800;margin-top:4px;">$</div>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;color:#8e8e93;margin-bottom:2px;">红包</div>
                    <div style="font-size:14px;color:#000;font-weight:500;" class="payment-note-text">${note || '恭喜发财'}</div>
                    <div class="payment-amount-hidden" style="font-size:18px;font-weight:700;color:#000;display:none;">$` + amount.toFixed(2) + `</div>
                    <div class="payment-status-label" style="font-size:11px;color:#8e8e93;margin-top:4px;display:none;"></div>
                </div>
            </div>`;
    } else {
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;padding:14px;">
                <div style="width:50px;height:50px;background:#1d1d1f;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="color:#fff;font-size:18px;font-weight:700;">$</div></div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;color:#8e8e93;margin-bottom:2px;">转账</div>
                    <div style="font-size:18px;font-weight:700;color:#000;">$` + amount.toFixed(2) + `</div>
                    <div class="payment-status-label" style="font-size:11px;color:#8e8e93;margin-top:4px;display:none;"></div>
                </div>
            </div>`;
    }
    row.appendChild(avatar); row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);

    var nRow = document.createElement('div');
nRow.className = 'bubble-narration';
nRow.textContent = '（' + type + amount.toFixed(2) + '元）';
nRow.style.display = 'none';
document.getElementById('chatMessages').appendChild(nRow);
    
    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 角色发送黑卡 ==========
function sendBotBlackCard(amount) {
    var msgId = 'blackcard_bot_' + Date.now();
    setPaymentState(msgId, 'pending');
    var row = document.createElement('div');
    row.className = 'bubble-row assistant';
    var avatar = document.createElement('div');
    avatar.className = 'bubble-avatar bot-avatar';
    avatar.textContent = getContactById(window.ChatState.currentContactId)?.avatar || 'AI';
    var card = document.createElement('div');
    card.className = 'payment-card';
    card.setAttribute('data-msg-id', msgId);
    card.setAttribute('data-type', '黑卡');
    card.setAttribute('data-amount', amount);
    card.style.cssText = 'background:linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);border-radius:14px;padding:14px;width:180px;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.2);cursor:pointer;';
    card.innerHTML = ''
    + '<div style="font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:2px;margin-bottom:12px;">BLACK CARD</div>'
    + '<div style="font-size:22px;font-weight:700;margin-bottom:2px;">¥' + amount.toFixed(2) + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
    + '<div style="font-size:10px;color:rgba(255,255,255,0.5);">可用额度</div>'
    + '<div style="font-size:10px;color:rgba(255,255,255,0.4);">角色赠送</div>'
    + '</div>';
    row.appendChild(avatar);
    row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);

    var nRow = document.createElement('div');
    nRow.className = 'bubble-narration';
    nRow.textContent = '（赠送了一张黑卡，额度¥' + amount.toFixed(2) + '）';
    nRow.style.display = 'none';
    document.getElementById('chatMessages').appendChild(nRow);

    saveChatHistory(window.ChatState.currentContactId);
}

// ========== 链接 ==========
function openFileSend() {
    toggleAddPanel();
    const overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'linkModalOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">分享链接</div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:10px;">复制抖音/小红书/B站链接发给角色</div>
            <textarea class="caption-textarea" id="linkInput" placeholder="粘贴链接..." style="height:80px;"></textarea>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeLinkModal()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmSendLink()">发送</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeLinkModal(); };
}

function closeLinkModal() {
    const overlay = document.getElementById('linkModalOverlay');
    if (overlay) overlay.remove();
}

function confirmSendLink() {
    const link = document.getElementById('linkInput').value.trim();
    closeLinkModal();
    if (!link) return;

    const row = document.createElement('div');
    row.className = 'bubble-row user';
    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar user-avatar';
    avatar.textContent = '我';
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:14px;padding:12px 14px;max-width:220px;box-shadow:0 2px 8px rgba(0,0,0,0.06);';
    let displayLink = link;
    try {
        const url = new URL(link);
        displayLink = url.hostname + url.pathname.substring(0, 15) + (url.pathname.length > 15 ? '...' : '');
    } catch(e) {}
    card.innerHTML = `
        <div style="font-size:13px;font-weight:500;color:#000;margin-bottom:4px;">分享链接</div>
        <div style="font-size:11px;color:#007aff;word-break:break-all;">${displayLink}</div>
    `;
    card.onclick = function() { window.open(link, '_blank'); };
    row.appendChild(avatar);
    row.appendChild(card);
    document.getElementById('chatMessages').appendChild(row);

    var nRow = document.createElement('div');
    nRow.className = 'bubble-narration';
    nRow.textContent = '（分享了一个链接）';
    nRow.style.display = 'none';
    document.getElementById('chatMessages').appendChild(nRow);

    saveChatHistory(window.ChatState.currentContactId);
    }

function sendShopCard(contactId, item) {
    var cardHTML = '<div class="bubble-row user">'
        + '<div class="bubble-avatar user-avatar">我</div>'
        + '<div class="shop-chat-card" style="background:#fff;border-radius:14px;padding:12px;width:220px;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:flex;gap:10px;align-items:center;cursor:pointer;">'
        + (item.img ? '<div style="width:50px;height:50px;border-radius:8px;background-image:url(' + item.img + ');background-size:cover;background-position:center;flex-shrink:0;"></div>' : '')
        + '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:500;color:#000;">' + item.name + '</div><div style="font-size:15px;font-weight:700;color:#000;margin-top:2px;">¥' + item.price + '</div></div>'
        + '</div></div>';
    var narrationHTML = '<div class="bubble-narration" style="display:none;">（想买：' + item.name + '，¥' + item.price + '，请求买单）</div>';

    var messages = document.getElementById('chatMessages');
    var isCurrentContactOpen = messages && window.ChatState && window.ChatState.currentContactId === contactId;

    if (isCurrentContactOpen) {
        messages.insertAdjacentHTML('beforeend', cardHTML + narrationHTML);
        messages.scrollTop = messages.scrollHeight;
        saveChatHistory(contactId);
    } else {
        var storageKey = 'chat_history_' + contactId;
        var saved = localStorage.getItem(storageKey) || '';
        var container = document.createElement('div');
        container.innerHTML = saved + cardHTML + narrationHTML;
        localStorage.setItem(storageKey, container.innerHTML);
    }
}

// ========== 线下模式切换 ==========
function switchToOffline() {
    toggleAddPanel();
    var currentId = window.ChatState.currentContactId || (window.ChatConfig && window.ChatConfig.contacts[0] ? window.ChatConfig.contacts[0].id : 'c1');
    if (typeof saveChatHistory === 'function') saveChatHistory(currentId);
    
    var summaryToast = document.createElement('div');
    summaryToast.className = 'global-toast';
    summaryToast.textContent = '正在总结对话…';
    document.body.appendChild(summaryToast);
    
    window.ChatState.isOfflineMode = true;
    var contactId = window.ChatState.currentContactId || currentId;
    
    if (typeof generateSummary === 'function') {
        generateSummary(currentId).then(function(summary) {
            if (summary && typeof saveShiyilinSummary === 'function') {
                var now = new Date();
                var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
                saveShiyilinSummary(currentId, dateStr, summary);
            }
            if (summaryToast) summaryToast.remove();
            enterChat(contactId);
        }).catch(function(){
            if (summaryToast) summaryToast.remove();
            enterChat(contactId);
        });
    } else {
        if (summaryToast) summaryToast.remove();
        enterChat(contactId);
    }
}

function switchToOnline() {
    toggleAddPanel();
    var currentId = window.ChatState.currentContactId || (window.ChatConfig && window.ChatConfig.contacts[0] ? window.ChatConfig.contacts[0].id : 'c1');
    if (typeof saveChatHistory === 'function') saveChatHistory(currentId);
    
    var summaryToast = document.createElement('div');
    summaryToast.className = 'global-toast';
    summaryToast.textContent = '正在总结对话…';
    document.body.appendChild(summaryToast);
    
    window.ChatState.isOfflineMode = false;
    var contactId = window.ChatState.currentContactId || currentId;
    
    if (typeof generateSummary === 'function') {
        generateSummary(currentId).then(function(summary) {
            if (summary && typeof saveShiyilinSummary === 'function') {
                var now = new Date();
                var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
                saveShiyilinSummary(currentId, dateStr, summary);
            }
            if (summaryToast) summaryToast.remove();
            enterChat(contactId);
        }).catch(function(){
            if (summaryToast) summaryToast.remove();
            enterChat(contactId);
        });
    } else {
        if (summaryToast) summaryToast.remove();
        enterChat(contactId);
    }
}

function selectOfflinePreset(min, max, el) {
    localStorage.setItem('offline_word_min', min);
    localStorage.setItem('offline_word_max', max);
    document.querySelectorAll('.offline-preset-btn').forEach(function(b) { b.style.background = ''; b.style.color = ''; });
    el.style.background = '#1d1d1f';
    el.style.color = '#fff';
    var valEl = document.getElementById('offlineWordLimitVal');
    if (valEl) valEl.textContent = min + '-' + max;
    showToast('字数设为' + min + '-' + max);
}

function confirmOfflineCustom() {
    var min = parseInt(document.getElementById('offlineCustomMin').value) || 100;
    var max = parseInt(document.getElementById('offlineCustomMax').value) || 300;
    if (min > max) { var tmp = min; min = max; max = tmp; }
    if (min < 50) min = 50;
    localStorage.setItem('offline_word_min', min);
    localStorage.setItem('offline_word_max', max);
    document.querySelectorAll('.offline-preset-btn').forEach(function(b) { b.style.background = ''; b.style.color = ''; });
    var valEl = document.getElementById('offlineWordLimitVal');
    if (valEl) valEl.textContent = min + '-' + max;
    showToast('字数设为' + min + '-' + max);
}
