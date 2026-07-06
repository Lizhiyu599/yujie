/**
 * 玉界 - 塔罗占卜
 * 22张大阿卡那
 */

var _tarotDeck = [
    { name: '愚者', meaning: '新的开始、冒险、天真', reverse: '冲动、鲁莽、缺乏计划' },
    { name: '魔术师', meaning: '创造力、技能、自信', reverse: '欺骗、能力不足、犹豫' },
    { name: '女祭司', meaning: '直觉、智慧、神秘', reverse: '隐藏的信息、表面知识' },
    { name: '女皇', meaning: '丰饶、母性、自然', reverse: '依赖、创造力受阻' },
    { name: '皇帝', meaning: '权威、稳定、领导力', reverse: '专制、缺乏纪律' },
    { name: '教皇', meaning: '传统、信仰、教育', reverse: '反叛、非传统' },
    { name: '恋人', meaning: '爱情、和谐、选择', reverse: '分离、不忠、犹豫' },
    { name: '战车', meaning: '胜利、决心、控制', reverse: '失控、失败、侵略' },
    { name: '力量', meaning: '勇气、耐心、内在力量', reverse: '软弱、自我怀疑' },
    { name: '隐士', meaning: '内省、指引、孤独', reverse: '孤立、逃避现实' },
    { name: '命运之轮', meaning: '转变、机遇、命运', reverse: '厄运、停滞' },
    { name: '正义', meaning: '公平、真相、因果', reverse: '不公平、逃避责任' },
    { name: '倒吊人', meaning: '牺牲、换个角度、等待', reverse: '停滞、无谓的牺牲' },
    { name: '死神', meaning: '结束、转变、重生', reverse: '抗拒改变、停滞' },
    { name: '节制', meaning: '平衡、耐心、调和', reverse: '极端、失衡' },
    { name: '恶魔', meaning: '束缚、欲望、物质主义', reverse: '挣脱、觉醒' },
    { name: '高塔', meaning: '突变、颠覆、启示', reverse: '避免灾难、恐惧改变' },
    { name: '星星', meaning: '希望、灵感、宁静', reverse: '绝望、失去信心' },
    { name: '月亮', meaning: '幻觉、恐惧、潜意识', reverse: '真相浮现、克服恐惧' },
    { name: '太阳', meaning: '快乐、成功、活力', reverse: '暂时的阴霾、缺乏动力' },
    { name: '审判', meaning: '觉醒、重生、召唤', reverse: '逃避召唤、后悔' },
    { name: '世界', meaning: '完成、圆满、成就', reverse: '未完成、延迟' }
];

