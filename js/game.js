/**
 * 玉界 - 游戏
 * 包含：五子棋、井字棋、黑白棋
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

// ========== 黑白棋状态 ==========
var revBoard = [];
var revCurrentPlayer = 'user';
var revHistory = [];
var revGameOver = false;
var revUserColor = 1; // 1黑2白
var revPreview = null;
var revLastMove = null;
var revValidMoves = [];

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
        + '<div class="game-item" onclick="selectReversiContact()">'
        + '<div class="game-item-icon">🔄</div>'
        + '<div class="game-item-name">黑白棋</div>'
        + '<div class="game-item-desc">翻转棋·谁多谁赢</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}

// ========== 选择对手 ==========
function selectGobangContact() { renderContactList('gobang'); }
function selectTicTacToeContact() { renderContactList('tictactoe'); }
function selectReversiContact() { renderContactList('reversi'); }

function renderContactList(type) {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.length === 0) { showToast('暂无角色'); return; }
    var appWindow = document.getElementById('gameAppWindow');
    if (!appWindow) return;
    var startFn = type === 'gobang' ? 'startGobang' : (type === 'tictactoe' ? 'startTicTacToe' : 'startReversi');
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
    gameContactId = contactId; gameType = 'gobang';
    gobangBoard = []; for (var i = 0; i < 15; i++) { gobangBoard[i] = []; for (var j = 0; j < 15; j++) gobangBoard[i][j] = 0; }
    gobangUserColor = Math.random() < 0.5 ? 1 : 2;
    gobangCurrentPlayer = gobangUserColor === 1 ? 'user' : 'ai';
    gobangHistory = []; gobangGameOver = false; gobangPendingUndo = null; gobangPreview = null; gobangLastMove = null;
    renderGobang();
    if (gobangCurrentPlayer === 'ai') setTimeout(function() { gobangAIMove(); }, 600);
}
function renderGobang() {
    var appWindow = document.getElementById('gameAppWindow'); if (!appWindow) return;
    var contact = getContactById(gameContactId); var contactName = contact ? contact.name : '角色';
    var contactAvatar = contact && contact.avatarData ? contact.avatarData : ''; var contactAvatarText = contact ? contact.avatar : '?';
    var masks = typeof getMasks === 'function' ? getMasks() : []; var activeMaskId = localStorage.getItem('active_mask_id') || ''; var activeMask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; } }
    var userName = activeMask ? activeMask.name : '我'; var userAvatar = activeMask && activeMask.avatar ? activeMask.avatar : '';
    var userPieceClass = gobangUserColor === 1 ? 'black' : 'white'; var aiPieceClass = gobangUserColor === 1 ? 'white' : 'black';
    var boardHTML = '';
    for (var r = 0; r < 15; r++) { for (var c = 0; c < 15; c++) {
        var pieceClass = '', lastClass = '', previewClass = '';
        if (gobangBoard[r][c] === 1) pieceClass = 'black'; else if (gobangBoard[r][c] === 2) pieceClass = 'white';
        if (gobangLastMove && gobangLastMove.r === r && gobangLastMove.c === c) lastClass = ' last-move';
        if (gobangPreview && gobangPreview.r === r && gobangPreview.c === c) previewClass = ' preview';
        boardHTML += '<div class="gobang-cell" onclick="gobangClick(' + r + ',' + c + ')"><div class="gobang-piece ' + pieceClass + lastClass + previewClass + '"></div></div>';
    }}
    appWindow.innerHTML = ''
        + '<div class="gobang-app">'
        + '<div class="game-top-bar"><div class="game-back-btn" onclick="gobangConfirmExit()">‹</div><div class="game-top-title"></div><div class="game-btn-undo" onclick="gobangRequestUndo()">悔棋</div></div>'
        + '<div class="gobang-header">'
        + '<div class="gobang-player user"><div class="gobang-player-avatar" style="' + (userAvatar ? 'background-image:url(' + userAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (userAvatar ? '' : userName.charAt(0)) + '<div class="gobang-avatar-badge user ' + userPieceClass + '"></div></div><div class="gobang-player-name">' + userName + '</div><div class="gobang-emoji-spot" id="gobangEmojiUser"></div></div>'
        + '<div class="gobang-vs">VS</div>'
        + '<div class="gobang-player ai"><div class="gobang-player-avatar" style="' + (contactAvatar ? 'background-image:url(' + contactAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (contactAvatar ? '' : contactAvatarText) + '<div class="gobang-avatar-badge ai ' + aiPieceClass + '"></div></div><div class="gobang-player-name">' + contactName + '</div><div class="gobang-emoji-spot" id="gobangEmojiAI"></div></div>'
        + '</div>'
        + '<div class="gobang-board-wrap"><div class="gobang-board">' + boardHTML + '</div></div>'
        + '<div class="gobang-status">' + (gobangGameOver ? '游戏结束' : (gobangCurrentPlayer === 'user' ? '你的回合' : contactName + '思考中...')) + '</div>'
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
    gobangPreview = null; gobangBoard[r][c] = gobangUserColor; gobangLastMove = { r: r, c: c }; gobangHistory.push({ r: r, c: c, player: gobangUserColor });
    if (checkGobangWin(gobangUserColor)) { gobangGameOver = true; renderGobang(); showGameWinDialog('gobang', '你赢了！🎉'); return; }
    gobangCurrentPlayer = 'ai'; renderGobang(); setTimeout(function() { gobangAIMove(); }, 500);
}
function gobangAIMove() {
    if (gobangGameOver) return;
    var move, mistakeRate = getAIMistakeRate();
    if (Math.random() < mistakeRate) { var ec = []; for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) if (gobangBoard[r][c] === 0) ec.push({ r: r, c: c }); move = ec[Math.floor(Math.random() * ec.length)]; }
    else { move = gobangFindBestMove(); }
    if (!move) return;
    var aiColor = gobangUserColor === 1 ? 2 : 1; gobangBoard[move.r][move.c] = aiColor; gobangLastMove = { r: move.r, c: move.c }; gobangHistory.push({ r: move.r, c: move.c, player: aiColor });
    if (checkGobangWin(aiColor)) { gobangGameOver = true; renderGobang(); showGameWinDialog('gobang', (getContactById(gameContactId) || {}).name + '赢了！'); return; }
    gobangCurrentPlayer = 'user'; renderGobang();
}
function gobangFindBestMove() {
    var bs = -Infinity, bm = null, ac = gobangUserColor === 1 ? 2 : 1;
    for (var r = 0; r < 15; r++) for (var c = 0; c < 15; c++) { if (gobangBoard[r][c] !== 0) continue; var s = gobangEval(r,c,ac) + gobangEval(r,c,gobangUserColor)*0.9; if (s > bs) { bs = s; bm = {r:r,c:c}; } }
    return bm;
}
function gobangEval(r, c, player) {
    var score = 0, dirs = [[1,0],[0,1],[1,1],[1,-1]];
    dirs.forEach(function(d) { var cnt = 1, op = 0;
        for (var i = 1; i < 5; i++) { var nr = r+d[0]*i, nc = c+d[1]*i; if (nr>=0&&nr<15&&nc>=0&&nc<15&&gobangBoard[nr][nc]===player) cnt++; else { if (nr>=0&&nr<15&&nc>=0&&nc<15&&gobangBoard[nr][nc]===0) op++; break; } }
        for (var i = 1; i < 5; i++) { var nr = r-d[0]*i, nc = c-d[1]*i; if (nr>=0&&nr<15&&nc>=0&&nc<15&&gobangBoard[nr][nc]===player) cnt++; else { if (nr>=0&&nr<15&&nc>=0&&nc<15&&gobangBoard[nr][nc]===0) op++; break; } }
        if (cnt>=5) score+=100000; else if (cnt===4) score+=(op>=2?5000:1000); else if (cnt===3) score+=(op>=2?500:100); else if (cnt===2&&op>=2) score+=50;
    }); return score;
}
function checkGobangWin(player) { var dirs=[[1,0],[0,1],[1,1],[1,-1]]; for (var r=0;r<15;r++) for (var c=0;c<15;c++) { if (gobangBoard[r][c]!==player) continue; for (var d=0;d<dirs.length;d++) { var cnt=1; for (var i=1;i<5;i++) { var nr=r+dirs[d][0]*i,nc=c+dirs[d][1]*i; if (nr>=0&&nr<15&&nc>=0&&nc<15&&gobangBoard[nr][nc]===player) cnt++; else break; } if (cnt>=5) return true; } } return false; }
function gobangRequestUndo() { if (gobangGameOver||gobangHistory.length<2) { showToast('无法悔棋'); return; } var agree=Math.random()>0.4; if (agree) { gobangHistory.pop(); var l=gobangHistory.pop(); gobangBoard[l.r][l.c]=0; gobangLastMove=gobangHistory.length>0?gobangHistory[gobangHistory.length-1]:null; gobangCurrentPlayer='user'; gobangPreview=null; renderGobang(); showToast('悔棋成功'); } else { showGameEmoji('gobang','ai','x( ˃ ⌂ ˂ ՞ )'); } }
function gobangConfirmExit() { showGameConfirm('确定退出？',function(){renderGameHome();}); }

// ============================================================
//                        井 字 棋
// ============================================================
function startTicTacToe(contactId) {
    gameContactId=contactId;gameType='tictactoe';tttBoard=[0,0,0,0,0,0,0,0,0];
    tttUserMark=(Date.now()%2===0)?'X':'O';tttCurrentPlayer=tttUserMark==='X'?'user':'ai';
    tttHistory=[];tttGameOver=false;tttLastMove=null;tttWinCells=[];
    renderTicTacToe();if(tttCurrentPlayer==='ai')setTimeout(function(){tttAIMove();},500);
}
function renderTicTacToe() {
    var appWindow=document.getElementById('gameAppWindow');if(!appWindow)return;
    var contact=getContactById(gameContactId);var contactName=contact?contact.name:'角色';
    var contactAvatar=contact&&contact.avatarData?contact.avatarData:'';var contactAvatarText=contact?contact.avatar:'?';
    var masks=typeof getMasks==='function'?getMasks():[];var activeMaskId=localStorage.getItem('active_mask_id')||'';var activeMask=null;
    for(var i=0;i<masks.length;i++){if(masks[i].id===activeMaskId){activeMask=masks[i];break;}}
    var userName=activeMask?activeMask.name:'我';var userAvatar=activeMask&&activeMask.avatar?activeMask.avatar:'';
    var aiMark=tttUserMark==='X'?'O':'X';
    var boardHTML='';for(var i=0;i<9;i++){var mark='',ec='';if(tttBoard[i]===1){mark=tttUserMark;ec=' x';}else if(tttBoard[i]===2){mark=aiMark;ec=' o';}var wc=tttWinCells.indexOf(i)>=0?' win-cell':'';boardHTML+='<div class="tictactoe-cell'+wc+'" onclick="tttPlace('+i+')"><div class="tictactoe-mark'+ec+'">'+mark+'</div></div>';}
    appWindow.innerHTML=''
        +'<div class="tictactoe-app">'
        +'<div class="game-top-bar"><div class="game-back-btn" onclick="tttConfirmExit()">‹</div><div class="game-top-title"></div><div class="game-btn-undo" onclick="tttRequestUndo()">悔棋</div></div>'
        +'<div class="tictactoe-header">'
        +'<div class="tictactoe-player user"><div class="tictactoe-player-avatar" style="'+(userAvatar?'background-image:url('+userAvatar+');background-size:cover;background-position:center;':'')+'">'+(userAvatar?'':userName.charAt(0))+'<div class="tictactoe-avatar-badge user '+(tttUserMark==='X'?'x':'o')+'">'+tttUserMark+'</div></div><div class="tictactoe-player-name">'+userName+'</div><div class="tictactoe-emoji-spot" id="tttEmojiUser"></div></div>'
        +'<div class="tictactoe-vs">VS</div>'
        +'<div class="tictactoe-player ai"><div class="tictactoe-player-avatar" style="'+(contactAvatar?'background-image:url('+contactAvatar+');background-size:cover;background-position:center;':'')+'">'+(contactAvatar?'':contactAvatarText)+'<div class="tictactoe-avatar-badge ai '+(aiMark==='X'?'x':'o')+'">'+aiMark+'</div></div><div class="tictactoe-player-name">'+contactName+'</div><div class="tictactoe-emoji-spot" id="tttEmojiAI"></div></div>'
        +'</div>'
        +'<div class="tictactoe-board-wrap"><div class="tictactoe-board">'+boardHTML+'</div></div>'
        +'<div class="tictactoe-status">'+(tttGameOver?'游戏结束':(tttCurrentPlayer==='user'?'你的回合':contactName+'思考中...'))+'</div>'
        +'<div class="tictactoe-emoji-btn" onclick="toggleTicTacToeEmojiPanel()">>ᴗ<</div>'
        +'<div class="tictactoe-emoji-panel" id="tttEmojiPanel" style="display:none;">'
        +'<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'T^T\',\'tictactoe\')">T^T<br><small>哭哭</small></div>'
        +'<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'x( ˃ ⌂ ˂ ՞ )\',\'tictactoe\')">x( ˃ ⌂ ˂ ՞ )<br><small>拒绝</small></div>'
        +'<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'꩜ᯅ꩜\',\'tictactoe\')">꩜ᯅ꩜<br><small>迷惑</small></div>'
        +'<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'づ♡ど\',\'tictactoe\')">づ♡ど<br><small>比心</small></div>'
        +'<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'o_O\',\'tictactoe\')">o_O<br><small>挑衅</small></div>'
        +'<div class="tictactoe-emoji-item" onclick="sendGameEmoji(\'⦁֊⦁꧞\',\'tictactoe\')">⦁֊⦁꧞<br><small>无语</small></div>'
        +'</div></div>';
}
function tttPlace(i){if(tttGameOver||tttCurrentPlayer!=='user'||tttBoard[i]!==0)return;tttBoard[i]=1;tttLastMove=i;tttHistory.push(i);var r=checkTicTacToeWin();if(r){tttGameOver=true;tttWinCells=r;renderTicTacToe();showGameWinDialog('tictactoe','你赢了！🎉');return;}if(tttHistory.length>=9){tttGameOver=true;renderTicTacToe();showGameWinDialog('tictactoe','平局！');return;}tttCurrentPlayer='ai';renderTicTacToe();setTimeout(function(){tttAIMove();},400);}
function tttAIMove(){if(tttGameOver)return;var m,aiM=2,usM=1,mr=getAIMistakeRate();if(Math.random()<mr){var em=[];for(var i=0;i<9;i++)if(tttBoard[i]===0)em.push(i);m=em[Math.floor(Math.random()*em.length)];}else{m=tttBestMove(aiM,usM);}if(m===undefined||m===null)return;tttBoard[m]=aiM;tttLastMove=m;tttHistory.push(m);var r=checkTicTacToeWin();if(r){tttGameOver=true;tttWinCells=r;renderTicTacToe();showGameWinDialog('tictactoe',(getContactById(gameContactId)||{}).name+'赢了！');return;}if(tttHistory.length>=9){tttGameOver=true;renderTicTacToe();showGameWinDialog('tictactoe','平局！');return;}tttCurrentPlayer='user';renderTicTacToe();}
function tttBestMove(am,um){var bs=-Infinity,bm=0;for(var i=0;i<9;i++){if(tttBoard[i]!==0)continue;tttBoard[i]=am;var s=tttMinimax(0,false,am,um);tttBoard[i]=0;if(s>bs){bs=s;bm=i;}}return bm;}
function tttMinimax(d,isMax,am,um){var r=checkTicTacToeWinRaw();if(r===am)return 10-d;if(r===um)return d-10;var em=[];for(var i=0;i<9;i++)if(tttBoard[i]===0)em.push(i);if(em.length===0)return 0;if(isMax){var b=-Infinity;em.forEach(function(i){tttBoard[i]=am;b=Math.max(b,tttMinimax(d+1,false,am,um));tttBoard[i]=0;});return b;}else{var b=Infinity;em.forEach(function(i){tttBoard[i]=um;b=Math.min(b,tttMinimax(d+1,true,am,um));tttBoard[i]=0;});return b;}}
function checkTicTacToeWinRaw(){var ls=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];for(var l=0;l<ls.length;l++){var a=ls[l][0],b=ls[l][1],c=ls[l][2];if(tttBoard[a]!==0&&tttBoard[a]===tttBoard[b]&&tttBoard[a]===tttBoard[c])return tttBoard[a];}return 0;}
function checkTicTacToeWin(){var ls=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];for(var l=0;l<ls.length;l++){var a=ls[l][0],b=ls[l][1],c=ls[l][2];if(tttBoard[a]!==0&&tttBoard[a]===tttBoard[b]&&tttBoard[a]===tttBoard[c])return[a,b,c];}return null;}
function tttRequestUndo(){if(tttGameOver||tttHistory.length<2){showToast('无法悔棋');return;}var agree=Math.random()>0.4;if(agree){tttHistory.pop();var l=tttHistory.pop();tttBoard[l]=0;tttLastMove=tttHistory.length>0?tttHistory[tttHistory.length-1]:null;tttCurrentPlayer='user';renderTicTacToe();showToast('悔棋成功');}else{showGameEmoji('tictactoe','ai','x( ˃ ⌂ ˂ ՞ )');}}
function tttConfirmExit(){showGameConfirm('确定退出？',function(){renderGameHome();});}

// ============================================================
//                        黑 白 棋
// ============================================================
function startReversi(contactId) {
    gameContactId = contactId; gameType = 'reversi';
    revBoard = []; for (var i = 0; i < 8; i++) { revBoard[i] = []; for (var j = 0; j < 8; j++) revBoard[i][j] = 0; }
    revBoard[3][3] = 2; revBoard[3][4] = 1; revBoard[4][3] = 1; revBoard[4][4] = 2;
    revUserColor = Math.random() < 0.5 ? 1 : 2;
    revCurrentPlayer = revUserColor === 1 ? 'user' : 'ai';
    revHistory = []; revGameOver = false; revPreview = null; revLastMove = null;
    revValidMoves = getReversiValidMoves(revCurrentPlayer === 'user' ? revUserColor : (revUserColor === 1 ? 2 : 1));
    renderReversi();
    if (revCurrentPlayer === 'ai') setTimeout(function() { revAIMove(); }, 600);
}

function getReversiValidMoves(playerColor) {
    var moves = [];
    var dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            if (revBoard[r][c] !== 0) continue;
            var valid = false;
            for (var d = 0; d < dirs.length; d++) {
                var nr = r + dirs[d][0], nc = c + dirs[d][1];
                var foundOpponent = false;
                while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && revBoard[nr][nc] !== 0 && revBoard[nr][nc] !== playerColor) {
                    foundOpponent = true;
                    nr += dirs[d][0]; nc += dirs[d][1];
                }
                if (foundOpponent && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && revBoard[nr][nc] === playerColor) {
                    valid = true; break;
                }
            }
            if (valid) moves.push({ r: r, c: c });
        }
    }
    return moves;
}

function flipReversiPieces(r, c, playerColor) {
    var dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    var opponentColor = playerColor === 1 ? 2 : 1;
    var flipped = [];
    for (var d = 0; d < dirs.length; d++) {
        var nr = r + dirs[d][0], nc = c + dirs[d][1];
        var chain = [];
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && revBoard[nr][nc] === opponentColor) {
            chain.push({ r: nr, c: nc });
            nr += dirs[d][0]; nc += dirs[d][1];
        }
        if (chain.length > 0 && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && revBoard[nr][nc] === playerColor) {
            chain.forEach(function(pos) { revBoard[pos.r][pos.c] = playerColor; flipped.push(pos); });
        }
    }
    return flipped;
}

function renderReversi() {
    var appWindow = document.getElementById('gameAppWindow'); if (!appWindow) return;
    var contact = getContactById(gameContactId); var contactName = contact ? contact.name : '角色';
    var contactAvatar = contact && contact.avatarData ? contact.avatarData : ''; var contactAvatarText = contact ? contact.avatar : '?';
    var masks = typeof getMasks === 'function' ? getMasks() : []; var activeMaskId = localStorage.getItem('active_mask_id') || ''; var activeMask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; } }
    var userName = activeMask ? activeMask.name : '我'; var userAvatar = activeMask && activeMask.avatar ? activeMask.avatar : '';
    var userPieceClass = revUserColor === 1 ? 'black' : 'white'; var aiPieceClass = revUserColor === 1 ? 'white' : 'black';
    var currentColor = revCurrentPlayer === 'user' ? revUserColor : (revUserColor === 1 ? 2 : 1);
    var validMoves = revCurrentPlayer === 'user' ? revValidMoves : [];
    var validMap = {};
    validMoves.forEach(function(m) { validMap[m.r + '_' + m.c] = true; });

    var blackCount = 0, whiteCount = 0;
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { if (revBoard[r][c] === 1) blackCount++; else if (revBoard[r][c] === 2) whiteCount++; }

    var boardHTML = '';
    for (var r = 0; r < 8; r++) {
        for (var c = 0; c < 8; c++) {
            var pieceClass = '', lastClass = '', previewClass = '', validClass = '';
            if (revBoard[r][c] === 1) pieceClass = 'black';
            else if (revBoard[r][c] === 2) pieceClass = 'white';
            if (revLastMove && revLastMove.r === r && revLastMove.c === c) lastClass = ' last-move';
            if (revPreview && revPreview.r === r && revPreview.c === c) previewClass = ' preview';
            if (validMap[r + '_' + c]) validClass = ' valid-move';
            boardHTML += '<div class="reversi-cell' + validClass + '" onclick="revClick(' + r + ',' + c + ')"><div class="reversi-piece ' + pieceClass + lastClass + previewClass + '"></div></div>';
        }
    }

    var statusText = revGameOver ? '游戏结束 · 黑' + blackCount + ' : 白' + whiteCount : (revCurrentPlayer === 'user' ? '你的回合 · 黑' + blackCount + ' : 白' + whiteCount : contactName + '思考中... · 黑' + blackCount + ' : 白' + whiteCount);

    appWindow.innerHTML = ''
        + '<div class="reversi-app">'
        + '<div class="game-top-bar"><div class="game-back-btn" onclick="revConfirmExit()">‹</div><div class="game-top-title"></div><div class="game-btn-undo" onclick="revRequestUndo()">悔棋</div></div>'
        + '<div class="reversi-header">'
        + '<div class="reversi-player user"><div class="reversi-player-avatar" style="' + (userAvatar ? 'background-image:url(' + userAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (userAvatar ? '' : userName.charAt(0)) + '<div class="reversi-avatar-badge user ' + userPieceClass + '"></div></div><div class="reversi-player-name">' + userName + '</div><div class="reversi-emoji-spot" id="revEmojiUser"></div></div>'
        + '<div class="reversi-vs">VS</div>'
        + '<div class="reversi-player ai"><div class="reversi-player-avatar" style="' + (contactAvatar ? 'background-image:url(' + contactAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (contactAvatar ? '' : contactAvatarText) + '<div class="reversi-avatar-badge ai ' + aiPieceClass + '"></div></div><div class="reversi-player-name">' + contactName + '</div><div class="reversi-emoji-spot" id="revEmojiAI"></div></div>'
        + '</div>'
        + '<div class="reversi-board-wrap"><div class="reversi-board">' + boardHTML + '</div></div>'
        + '<div class="reversi-status">' + statusText + '</div>'
        + '<div class="reversi-emoji-btn" onclick="toggleReversiEmojiPanel()">>ᴗ<</div>'
        + '<div class="reversi-emoji-panel" id="revEmojiPanel" style="display:none;">'
        + '<div class="reversi-emoji-item" onclick="sendGameEmoji(\'T^T\',\'reversi\')">T^T<br><small>哭哭</small></div>'
        + '<div class="reversi-emoji-item" onclick="sendGameEmoji(\'x( ˃ ⌂ ˂ ՞ )\',\'reversi\')">x( ˃ ⌂ ˂ ՞ )<br><small>拒绝</small></div>'
        + '<div class="reversi-emoji-item" onclick="sendGameEmoji(\'꩜ᯅ꩜\',\'reversi\')">꩜ᯅ꩜<br><small>迷惑</small></div>'
        + '<div class="reversi-emoji-item" onclick="sendGameEmoji(\'づ♡ど\',\'reversi\')">づ♡ど<br><small>比心</small></div>'
        + '<div class="reversi-emoji-item" onclick="sendGameEmoji(\'o_O\',\'reversi\')">o_O<br><small>挑衅</small></div>'
        + '<div class="reversi-emoji-item" onclick="sendGameEmoji(\'⦁֊⦁꧞\',\'reversi\')">⦁֊⦁꧞<br><small>无语</small></div>'
        + '</div></div>';
}

function revClick(r, c) {
    if (revGameOver || revCurrentPlayer !== 'user') return;
    var currentColor = revUserColor;
    var validMoves = getReversiValidMoves(currentColor);
    var isValid = validMoves.some(function(m) { return m.r === r && m.c === c; });
    if (!isValid) return;
    if (revPreview && revPreview.r === r && revPreview.c === c) { revPlace(r, c); }
    else { revPreview = { r: r, c: c }; revValidMoves = validMoves; renderReversi(); }
}

function revPlace(r, c) {
    revPreview = null;
    var currentColor = revCurrentPlayer === 'user' ? revUserColor : (revUserColor === 1 ? 2 : 1);
    revBoard[r][c] = currentColor;
    var flipped = flipReversiPieces(r, c, currentColor);
    revLastMove = { r: r, c: c };
    revHistory.push({ r: r, c: c, player: currentColor, flipped: flipped });

    var opponentColor = currentColor === 1 ? 2 : 1;
    var opponentMoves = getReversiValidMoves(opponentColor);
    if (opponentMoves.length === 0) {
        var myMoves = getReversiValidMoves(currentColor);
        if (myMoves.length === 0) {
            revGameOver = true;
            revValidMoves = [];
            renderReversi();
            var bc = 0, wc = 0;
            for (var rr = 0; rr < 8; rr++) for (var cc = 0; cc < 8; cc++) { if (revBoard[rr][cc] === 1) bc++; else if (revBoard[rr][cc] === 2) wc++; }
            var uwc = revUserColor === 1 ? bc : wc;
            var awc = revUserColor === 1 ? wc : bc;
            if (uwc > awc) showGameWinDialog('reversi', '你赢了！🎉');
            else if (awc > uwc) showGameWinDialog('reversi', (getContactById(gameContactId) || {}).name + '赢了！');
            else showGameWinDialog('reversi', '平局！');
            return;
        }
        revCurrentPlayer = revCurrentPlayer === 'user' ? 'ai' : 'user';
        revValidMoves = myMoves;
        renderReversi();
        if (revCurrentPlayer === 'ai') setTimeout(function() { revAIMove(); }, 500);
        return;
    }

    revCurrentPlayer = revCurrentPlayer === 'user' ? 'ai' : 'user';
    revValidMoves = opponentMoves;
    renderReversi();
    if (revCurrentPlayer === 'ai') setTimeout(function() { revAIMove(); }, 500);
}

function revAIMove() {
    if (revGameOver) return;
    var aiColor = revUserColor === 1 ? 2 : 1;
    var validMoves = getReversiValidMoves(aiColor);
    if (validMoves.length === 0) {
        revCurrentPlayer = 'user';
        revValidMoves = getReversiValidMoves(revUserColor);
        renderReversi();
        return;
    }
    var move;
    var mistakeRate = getAIMistakeRate();
    if (Math.random() < mistakeRate && validMoves.length > 1) {
        move = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else {
        move = revBestMove(validMoves, aiColor);
    }
    if (!move) return;
    revBoard[move.r][move.c] = aiColor;
    var flipped = flipReversiPieces(move.r, move.c, aiColor);
    revLastMove = { r: move.r, c: move.c };
    revHistory.push({ r: move.r, c: move.c, player: aiColor, flipped: flipped });

    var opponentColor = revUserColor;
    var opponentMoves = getReversiValidMoves(opponentColor);
    if (opponentMoves.length === 0) {
        var myMoves = getReversiValidMoves(aiColor);
        if (myMoves.length === 0) {
            revGameOver = true; revValidMoves = []; renderReversi();
            var bc = 0, wc = 0;
            for (var rr = 0; rr < 8; rr++) for (var cc = 0; cc < 8; cc++) { if (revBoard[rr][cc] === 1) bc++; else if (revBoard[rr][cc] === 2) wc++; }
            var uwc = revUserColor === 1 ? bc : wc; var awc = revUserColor === 1 ? wc : bc;
            if (uwc > awc) showGameWinDialog('reversi', '你赢了！🎉');
            else if (awc > uwc) showGameWinDialog('reversi', (getContactById(gameContactId) || {}).name + '赢了！');
            else showGameWinDialog('reversi', '平局！');
            return;
        }
        revCurrentPlayer = 'user'; revValidMoves = myMoves; renderReversi(); return;
    }
    revCurrentPlayer = 'user'; revValidMoves = opponentMoves; renderReversi();
}

function revBestMove(validMoves, aiColor) {
    var bestScore = -Infinity, bestMove = validMoves[0];
    var corners = [[0,0],[0,7],[7,0],[7,7]];
    validMoves.forEach(function(m) {
        var score = 0;
        corners.forEach(function(corner) {
            if (m.r === corner[0] && m.c === corner[1]) score += 100;
            else if (Math.abs(m.r - corner[0]) <= 1 && Math.abs(m.c - corner[1]) <= 1) score -= 50;
        });
        if (m.r === 0 || m.r === 7 || m.c === 0 || m.c === 7) score += 10;
        score += Math.random() * 5;
        if (score > bestScore) { bestScore = score; bestMove = m; }
    });
    return bestMove;
}

function revRequestUndo() {
    if (revGameOver || revHistory.length < 2) { showToast('无法悔棋'); return; }
    var agree = Math.random() > 0.4;
    if (agree) {
        revHistory.pop(); var last = revHistory.pop();
        revBoard[last.r][last.c] = 0;
        if (last.flipped) last.flipped.forEach(function(pos) { revBoard[pos.r][pos.c] = last.player === 1 ? 2 : 1; });
        revLastMove = revHistory.length > 0 ? { r: revHistory[revHistory.length-1].r, c: revHistory[revHistory.length-1].c } : null;
        revCurrentPlayer = 'user'; revPreview = null;
        revValidMoves = getReversiValidMoves(revUserColor);
        renderReversi(); showToast('悔棋成功');
    } else { showGameEmoji('reversi', 'ai', 'x( ˃ ⌂ ˂ ՞ )'); }
}

function revConfirmExit() { showGameConfirm('确定退出？', function() { renderGameHome(); }); }

// ============================================================
//                      通用：颜文字 / 弹窗
// ============================================================
function toggleGobangEmojiPanel() { var p = document.getElementById('gobangEmojiPanel'); if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none'; }
function toggleTicTacToeEmojiPanel() { var p = document.getElementById('tttEmojiPanel'); if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none'; }
function toggleReversiEmojiPanel() { var p = document.getElementById('revEmojiPanel'); if (p) p.style.display = p.style.display === 'none' ? 'flex' : 'none'; }

function sendGameEmoji(emoji, game) {
    if (game === 'gobang') { var p = document.getElementById('gobangEmojiPanel'); if (p) p.style.display = 'none'; }
    else if (game === 'tictactoe') { var p = document.getElementById('tttEmojiPanel'); if (p) p.style.display = 'none'; }
    else { var p = document.getElementById('revEmojiPanel'); if (p) p.style.display = 'none'; }
    showGameEmoji(game, 'user', emoji);
    setTimeout(function() {
        var resp = { '哭哭': 'づ♡ど', '比心': 'づ♡ど', '挑衅': 'o_O', '迷惑': '꩜ᯅ꩜', '无语': '⦁֊⦁꧞', '拒绝': '⦁֊⦁꧞' };
        showGameEmoji(game, 'ai', resp[emoji] || 'T^T');
    }, 800);
}

function showGameEmoji(game, from, emoji) {
    var spotId;
    if (game === 'gobang') spotId = from === 'user' ? 'gobangEmojiUser' : 'gobangEmojiAI';
    else if (game === 'tictactoe') spotId = from === 'user' ? 'tttEmojiUser' : 'tttEmojiAI';
    else spotId = from === 'user' ? 'revEmojiUser' : 'revEmojiAI';
    var spot = document.getElementById(spotId); if (!spot) return;
    spot.innerHTML = '';
    var bubble = document.createElement('div');
    bubble.className = (game === 'gobang' ? 'gobang-emoji-bubble' : (game === 'tictactoe' ? 'tictactoe-emoji-bubble' : 'reversi-emoji-bubble')) + ' ' + from;
    bubble.textContent = emoji;
    bubble.onclick = function() { bubble.remove(); };
    spot.appendChild(bubble);
    clearTimeout(gameEmojiTimer);
    gameEmojiTimer = setTimeout(function() { bubble.remove(); }, 6000);
}

function showGameWinDialog(game, message) {
    var overlay = document.createElement('div');
    overlay.className = game === 'gobang' ? 'gobang-win-overlay' : (game === 'tictactoe' ? 'tictactoe-win-overlay' : 'reversi-win-overlay');
    overlay.id = 'gameWinOverlay';
    overlay.innerHTML = ''
        + '<div class="' + (game === 'gobang' ? 'gobang-win-dialog' : (game === 'tictactoe' ? 'tictactoe-win-dialog' : 'reversi-win-dialog')) + '">'
        + '<div class="' + (game === 'gobang' ? 'gobang-win-text' : (game === 'tictactoe' ? 'tictactoe-win-text' : 'reversi-win-text')) + '">' + message + '</div>'
        + '<button class="game-btn-confirm" onclick="gameWinAction(\'' + game + '\')">再来一局</button>'
        + '<button class="game-btn-cancel" onclick="gameWinExit()">退出</button>'
        + '</div>';
    document.body.appendChild(overlay);
}
function gameWinAction(game) { var o = document.getElementById('gameWinOverlay'); if (o) o.remove(); if (game === 'gobang') startGobang(gameContactId); else if (game === 'tictactoe') startTicTacToe(gameContactId); else startReversi(gameContactId); }
function gameWinExit() { var o = document.getElementById('gameWinOverlay'); if (o) o.remove(); renderGameHome(); }

function showGameConfirm(msg, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'game-confirm-overlay'; overlay.id = 'gameConfirmOverlay';
    overlay.innerHTML = '<div class="game-confirm-dialog"><p>' + msg + '</p><div class="game-confirm-btns"><button class="game-btn-cancel" onclick="closeGameConfirm()">取消</button><button class="game-btn-confirm" onclick="executeGameConfirm()">确定</button></div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeGameConfirm(); };
    window._gameConfirmCallback = onConfirm;
}
function closeGameConfirm() { var o = document.getElementById('gameConfirmOverlay'); if (o) o.remove(); }
function executeGameConfirm() { closeGameConfirm(); if (window._gameConfirmCallback) window._gameConfirmCallback(); }

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', function() {});
