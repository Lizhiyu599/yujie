/**
 * 奇问妙答 - 角色每日问答
 * 选择题为主，6-10道题
 * 支持往期记录、自动提问、手动刷新、角色隔离
 * 题目基于聊天剧情生成
 */

// ========== 数据存储 ==========
function getQawendaData() {
    var contactId = getQawendaSelectedChar();
    var key = 'qawenda_data_' + (contactId || 'default');
    var raw = localStorage.getItem(key);
    if (raw) {
        return JSON.parse(raw);
    }
    return {
        selectedChar: contactId || '',
        autoAsk: false,
        todayDate: '',
        todayAsked: false,
        todayQuestions: [],
        todayAnswers: [],
        todayScored: false,
        todayManualCount: 0,
        todayAutoCount: 0,
        history: []
    };
}

function saveQawendaData(data) {
    var contactId = data.selectedChar || getQawendaSelectedChar();
    var key = 'qawenda_data_' + (contactId || 'default');
    localStorage.setItem(key, JSON.stringify(data));
}

function getQawendaSelectedChar() {
    return localStorage.getItem('qawenda_selected_char') || '';
}

// ========== 检查日期是否更新 ==========
function checkQawendaDate() {
    var data = getQawendaData();
    var now = new Date();
    var todayStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
    if (data.todayDate !== todayStr) {
        if (data.todayQuestions.length > 0 && data.todayScored) {
            if (!data.history) data.history = [];
            data.history.unshift({
                date: data.todayDate,
                questions: data.todayQuestions.slice(),
                answers: data.todayAnswers.slice()
            });
            if (data.history.length > 50) data.history = data.history.slice(0, 50);
        }
        data.todayDate = todayStr;
        data.todayAsked = false;
        data.todayQuestions = [];
        data.todayAnswers = [];
        data.todayScored = false;
        data.todayManualCount = 0;
        data.todayAutoCount = 0;
        saveQawendaData(data);
    }
    return data;
}

// ========== 加载弹窗相关 ==========
let qawendaLoadingToast = null;
let isQawendaGenerating = false;

