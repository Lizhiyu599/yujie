/**
 * 玉界 - 游戏
 * 包含：五子棋、井字棋
 * AI 根据人设调整棋力
 */

// ========== 共享状态 ==========
var gameContactId = null;
var gameType = null;
var gameEmojiTimer = null;

// ========== 五子棋状态 ==========
var gobangBoard = [];
var gobangCurrentPlayer = 'user';
var gobangHistory = [];
var gobangGameOver = false;
var gobangPendingUndo = null;
var gobangUserColor = 1;
var gobangPreview = null;
var gobangLastMove = null;

// ========== 井字棋状态 ==========
var tttBoard = [];
var tttCurrentPlayer = 'user';
var tttHistory = [];
var tttGameOver = false;
var tttUserMark = 'X';
var tttLastMove = null;
var tttWinCells = [];

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
        + '<div class="game-item" onclick="selectTicTacToeContact()">'
        + '<div class="game-item-icon">✕○</div>'
        + '<div class="game-item-name">井字棋</div>'
        + '<div class="game-item-desc">经典三连棋</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}

// ========== 选择对手 ==========
function selectGobangContact() {
    renderContactList('gobang');
}
function selectTicTacToeContact() {
    renderContactList('tictactoe');
}

function renderContactList(type) {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.length === 0) {
        showToast('暂无角色');
        return;
    }
    var appWindow = document.getElementById('gameAppWindow');
    if (!appWindow) return;

    var startFn = type === 'gobang' ? 'startGobang' : 'startTicTacToe';
    var listHTML = '';
    contacts.forEach(function(c) {
        var avatarStyle = c.avatarData ? 'background-image:url(' + c.avatarData + ');background-size:cover;background-position:center;' : '';
        listHTML += ''
            + '<div class="game-contact-card" onclick="' + startFn + '(\'' + c.id + '\')">'
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
        + '<div class="game-body">' + listHTML + '</div>'
        + '</div>';
}

// ========== 根据人设获取AI失误率 ==========
function getAIMistakeRate() {
    var contact = getContactById(gameContactId);
    if (!contact || !contact.persona) return 0.2;
    var persona = contact.persona;
    if (persona.indexOf('好胜') >= 0 || persona.indexOf('认真') >= 0 || persona.indexOf('强势') >= 0) return 0;
    if (persona.indexOf('温柔') >= 0 || persona.indexOf('随和') >= 0 || persona.indexOf('照顾') >= 0) return 0.5;
    if (persona.indexOf('傲娇') >= 0 || persona.indexOf('别扭') >= 0) return 0.15;
    return 0.2;
}

// ============================================================
//                        五 子 棋
// ============================================================

function startGobang(contactId) {
    gameContactId = contactId;
    gameType = 'gobang';
    gobangBoard = [];
    for (var i = 0; i < 15; i++) { gobangBoard[i] = []; for (var j = 0; j < 15; j++) gobangBoard[i][j] = 0; }
    gobangUserColor = Math.random() < 0.5 ? 1 : 2;
    gobangCurrentPlayer = gobangUserColor === 1 ? 'user' : 'ai';
    gobangHistory = [];
    gobangGameOver = false;
    gobangPendingUndo = null;
    gobangPreview = null;
    gobangLastMove = null;
    renderGobang();
    if (gobangCurrentPlayer === 'ai') setTimeout(function() { gobangAIMove(); }, 600);
}

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
    var userPieceClass = gobangUserColor === 1 ? 'black' : 'white';
    var aiPieceClass = gobangUserColor === 1 ? 'white' : 'black';
    var boardHTML = '';
    for (var r = 0; r < 15; r++) {
        for (var c = 0; c < 15; c++) {
            var pieceClass = '', lastClass = '', previewClass = '';
            if (gobangBoard[r][c] === 1) pieceClass = 'black';
            else if (gobangBoard[r][c] === 2) pieceClass = 'white';
            if (gobangLastMove && gobangLastMove.r === r && gobangLastMove.c === c) lastClass = ' last-move';
            if (gobangPreview && gobangPreview.r === r && gobangPreview.c === c) previewClass = ' preview';
            boardHTML += '<div class="gobang-cell" data-r="' + r + '" data-c="' + c + '" onclick="gobangClick(' + r + ',' + c + ')"><div class="gobang-piece ' + pieceClass + lastClass + previewClass + '"></div></div>';
        }
    }
    var statusText = gobangGameOver ? '游戏结束' : (gobangCurrentPlayer === 'user' ? '你的回合' : contactName + '思考中...');
    appWindow.innerHTML = ''
        + '<div class="gobang-app">'
        + '<div class="game-top-bar"><div class="game-back-btn" onclick="gobangConfirmExit()">‹</div><div class="game-top-title"></div><div class="game-btn-undo" onclick="gobangRequestUndo()">悔棋</div></div>'
        + '<div class="gobang-header">'
        + '<div class="gobang-player user"><div class="gobang-player-avatar" style="' + (userAvatar ? 'background-image:url(' + userAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (userAvatar ? '' : userName.charAt(0)) + '<div class="gobang-avatar-badge user ' + userPieceClass + '"></div></div><div class="gobang-player-name">' + userName + '</div><div class="gobang-emoji-spot" id="gobangEmojiUser"></div></div>'
        + '<div class="gobang-vs">VS</div>'
        + '<div class="gobang-player ai"><div class="gobang-player-avatar" style="' + (contactAvatar ? 'background-image:url(' + contactAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (contactAvatar ? '' : contactAvatarText) + '<div class="gobang-avatar-badge ai ' + aiPieceClass + '"></div></div><div class="gobang-player-name">' + contactName + '</div><div class="gobang-emoji-spot" id="gobangEmojiAI"></div></div>'
        + '</div>'
        + '<div class="gobang-board-wrap"><div class="gobang-board">' + boardHTML + '</div></div>'
        + '<div class="gobang-status">' + statusText + '</div>'
        + '<div class="gobang-emoji-btn" onclick="toggleGobangEmojiPanel()">>ᴗ<</div>'
        + '<div class="gobang-emoji-panel" id="gobangEmojiPanel" style="display:none;">'
        + '<div class="gobang-emoji-item" onclick="sendGameEmoji(\'T^T\',\'gobang\')">T^T<br><small>哭哭</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGameEmoji(\'x( ˃ ⌂ ˂ ՞ )\',\'gobang\')">x( ˃ ⌂ ˂ ՞ )<br><small>拒绝</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGameEmoji(\'꩜ᯅ꩜\',\'gobang\')">꩜ᯅ꩜<br><small>迷惑</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGameEmoji(\'づ♡ど\',\'gobang\')">づ♡ど<br><small>比心</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGameEmoji(\'o_O\',\'gobang\')">o_O<br><small>挑衅</small></div>'
        + '<div class="gobang-emoji-item" onclick="sendGameEmoji(\'⦁֊⦁꧞\',\'gobang\')">⦁֊⦁꧞<br><small>无语</small></div>'
        + '</div></div>';
}

function gobangClick(r, c) {
    if (gobangGameOver || gobangCurrentPlayer !== 'user' || gobangBoard[r][c] !== 0) return;
    if (gobangPreview && gobangPreview.r === r && gobangPreview.c === c) { gobangPlace(r, c); }
    else { gobangPreview = { r: r, c: c }; renderGobang(); }
}

function gobangPlace(r, c) {
    gobangPreview = null;
    gobangBoard[r][c] = gobangUserColor;
    gobangLastMove = { r: r, c: c };
    gobangHistory.push({ r: r, c: c, player: gobangUserColor });
    if (checkGobangWin(gobangUserColor)) { gobangGameOver = true; renderGobang(); showGameWinDialog('gobang', '你赢了！🎉'); return; }
    gobangCurrentPlayer = 'ai'; renderGobang();
    setTimeout(function() { gobangAIMove(); }, 500);
}

function gobangAIMove() {
    if (gobangGameOver) return;
    var mistakeRate = getAIMistakeRate();
    var move;
    if (Math.random() < mistakeRate) {
        var emptyCells = [];
        for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) if (gobangBoard[r][c] === 0) emptyCells.push({ r: r, c: c });
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else {
        move = gobangFindBestMove();
    }
    if (!move) return;
    var aiColor = gobangUserColor === 1 ? 2 : 1;
    gobangBoard[move.r][move.c] = aiColor;
    gobangLastMove = { r: move.r, c: move.c };
    gobangHistory.push({ r: move.r, c: move.c, player: aiColor });
    if (checkGobangWin(aiColor)) { gobangGameOver = true; renderGobang(); showGameWinDialog('gobang', (getContactById(gameContactId) || {}).name + '赢了！'); return; }
    gobangCurrentPlayer = 'user'; renderGobang();
}

function gobangFindBestMove() {
    var bestScore = -Infinity, bestMove = null;
    var aiColor = gobangUserColor === 1 ? 2 : 1;
    for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) {
        if (gobangBoard[r][c] !== 0) continue;
        var score = gobangEval(r, c, aiColor) + gobangEval(r, c, gobangUserColor) * 0.9;
        if (score > bestScore) { bestScore = score; bestMove = { r: r, c: c }; }
    }
    return bestMove;
}

function gobangEval(r, c, player) {
    var score = 0;
    var dirs = [[1,0],[0,1],[1,1],[1,-1]];
    dirs.forEach(function(d) {
        var count = 1, open = 0;
        for (var i = 1; i < 5; i++) { var nr = r + d[0] * i, nc = c + d[1] * i; if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === player) count++; else { if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === 0) open++; break; } }
        for (var i = 1; i < 5; i++) { var nr = r - d[0] * i, nc = c - d[1] * i; if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === player) count++; else { if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === 0) open++; break; } }
        if (count >= 5) score += 100000;
        else if (count === 4) score += (open >= 2 ? 5000 : 1000);
        else if (count === 3) score += (open >= 2 ? 500 : 100);
        else if (count === 2 && open >= 2) score += 50;
    });
    return score;
}

