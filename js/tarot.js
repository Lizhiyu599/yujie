/**
 * 玉界 - 塔罗占卜
 * 22张大阿卡那，暗黑风格
 */

var _tarotDeck = [
    { name: '愚者', upright: '新的旅程即将开启，保持开放的心态迎接未知。冒险会带来意想不到的收获，不要害怕迈出第一步。', reversed: '你可能过于冲动，需要停下来思考后果。缺乏计划的行动会带来麻烦。' },
    { name: '魔术师', upright: '你拥有实现目标所需的一切资源和能力。现在是行动的最佳时机，自信地展现你的才华。', reversed: '能力被浪费或误用，可能存在欺骗或操纵。审视自己的动机是否纯粹。' },
    { name: '女祭司', upright: '相信你的直觉和内在智慧。答案存在于你的潜意识中，静下心来倾听内心深处的声音。', reversed: '忽视直觉，过于依赖表面信息。有些秘密尚未揭晓，需要更多耐心。' },
    { name: '女皇', upright: '丰饶与创造力正在流动。享受生活中的美好，呵护自己与身边的人，自然会开花结果。', reversed: '过度依赖他人，或创造力受阻。需要重新找回内在的力量和独立。' },
    { name: '皇帝', upright: '秩序和纪律将带来稳定。坚持你的原则，以理性和领导力掌控局面。', reversed: '过于专制或缺乏自律。权力被滥用，或需要放弃控制欲。' },
    { name: '教皇', upright: '寻求传统智慧或导师指引。遵循既定的规则和仪式，会得到精神上的成长。', reversed: '反叛传统，或受到不良影响。需要打破束缚，寻找自己的信仰之路。' },
    { name: '恋人', upright: '一段重要的关系或选择摆在面前。跟随内心做出决定，爱与和谐正在靠近。', reversed: '犹豫不决或感情破裂。价值观冲突，需要面对内心的矛盾。' },
    { name: '战车', upright: '胜利在望，凭借意志力战胜困难。保持专注，勇往直前就会成功。', reversed: '失控或失败。过于激进导致翻车，需要调整策略重新出发。' },
    { name: '力量', upright: '内在的勇气和耐心足以驯服任何困难。温柔比暴力更有力量，坚持就会赢。', reversed: '自我怀疑和软弱正在影响你。需要找回自信，相信自己有足够的力量。' },
    { name: '隐士', upright: '独处和内省会带来深刻的领悟。暂时从喧嚣中抽离，寻找内心的灯塔。', reversed: '过于孤立自己，或逃避现实。该走出舒适区与外界交流了。' },
    { name: '命运之轮', upright: '命运正在转动，机遇从天而降。顺应变化，好运将站在你这边。', reversed: '霉运缠身或停滞不前。抵抗变化只会让情况更糟，接受并适应它。' },
    { name: '正义', upright: '真相和公正会得到伸张。做出明智的决定，承担自己行为的后果。', reversed: '不公平或逃避责任。某种失衡需要被纠正，诚实面对自己。' },
    { name: '倒吊人', upright: '换个角度看问题，暂停是为了更好地前进。牺牲和耐心终将得到回报。', reversed: '无谓的牺牲或陷入僵局。该放手时就放手，不要过度纠结。' },
    { name: '死神', upright: '一个阶段即将结束，新的开始就在前方。拥抱变革，放下不再适合的东西。', reversed: '抗拒改变，活在过去的阴影里。越害怕结束，越难以重获新生。' },
    { name: '节制', upright: '平衡与调和是关键。避免走极端，融合对立面找到中庸之道。', reversed: '生活失去平衡，过度或不足都是问题。需要重新调整节奏。' },
    { name: '恶魔', upright: '被物质或欲望束缚，但解脱的钥匙就在你手中。正视诱惑，重获自由。', reversed: '正在挣脱束缚，觉醒的曙光已经出现。摆脱不良习惯或控制。' },
    { name: '高塔', upright: '突然的变故会颠覆现状，但这是必要的清理。崩塌之后才能重建。', reversed: '避免了某种危机但问题仍在。主动求变好过被动承受。' },
    { name: '星星', upright: '希望和灵感照亮前路。保持信心，宇宙正在为你铺设惊喜。', reversed: '失去希望或感到迷惘。需要重新点燃内心的火花，不要放弃。' },
    { name: '月亮', upright: '迷雾重重，有些真相尚未显现。相信直觉穿过虚幻的幻景。', reversed: '迷雾逐渐散开，真相浮出水面。恐惧即将消散，光明在即。' },
    { name: '太阳', upright: '幸福、成功和活力充满你的生活。自信地发光发热，享受这段美好时光。', reversed: '阳光暂时被云遮住，但温暖从未离去。保持乐观，等待放晴。' },
    { name: '审判', upright: '某个重要的召唤或觉醒时刻。回应内心的呼唤，告别过去迎接新生。', reversed: '逃避某个必须面对的决定。不要再拖延，该做的事终究要做。' },
    { name: '世界', upright: '一个圆满的循环即将完成。你已经走完了这段旅程，值得所有赞誉。', reversed: '某件事尚未完成，还有最后一里路。不要半途而废，坚持到底。' }
];

