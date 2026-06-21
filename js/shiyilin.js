/**
 * 拾忆林 - 角色聊天总结
 * 复古牛皮纸风格书架，仿真翻页
 * 每创建一个角色自动生成一本书
 */

// ========== 数据存储 ==========
function getShiyilinBooks() {
    var raw = localStorage.getItem('shiyilin_books');
    return raw ? JSON.parse(raw) : [];
}

function saveShiyilinBooks(books) {
    localStorage.setItem('shiyilin_books', JSON.stringify(books));
}

// ========== 同步角色，自动创建/删除书籍 ==========
function syncShiyilinBooks() {
    var books = getShiyilinBooks();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var bookMap = {};
    books.forEach(function(b) { bookMap[b.contactId] = b; });

    var newBooks = [];
    contacts.forEach(function(c) {
        if (bookMap[c.id]) {
            newBooks.push(bookMap[c.id]);
        } else {
            newBooks.push({
                id: 'sl_book_' + c.id,
                contactId: c.id,
                contactName: c.name,
                summary: '',
                createdAt: Date.now()
            });
        }
    });

    var contactIds = {};
    contacts.forEach(function(c) { contactIds[c.id] = true; });
    newBooks = newBooks.filter(function(b) { return contactIds[b.contactId]; });

    saveShiyilinBooks(newBooks);
    return newBooks;
}