function checkGobangWin(player) {
    var dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) {
        if (gobangBoard[r][c] !== player) continue;
        for (var d = 0; d < dirs.length; d++) { var count = 1; for (var i = 1; i < 5; i++) { var nr = r + dirs[d][0] * i, nc = c + dirs[d][1] * i; if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && gobangBoard[nr][nc] === player) count++; else break; } if (count >= 5) return true; }
    }
    return false;
}

function gobangRequestUndo() {
    if (gobangGameOver || gobangHistory.length < 2) { showToast('无法悔棋'); return; }
    var agree = Math.random() > 0.4;
    if (agree) { gobangHistory.pop(); var last = gobangHistory.pop(); gobangBoard[last.r][last.c] = 0; gobangLastMove = gobangHistory.length > 0 ? gobangHistory[gobangHistory.length - 1] : null; gobangCurrentPlayer = 'user'; gobangPreview = null; renderGobang(); showToast('悔棋成功'); }
    else { showGameEmoji('gobang', 'ai', 'x( ˃ ⌂ ˂ ՞ )'); }
}

function gobangConfirmExit() {
    showGameConfirm('确定退出？', function() { renderGameHome(); });
}

// ============================================================
//                        井 字 棋 （修 复 版）
// ============================================================

function startTicTacToe(contactId) {
    gameContactId = contactId;
    gameType = 'tictactoe';
    tttBoard = [0,0,0,0,0,0,0,0,0];
    // 用时间戳+随机数确保每次随机不同
    tttUserMark = (Date.now() % 2 === 0) ? 'X' : 'O';
    tttCurrentPlayer = tttUserMark === 'X' ? 'user' : 'ai';
    tttHistory = [];
    tttGameOver = false;
    tttLastMove = null;
    tttWinCells = [];
    renderTicTacToe();
    if (tttCurrentPlayer === 'ai') setTimeout(function() { tttAIMove(); }, 500);
}

