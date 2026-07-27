/**
 * 玉界 - 游戏
 * 包含：五子棋等小游戏
 * 五子棋：AI 下棋、悔棋请求、颜文字互动
 */

// ========== 游戏状态 ==========
var gameContactId = null;
var gameType = null;
var gobangBoard = [];
var gobangCurrentPlayer = 'user';
var gobangHistory = [];
var gobangGameOver = false;
var gobangPendingUndo = null;
var gobangEmojiTimer = null;

// ========== 打开游戏 ==========
function openGame() {
    var appWindow = document.getElementById('gameAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'gameAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    gameContactId = null;
    gameType = null;
    renderGameHome();
    appWindow.style.display = 'flex';
}

function closeGame() {
    var appWindow = document.getElementById('gameAppWindow');
    if (appWindow) appWindow.style.display = 'none';
    gameContactId = null;
    gameType = null;
}

// ========== 游戏首页 ==========
function renderGameHome() {
    var appWindow = document.getElementById('gameAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = ''
        + '<div class="game-app">'
        + '<div class="game-top-bar">'
        + '<div class="game-back-btn" onclick="closeGame()">‹</div>'
        + '<div class="game-top-title">游 戏</div>'
        + '<div class="game-top-spacer"></div>'
        + '</div>'
        + '<div class="game-body">'
        + '<div class="game-list">'
        + '<div class="game-item" onclick="selectGobangContact()">'
        + '<div class="game-item-icon">⚫⚪</div>'
        + '<div class="game-item-name">五子棋</div>'
        + '<div class="game-item-desc">和角色来一局</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}

// ========== 选择五子棋对手 ==========
function selectGobangContact() {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.length === 0) {
        showToast('暂无角色，请先在聊天中添加');
        return;
    }

    var appWindow = document.getElementById('gameAppWindow');
    if (!appWindow) return;

    var listHTML = '';
    contacts.forEach(function(c) {
        var avatarStyle = c.avatarData ? 'background-image:url(' + c.avatarData + ');background-size:cover;background-position:center;' : '';
        listHTML += ''
            + '<div class="game-contact-card" onclick="startGobang(\'' + c.id + '\')">'
            + '<div class="game-contact-avatar" style="' + avatarStyle + '">' + (c.avatarData ? '' : c.avatar) + '</div>'
            + '<div class="game-contact-name">' + c.name + '</div>'
            + '<div class="game-contact-arrow">›</div>'
            + '</div>';
    });

    appWindow.innerHTML = ''
        + '<div class="game-app">'
        + '<div class="game-top-bar">'
        + '<div class="game-back-btn" onclick="renderGameHome()">‹</div>'
        + '<div class="game-top-title">选择对手</div>'
        + '<div class="game-top-spacer"></div>'
        + '</div>'
        + '<div class="game-body">'
        + listHTML
        + '</div>'
        + '</div>';
}

// ========== 开始五子棋 ==========
function startGobang(contactId) {
    gameContactId = contactId;
    gameType = 'gobang';

    gobangBoard = [];
    for (var i = 0; i < 15; i++) {
        gobangBoard[i] = [];
        for (var j = 0; j < 15; j++) {
            gobangBoard[i][j] = 0;
        }
    }
    gobangCurrentPlayer = 'user';
    gobangHistory = [];
    gobangGameOver = false;
    gobangPendingUndo = null;

    renderGobang();
}

// ========== 渲染五子棋界面 ==========
function renderGobang() {
    var appWindow = document.getElementById('gameAppWindow');
    if (!appWindow) return;

    var contact = getContactById(gameContactId);
    var contactName = contact ? contact.name : '角色';
    var contactAvatar = contact && contact.avatarData ? contact.avatarData : '';
    var contactAvatarText = contact ? contact.avatar : '?';

    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var activeMask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; } }
    var userName = activeMask ? activeMask.name : '我';
    var userAvatar = activeMask && activeMask.avatar ? activeMask.avatar : '';

    var boardHTML = '';
    for (var r = 0; r < 15; r++) {
        for (var c = 0; c < 15; c++) {
            var pieceClass = '';
            if (gobangBoard[r][c] === 1) pieceClass = 'black';
            else if (gobangBoard[r][c] === 2) pieceClass = 'white';
            boardHTML += '<div class="gobang-cell" data-r="' + r + '" data-c="' + c + '" onclick="gobangPlace(' + r + ',' + c + ')"><div class="gobang-piece ' + pieceClass + '"></div></div>';
        }
    }

    var statusText = gobangGameOver ? '游戏结束' : (gobangCurrentPlayer === 'user' ? '你的回合' : contactName + '思考中...');

    appWindow.innerHTML = ''
        + '<div class="gobang-app">'
        + '<div class="game-top-bar">'
        + '<div class="game-back-btn" onclick="gobangConfirmExit()">‹</div>'
        + '<div class="game-top-title"></div>'
        + '<div class="game-btn-undo" onclick="gobangRequestUndo()">悔棋</div>'
        + '</div>'

        + '<div class="gobang-header">'
        + '<div class="gobang-player user">'
        + '<div class="gobang-player-avatar" style="' + (userAvatar ? 'background-image:url(' + userAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (userAvatar ? '' : userName.charAt(0)) + '</div>'
        + '<div class="gobang-player-name">' + userName + '</div>'
        + '<div class="gobang-emoji-spot" id="gobangEmojiUser"></div>'
        + '</div>'
        + '<div class="gobang-vs">VS</div>'
        + '<div class="gobang-player ai">'
        + '<div class="gobang-player-avatar" style="' + (contactAvatar ? 'background-image:url(' + contactAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (contactAvatar ? '' : contactAvatarText) + '</div>'
        + '<div class="gobang-player-name">' + contactName + '</div>'
        + '<div class="gobang-emoji-spot" id="gobangEmojiAI"></div>'
        + '</div>'
        + '</div>'

        + '<div class="gobang-board-wrap">'
        + '<div class="gobang-board" id="gobangBoard">' + boardHTML + '</div>'
        + '</div>'

        + '<div class="gobang-status">' + statusText + '</div>'

        + '<div class="gobang-emoji-btn" onclick="toggleGobangEmojiPanel()">>ᴗ<</div>'

        + '<div class="gobang-emoji-panel" id="gobangEmojiPanel" style="display:none;">'
        + '<div class="gobang-emoji-item" onclick="sendGobangEmoji(\'T^T\', \'哭哭\')">T^T<br><small>哭哭</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGobangEmoji(\'x( ˃ ⌂ ˂ ՞ )\', \'拒绝\')">x( ˃ ⌂ ˂ ՞ )<br><small>拒绝</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGobangEmoji(\'꩜ᯅ꩜\', \'迷惑\')">꩜ᯅ꩜<br><small>迷惑</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGobangEmoji(\'づ♡ど\', \'比心\')">づ♡ど<br><small>比心</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGobangEmoji(\'o_O\', \'挑衅\')">o_O<br><small>挑衅</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGobangEmoji(\'⦁֊⦁꧞\', \'无语\')">⦁֊⦁꧞<br><small>无语</small></div>'
        + '</div>'
        + '</div>';
}

// ========== 下棋 ==========
function gobangPlace(r, c) {
    if (gobangGameOver) return;
    if (gobangCurrentPlayer !== 'user') return;
    if (gobangBoard[r][c] !== 0) return;
    if (gobangPendingUndo) return;

    gobangBoard[r][c] = 1;
    gobangHistory.push({ r: r, c: c, player: 1 });

    if (checkGobangWin(1)) {
        gobangGameOver = true;
        renderGobang();
        showGobangWinDialog('你赢了！🎉');
        return;
    }

    gobangCurrentPlayer = 'ai';
    renderGobang();

    setTimeout(function() {
        gobangAIMove();
    }, 500);
}

// ========== AI走棋 ==========
function gobangAIMove() {
    if (gobangGameOver) return;

    var move = gobangFindBestMove();
    if (!move) return;

    gobangBoard[move.r][move.c] = 2;
    gobangHistory.push({ r: move.r, c: move.c, player: 2 });

    if (checkGobangWin(2)) {
        gobangGameOver = true;
        renderGobang();
        var contact = getContactById(gameContactId);
        var contactName = contact ? contact.name : '角色';
        showGobangWinDialog(contactName + '赢了！');
        return;
    }

    gobangCurrentPlayer = 'user';
    renderGobang();
}

// ========== AI评分 ==========
function gobangFindBestMove() {
    var bestScore = -Infinity;
    var bestMove = null;

    for (var r = 0; r < 15; r++) {
        for (var c = 0; c < 15; c++) {
            if (gobangBoard[r][c] !== 0) continue;
            var score = gobangEval(r, c, 2) + gobangEval(r, c, 1) * 0.9;
            if (score > bestScore) {
                bestScore = score;
                bestMove = { r: r, c: c };
            }
        }
    }
    return bestMove;
}

function gobangEval(r, c, player) {
    var score = 0;
    var dirs = [[1,0],[0,1],[1,1],[1,-1]];

    dirs.forEach(function(d) {
        var count = 1;
        var open = 0;
        for (var i = 1; i < 5; i++) {
            var nr = r + d[0] * i, nc = c + d[1] * i;
            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === player) count++;
            else { if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === 0) open++; break; }
        }
        for (var i = 1; i < 5; i++) {
            var nr = r - d[0] * i, nc = c - d[1] * i;
            if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === player) count++;
            else { if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === 0) open++; break; }
        }
        if (count >= 5) score += 100000;
        else if (count === 4) {
            if (open >= 2) score += 5000;
            else if (open === 1) score += 1000;
        } else if (count === 3) {
            if (open >= 2) score += 500;
            else if (open === 1) score += 100;
        } else if (count === 2) {
            if (open >= 2) score += 50;
        }
    });
    return score;
}

