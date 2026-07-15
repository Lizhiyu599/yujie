/**
 * 玉界 - 视界（美化资源库）
 * 包含：气泡、字体、其他、我的 四个标签页
 * 数据持久化 localStorage，收藏系统
 */

// ========== 预设数据 ==========
function getShijieData() {
    var raw = localStorage.getItem('shijie_data');
    if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
    }
    var defaults = {
        bubbles: [],
        fonts: [],
        others: []
    };
    localStorage.setItem('shijie_data', JSON.stringify(defaults));
    return defaults;
}

function saveShijieData(data) {
    localStorage.setItem('shijie_data', JSON.stringify(data));
}

function getFavorites() {
    var raw = localStorage.getItem('shijie_favorites');
    if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
    }
    return [];
}

function saveFavorites(favs) {
    localStorage.setItem('shijie_favorites', JSON.stringify(favs));
}

function toggleFavorite(itemId) {
    var favs = getFavorites();
    var idx = favs.indexOf(itemId);
    if (idx >= 0) {
        favs.splice(idx, 1);
    } else {
        favs.push(itemId);
    }
    saveFavorites(favs);
    return idx < 0;
}

function isFavorite(itemId) {
    var favs = getFavorites();
    return favs.indexOf(itemId) >= 0;
}

// ========== 当前状态 ==========
var shijieTab = 'bubbles';
var shijieSearch = '';
var shijieFavFilter = 'all';
var shijieLastScrollY = 0;
var shijieSearchVisible = true;