// ========== 打开软件 ==========
function openQawenda() {
    var appWindow = document.getElementById('qawendaAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'qawendaAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    var data = checkQawendaDate();
    renderQawenda(data);
    appWindow.style.display = 'flex';
}

function closeQawenda() {
    var appWindow = document.getElementById('qawendaAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染主界面 ==========
function renderQawenda(data) {
    var appWindow = document.getElementById('qawendaAppWindow');
    if (!appWindow) return;
    if (!data) data = getQawendaData();

    var charName = '未选择角色';
    var charAvatar = '?';
    var charAvatarBg = '';
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var selected = contacts.find(function(c) { return c.id === data.selectedChar; });
    if (selected) {
        charName = selected.name;
        charAvatar = selected.avatarData ? '' : selected.avatar;
        charAvatarBg = selected.avatarData ? 'background-image:url(' + selected.avatarData + ');background-size:cover;background-position:center;' : '';
    }

    var bodyHTML = '';
    var bottomHTML = '';

    if (!data.selectedChar) {
        bodyHTML = '<div class="qw-waiting">请先在设置中选择角色</div>';
        bottomHTML = '<button class="qw-btn qw-btn-black" onclick="openQawendaSettings()">设置</button>';
    } else if (data.todayScored) {
        bodyHTML += '<div class="qw-char-card"><div class="qw-char-avatar" style="' + charAvatarBg + '">' + charAvatar + '</div><div class="qw-char-info"><div class="qw-char-name">' + charName + '</div><div class="qw-char-hint">今日问答已完成</div></div></div>';
        bodyHTML += '<div class="qw-score-display">今日得分：' + calcTodayScore(data) + ' / ' + data.todayQuestions.length + '</div>';
        data.todayQuestions.forEach(function(q, i) {
            var answer = data.todayAnswers[i] || '';
            bodyHTML += '<div class="qw-question-card"><div class="qw-question-num">第' + (i + 1) + '题</div><div class="qw-question-text">' + q.question + '</div><div style="font-size:13px;color:#8e8e93;">你的回答：' + answer + '</div><div class="qw-feedback-card">' + (q.feedback || '暂无评价') + '</div></div>';
        });
        var manRemain = 2 - (data.todayManualCount || 0);
bottomHTML = '<button class="qw-btn qw-btn-white" onclick="openQawendaHistory()">往期记录</button>';
if (manRemain > 0) {
    bottomHTML += '<button class="qw-btn qw-btn-black" onclick="generateQawendaQuestions()">再次提问（剩' + manRemain + '次）</button>';
}
    } else if (data.todayAsked && data.todayQuestions.length > 0) {
        bodyHTML += '<div class="qw-char-card"><div class="qw-char-avatar" style="' + charAvatarBg + '">' + charAvatar + '</div><div class="qw-char-info"><div class="qw-char-name">' + charName + '</div><div class="qw-char-hint">今天问了你 ' + data.todayQuestions.length + ' 道题</div></div></div>';
        data.todayQuestions.forEach(function(q, i) {
            bodyHTML += '<div class="qw-question-card" id="qwQuestion' + i + '"><div class="qw-question-num">第' + (i + 1) + '题 · ' + (q.type === 'choice' ? '选择题' : '填空题') + '</div><div class="qw-question-text">' + q.question + '</div>';
            if (q.type === 'choice') {
                q.options.forEach(function(opt, oi) {
                    var selClass = data.todayAnswers[i] === opt ? ' selected' : '';
                    bodyHTML += '<div class="qw-option' + selClass + '" data-value="' + opt.replace(/"/g, '&quot;') + '" onclick="selectQawendaOption(' + i + ', \'' + opt.replace(/'/g, "\\'") + '\')"><div class="qw-option-radio"></div>' + opt + '</div>';
                });
            } else {
                bodyHTML += '<input type="text" class="qw-fill-input" id="qwFillInput' + i + '" placeholder="输入你的答案..." value="' + (data.todayAnswers[i] || '') + '" onchange="selectQawendaFill(' + i + ', this.value)">';
            }
            bodyHTML += '</div>';
        });
        bottomHTML = '<button class="qw-btn qw-btn-black" onclick="submitQawendaAnswers()">提交答案</button>';
    } else {
        bodyHTML += '<div class="qw-char-card"><div class="qw-char-avatar" style="' + charAvatarBg + '">' + charAvatar + '</div><div class="qw-char-info"><div class="qw-char-name">' + charName + '</div><div class="qw-char-hint">等待今天的提问...</div></div></div>';
        bodyHTML += '<div class="qw-waiting">今天还没有问题<br>点击下方按钮让角色出题吧</div>';
        bottomHTML = '<button class="qw-btn qw-btn-black" onclick="generateQawendaQuestions()">刷新提问</button>';
    }

    appWindow.innerHTML = ''
        + '<div class="qawenda-app">'
        + '<div class="qw-top-bar">'
        + '<div class="qw-back-btn" onclick="closeQawenda()">‹</div>'
        + '<div class="qw-title">奇 问 妙 答</div>'
        + '<div class="qw-settings-btn" onclick="openQawendaSettings()">○</div>'
        + '</div>'
        + '<div class="qw-body">' + bodyHTML + '</div>'
        + '<div class="qw-bottom-bar">' + bottomHTML + '</div>'
        + '</div>';
}

// ========== 选择选项（点击直接选中） ==========
function selectQawendaOption(index, value) {
    var data = getQawendaData();
    if (!data.todayAnswers) data.todayAnswers = [];
    data.todayAnswers[index] = value;
    saveQawendaData(data);

    var card = document.getElementById('qwQuestion' + index);
    if (card) {
        var options = card.querySelectorAll('.qw-option');
        options.forEach(function(opt) {
            var optValue = opt.getAttribute('data-value') || opt.textContent.trim();
            if (optValue === value) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }
}

function selectQawendaFill(index, value) {
    var data = getQawendaData();
    if (!data.todayAnswers) data.todayAnswers = [];
    data.todayAnswers[index] = value;
    saveQawendaData(data);
}

// ========== 生成问题（基于聊天剧情） ==========
async function generateQawendaQuestions() {
    if (isQawendaGenerating) {
        showToast('问题正在生成中，请稍候');
        return;
    }

    var data = checkQawendaDate();
    if (!data.selectedChar) {
        showToast('请先在设置中选择角色');
        return;
    }

    if (data.todayManualCount >= 2) {
        showToast('今天手动生成已达上限（2次）');
        return;
    }

    isQawendaGenerating = true;
    if (qawendaLoadingToast) qawendaLoadingToast.remove();
    qawendaLoadingToast = document.createElement('div');
    qawendaLoadingToast.className = 'global-toast';
    qawendaLoadingToast.textContent = '正在生成问题…';
    document.body.appendChild(qawendaLoadingToast);

    var contact = null;
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    for (var i = 0; i < contacts.length; i++) {
        if (contacts[i].id === data.selectedChar) { contact = contacts[i]; break; }
    }
    if (!contact) {
        if (qawendaLoadingToast) qawendaLoadingToast.remove();
        qawendaLoadingToast = null;
        isQawendaGenerating = false;
        showToast('未找到该角色');
        return;
    }

    var chatContent = '';
    if (typeof getRecentHistory === 'function') {
        var historyMessages = getRecentHistory(data.selectedChar, 30);
        historyMessages.forEach(function(m) {
            var roleName = m.role === 'user' ? '用户' : contact.name;
            chatContent += roleName + '：' + m.content + '\n';
        });
    }
    if (!chatContent.trim()) {
        chatContent = '今天还没有对话记录。';
    }

    var systemPrompt = buildSystemPrompt ? buildSystemPrompt(data.selectedChar) : '';
    var askPrompt = '你今天是奇问妙答的出题人。请以' + contact.name + '的口吻出题。\n\n【强制要求】出6-10道选择题，不能少于6道。\n\n【人称规则】题目中的"我"代表角色（出题人），"你"代表用户（答题人）。选项中的"你"指角色，"我"指用户。例如正确选项："把我关起来只许看你"。错误选项："把你关起来只许看我"。\n\n【角色一致性】你在奇问妙答中的语气和性格必须与聊天中完全一致。聊天中是什么样，出题时就什么样。不要因为是出题就改变性格。\n\n题目基于以下聊天记录，可以涉及以前的事，可以出送命题。\n\n【语言风格】可以暧昧、可以挑逗、可以有情欲暗示，但用词要缠绵拉扯、情意绵绵，不要直接使用器官词汇或直白粗俗的表达。\n\n【最近的聊天记录】\n' + chatContent + '\n\n【格式-必须严格遵守】每道题格式如下：\n1. 题目内容\nA. 选项一\nB. 选项二\nC. 选项三\nD. 选项四\n\n每道题的每个选项必须独占一行，用"A. ""B. ""C. ""D. "开头。不要写答案。';
    
    try {
        var reply = await callChatAPI([
            { role: 'system', content: systemPrompt + '\n\n你现在是奇问妙答的出题人，只出题不解答。' },
            { role: 'user', content: askPrompt }
        ]);

        var questions = parseQawendaQuestions(reply);
        if (questions.length === 0) {
            if (qawendaLoadingToast) qawendaLoadingToast.remove();
            qawendaLoadingToast = null;
            isQawendaGenerating = false;
            showToast('问题生成失败，请重试');
            return;
        }

        data.todayAsked = true;
        data.todayQuestions = questions;
        data.todayAnswers = new Array(questions.length).fill('');
        data.todayScored = false;
        data.todayManualCount = (data.todayManualCount || 0) + 1;
        saveQawendaData(data);
        
        if (qawendaLoadingToast) qawendaLoadingToast.remove();
        qawendaLoadingToast = null;
        isQawendaGenerating = false;
        showToast('问题已生成（共' + questions.length + '题）');
        renderQawenda(data);
    } catch (e) {
        if (qawendaLoadingToast) qawendaLoadingToast.remove();
        qawendaLoadingToast = null;
        isQawendaGenerating = false;
        showToast('问题生成失败，请重试');
    }
}

// ========== 解析AI返回的问题 ==========
function parseQawendaQuestions(rawText) {
    var questions = [];
    var lines = rawText.split('\n').filter(function(l) { return l.trim(); });
    var currentQ = null;
    var options = [];

    lines.forEach(function(line) {
        var qMatch = line.match(/^(\d+)[\.、]\s*(.+)/);
        if (qMatch) {
            if (currentQ && options.length > 0) {
                currentQ.options = options;
                questions.push(currentQ);
            }
            currentQ = { question: qMatch[2], type: 'choice', options: [] };
            options = [];
        } else {
            var optMatch = line.match(/^[A-D][\)\.\、]\s*(.+)/);
            if (optMatch && currentQ) {
                options.push(optMatch[1]);
            }
        }
    });
    if (currentQ && options.length > 0) {
        currentQ.options = options;
        questions.push(currentQ);
    }

    return questions.slice(0, 10);
}

// ========== 提交答案并评分 ==========
async function submitQawendaAnswers() {
    var data = getQawendaData();
    if (!data.todayAsked || data.todayQuestions.length === 0) return;

    var allAnswered = true;
    for (var i = 0; i < data.todayQuestions.length; i++) {
        if (!data.todayAnswers[i] || data.todayAnswers[i].trim() === '') {
            allAnswered = false;
            break;
        }
    }
    if (!allAnswered) {
        showToast('请完成所有题目后再提交');
        return;
    }

    if (qawendaLoadingToast) qawendaLoadingToast.remove();
    qawendaLoadingToast = document.createElement('div');
    qawendaLoadingToast.className = 'global-toast';
    qawendaLoadingToast.textContent = '正在评分…';
    document.body.appendChild(qawendaLoadingToast);

    var contact = null;
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    for (var j = 0; j < contacts.length; j++) {
        if (contacts[j].id === data.selectedChar) { contact = contacts[j]; break; }
    }

    var systemPrompt = buildSystemPrompt ? buildSystemPrompt(data.selectedChar) : '';

    var scorePrompt = '请以' + contact.name + '的口吻，对用户刚才的回答进行评分和评价。每题满分1分，总共' + data.todayQuestions.length + '分。\n\n';
    data.todayQuestions.forEach(function(q, k) {
        scorePrompt += '第' + (k + 1) + '题：' + q.question + '\n用户回答：' + (data.todayAnswers[k] || '未答') + '\n\n';
    });
    scorePrompt += '请逐题给出评价，最后给出总分。每题只能给0分或1分。\n\n【送命题评分规则】送命题是指涉及前任、暧昧对象等敏感话题的题目。评分逻辑：如果用户对别人表现得太了解、太在意、记得太清楚，说明用户对那个人太上心，角色应该吃醋给0分。如果用户答错或表现得不了解不在意，说明用户心里没有别人，角色应该开心给1分。根据角色性格和问题语境自主判断。\n\n【必须严格遵守的输出格式】\n1. 评价内容（1分）\n2. 评价内容（0分）\n3. 评价内容（1分）\n...\n总分：X分\n\n每道题都必须有评价，不能跳过任何一题。';

    try {
        var reply = await callChatAPI([
            { role: 'system', content: systemPrompt + '\n\n你现在要批改用户的答题。每题最多1分。评价要符合角色性格。' },
            { role: 'user', content: scorePrompt }
        ]);

        parseQawendaScores(reply, data);
        data.todayScored = true;
        saveQawendaData(data);
        if (qawendaLoadingToast) { qawendaLoadingToast.remove(); qawendaLoadingToast = null; }
        showToast('评分完成');
        renderQawenda(data);
    } catch (e) {
        if (qawendaLoadingToast) { qawendaLoadingToast.remove(); qawendaLoadingToast = null; }
        showToast('评分失败，请重试');
    }
}

// ========== 解析评分 ==========
function parseQawendaScores(rawText, data) {
    var totalScore = 0;
    var lines = rawText.split('\n');
    var scoreIndex = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        
        // 检查是否是总分行
        var totalMatch = line.match(/总分[：:]\s*(\d+)/);
        if (totalMatch) {
            totalScore = Math.min(parseInt(totalMatch[1]), data.todayQuestions.length);
            continue;
        }

        // 尝试匹配题号和内容
        var match = line.match(/^(\d+)[\.、\)]\s*(.+)/);
        if (match && scoreIndex < data.todayQuestions.length) {
            var content = match[2];
            var scoreMatch = content.match(/（(\d+)分）/) || content.match(/\((\d+)分\)/) || content.match(/(\d+)分/);
            var score = scoreMatch ? Math.min(parseInt(scoreMatch[1]), 1) : 1;
            data.todayQuestions[scoreIndex].feedback = content;
            data.todayQuestions[scoreIndex].score = score;
            scoreIndex++;
        }
    }

    // 如果没解析到总分，用累计的
    if (totalScore === 0) {
        for (var j = 0; j < data.todayQuestions.length; j++) {
            if (data.todayQuestions[j].score) totalScore += data.todayQuestions[j].score;
        }
    }

    data.todayTotalScore = totalScore;
}

// ========== 计算得分 ==========
function calcTodayScore(data) {
    if (data.todayTotalScore) return data.todayTotalScore;
    var total = 0;
    if (data.todayQuestions) {
        data.todayQuestions.forEach(function(q) {
            if (q.score) total += q.score;
        });
    }
    return total;
}

// ========== 设置面板 ==========
function openQawendaSettings() {
    var data = getQawendaData();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];

    var charListHTML = '';
    if (contacts.length === 0) {
        charListHTML = '<div style="text-align:center;color:#8e8e93;padding:16px;">暂无角色</div>';
    } else {
        contacts.forEach(function(c) {
            var isActive = c.id === data.selectedChar;
            var badge = isActive ? '<span style="font-size:10px;color:#fff;background:#1d1d1f;padding:2px 6px;border-radius:4px;margin-left:6px;">当前</span>' : '';
            charListHTML += '<div class="qw-char-select-item' + (isActive ? ' active' : '') + '" onclick="selectQawendaChar(\'' + c.id + '\')">' + c.name + badge + '</div>';
        });
    }

    var overlay = document.createElement('div');
    overlay.className = 'qw-edit-overlay';
    overlay.id = 'qwSettingsOverlay';
    overlay.innerHTML = ''
        + '<div class="qw-edit-panel" onclick="event.stopPropagation()">'
        + '<div class="qw-edit-handle"></div>'
        + '<div class="qw-edit-title">奇问妙答设置</div>'
        + '<div style="font-size:13px;color:#8e8e93;margin-bottom:8px;">选择出题角色</div>'
        + charListHTML
        + '<div class="qw-edit-row" style="margin-top:12px;">'
        + '<span>自动提问</span>'
        + '<input type="checkbox" class="ios-switch-sm" ' + (data.autoAsk ? 'checked' : '') + ' onchange="toggleQawendaAuto(this.checked)">'
        + '</div>'
        + '<div style="font-size:11px;color:#8e8e93;margin:4px 0 12px;">开启后角色每天自动出题（最多1次）</div>'
        + '<div class="qw-edit-buttons">'
        + '<div class="qw-edit-btn-cancel" onclick="closeQawendaSettings()">关闭</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeQawendaSettings(); };
}

function selectQawendaChar(charId) {
    localStorage.setItem('qawenda_selected_char', charId);
    closeQawendaSettings();
    showToast('角色已选择');
    var data = getQawendaData();
    renderQawenda(data);
}

function toggleQawendaAuto(checked) {
    var data = getQawendaData();
    data.autoAsk = checked;
    saveQawendaData(data);
}

function closeQawendaSettings() {
    var overlay = document.getElementById('qwSettingsOverlay');
    if (overlay) overlay.remove();
}

// ========== 往期记录 ==========
function openQawendaHistory() {
    var data = getQawendaData();
    var history = data.history || [];

    var overlay = document.createElement('div');
    overlay.className = 'qw-edit-overlay';
    overlay.id = 'qwHistoryOverlay';

    var historyHTML = '';
    if (history.length === 0) {
        historyHTML = '<div style="text-align:center;color:#8e8e93;padding:40px;">暂无往期记录</div>';
    } else {
        history.forEach(function(record) {
            historyHTML += '<div style="font-size:14px;font-weight:600;color:#000;margin:12px 0 8px;">' + record.date + '</div>';
            record.questions.forEach(function(q, i) {
                var answer = record.answers[i] || '未答';
                historyHTML += '<div class="qw-question-card"><div class="qw-question-num">第' + (i + 1) + '题</div><div class="qw-question-text">' + q.question + '</div><div style="font-size:13px;color:#8e8e93;">回答：' + answer + '</div><div class="qw-feedback-card">' + (q.feedback || '暂无评价') + '</div></div>';
            });
        });
    }

    overlay.innerHTML = ''
        + '<div class="qw-edit-panel" onclick="event.stopPropagation()">'
        + '<div class="qw-edit-handle"></div>'
        + '<div class="qw-edit-title">往期记录</div>'
        + historyHTML
        + '<div class="qw-edit-buttons"><div class="qw-edit-btn-cancel" onclick="closeQawendaHistory()">关闭</div></div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeQawendaHistory(); };
}

function closeQawendaHistory() {
    var overlay = document.getElementById('qwHistoryOverlay');
    if (overlay) overlay.remove();
}