function checkGobangWin(player) {
    var dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (var r = 0; r < 15; r++) {
        for (var c = 0; c < 15; c++) {
            if (gobangBoard[r][c] !== player) continue;
            for (var d = 0; d < dirs.length; d++) {
                var count = 1;
                for (var i = 1; i < 5; i++) {
                    var nr = r + dirs[d][0] * i, nc = c + dirs[d][1] * i;
                    if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === player) count++;
                    else break;
                }
                if (count >= 5) return true;
            }
        }
    }
    return false;
}

// ========== 游戏结束弹窗 ==========
function showGobangWinDialog(message) {
    var overlay = document.createElement('div');
    overlay.className = 'gobang-win-overlay';
    overlay.id = 'gobangWinOverlay';
    overlay.innerHTML = ''
        + '<div class="gobang-win-dialog">'
        + '<div class="gobang-win-text">' + message + '</div>'
        + '<button class="game-btn-confirm" onclick="gobangWinAction()">再来一局</button>'
        + '<button class="game-btn-cancel" onclick="gobangWinExit()">退出</button>'
        + '</div>';
    document.body.appendChild(overlay);
}

function gobangWinAction() {
    var overlay = document.getElementById('gobangWinOverlay');
    if (overlay) overlay.remove();
    startGobang(gameContactId);
}