// ========== 打开视界 ==========
function openShijie() {
    var appWindow = document.getElementById('shijieAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'shijieAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    shijieTab = 'bubbles';
    shijieSearch = '';
    shijieFavFilter = 'all';
    shijieLastScrollY = 0;
    shijieSearchVisible = true;
    renderShijie();
    appWindow.style.display = 'flex';
}

function closeShijie() {
    var appWindow = document.getElementById('shijieAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染外壳 ==========
function renderShijie() {
    var appWindow = document.getElementById('shijieAppWindow');
    if (!appWindow) return;

    var tabTitles = { bubbles: '气泡', fonts: '字体', others: '其他', me: '我的' };
    var title = tabTitles[shijieTab] || '视界';

    var searchHTML = '';
    if (shijieTab !== 'me') {
        searchHTML = '<div class="sj-search-bar" id="sjSearchBar" style="' + (shijieSearchVisible ? '' : 'display:none;') + '"><input type="text" class="sj-search-input" id="sjSearchInput" placeholder="搜索..." value="' + shijieSearch + '" oninput="onShijieSearch(this.value)"></div>';
    }

    appWindow.innerHTML = ''
        + '<div class="shijie-app">'
        + '<div class="sj-top-bar">'
        + '<div class="sj-back-btn" onclick="closeShijie()">‹</div>'
        + '<div class="sj-top-title">' + title + '</div>'
        + '<div class="sj-top-spacer"></div>'
        + '</div>'
        + searchHTML
        + '<div class="sj-body" id="sjBody" onscroll="onShijieScroll()">'
        + '<div class="sj-content" id="sjContent"></div>'
        + '</div>'
        + '<div class="sj-bottom-bar">'
        + '<span class="sj-tab ' + (shijieTab === 'bubbles' ? 'active' : '') + '" onclick="switchShijieTab(\'bubbles\')">气泡</span>'
        + '<span class="sj-tab ' + (shijieTab === 'fonts' ? 'active' : '') + '" onclick="switchShijieTab(\'fonts\')">字体</span>'
        + '<span class="sj-tab ' + (shijieTab === 'others' ? 'active' : '') + '" onclick="switchShijieTab(\'others\')">其他</span>'
        + '<span class="sj-tab ' + (shijieTab === 'me' ? 'active' : '') + '" onclick="switchShijieTab(\'me\')">我的</span>'
        + '</div>'
        + '</div>';

    renderShijieContent();
}

// ========== 切换标签 ==========
function switchShijieTab(tab) {
    shijieTab = tab;
    shijieSearch = '';
    shijieFavFilter = 'all';
    shijieLastScrollY = 0;
    shijieSearchVisible = true;
    renderShijie();
}

// ========== 搜索 ==========
function onShijieSearch(val) {
    shijieSearch = val;
    renderShijieContent();
}

// ========== 滚动控制搜索栏显隐 ==========
function onShijieScroll() {
    var body = document.getElementById('sjBody');
    if (!body) return;
    var currentY = body.scrollTop;
    if (currentY > shijieLastScrollY && currentY > 40) {
        if (shijieSearchVisible) {
            shijieSearchVisible = false;
            var bar = document.getElementById('sjSearchBar');
            if (bar) bar.style.display = 'none';
        }
    } else if (currentY < shijieLastScrollY || currentY < 10) {
        if (!shijieSearchVisible) {
            shijieSearchVisible = true;
            var bar = document.getElementById('sjSearchBar');
            if (bar) bar.style.display = '';
        }
    }
    shijieLastScrollY = currentY;
}

// ========== 渲染内容区 ==========
function renderShijieContent() {
    var content = document.getElementById('sjContent');
    if (!content) return;

    if (shijieTab === 'me') {
        renderFavoritesContent(content);
        return;
    }

    var data = getShijieData();

    if (shijieSearch) {
        var q = shijieSearch.toLowerCase();
        var allResults = { bubbles: [], fonts: [], others: [] };
        ['bubbles', 'fonts', 'others'].forEach(function(type) {
            var items = data[type] || [];
            allResults[type] = items.filter(function(item) {
                return item.name.toLowerCase().indexOf(q) >= 0
                    || (item.tags && item.tags.join(' ').toLowerCase().indexOf(q) >= 0)
                    || (item.author && item.author.toLowerCase().indexOf(q) >= 0);
            });
        });
        var html = '';
        if (allResults.bubbles.length > 0) {
            html += '<div class="sj-section-title">气泡</div>';
            html += renderBubbleCards(allResults.bubbles);
        }
        if (allResults.fonts.length > 0) {
            html += '<div class="sj-section-title">字体</div>';
            html += renderFontCards(allResults.fonts);
        }
        if (allResults.others.length > 0) {
            html += '<div class="sj-section-title">其他</div>';
            html += renderOtherCards(allResults.others);
        }
        if (!html) {
            html = '<div class="sj-empty">未找到相关内容</div>';
        }
        content.innerHTML = html;
        return;
    }

    var typeKey = shijieTab;
    var items = data[typeKey] || [];

    if (items.length === 0) {
        content.innerHTML = '<div class="sj-empty">暂无内容</div>';
        return;
    }

    var html = '';
    if (shijieTab === 'bubbles') {
        html = renderBubbleCards(items);
    } else if (shijieTab === 'fonts') {
        html = renderFontCards(items);
    } else if (shijieTab === 'others') {
        html = renderOtherCards(items);
    }

    content.innerHTML = html;
}

// ========== 渲染气泡卡片 ==========
function renderBubbleCards(items) {
    var html = '';
    items.forEach(function(item) {
        var liked = isFavorite(item.id);
        html += ''
            + '<div class="sj-card" onclick="previewBubble(\'' + item.id + '\')">'
            + '<div class="sj-card-preview">'
            + '<div class="sj-bubble-preview">'
            + '<div class="sj-bubble-user" style="' + (item.cssUser || '') + '">你好呀</div>'
            + '<div class="sj-bubble-assistant" style="' + (item.cssAssistant || '') + '">今天过得怎么样</div>'
            + '</div>'
            + '</div>'
            + '<div class="sj-card-info">'
            + '<div class="sj-card-name">' + item.name + '</div>'
            + '<div class="sj-card-author">' + (item.author || '') + '</div>'
            + '</div>'
            + '<div class="sj-card-actions">'
            + '<span class="sj-btn-copy" onclick="event.stopPropagation(); copyBubbleCSS(\'' + item.id + '\')">复制CSS</span>'
            + '<span class="sj-btn-fav ' + (liked ? 'liked' : '') + '" data-id="' + item.id + '" onclick="event.stopPropagation(); onFavClick(this, \'' + item.id + '\')">' + (liked ? '♥' : '♡') + '</span>'
            + '</div>'
            + '</div>';
    });
    return html;
}

// ========== 渲染字体卡片（两列） ==========
function renderFontCards(items) {
    var html = '<div class="sj-font-grid">';
    items.forEach(function(item) {
        var liked = isFavorite(item.id);
        html += ''
            + '<div class="sj-font-card" onclick="previewFont(\'' + item.id + '\')">'
            + '<div class="sj-font-preview" style="font-family:' + (item.fontFamily || 'inherit') + ';">'
            + '<div class="sj-font-sample">你好，今天天气不错</div>'
            + '<div class="sj-font-sample-en">Hello, nice day</div>'
            + '</div>'
            + '<div class="sj-card-info">'
            + '<div class="sj-card-name">' + item.name + '</div>'
            + '</div>'
            + '<div class="sj-card-actions">'
            + '<span class="sj-btn-copy" onclick="event.stopPropagation(); copyFontCSS(\'' + item.id + '\')">复制CSS</span>'
            + '<span class="sj-btn-fav ' + (liked ? 'liked' : '') + '" data-id="' + item.id + '" onclick="event.stopPropagation(); onFavClick(this, \'' + item.id + '\')">' + (liked ? '♥' : '♡') + '</span>'
            + '</div>'
            + '</div>';
    });
    html += '</div>';
    return html;
}

// ========== 渲染其他卡片 ==========
function renderOtherCards(items) {
    var html = '';
    items.forEach(function(item) {
        var liked = isFavorite(item.id);
        html += ''
            + '<div class="sj-card" onclick="previewOther(\'' + item.id + '\')">'
            + '<div class="sj-card-preview">'
            + '<div class="sj-other-preview">' + (item.previewHTML || '<div style="padding:20px;text-align:center;color:#8e8e93;">预览</div>') + '</div>'
            + '</div>'
            + '<div class="sj-card-info">'
            + '<div class="sj-card-name">' + item.name + '</div>'
            + '<div class="sj-card-author">' + (item.author || '') + '</div>'
            + '</div>'
            + '<div class="sj-card-actions">'
            + '<span class="sj-btn-copy" onclick="event.stopPropagation(); copyOtherCSS(\'' + item.id + '\')">复制CSS</span>'
            + '<span class="sj-btn-fav ' + (liked ? 'liked' : '') + '" data-id="' + item.id + '" onclick="event.stopPropagation(); onFavClick(this, \'' + item.id + '\')">' + (liked ? '♥' : '♡') + '</span>'
            + '</div>'
            + '</div>';
    });
    return html;
}

// ========== 复制气泡 CSS ==========
function copyBubbleCSS(itemId) {
    var data = getShijieData();
    var item = data.bubbles.find(function(b) { return b.id === itemId; });
    if (!item) return;
    var css = '';
    if (item.hideAvatar) {
        css += '.bubble-row .bubble-avatar {\n  display: none !important;\n}\n\n';
    }
    if (item.cssUser) css += '.bubble-user {\n' + item.cssUser + '\n}\n\n';
    if (item.cssAssistant) css += '.bubble-assistant {\n' + item.cssAssistant + '\n}\n';
    copyToClipboard(css.trim());
    showToast('气泡CSS已复制，去美化软件粘贴吧');
}

// ========== 复制字体 CSS ==========
function copyFontCSS(itemId) {
    var data = getShijieData();
    var item = data.fonts.find(function(f) { return f.id === itemId; });
    if (!item) return;
    var css = '';
    if (item.importURL) css += '@import url(' + item.importURL + ');\n\n';
    css += '* {\n  font-family: ' + (item.fontFamily || 'inherit') + ';\n}\n';
    copyToClipboard(css.trim());
    showToast('字体CSS已复制，去美化软件粘贴吧');
}

// ========== 复制其他 CSS ==========
function copyOtherCSS(itemId) {
    var data = getShijieData();
    var item = data.others.find(function(o) { return o.id === itemId; });
    if (!item || !item.css) return;
    copyToClipboard(item.css.trim());
    showToast('CSS已复制，去美化软件粘贴吧');
}

// ========== 复制到剪贴板 ==========
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function() {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
}

// ========== 收藏点击 ==========
function onFavClick(el, itemId) {
    var liked = toggleFavorite(itemId);
    if (liked) {
        el.classList.add('liked');
        el.textContent = '♥';
    } else {
        el.classList.remove('liked');
        el.textContent = '♡';
    }
    showToast(liked ? '已收藏' : '已取消收藏');
}

// ========== 预览弹窗 ==========
function previewBubble(itemId) {
    var data = getShijieData();
    var item = data.bubbles.find(function(b) { return b.id === itemId; });
    if (!item) return;

    var overlay = document.createElement('div');
    overlay.className = 'sj-preview-overlay';
    overlay.id = 'sjPreviewOverlay';
    overlay.innerHTML = ''
        + '<div class="sj-preview-panel">'
        + '<div class="sj-preview-handle" id="sjPreviewHandle"></div>'
        + '<div class="sj-preview-title">' + item.name + '</div>'
        + '<div class="sj-preview-messages">'
        + '<div class="sj-preview-msg user" style="' + (item.cssUser || '') + '">你好呀，今天过得怎么样？</div>'
        + '<div class="sj-preview-msg assistant" style="' + (item.cssAssistant || '') + '">还不错呢，刚看完一本书</div>'
        + '<div class="sj-preview-msg user" style="' + (item.cssUser || '') + '">什么书呀？推荐给我看看</div>'
        + '<div class="sj-preview-msg assistant" style="' + (item.cssAssistant || '') + '">一本关于星星的小说，挺浪漫的</div>'
        + '</div>'
        + '<div class="sj-preview-actions">'
        + '<span class="sj-btn-copy" onclick="copyBubbleCSS(\'' + itemId + '\')">复制CSS</span>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);

    overlay.onclick = function(e) { if (e.target === overlay) closePreview(); };
    setupPreviewHandle();
}

function previewFont(itemId) {
    var data = getShijieData();
    var item = data.fonts.find(function(f) { return f.id === itemId; });
    if (!item) return;

    var overlay = document.createElement('div');
    overlay.className = 'sj-preview-overlay';
    overlay.id = 'sjPreviewOverlay';
    overlay.innerHTML = ''
        + '<div class="sj-preview-panel">'
        + '<div class="sj-preview-handle" id="sjPreviewHandle"></div>'
        + '<div class="sj-preview-title">' + item.name + '</div>'
        + '<div class="sj-font-big-preview" style="font-family:' + (item.fontFamily || 'inherit') + ';">'
        + '<div class="sj-font-big-cn">你好，今天天气不错</div>'
        + '<div class="sj-font-big-en">The quick brown fox jumps over the lazy dog.</div>'
        + '<div class="sj-font-big-numbers">0123456789</div>'
        + '</div>'
        + '<div class="sj-preview-actions">'
        + '<span class="sj-btn-copy" onclick="copyFontCSS(\'' + itemId + '\')">复制CSS</span>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);

    overlay.onclick = function(e) { if (e.target === overlay) closePreview(); };
    setupPreviewHandle();
}

function previewOther(itemId) {
    var data = getShijieData();
    var item = data.others.find(function(o) { return o.id === itemId; });
    if (!item) return;

    var overlay = document.createElement('div');
    overlay.className = 'sj-preview-overlay';
    overlay.id = 'sjPreviewOverlay';
    overlay.innerHTML = ''
        + '<div class="sj-preview-panel">'
        + '<div class="sj-preview-handle" id="sjPreviewHandle"></div>'
        + '<div class="sj-preview-title">' + item.name + '</div>'
        + '<div class="sj-other-big-preview">' + (item.previewHTML || '<div style="padding:40px;text-align:center;color:#8e8e93;">暂无预览</div>') + '</div>'
        + '<div class="sj-preview-actions">'
        + '<span class="sj-btn-copy" onclick="copyOtherCSS(\'' + itemId + '\')">复制CSS</span>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);

    overlay.onclick = function(e) { if (e.target === overlay) closePreview(); };
    setupPreviewHandle();
}

function closePreview() {
    var overlay = document.getElementById('sjPreviewOverlay');
    if (overlay) overlay.remove();
}

function setupPreviewHandle() {
    var handle = document.getElementById('sjPreviewHandle');
    if (!handle) return;
    var startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) { if (e.touches[0].clientY - startY > 40) closePreview(); });
    handle.addEventListener('click', function() { closePreview(); });
}

// ========== 收藏页面 ==========
function renderFavoritesContent(content) {
    var favs = getFavorites();
    if (favs.length === 0) {
        content.innerHTML = '<div class="sj-empty">暂无收藏</div>';
        return;
    }

    var data = getShijieData();
    var allItems = [];
    favs.forEach(function(fid) {
        ['bubbles', 'fonts', 'others'].forEach(function(type) {
            var item = data[type].find(function(d) { return d.id === fid; });
            if (item) {
                item._type = type;
                allItems.push(item);
            }
        });
    });

    if (shijieFavFilter !== 'all') {
        allItems = allItems.filter(function(item) {
            return item._type === shijieFavFilter;
        });
    }

    var filterHTML = ''
        + '<div class="sj-fav-filter">'
        + '<span class="sj-fav-filter-item ' + (shijieFavFilter === 'all' ? 'active' : '') + '" onclick="onFavFilter(\'all\')">全部</span>'
        + '<span class="sj-fav-filter-item ' + (shijieFavFilter === 'bubbles' ? 'active' : '') + '" onclick="onFavFilter(\'bubbles\')">气泡</span>'
        + '<span class="sj-fav-filter-item ' + (shijieFavFilter === 'fonts' ? 'active' : '') + '" onclick="onFavFilter(\'fonts\')">字体</span>'
        + '<span class="sj-fav-filter-item ' + (shijieFavFilter === 'others' ? 'active' : '') + '" onclick="onFavFilter(\'others\')">其他</span>'
        + '</div>';

    var html = filterHTML;

    if (allItems.length === 0) {
        html += '<div class="sj-empty">暂无此类收藏</div>';
    } else {
        allItems.forEach(function(item) {
            var typeLabel = { bubbles: '气泡', fonts: '字体', others: '其他' }[item._type] || '';
            html += ''
                + '<div class="sj-card" onclick="openFavItem(\'' + item._type + '\', \'' + item.id + '\')">'
                + '<div class="sj-card-preview">'
                + renderFavItemPreview(item)
                + '</div>'
                + '<div class="sj-card-info">'
                + '<div class="sj-card-name">' + item.name + '</div>'
                + '<div class="sj-card-type-badge">' + typeLabel + '</div>'
                + '</div>'
                + '<div class="sj-card-actions">'
                + '<span class="sj-btn-fav liked" data-id="' + item.id + '" onclick="event.stopPropagation(); onFavClick(this, \'' + item.id + '\')">♥</span>'
                + '</div>'
                + '</div>';
        });
    }

    content.innerHTML = html;
}

function renderFavItemPreview(item) {
    if (item._type === 'bubbles') {
        return ''
            + '<div class="sj-bubble-preview">'
            + '<div class="sj-bubble-user" style="' + (item.cssUser || '') + '">你好呀</div>'
            + '<div class="sj-bubble-assistant" style="' + (item.cssAssistant || '') + '">今天怎么样</div>'
            + '</div>';
    } else if (item._type === 'fonts') {
        return '<div class="sj-font-preview" style="font-family:' + (item.fontFamily || 'inherit') + ';">'
            + '<div class="sj-font-sample">你好，今天天气不错</div>'
            + '</div>';
    } else if (item._type === 'others') {
        return '<div class="sj-other-preview">' + (item.previewHTML || '<div style="padding:10px;text-align:center;color:#8e8e93;">预览</div>') + '</div>';
    }
    return '';
}

function onFavFilter(filter) {
    shijieFavFilter = filter;
    renderShijieContent();
}

function openFavItem(type, itemId) {
    if (type === 'bubbles') previewBubble(itemId);
    else if (type === 'fonts') previewFont(itemId);
    else if (type === 'others') previewOther(itemId);
}

// ========== 添加/删除数据（管理用） ==========
function addShijieItem(type, item) {
    var data = getShijieData();
    if (!data[type]) data[type] = [];
    item.id = item.id || (type + '_' + Date.now());
    data[type].push(item);
    saveShijieData(data);
}

function removeShijieItem(type, itemId) {
    var data = getShijieData();
    if (!data[type]) return;
    data[type] = data[type].filter(function(item) { return item.id !== itemId; });
    saveShijieData(data);
}

// ========== 初始化示例数据（首次使用时） ==========
function initShijieSampleData() {
    localStorage.removeItem('shijie_data');
    var data = getShijieData();

    data.bubbles.push({
        id: 'bubble_no_avatar',
        name: '无头像气泡',
        author: '官方',
        cssUser: 'background: #fff !important; color: #000 !important; border-top-right-radius: 4px !important; border-radius: 18px !important; box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important; padding: 10px 14px !important; font-size: 14px !important;',
        cssAssistant: 'background: #1d1d1f !important; color: #fff !important; border-top-left-radius: 4px !important; border-radius: 18px !important; box-shadow: 0 1px 4px rgba(0,0,0,0.1) !important; padding: 10px 14px !important; font-size: 14px !important;',
        hideAvatar: true,
        tags: ['简约', '无头像']
    });

    saveShijieData(data);
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {
    initShijieSampleData();
});