function renderTicTacToe() {
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

    var aiMark = tttUserMark === 'X' ? 'O' : 'X';

    var boardHTML = '';
    for (var i = 0; i < 9; i++) {
        var mark = '', extraClass = '';
        if (tttBoard[i] === 1) { mark = tttUserMark; extraClass = ' x'; }
        else if (tttBoard[i] === 2) { mark = aiMark; extraClass = ' o'; }
        var winClass = tttWinCells.indexOf(i) >= 0 ? ' win-cell' : '';
        boardHTML += '<div class="tictactoe-cell' + winClass + '" onclick="tttPlace(' + i + ')"><div class="tictactoe-mark' + extraClass + '">' + mark + '</div></div>';
    }
    var statusText = tttGameOver ? '游戏结束' : (tttCurrentPlayer === 'user' ? '你的回合' : contactName + '思考中...');
    appWindow.innerHTML = ''
        + '<div class="tictactoe-app">'
        + '<div class="game-top-bar"><div class="game-back-btn" onclick="tttConfirmExit()">‹</div><div class="game-top-title"></div><div class="game-btn-undo" onclick="tttRequestUndo()">悔棋</div></div>'
        + '<div class="tictactoe-header">'
        + '<div class="tictactoe-player user"><div class="tictactoe-player-avatar" style="' + (userAvatar ? 'background-image:url(' + userAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (userAvatar ? '' : userName.charAt(0)) + '<div class="tictactoe-avatar-badge user ' + (tttUserMark === 'X' ? 'x' : 'o') + '">' + tttUserMark + '</div></div><div class="tictactoe-player-name">' + userName + '</div><div class="tictactoe-emoji-spot" id="tttEmojiUser"></div></div>'
        + '<div class="tictactoe-vs">VS</div>'
        + '<div class="tictactoe-player ai"><div class="tictactoe-player-avatar" style="' + (contactAvatar ? 'background-image:url(' + contactAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (contactAvatar ? '' : contactAvatarText) + '<div class="tictactoe-avatar-badge ai ' + (aiMark === 'X' ? 'x' : 'o') + '">' + aiMark + '</div></div><div class="tictactoe-player-name">' + contactName + '</div><div class="tictactoe-emoji-spot" id="tttEmojiAI"></div></div>'
        + '</div>'
        + '<div class="tictactoe-board-wrap"><div class="tictactoe-board">' + boardHTML + '</div></div>'
        + '<div class="tictactoe-status">' + statusText + '</div>'
        + '<div class="tictactoe-emoji-btn" onclick="toggleTicTacToeEmojiPanel()">>ᴗ<</div>'
        + '<div class="tictactoe-emoji-panel" id="tttEmojiPanel" style="display:none;">'
        + '<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'T^T\',\'tictactoe\')">T^T<br><small>哭哭</small></div>'
        + '<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'x( ˃ ⌂ ˂ ՞ )\',\'tictactoe\')">x( ˃ ⌂ ˂ ՞ )<br><small>拒绝</small></div>'
        + '<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'꩜ᯅ꩜\',\'tictactoe\')">꩜ᯅ꩜<br><small>迷惑</small></div>'
        + '<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'づ♡ど\',\'tictactoe\')">づ♡ど<br><small>比心</small></div>'
        + '<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'o_O\',\'tictactoe\')">o_O<br><small>挑衅</small></div>'
        + '<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'⦁֊⦁꧞\',\'tictactoe\')">⦁֊⦁꧞<br><small>无语</small></div>'
        + '</div></div>';
}

function tttPlace(i) {
    if (tttGameOver || tttCurrentPlayer !== 'user' || tttBoard[i] !== 0) return;
    tttBoard[i] = 1; tttLastMove = i; tttHistory.push(i);
    var result = checkTicTacToeWin();
    if (result) { tttGameOver = true; tttWinCells = result; renderTicTacToe(); showGameWinDialog('tictactoe', '你赢了！🎉'); return; }
    if (tttHistory.length >= 9) { tttGameOver = true; renderTicTacToe(); showGameWinDialog('tictactoe', '平局！'); return; }
    tttCurrentPlayer = 'ai'; renderTicTacToe();
    setTimeout(function() { tttAIMove(); }, 400);
}

function tttAIMove() {
    if (tttGameOver) return;
    var aiMarkVal = 2;
    var userMarkVal = 1;
    var mistakeRate = getAIMistakeRate();
    var move;
    if (Math.random() < mistakeRate) {
        var empties = [];
        for (var i = 0; i < 9; i++) if (tttBoard[i] === 0) empties.push(i);
        move = empties[Math.floor(Math.random() * empties.length)];
    } else {
        move = tttBestMove(aiMarkVal, userMarkVal);
    }
    if (move === undefined || move === null) return;
    tttBoard[move] = aiMarkVal; tttLastMove = move; tttHistory.push(move);
    var result = checkTicTacToeWin();
    if (result) { tttGameOver = true; tttWinCells = result; renderTicTacToe(); showGameWinDialog('tictactoe', (getContactById(gameContactId) || {}).name + '赢了！'); return; }
    if (tttHistory.length >= 9) { tttGameOver = true; renderTicTacToe(); showGameWinDialog('tictactoe', '平局！'); return; }
    tttCurrentPlayer = 'user'; renderTicTacToe();
}

function tttBestMove(aiMark, userMark) {
    var bestScore = -Infinity, bestMove = 0;
    for (var i = 0; i < 9; i++) {
        if (tttBoard[i] !== 0) continue;
        tttBoard[i] = aiMark;
        var score = tttMinimax(0, false, aiMark, userMark);
        tttBoard[i] = 0;
        if (score > bestScore) { bestScore = score; bestMove = i; }
    }
    return bestMove;
}

function tttMinimax(depth, isMax, aiMark, userMark) {
    var result = checkTicTacToeWinRaw();
    if (result === aiMark) return 10 - depth;
    if (result === userMark) return depth - 10;
    var empties = []; for (var i = 0; i < 9; i++) if (tttBoard[i] === 0) empties.push(i);
    if (empties.length === 0) return 0;
    if (isMax) {
        var best = -Infinity;
        empties.forEach(function(i) { tttBoard[i] = aiMark; best = Math.max(best, tttMinimax(depth + 1, false, aiMark, userMark)); tttBoard[i] = 0; });
        return best;
    } else {
        var best = Infinity;
        empties.forEach(function(i) { tttBoard[i] = userMark; best = Math.min(best, tttMinimax(depth + 1, true, aiMark, userMark)); tttBoard[i] = 0; });
        return best;
    }
}

function checkTicTacToeWinRaw() {
    var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (var l = 0; l < lines.length; l++) {
        var a = lines[l][0], b = lines[l][1], c = lines[l][2];
        if (tttBoard[a] !== 0 && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) return tttBoard[a];
    }
    return 0;
}

function checkTicTacToeWin() {
    var lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (var l = 0; l < lines.length; l++) {
        var a = lines[l][0], b = lines[l][1], c = lines[l][2];
        if (tttBoard[a] !== 0 && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) return [a, b, c];
    }
    return null;
}

function tttRequestUndo() {
    if (tttGameOver || tttHistory.length < 2) { showToast('无法悔棋'); return; }
    var agree = Math.random() > 0.4;
    if (agree) { tttHistory.pop(); var last = tttHistory.pop(); tttBoard[last] = 0; tttLastMove = tttHistory.length > 0 ? tttHistory[tttHistory.length - 1] : null; tttCurrentPlayer = 'user'; renderTicTacToe(); showToast('悔棋成功'); }
    else { showGameEmoji('tictactoe', 'ai', 'x( ˃ ⌂ ˂ ՞ )'); }
}

function tttConfirmExit() {
    showGameConfirm('确定退出？', function() { renderGameHome(); });
}

// ============================================================
//                      通用：颜文字 / 弹窗
// ============================================================

function toggleGobangEmojiPanel() {
    var p = document.getElementById('gobangEmojiPanel'); if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none';
}
function toggleTicTacToeEmojiPanel() {
    var p = document.getElementById('tttEmojiPanel'); if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none';
}

function sendGameEmoji(emoji, game) {
    if (game === 'gobang') { var p = document.getElementById('gobangEmojiPanel'); if (p) p.style.display = 'none'; }
    else { var p = document.getElementById('tttEmojiPanel'); if (p) p.style.display = 'none'; }
    showGameEmoji(game, 'user', emoji);
    setTimeout(function() {
        var resp = { '哭哭': 'づ♡ど', '比心': 'づ♡ど', '挑衅': 'o_O', '迷惑': '꩜ᯅ꩜', '无语': '⦁֊⦁꧞', '拒绝': '⦁֊⦁꧞' };
        showGameEmoji(game, 'ai', resp[emoji] || 'T^T');
    }, 800);
}

function showGameEmoji(game, from, emoji) {
    var spotId = (from === 'user' ? (game === 'gobang' ? 'gobangEmojiUser' : 'tttEmojiUser') : (game === 'gobang' ? 'gobangEmojiAI' : 'tttEmojiAI'));
    var spot = document.getElementById(spotId); if (!spot) return;
    spot.innerHTML = '';
    var bubble = document.createElement('div');
    bubble.className = (game === 'gobang' ? 'gobang-emoji-bubble' : 'tictactoe-emoji-bubble') + ' ' + from;
    bubble.textContent = emoji;
    bubble.onclick = function() { bubble.remove(); };
    spot.appendChild(bubble);
    clearTimeout(gameEmojiTimer);
    gameEmojiTimer = setTimeout(function() { bubble.remove(); }, 6000);
}

function showGameWinDialog(game, message) {
    var overlay = document.createElement('div');
    overlay.className = game === 'gobang' ? 'gobang-win-overlay' : 'tictactoe-win-overlay';
    overlay.id = 'gameWinOverlay';
    overlay.innerHTML = ''
        + '<div class="' + (game === 'gobang' ? 'gobang-win-dialog' : 'tictactoe-win-dialog') + '">'
        + '<div class="' + (game === 'gobang' ? 'gobang-win-text' : 'tictactoe-win-text') + '">' + message + '</div>'
        + '<button class="game-btn-confirm" onclick="gameWinAction(\'' + game + '\')">再来一局</button>'
        + '<button class="game-btn-cancel" onclick="gameWinExit()">退出</button>'
        + '</div>';
    document.body.appendChild(overlay);
}

function gameWinAction(game) {
    var o = document.getElementById('gameWinOverlay'); if (o) o.remove();
    if (game === 'gobang') startGobang(gameContactId); else startTicTacToe(gameContactId);
}
function gameWinExit() {
    var o = document.getElementById('gameWinOverlay'); if (o) o.remove();
    renderGameHome();
}

function showGameConfirm(msg, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'game-confirm-overlay'; overlay.id = 'gameConfirmOverlay';
    overlay.innerHTML = ''
        + '<div class="game-confirm-dialog"><p>' + msg + '</p>'
        + '<div class="game-confirm-btns">'
        + '<button class="game-btn-cancel" onclick="closeGameConfirm()">取消</button>'
        + '<button class="game-btn-confirm" onclick="executeGameConfirm()">确定</button>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeGameConfirm(); };
    window._gameConfirmCallback = onConfirm;
}
function closeGameConfirm() { var o = document.getElementById('gameConfirmOverlay'); if (o) o.remove(); }
function executeGameConfirm() { closeGameConfirm(); if (window._gameConfirmCallback) window._gameConfirmCallback(); }

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {});