function openTarot() {
    var appWindow = document.getElementById('tarotAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'tarotAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    _tarotRenderHome();
    appWindow.style.display = 'flex';
}

function closeTarot() {
    var appWindow = document.getElementById('tarotAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

function _tarotRenderHome() {
    var appWindow = document.getElementById('tarotAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = ''
        + '<div class="tarot-app">'
        + '<div class="tarot-nav">'
        + '<div class="tarot-nav-back" onclick="closeTarot()">‹</div>'
        + '<div class="tarot-nav-title">Tarot</div>'
        + '</div>'
        + '<div class="tarot-body">'
        + '<div class="tarot-home-title">塔罗占卜</div>'
        + '<div class="tarot-home-desc">默想你的问题，让命运指引你</div>'
        + '<div class="tarot-menu-card" onclick="_tarotTodayFortune()">'
        + '<div class="tarot-menu-title">今日运势</div>'
        + '<div class="tarot-menu-desc">抽取单张牌，看看今天的运气如何</div>'
        + '</div>'
        + '<div class="tarot-menu-card" onclick="_tarotQuestionMode()">'
        + '<div class="tarot-menu-title">提问占卜</div>'
        + '<div class="tarot-menu-desc">提出你的疑问，用3张牌寻找答案</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}

// ========== 今日运势 ==========
function _tarotTodayFortune() {
    var card = _tarotDraw(1)[0];
    var isReversed = Math.random() > 0.5;
    
    var appWindow = document.getElementById('tarotAppWindow');
    if (!appWindow) return;

    var meaningText = isReversed ? card.reverse : card.meaning;
    var posLabel = isReversed ? '逆位' : '正位';

    appWindow.innerHTML = ''
        + '<div class="tarot-app">'
        + '<div class="tarot-nav">'
        + '<div class="tarot-nav-back" onclick="_tarotRenderHome()">‹</div>'
        + '<div class="tarot-nav-title">今日运势</div>'
        + '</div>'
        + '<div class="tarot-body">'
        + '<div class="tarot-cards-row" style="padding-top:30px;">'
        + '<div class="tarot-slot" style="width:100px;height:156px;">'
        + '<div class="tarot-card-inner flipped">'
        + '<div class="tarot-card-back"></div>'
        + '<div class="tarot-card-front">'
        + '<div class="tarot-card-name">' + card.name + '</div>'
        + '<div class="tarot-card-meaning">' + meaningText + '</div>'
        + '<div class="tarot-card-pos">' + posLabel + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div style="text-align:center;padding:12px 0 20px;">'
        + '<button class="tarot-retry-btn" onclick="_tarotTodayFortune()">重新抽取</button>'
        + '</div>'
        + '</div>'
        + '</div>';
}

// ========== 提问模式 ==========
var _tarotQuestions = [];

function _tarotQuestionMode() {
    var appWindow = document.getElementById('tarotAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = ''
        + '<div class="tarot-app">'
        + '<div class="tarot-nav">'
        + '<div class="tarot-nav-back" onclick="_tarotRenderHome()">‹</div>'
        + '<div class="tarot-nav-title">提问占卜</div>'
        + '</div>'
        + '<div class="tarot-body" style="display:flex;flex-direction:column;">'
        + '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:#8e8e93;font-size:14px;text-align:center;padding:20px;">'
        + '在心中默想你的问题<br>然后点击下方按钮抽取三张牌'
        + '</div>'
        + '<div class="tarot-question-bar">'
        + '<input type="text" class="tarot-question-input" id="tarotQuestionInput" placeholder="写下你的问题…">'
        + '<button class="tarot-question-btn" onclick="_tarotDrawThree()">→</button>'
        + '</div>'
        + '</div>'
        + '</div>';
}

function _tarotDrawThree() {
    var input = document.getElementById('tarotQuestionInput');
    var question = input ? input.value.trim() : '';
    
    var cards = _tarotDraw(3);
    
    var appWindow = document.getElementById('tarotAppWindow');
    if (!appWindow) return;

    var cardsHTML = '';
    cards.forEach(function(card, i) {
        var isReversed = Math.random() > 0.5;
        var posLabel = isReversed ? '逆位' : '正位';
        var meaningText = isReversed ? card.reverse : card.meaning;
        var positionLabel = i === 0 ? '过去' : (i === 1 ? '现在' : '未来');
        
        cardsHTML += ''
            + '<div class="tarot-slot" onclick="this.querySelector(\'.tarot-card-inner\').classList.toggle(\'flipped\')">'
            + '<div class="tarot-card-inner">'
            + '<div class="tarot-card-back"></div>'
            + '<div class="tarot-card-front">'
            + '<div class="tarot-card-name">' + card.name + '</div>'
            + '<div class="tarot-card-meaning">' + meaningText + '</div>'
            + '<div class="tarot-card-pos">' + positionLabel + ' · ' + posLabel + '</div>'
            + '</div>'
            + '</div>'
            + '</div>';
    });

    appWindow.innerHTML = ''
        + '<div class="tarot-app">'
        + '<div class="tarot-nav">'
        + '<div class="tarot-nav-back" onclick="_tarotRenderHome()">‹</div>'
        + '<div class="tarot-nav-title">提问占卜</div>'
        + '</div>'
        + '<div class="tarot-body">'
        + (question ? '<div style="text-align:center;color:#8e8e93;font-size:13px;padding:12px 0 4px;">Q: ' + question + '</div>' : '')
        + '<div class="tarot-cards-row">' + cardsHTML + '</div>'
        + '<div style="text-align:center;padding:0 0 12px;color:#8e8e93;font-size:11px;">点击牌面翻开</div>'
        + '<button class="tarot-retry-btn" onclick="_tarotQuestionMode()">重新提问</button>'
        + '</div>'
        + '</div>';
}

// ========== 抽牌 ==========
function _tarotDraw(count) {
    var deck = _tarotDeck.slice();
    var result = [];
    for (var i = 0; i < count; i++) {
        var idx = Math.floor(Math.random() * deck.length);
        result.push(deck.splice(idx, 1)[0]);
    }
    return result;
}