var _tarotPickedCards = [];
var _tarotMaxPick = 3;
var _tarotModeName = '';
var _tarotQuestion = '';

function openTarot() {
    var appWindow = document.getElementById('tarotAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'tarotAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#0d0d0d;z-index:200;display:none;flex-direction:column;';
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
        + '<div class="tarot-home-title">塔 罗 占 卜</div>'
        + '<div class="tarot-home-desc">命运之轮静待你的触碰</div>'
        + '<div class="tarot-menu-card" onclick="_tarotTodayFortune()">'
        + '<div class="tarot-menu-title">今日运势</div>'
        + '<div class="tarot-menu-desc">每日单张指引，洞察今日能量</div>'
        + '</div>'
        + '<div class="tarot-menu-card" onclick="_tarotQuestionMode()">'
        + '<div class="tarot-menu-title">提问占卜</div>'
        + '<div class="tarot-menu-desc">22张牌中选取3张，解读你的困惑</div>'
        + '</div>'
        + '</div>'
        + '</div>';
}

function _tarotTodayFortune() {
    var today = new Date().toDateString();
    var saved = localStorage.getItem('tarot_today_date');
    if (saved === today) {
        var appWindow = document.getElementById('tarotAppWindow');
        appWindow.innerHTML = ''
            + '<div class="tarot-app">'
            + '<div class="tarot-nav">'
            + '<div class="tarot-nav-back" onclick="_tarotRenderHome()">‹</div>'
            + '<div class="tarot-nav-title">今日运势</div>'
            + '</div>'
            + '<div class="tarot-body">'
            + '<div class="tarot-locked">今日运势已抽取<br>明日再来吧 ✦</div>'
            + '</div>'
            + '</div>';
        return;
    }
    localStorage.setItem('tarot_today_date', today);
    _tarotRenderPickMode(1, '今日运势');
}

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
        + '<div class="tarot-question-area">'
        + '<input type="text" class="tarot-question-input" id="tarotQuestionInput" placeholder="写下你的问题…">'
        + '<button class="tarot-draw-btn" onclick="_tarotStartPick()">开始选牌</button>'
        + '</div>'
        + '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:13px;">'
        + '默想问题 · 静心选牌 · 解读答案'
        + '</div>'
        + '</div>'
        + '</div>';
}

function _tarotStartPick() {
    var input = document.getElementById('tarotQuestionInput');
    var question = input ? input.value.trim() : '';
    if (!question) question = '未写下问题';
    _tarotRenderPickMode(3, '提问占卜', question);
}

function _tarotRenderPickMode(maxPick, modeName, question) {
    _tarotPickedCards = [];
    _tarotMaxPick = maxPick;
    _tarotModeName = modeName;
    _tarotQuestion = question || '';

    var appWindow = document.getElementById('tarotAppWindow');
    if (!appWindow) return;

    var fanHTML = '';
    var totalCards = 22;
    var arcStart = -35;
    var arcEnd = 35;
    var radius = 130;

    for (var i = 0; i < totalCards; i++) {
        var angle = arcStart + (arcEnd - arcStart) * (i / (totalCards - 1));
        var rad = angle * Math.PI / 180;
        var x = 50 + Math.sin(rad) * radius * 0.55;
        var y = 55 - Math.cos(rad) * radius * 0.45;
        var rotate = angle * 0.6;

        fanHTML += ''
            + '<div class="tarot-fan-card-wrap" style="left:' + x + '%;top:' + y + '%;transform:translate(-50%,-50%) rotate(' + rotate + 'deg);z-index:' + i + ';" onclick="_tarotPickFanCard(' + i + ', this)">'
            + '<div class="tarot-card-face">'
            + '<div class="tarot-card-symbol">✦</div>'
            + '<div class="tarot-card-label">' + _tarotDeck[i].name + '</div>'
            + '</div>'
            + '</div>';
    }

    appWindow.innerHTML = ''
        + '<div class="tarot-app">'
        + '<div class="tarot-nav">'
        + '<div class="tarot-nav-back" onclick="_tarotRenderHome()">‹</div>'
        + '<div class="tarot-nav-title">' + modeName + '</div>'
        + '</div>'
        + '<div class="tarot-body">'
        + (_tarotQuestion ? '<div style="text-align:center;color:rgba(255,255,255,0.35);font-size:12px;padding:8px 0;">Q: ' + _tarotQuestion + '</div>' : '')
        + '<div class="tarot-fan-count" id="tarotCount">请选择 ' + maxPick + ' 张牌</div>'
        + '<div class="tarot-fan-area">' + fanHTML + '</div>'
        + '<div id="tarotPickedRow"></div>'
        + '</div>'
        + '</div>';
}