function gobangWinExit() {
    var overlay = document.getElementById('gobangWinOverlay');
    if (overlay) overlay.remove();
    renderGameHome();
}

// ========== 悔棋 ==========
function gobangRequestUndo() {
    if (gobangGameOver) return;
    if (gobangHistory.length < 2) { showToast('无法悔棋'); return; }

    // 没配API时根据角色性格本地判断
    if (typeof callChatAPI !== 'function') {
        // 本地兜底：随机同意/拒绝
        var agree = Math.random() > 0.4;
        if (agree) {
            gobangHistory.pop();
            var last = gobangHistory.pop();
            gobangBoard[last.r][last.c] = 0;
            gobangCurrentPlayer = 'user';
            renderGobang();
            showToast('悔棋成功');
        } else {
            showGobangEmoji('ai', 'x( ˃ ⌂ ˂ ՞ )', '拒绝');
        }
        return;
    }

    gobangDecideUndo(function(agree) {
        if (agree) {
            gobangHistory.pop();
            var last = gobangHistory.pop();
            gobangBoard[last.r][last.c] = 0;
            gobangCurrentPlayer = 'user';
            gobangPendingUndo = null;
            renderGobang();
            showToast('悔棋成功');
        } else {
            gobangPendingUndo = null;
            showGobangEmoji('ai', 'x( ˃ ⌂ ˂ ՞ )', '拒绝');
        }
    });
}