// ========== 打开拾忆林 ==========
function openShiyilin() {
    var appWindow = document.getElementById('shiyilinAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'shiyilinAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f5f0e8;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    renderShiyilin();
    appWindow.style.display = 'flex';
}

function closeShiyilin() {
    var appWindow = document.getElementById('shiyilinAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染书架 ==========
function renderShiyilin() {
    var appWindow = document.getElementById('shiyilinAppWindow');
    if (!appWindow) return;

    var books = syncShiyilinBooks();

    var rowsHTML = '';
    if (books.length === 0) {
        rowsHTML = '<div class="sl-empty">书架上还没有书<br>创建角色后会自动生成</div>';
    } else {
        for (var i = 0; i < books.length; i += 2) {
            rowsHTML += '<div class="sl-row">';
            for (var j = i; j < Math.min(i + 2, books.length); j++) {
                rowsHTML += `
                    <div class="sl-book" onclick="openShiyilinBook('${books[j].contactId}')">
                        <div class="sl-book-cover">
                            <div class="sl-cover-inner-border"></div>
                            <div class="sl-cover-inner-border2"></div>
                            <div class="sl-cover-diamond"></div>
                            <div class="sl-cover-cross"></div>
                            <div class="sl-cover-corners">
                                <span class="sl-corner-tl">✦</span>
                                <span class="sl-corner-tr">✦</span>
                                <span class="sl-corner-bl">✦</span>
                                <span class="sl-corner-br">✦</span>
                            </div>
                            <div class="sl-cover-corner-vine tl">🌿</div>
                            <div class="sl-cover-corner-vine tr">🌿</div>
                            <div class="sl-cover-corner-vine bl">🌿</div>
                            <div class="sl-cover-corner-vine br">🌿</div>
                            <div class="sl-cover-badge"></div>
                            <div class="sl-cover-top-ornament"></div>
                            <div class="sl-cover-bottom-ornament"></div>
                            <div class="sl-cover-top-star">✧ ✧ ✧</div>
                            <div class="sl-cover-bottom-vine">❦   ❦   ❦</div>
                            <div class="sl-cover-english">Good luck, in countless tomorrow</div>
                            <div class="sl-cover-english-line2">keep your spirit free</div>
                        </div>
                        <div class="sl-book-spine">
                            <div class="sl-spine-name">${books[j].contactName}</div>
                        </div>
                    </div>
                `;
            }
            if (books.length % 2 !== 0 && i === books.length - 1) {
                rowsHTML += '<div class="sl-book" style="visibility:hidden;"></div>';
            }
            rowsHTML += '</div>';
        }
    }

    appWindow.innerHTML = `
        <div class="shiyilin-app">
            <div class="sl-top-bar">
                <div class="sl-back-btn" onclick="closeShiyilin()">‹</div>
                <div class="sl-title">拾 忆 林</div>
                <div style="width:36px;"></div>
            </div>
            <div class="sl-shelf">
                ${rowsHTML}
            </div>
        </div>
    `;
}

// ========== 打开一本书（全屏放大，默认显示封面） ==========
function openShiyilinBook(contactId) {
    var books = getShiyilinBooks();
    var book = null;
    for (var i = 0; i < books.length; i++) {
        if (books[i].contactId === contactId) { book = books[i]; break; }
    }
    if (!book) return;

    var overlay = document.createElement('div');
    overlay.className = 'sl-book-open';
    overlay.id = 'slBookOpen';
    overlay.innerHTML = `
        <div class="sl-book-viewer" onclick="event.stopPropagation()">
            <div class="sl-viewer-cover" id="slViewerCover">
                <div class="sl-viewer-vine tl">🌿</div>
                <div class="sl-viewer-vine tr">🌿</div>
                <div class="sl-viewer-vine bl">🌿</div>
                <div class="sl-viewer-vine br">🌿</div>
                <div class="sl-viewer-badge"></div>
                <div class="sl-viewer-star">✧ ✧ ✧</div>
                <div class="sl-viewer-gold-line"></div>
                <div class="sl-viewer-english">Good luck, in countless tomorrow</div>
                <div class="sl-viewer-english-line2">keep your spirit free</div>
                <div class="sl-viewer-bottom-line"></div>
                <div class="sl-viewer-hint">轻触翻开</div>
            </div>
        </div>
        <div class="sl-pages-bottom" id="slPagesBottom">
            <button class="sl-nav-btn" id="slPrevBtn" onclick="event.stopPropagation(); openShiyilinPages('${contactId}')">‹ 上一页</button>
            <button class="sl-nav-btn" id="slNextBtn" onclick="event.stopPropagation(); openShiyilinPages('${contactId}')">下一页 ›</button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('slViewerCover').addEventListener('click', function() {
        openShiyilinPages(contactId);
    });

    overlay.onclick = function(e) {
        if (e.target === overlay) closeShiyilinBook();
    };
}

// ========== 翻开封面，显示内页（即时显示） ==========
function openShiyilinPages(contactId) {
    var cover = document.getElementById('slViewerCover');
    if (cover && !cover.classList.contains('open')) {
        cover.classList.add('open');
    }

    var books = getShiyilinBooks();
    var book = null;
    for (var i = 0; i < books.length; i++) {
        if (books[i].contactId === contactId) { book = books[i]; break; }
    }
    if (!book) return;

    var viewer = document.querySelector('.sl-book-viewer');
    if (!viewer) return;

    var existingPanel = document.getElementById('slPagesPanel');
    if (existingPanel) existingPanel.remove();

    var pagesPanel = document.createElement('div');
    pagesPanel.className = 'sl-pages-panel';
    pagesPanel.id = 'slPagesPanel';
    pagesPanel.innerHTML = `
        <div class="sl-page-holes">
            <div class="sl-page-hole"></div>
            <div class="sl-page-hole"></div>
            <div class="sl-page-hole"></div>
            <div class="sl-page-hole"></div>
            <div class="sl-page-hole"></div>
            <div class="sl-page-hole"></div>
        </div>
        <div class="sl-pages-body">
            <div class="sl-page-decoration top-left">🌿</div>
            <div class="sl-page-decoration bottom-right">🌱</div>
            <div class="sl-summary-text" id="slSummaryText">${book.summary || '翻开空白的书页，等待记忆落笔。'}</div>
        </div>
    `;
    viewer.appendChild(pagesPanel);
}

function closeShiyilinBook() {
    var overlay = document.getElementById('slBookOpen');
    if (overlay) overlay.remove();
}

// ========== 保存总结内容 ==========
function saveShiyilinSummary(contactId, summary) {
    var books = getShiyilinBooks();
    for (var i = 0; i < books.length; i++) {
        if (books[i].contactId === contactId) {
            books[i].summary = summary;
            break;
        }
    }
    saveShiyilinBooks(books);
}