function _tarotPickFanCard(index, el) {
    if (_tarotPickedCards.indexOf(index) >= 0) return;
    if (_tarotPickedCards.length >= _tarotMaxPick) return;

    _tarotPickedCards.push(index);
    el.classList.add('picked');

    var countEl = document.getElementById('tarotCount');
    var remaining = _tarotMaxPick - _tarotPickedCards.length;

    var pickedRow = document.getElementById('tarotPickedRow');
    var html = '<div class="tarot-picked-row">';
    _tarotPickedCards.forEach(function(ci) {
        html += '<div class="tarot-picked-card"><div class="tarot-card-symbol">✦</div><div class="tarot-card-name">' + _tarotDeck[ci].name + '</div></div>';
    });
    html += '</div>';
    pickedRow.innerHTML = html;

    if (remaining === 0) {
        if (countEl) countEl.textContent = '命运之门正在开启…';
        setTimeout(function() { _tarotShowReading(); }, 800);
    } else {
        if (countEl) countEl.textContent = '请选择 ' + _tarotMaxPick + ' 张牌（还剩 ' + remaining + ' 张）';
    }
}

function _tarotShowReading() {
    var appWindow = document.getElementById('tarotAppWindow');
    if (!appWindow) return;

    var positions = _tarotMaxPick === 1 ? ['今日指引'] : ['过去', '现在', '未来'];

    appWindow.innerHTML = ''
        + '<div class="tarot-app">'
        + '<div class="tarot-nav">'
        + '<div class="tarot-nav-back" onclick="_tarotRenderHome()">‹</div>'
        + '<div class="tarot-nav-title">' + _tarotModeName + '</div>'
        + '</div>'
        + '<div class="tarot-body">'
        + '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px 0;font-size:14px;">'
        + '命运之轮正在转动…'
        + '</div>'
        + '</div>'
        + '</div>';

    var cardsInfo = '';
    _tarotPickedCards.forEach(function(cardIdx, i) {
        var card = _tarotDeck[cardIdx];
        var isReversed = Math.random() > 0.5;
        var posLabel = isReversed ? '逆位' : '正位';
        cardsInfo += positions[i] + '：' + card.name + '（' + posLabel + '）\n';
    });

    var prompt = '你是一位经验丰富的塔罗占卜师。请根据以下牌阵，用温暖、神秘、富有洞察力的口吻给出一段完整的解读。\n\n';
    if (_tarotQuestion && _tarotQuestion !== '未写下问题') {
        prompt += '求问者的问题：' + _tarotQuestion + '\n\n';
    }
    prompt += '牌阵：\n' + cardsInfo + '\n';
    prompt += '请将牌串联解读，不要逐张分开解释。用"你"称呼求问者。字数控制在200字以内。';

    if (typeof callChatAPI === 'function') {
        callChatAPI([
            { role: 'system', content: '你是神秘的塔罗占卜师。解读温暖而深刻，不说教，不套话。' },
            { role: 'user', content: prompt }
        ]).then(function(reply) {
            var reading = reply.replace(/\{[^}]*\}/g, '').trim();
            _tarotRenderReading(appWindow, positions, reading);
        }).catch(function() {
            _tarotRenderReading(appWindow, positions, null);
        });
    } else {
        _tarotRenderReading(appWindow, positions, null);
    }
}

function _tarotRenderReading(appWindow, positions, aiReading) {
    var readingsHTML = '';

    if (aiReading) {
        readingsHTML += ''
            + '<div class="tarot-reading" style="margin-bottom:16px;">'
            + '<div class="tarot-reading-title">✦ 解读</div>'
            + '<div class="tarot-reading-text">' + aiReading + '</div>'
            + '</div>';
    }

    readingsHTML += '<div class="tarot-reading-title" style="margin-top:16px;">牌面详情</div>';

    _tarotPickedCards.forEach(function(cardIdx, i) {
        var card = _tarotDeck[cardIdx];
        var isReversed = Math.random() > 0.5;
        var posLabel = isReversed ? '逆位' : '正位';
        var meaningText = isReversed ? card.reversed : card.upright;

        readingsHTML += ''
            + '<div class="tarot-reading">'
            + '<div class="tarot-reading-card-name">' + card.name + '</div>'
            + '<div class="tarot-reading-pos">' + positions[i] + ' · ' + posLabel + '</div>'
            + '<div class="tarot-reading-text">' + meaningText + '</div>'
            + '</div>';
    });

    appWindow.innerHTML = ''
        + '<div class="tarot-app">'
        + '<div class="tarot-nav">'
        + '<div class="tarot-nav-back" onclick="_tarotRenderHome()">‹</div>'
        + '<div class="tarot-nav-title">' + _tarotModeName + '</div>'
        + '</div>'
        + '<div class="tarot-body">'
        + (_tarotQuestion && _tarotQuestion !== '未写下问题' ? '<div style="text-align:center;color:rgba(255,255,255,0.35);font-size:12px;padding:8px 0;">Q: ' + _tarotQuestion + '</div>' : '')
        + readingsHTML
        + '</div>'
        + '</div>';
        }