function gobangDecideUndo(callback) {
    var contact = getContactById(gameContactId);
    if (!contact) { callback(true); return; }
    var contactName = contact.name;

    var prompt = '你是' + contactName + '。你正在和用户下五子棋。用户请求悔棋。请根据你的性格决定是否同意。回复一个字：同意 或 拒绝。';

    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: typeof buildSystemPrompt === 'function' ? buildSystemPrompt(gameContactId) : '' },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            var text = typeof reply === 'string' ? reply : (reply.content || reply.text || '');
            if (text.indexOf('拒绝') >= 0) callback(false);
            else callback(true);
        }).catch(function() {
            callback(Math.random() > 0.4);
        });
    } else {
        callback(true);
    }
}

// ========== 颜文字系统 ==========
function toggleGobangEmojiPanel() {
    var panel = document.getElementById('gobangEmojiPanel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

function sendGobangEmoji(emoji, meaning) {
    var panel = document.getElementById('gobangEmojiPanel');
    if (panel) panel.style.display = 'none';
    showGobangEmoji('user', emoji);

    setTimeout(function() {
        gobangAIRespondEmoji(meaning);
    }, 800);
}

function showGobangEmoji(from, emoji) {
    var spotId = from === 'user' ? 'gobangEmojiUser' : 'gobangEmojiAI';
    var spot = document.getElementById(spotId);
    if (!spot) return;

    spot.innerHTML = '';
    var bubble = document.createElement('div');
    bubble.className = 'gobang-emoji-bubble ' + from;
    bubble.textContent = emoji;
    bubble.onclick = function() { bubble.remove(); };
    spot.appendChild(bubble);

    clearTimeout(gobangEmojiTimer);
    gobangEmojiTimer = setTimeout(function() {
        bubble.remove();
    }, 6000);
}

function gobangAIRespondEmoji(userMeaning) {
    var responseMap = {
        '哭哭': 'づ♡ど',
        '比心': 'づ♡ど',
        '挑衅': 'o_O',
        '迷惑': '꩜ᯅ꩜',
        '无语': '⦁֊⦁꧞',
        '拒绝': '⦁֊⦁꧞'
    };
    var respondEmoji = responseMap[userMeaning] || 'T^T';
    showGobangEmoji('ai', respondEmoji);
}

// ========== 退出确认 ==========
function gobangConfirmExit() {
    var overlay = document.createElement('div');
    overlay.className = 'game-confirm-overlay';
    overlay.id = 'gobangExitOverlay';
    overlay.innerHTML = ''
        + '<div class="game-confirm-dialog">'
        + '<p>确定退出？当前棋局将不会保存。</p>'
        + '<div class="game-confirm-btns">'
        + '<button class="game-btn-cancel" onclick="closeGobangExit()">取消</button>'
        + '<button class="game-btn-confirm" onclick="executeGobangExit()">退出</button>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeGobangExit(); };
}

function closeGobangExit() {
    var overlay = document.getElementById('gobangExitOverlay');
    if (overlay) overlay.remove();
}

function executeGobangExit() {
    closeGobangExit();
    renderGameHome();
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {});
