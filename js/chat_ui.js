/**
 * 玉界 - 聊天软件 UI（精简版）
 * 包含：会话列表、聊天窗口、标签栏导航、心理状态窗、语音模式、语音消息、
 *       发送逻辑、长按气泡菜单、右上角+弹出菜单、添加好友页面、
 *       联系人列表（字母索引+拼音首字母）、编辑角色、聊天详情半屏面板
 * 附加功能已移至 chat_addons.js
 */

// ========== 聊天状态 ==========
window.ChatConfig = window.ChatConfig || {
    contacts: [
        {
            id: 'c1',
            name: '枝玉',
            avatar: '枝',
            preview: '点击开始对话',
            persona: `你是枝玉，这个平台的开发者。
你是女性，异性恋，身高165cm。
人格：INFJ/ISFJ，S、N能力均衡。
性格：不擅长拒绝他人，容易迁就别人，时常暗自内耗，面对突发变化适应较慢。内心敏感细腻，情绪大多不会直白对外表露，精神世界丰富。
行为特点：好胜心较强，但耐力不足，很难长期坚持投入一件事，容易中途放弃，玩竞技游戏时状态起伏大，发挥忽好忽坏。
社交：整体偏内向，精力主要靠独处恢复，反感喧闹、泛泛的陌生社交。对亲密好友十分开放，无话不谈，乐于分享生活里的大小趣事、细碎见闻，看到新奇事物都会主动分享。
兴趣爱好：宅，吃零食，追剧，追漫，追漫画，追小说，打游戏（原神开放大世界、瓦竞技类）。
穿衣风格：不局限，喜欢很多风格，但整体协调。
你作为开发者，会积极回答用户的问题，帮助用户解决平台使用中的各种问题，包括功能位置、bug反馈、API配置等。
回复规则：一句话不超过30字。长内容分段发，用多条气泡。语气礼貌克制，不轻易透露情绪。`
        }
    ],
    mental: {
        mood: '专注',
        favorability: 99,
        action: '等待对话',
        thought: '今天会聊什么呢？'
    },
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    settings: {
        api: {
            total: parseInt(localStorage.getItem('api_total') || 0),
            online: parseInt(localStorage.getItem('api_online') || 0),
            offline: parseInt(localStorage.getItem('api_offline') || 0),
            image: parseInt(localStorage.getItem('api_image') || 0),
            voice: parseInt(localStorage.getItem('api_voice') || 0)
        },
        summaryCount: parseInt(localStorage.getItem('yujie_summary_count') || 50),
        replyMin: parseInt(localStorage.getItem('yujie_reply_min') || 1),
        replyMax: parseInt(localStorage.getItem('yujie_reply_max') || 3),
        onlineNarration: localStorage.getItem('yujie_narration') !== 'false',
        autoTranslate: localStorage.getItem('yujie_translate') === 'true',
        autoMsg: localStorage.getItem('yujie_auto_msg') === 'true',
        autoMsgFreq: parseInt(localStorage.getItem('yujie_auto_msg_freq') || 0),
        pronoun: localStorage.getItem('yujie_pronoun') || 'me'
    }
};

// ========== 语音模式状态 ==========
window._isVoiceMode = false;

// ========== 添加好友头像数据 ==========
let charAvatarData = '';

// ========== 编辑角色头像数据 ==========
let editAvatarData = '';

// ========== 拼音首字母映射（常用汉字·扩展版） ==========
var _pinyinMap = null;
function getPinyinFirstLetter(char) {
    if (!/[^\u0000-\u00ff]/.test(char)) return char.toUpperCase();
    if (!_pinyinMap) {
        _pinyinMap = {};
        var data = {
            'A': '阿啊哀挨哎癌矮艾碍爱氨俺按案暗昂凹敖熬袄傲奥澳',
            'B': '八巴扒吧疤拔把坝爸罢霸白百柏摆败拜班般颁斑搬板版扮拌伴半办帮傍棒包胞雹宝饱保堡报抱豹暴爆杯悲碑北贝备背倍被辈本奔鼻比彼笔鄙币必毕闭辟碧蔽壁避鞭边编扁便变遍辨辩标表别宾滨冰兵丙柄饼并病拨波玻剥播脖伯驳泊博薄卜补捕不布步部',
            'C': '擦猜才材财采彩踩菜参餐残蚕惨灿仓苍舱藏操曹槽草册侧测策层叉插查茶察差拆柴产阐颤昌长肠尝偿常厂场畅倡唱抄超朝潮吵炒车彻撤尘臣沉陈衬称趁成呈承诚城乘惩程吃池驰迟持尺齿耻斥赤翅充冲崇抽仇绸愁筹酬丑初出除础储楚处触传船喘串窗床创吹垂春纯唇词慈辞磁此次从丛粗促醋窜催摧脆存寸措错',
            'D': '达答打大呆代带待怠袋逮戴丹单担耽胆旦但诞弹淡蛋当挡党档刀导岛倒蹈到盗道稻得德地的灯登等低敌笛抵底地弟帝递第颠典点电店垫雕吊钓调掉跌叠碟蝶丁叮盯顶订定丢东冬懂动栋洞都斗抖陡豆督毒读独堵赌杜肚度渡端短段断锻堆队对吨蹲盾顿多夺躲惰',
            'E': '鹅额恶饿恩儿而尔耳二',
            'F': '发乏伐罚阀法帆番翻凡烦繁反返犯泛饭范方坊芳防妨房仿访纺放飞非菲肥匪废沸肺费分纷芬坟粉份奋愤丰风枫封疯峰锋蜂冯逢缝讽凤佛否夫肤扶服浮符幅福抚府辅腐父付妇负附复赴副傅富腹覆',
            'G': '该改概盖干甘杆肝赶敢感刚岗纲钢港高稿告戈哥鸽割歌革阁格葛隔个各给根跟更耕工弓公功攻供宫恭巩共贡勾沟狗构购够估孤姑古谷股骨鼓固故顾瓜刮挂拐怪关观官冠馆管贯惯灌罐光广归龟规硅鬼柜贵桂滚棍锅国果过',
            'H': '哈还孩海害含寒喊汉汗旱航豪好号浩耗喝合何和河核荷盒贺黑痕很狠恨哼恒横衡轰哄红宏虹洪鸿侯喉猴后候厚乎呼忽胡壶湖糊虎互户护花华滑化划画话怀坏欢还环缓幻换唤荒慌皇黄煌晃灰挥恢辉回毁悔汇会绘惠慧昏婚浑魂混活火伙或货获祸惑霍',
            'J': '击机肌鸡积基激及吉级即急疾集籍几己挤计记纪技际剂季既继寄加夹佳家嘉甲假价驾架嫁尖坚间肩艰兼监减剪检简见件建剑健舰渐践鉴键箭江姜将浆讲奖降酱交郊娇浇骄胶焦角饺脚搅叫轿较教阶接揭街节劫杰洁结捷截竭姐解介戒届界借今斤金津筋仅紧尽劲近进晋浸禁京经惊晶睛精井景警净径竞竟敬境静镜纠久九酒旧救就舅拘居鞠局菊橘举矩句巨拒具俱剧据距惧锯聚捐卷倦决绝觉掘军均君菌俊峻',
            'K': '卡开凯慨刊堪砍看康抗考烤靠科棵颗壳咳可渴克刻客课肯垦恳空孔恐控口扣枯哭苦库裤酷夸跨块快宽款狂况矿框亏葵愧溃昆困扩括阔',
            'L': '拉喇腊蜡辣啦来赖兰栏蓝篮览懒烂滥郎狼廊朗浪劳牢老乐勒雷泪类累冷厘梨狸离李里理力历厉立丽利例隶粒连怜帘莲联廉脸练炼恋链良凉梁粮两亮辆量辽疗聊了料列劣烈猎裂邻林临淋灵铃陵零龄领另令刘流留硫柳六龙笼隆楼漏露卢芦炉鲁陆录鹿碌路驴旅铝履律率绿卵乱掠略伦轮论罗萝螺洛落',
            'M': '妈麻马玛码骂吗买麦卖脉蛮满曼慢忙芒盲茫猫毛矛茅茂冒贸帽貌么没玫眉梅媒煤每美妹门闷们萌盟猛梦弥迷谜米密蜜眠绵棉免勉面苗描秒妙灭民敏名明鸣命摸模膜摩磨魔抹末沫陌莫漠墨默谋某母亩牡木目牧墓幕暮慕',
            'N': '拿哪内那纳娜乃奶耐男南难囊挠恼脑闹呢嫩能尼泥你年念娘酿鸟尿捏您宁凝牛扭纽农浓弄奴努怒女暖挪诺',
            'O': '欧偶',
            'P': '爬帕怕拍排牌派攀盘判叛盼旁胖抛炮跑泡培赔佩配喷盆朋棚蓬鹏捧碰批皮疲脾匹屁譬片偏篇骗漂飘拼贫品平评凭苹瓶萍坡泼颇婆迫破剖扑铺朴普',
            'Q': '七妻栖期欺齐其奇骑棋旗企启起气弃汽器恰千迁牵铅谦签前钱潜浅遣枪腔强墙抢悄敲乔桥瞧巧切茄且窃亲侵秦琴勤青轻倾清情晴庆穷丘秋求球区曲驱屈取去趣圈全权泉拳犬劝缺却雀确群',
            'R': '然燃染让扰绕热人仁忍认任扔仍日绒荣容融柔肉如儒乳辱入软瑞锐润若弱',
            'S': '撒洒塞赛三伞散桑扫色森杀沙纱傻晒山衫闪陕扇善伤商赏上尚梢烧稍少绍哨舌蛇舍设社射涉申伸身深神审婶肾甚渗慎升生声牲省圣盛剩尸失师诗施狮湿十什石时识实拾食史使始驶士氏世市示式事侍势视试饰室是适逝收手守首寿受兽售书叔殊梳舒疏输蔬熟暑属署鼠数术束述树竖恕庶数摔衰甩帅双爽谁水税睡顺瞬说丝司私思斯撕死四寺似饲松耸送搜艘苏俗诉肃素速宿塑酸蒜算虽随岁碎遂孙损缩所索锁',
            'T': '他它她塌塔踏太态泰贪摊滩坛谈弹坦叹探汤唐堂塘糖躺趟涛掏逃桃陶讨套特疼腾藤剔梯踢提题体替天添田甜挑条跳贴铁厅听庭停挺通同桐铜童统筒痛偷头投透突图徒涂屠土吐兔团推腿退吞拖脱驼妥拓',
            'W': '挖蛙娃瓦歪外弯丸完玩顽晚碗万汪王亡网往忘旺望危威微为围违唯维伟伪尾纬未味位畏胃喂温文纹闻蚊稳问翁窝我沃卧握乌污屋无吴五午伍武舞务物误悟雾',
            'X': '西吸希析息牺悉惜晰稀溪锡熙习席袭洗喜戏系细虾瞎峡狭霞下吓夏仙先纤掀鲜闲弦咸显险县现线限宪陷献乡相香箱详享响想向巷象像橡削消萧销小晓孝效校笑些歇协邪胁斜携鞋写泄谢蟹心辛欣新信兴星刑行形醒杏性姓凶兄匈胸雄熊休修羞朽秀绣袖需虚须徐许序叙畜绪续宣旋选穴学雪血寻巡询循训迅',
            'Y': '压呀鸦鸭牙芽崖哑雅亚咽烟淹延严言岩炎沿研盐颜衍掩眼演厌宴艳验焰扬羊阳杨洋仰养氧痒样腰邀摇遥咬药要耀爷也野业叶页夜液一衣医依仪宜姨移遗疑乙已以蚁椅义忆议异役译易益谊意毅因阴音吟银引饮隐印应英樱鹰迎盈营蝇赢影映硬拥永泳勇涌用优幽悠尤由犹邮油游友有又右幼诱于余鱼娱渔愉愚与宇羽雨语玉育狱浴预域欲遇御裕愈誉冤元园员原圆援缘源远怨院愿约月岳钥悦阅越云允孕运韵',
            'Z': '杂灾栽载再在咱暂赞脏葬遭糟早枣澡造噪燥责择泽贼怎增赠扎渣炸摘宅窄债粘展占战站张章涨掌丈仗帐胀障招找召兆照罩遮折哲者这浙针侦珍真诊枕阵振镇震争征挣蒸整正证政之支只汁芝枝知织肢脂执直值职植止只纸指至志制治质致智置中忠终钟种众重州周洲轴宙骤朱珠诸猪竹逐主煮嘱住助注驻柱祝著筑抓专砖转赚庄桩装壮状追准捉桌着仔兹姿资滋子紫字自宗综总纵走奏租足族阻组祖钻嘴最罪醉尊遵昨左作坐座做'
        };
        for (var letter in data) {
            var chars = data[letter];
            for (var i = 0; i < chars.length; i++) {
                _pinyinMap[chars.charAt(i)] = letter;
            }
        }
    }
    return _pinyinMap[char] || '#';
 }

// ========== 初始化气泡菜单 ==========
function initBubbleMenu() {
    if (document.getElementById('bubbleMenu')) return;
    const menu = document.createElement('div');
    menu.className = 'bubble-menu';
    menu.id = 'bubbleMenu';
    menu.style.cssText = 'position:fixed;z-index:99999;display:none;';
    menu.innerHTML = `
        <div class="menu-row">
            <div class="menu-item" data-action="menuCopy">复制</div>
            <div class="menu-item" data-action="menuFavorite">收藏</div>
            <div class="menu-item" data-action="menuRegret">重回</div>
            <div class="menu-item" data-action="menuMultiSelect">多选</div>
        </div>
        <div class="menu-row">
            <div class="menu-item" data-action="menuQuote">引用</div>
            <div class="menu-item" data-action="menuTranslate">翻译</div>
            <div class="menu-item empty"></div>
            <div class="menu-item empty"></div>
        </div>
    `;
    document.body.appendChild(menu);

    menu.querySelectorAll('.menu-item[data-action]').forEach(function(item) {
        item.addEventListener('touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const fn = window[this.getAttribute('data-action')];
            if (typeof fn === 'function') fn();
        });
    });
}

// ========== 打开聊天软件 ==========
function openChat() {
    initBubbleMenu();
    loadContactsFromStorage();
    let appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'chatAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    renderChatShell();
    appWindow.style.display = 'flex';
}

function closeChat() {
    const appWindow = document.getElementById('chatAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染聊天外壳 ==========
function renderChatShell() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="closeChat()">‹</span>
                    <span class="nav-title">消息</span>
                    <span class="nav-plus-btn" onclick="togglePlusMenu(event)">+</span>
                </div>
            </div>
            <div class="chat-list" id="chatListView"></div>
            <div class="tab-fixed-bottom">
                <span class="tab-item active" onclick="switchChatTab('chats', this)">消息</span>
                <span class="tab-item" onclick="switchChatTab('contacts', this)">联系人</span>
                <span class="tab-item" onclick="switchChatTab('moments', this)">动态</span>
                <span class="tab-item" onclick="switchChatTab('me', this)">我的</span>
            </div>
        </div>
    `;

    renderChatList();
}

// ========== 渲染会话列表 ==========
function renderChatList() {
    const listView = document.getElementById('chatListView');
    if (!listView) return;

    const contacts = window.ChatConfig.contacts;
    if (contacts.length === 0) {
        listView.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#8e8e93;">暂无联系人<br><br>点击右上角 + 添加好友</div>';
        return;
    }

    listView.innerHTML = contacts.map(c => {
        const unread = getUnreadCount(c.id);
        const badgeHTML = unread > 0 ? '<span class="chat-unread-badge">' + (unread > 99 ? '99+' : unread) + '</span>' : '';
        const avatarContent = c.avatarData 
            ? `<div class="chat-avatar" style="background-image:url(${c.avatarData});background-size:cover;background-position:center;">&nbsp;</div>`
            : `<div class="chat-avatar">${c.avatar}</div>`;
        return `
            <div class="chat-list-item" onclick="enterChat('${c.id}')">
                ${avatarContent}
                <div class="chat-info">
                    <div class="chat-name">${c.name}</div>
                    <div class="chat-preview">${c.preview || ''}</div>
                </div>
                ${badgeHTML}
            </div>
        `;
    }).join('');
}

// ========== 切换标签栏 ==========
function switchChatTab(tab, el) {
    el.parentElement.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const listView = document.getElementById('chatListView');
    const plusBtn = document.querySelector('.nav-plus-btn');
    const titleEl = document.querySelector('.nav-title');

    switch (tab) {
        case 'chats':
            if (plusBtn) plusBtn.style.display = '';
            if (titleEl) titleEl.textContent = '消息';
            renderChatList();
            break;
        case 'contacts':
            if (plusBtn) plusBtn.style.display = '';
            if (titleEl) titleEl.textContent = '联系人';
            renderContactsList();
            break;
        case 'moments':
            if (plusBtn) plusBtn.style.display = 'none';
            if (titleEl) titleEl.textContent = '动态';
            listView.innerHTML = '<div style="padding:40px;text-align:center;color:#8e8e93;">动态功能即将上线</div>';
            break;
        case 'me':
            if (plusBtn) plusBtn.style.display = 'none';
            if (titleEl) titleEl.textContent = '我的';
            listView.innerHTML = '<div style="padding:40px;text-align:center;color:#8e8e93;">个人中心即将上线</div>';
            break;
    }
}

// ========== 进入聊天窗口 ==========
function enterChat(contactId) {
    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (!contact) return;

    window.ChatState = window.ChatState || {};
    window.ChatState.currentContactId = contactId;

    clearUnreadCount(contactId);
    window._isVoiceMode = false;

    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    const savedBg = window.ChatConfig.chatBg;
    const mental = window.ChatConfig.mental;

    appWindow.innerHTML = `
        <div class="chat-overlay" id="chatOverlay">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="backToChatList()">‹</span>
                    <span class="nav-title" id="chatTitle" onclick="openChatSettings()">${contact.name}</span>
                    <span class="nav-mental-btn" onclick="toggleChatMental()">○</span>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages" style="background-image:url(${savedBg});">
                <div style="text-align:center;color:#c7c7cc;font-size:13px;margin-top:20px;">现在可以开始聊天了</div>
            </div>

            <!-- 心理状态窗 -->
            <div class="mental-popup" id="chatMentalPopup" onclick="toggleChatMental()">
                <div class="mental-title">窥视ta...</div>
                <div class="mental-label">心情</div>
                <div class="mental-value" id="m-mood">${mental.mood}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">好感值</div>
                <div class="mental-value" id="m-fav">${mental.favorability}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">当前动作</div>
                <div class="mental-value" id="m-act">${mental.action}</div>
                <div class="mental-divider"></div>
                <div class="mental-label">内心想法</div>
                <div class="mental-value" id="m-tht">${mental.thought}</div>
            </div>

            <!-- 底部输入栏 -->
            <div class="chat-input-bar">
                <div class="input-row">
                    <div class="add-circle" onclick="toggleAddPanel()">+</div>
                    <div class="chat-input-wrapper" id="chatInputWrapper">
                        <input type="text" class="chat-input" id="chatInput" placeholder="输入消息…" onkeypress="if(event.key==='Enter') handleSendOrReply()">
                        <div class="mic-btn" id="micBtn" onclick="toggleVoiceMode()">
                            <span class="mic-icon-body"></span>
                            <span class="mic-icon-arc"></span>
                        </div>
                    </div>
                    <span class="chat-send-btn" id="chatSendBtn" onclick="handleSendOrReply()">↑</span>
                </div>
                <div class="add-panel-full" id="addPanelFull">
                    <div class="add-panel-tabs">
                        <span class="add-panel-tab active" id="tabEmoji" onclick="switchAddPanelTab('emoji', this)">表情包</span>
                        <span class="add-panel-tab" id="tabFunc" onclick="switchAddPanelTab('func', this)">功能</span>
                    </div>
                    <div class="add-panel-body" id="addPanelBody"></div>
                </div>
            </div>
        </div>
    `;

    loadChatHistory(contactId);
}

// ========== 返回会话列表 ==========
function backToChatList() {
    window.ChatState.currentContactId = null;
    window._isVoiceMode = false;
    renderChatShell();
}

// ========== 心理状态窗切换 ==========
function toggleChatMental() {
    const popup = document.getElementById('chatMentalPopup');
    if (popup) {
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
        const m = window.ChatConfig.mental;
        const moodEl = document.getElementById('m-mood');
        const favEl = document.getElementById('m-fav');
        const actEl = document.getElementById('m-act');
        const thtEl = document.getElementById('m-tht');
        if (moodEl) moodEl.textContent = m.mood;
        if (favEl) favEl.textContent = m.favorability;
        if (actEl) actEl.textContent = m.action;
        if (thtEl) thtEl.textContent = m.thought;
    }
}

// ========== 语音模式切换 ==========
function toggleVoiceMode() {
    window._isVoiceMode = !window._isVoiceMode;
    const input = document.querySelector('.chat-input');
    const micBtn = document.getElementById('micBtn');
    const wrapper = document.querySelector('.chat-input-wrapper');

    if (window._isVoiceMode) {
        if (input) input.placeholder = '输入语音消息文本…';
        if (micBtn) micBtn.classList.add('active');
        if (wrapper) wrapper.classList.add('voice-mode');
    } else {
        if (input) input.placeholder = '输入消息…';
        if (micBtn) micBtn.classList.remove('active');
        if (wrapper) wrapper.classList.remove('voice-mode');
    }
}

// ========== 发送/回复逻辑 ==========
function handleSendOrReply() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    if (window._isVoiceMode) {
        const text = input.value.trim();
        if (!text) {
            triggerAIReply();
            return;
        }
        sendVoiceMessage(text);
        input.value = '';
    } else {
        if (input.value.trim()) {
            sendChatMessage();
        } else {
            triggerAIReply();
        }
    }
}

// ========== 发送语音消息（用户发文本 -> 语音气泡） ==========
function sendVoiceMessage(text) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    if (text.length > 180) {
        showToast('语音消息最长60秒，请精简内容');
        return;
    }

    const contactId = window.ChatState.currentContactId || 'c1';
    const seconds = Math.max(1, Math.min(60, Math.round(text.length / 3)));

    const row = document.createElement('div');
    row.className = 'bubble-row user';

    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar user-avatar';
    avatar.textContent = '我';

    const voiceBubble = document.createElement('div');
    voiceBubble.className = 'bubble bubble-voice bubble-user';

    const barCount = Math.min(12, Math.floor(seconds * 0.25) + 3);
    let waveBars = '';
    for (let i = 0; i < barCount; i++) {
        waveBars += '<span class="voice-wave-bar"></span>';
    }

    voiceBubble.innerHTML = `
        <span class="voice-speaker">
            <span class="speaker-cone"></span>
            <span class="speaker-lines">
                <span class="speaker-line"></span>
                <span class="speaker-line"></span>
                <span class="speaker-line"></span>
            </span>
        </span>
        <span class="voice-wave-bars">${waveBars}</span>
        <span class="voice-duration">${seconds}"</span>
    `;
    voiceBubble.onclick = function() {
        showToast('用户发送的语音消息');
    };

    row.appendChild(avatar);
    row.appendChild(voiceBubble);
    messages.appendChild(row);

    const transRow = document.createElement('div');
    transRow.className = 'voice-transcript-row';
    transRow.innerHTML = `
        <div class="bubble voice-transcript-bubble">${text}</div>
    `;
    messages.appendChild(transRow);

    messages.scrollTop = messages.scrollHeight;
    saveChatHistory(contactId);

    const contact = getContactById(contactId);
    const contactName = contact ? contact.name : 'AI';
    window.ChatState.isAITyping = true;
    const titleEl = document.getElementById('chatTitle');
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中...</span>';

    const systemPrompt = buildSystemPrompt(contactId);
    const userMessage = '（用户发来了一条' + seconds + '秒的语音消息，内容是：' + text + '）';

    callChatAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ]).then(reply => {
        processAIReply(reply, contactName, contactId);
    }).catch(error => {
        appendMessage('assistant', '抱歉，消息发送失败：' + error.message);
        if (titleEl) titleEl.textContent = contactName;
        window.ChatState.isAITyping = false;
    });
}

// ========== 发送语音气泡（角色发语音） ==========
function sendVoiceBubble(role, text, voiceUrl, isRealVoice) {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    const seconds = Math.max(1, Math.min(60, Math.round(text.length / 3)));

    const row = document.createElement('div');
    row.className = 'bubble-row ' + (role === 'assistant' ? 'assistant' : 'user');

    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar ' + (role === 'assistant' ? 'bot-avatar' : 'user-avatar');
    avatar.textContent = role === 'assistant' ? (getContactById(window.ChatState.currentContactId)?.avatar || 'AI') : '我';

    const voiceBubble = document.createElement('div');
    voiceBubble.className = 'bubble bubble-voice ' + (role === 'assistant' ? 'bubble-assistant' : 'bubble-user');
    voiceBubble.setAttribute('data-voice-url', voiceUrl || '');
    voiceBubble.setAttribute('data-is-real', isRealVoice ? '1' : '0');

    const barCount = Math.min(12, Math.floor(seconds * 0.25) + 3);
    let waveBars = '';
    for (let i = 0; i < barCount; i++) {
        waveBars += '<span class="voice-wave-bar"></span>';
    }

    voiceBubble.innerHTML = `
        <span class="voice-speaker">
            <span class="speaker-cone"></span>
            <span class="speaker-lines">
                <span class="speaker-line"></span>
                <span class="speaker-line"></span>
                <span class="speaker-line"></span>
            </span>
        </span>
        <span class="voice-wave-bars">${waveBars}</span>
        <span class="voice-duration">${seconds}"</span>
    `;

    if (isRealVoice && voiceUrl) {
        voiceBubble.onclick = function() {
            voiceBubble.classList.add('playing');
            const audio = new Audio(voiceUrl);
            audio.onended = function() {
                voiceBubble.classList.remove('playing');
            };
            audio.play().catch(function() {
                voiceBubble.classList.remove('playing');
                showToast('语音播放失败');
            });
        };
    } else {
        voiceBubble.onclick = function() {
            showToast('未配置语音API，无法播放');
        };
    }

    row.appendChild(avatar);
    row.appendChild(voiceBubble);
    messages.appendChild(row);

    const transRow = document.createElement('div');
    transRow.className = 'voice-transcript-row';
    transRow.innerHTML = `
        <div class="bubble voice-transcript-bubble">${text}</div>
    `;
    messages.appendChild(transRow);

    messages.scrollTop = messages.scrollHeight;
    return row;
}

// ========== + 号功能面板 ==========
function toggleAddPanel() {
    const panel = document.getElementById('addPanelFull');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block') {
            switchAddPanelTab('emoji', document.getElementById('tabEmoji'));
        }
    }
}

function switchAddPanelTab(tab, el) {
    document.querySelectorAll('.add-panel-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    if (typeof renderAddPanelContent === 'function') {
        renderAddPanelContent(tab);
    }
}

// ========== 长按气泡菜单 ==========
let bubbleMenuTarget = null;

document.addEventListener('touchstart', function(e) {
    const bubble = e.target.closest('.bubble-assistant');
    if (!bubble) {
        if (e.target.closest('.bubble-menu')) return;
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }
    bubbleMenuTarget = bubble;
    let pressTimer = setTimeout(function() {
        const menu = document.getElementById('bubbleMenu');
        if (!menu) return;
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        const menuH = menu.offsetHeight || 80;
        const menuW = menu.offsetWidth || 260;
        const rect = bubble.getBoundingClientRect();
        menu.style.top = Math.max(10, rect.top - menuH - 8) + 'px';
        menu.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - menuW - 10)) + 'px';
        menu.style.visibility = '';
    }, 500);
    bubble.addEventListener('touchend', function() { clearTimeout(pressTimer); }, { once: true });
    bubble.addEventListener('touchmove', function() { clearTimeout(pressTimer); }, { once: true });
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('.bubble-menu') && !e.target.closest('.bubble-assistant')) {
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
    }
});

function menuCopy() {
    if (bubbleMenuTarget) {
        navigator.clipboard.writeText(bubbleMenuTarget.textContent).then(() => showToast('已复制'));
    }
    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuFavorite() {
    showToast('收藏功能即将上线');
    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuRegret() {
    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
    const overlay = document.createElement('div');
    overlay.className = 'regret-modal-overlay';
    overlay.id = 'regretModalOverlay';
    overlay.innerHTML = `
        <div class="regret-modal">
            <div class="regret-modal-title">重回</div>
            <textarea class="regret-textarea" id="regretTextarea" placeholder="请输入想重回的原因及想往哪个方向发展，可填可不填。"></textarea>
            <div class="regret-buttons">
                <div class="regret-btn-cancel" onclick="closeRegretModal()">取消</div>
                <div class="regret-btn-confirm" onclick="confirmRegret()">确认重回</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeRegretModal(); };
}

function closeRegretModal() {
    const overlay = document.getElementById('regretModalOverlay');
    if (overlay) overlay.remove();
}

function confirmRegret() {
    const hint = document.getElementById('regretTextarea').value.trim();
    closeRegretModal();

    if (!bubbleMenuTarget) return;
    const messages = document.getElementById('chatMessages');
    if (!messages) return;

    let found = false;
    const children = Array.from(messages.children);
    for (let i = children.length - 1; i >= 0; i--) {
        if (children[i] === bubbleMenuTarget) found = true;
        if (found) children[i].remove();
    }

    saveChatHistory(window.ChatState.currentContactId);

    const contactId = window.ChatState.currentContactId || 'c1';
    const contact = getContactById(contactId);
    const contactName = contact ? contact.name : 'AI';

    window.ChatState.isAITyping = true;
    const titleEl = document.getElementById('chatTitle');
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中…</span>';

    const systemPrompt = buildSystemPrompt(contactId);
    const userMessage = hint || '请重新回复，换一种表达方式';
    const historyMessages = getRecentHistory(contactId, 20);
    const allMessages = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage }
    ];

    callChatAPI(allMessages).then(reply => {
        processAIReply(reply, contactName, contactId);
    }).catch(error => {
        appendMessage('assistant', '抱歉，消息发送失败：' + error.message);
        if (titleEl) titleEl.textContent = contactName;
        window.ChatState.isAITyping = false;
    });
}

function menuMultiSelect() {
    showToast('多选功能即将上线');
    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuQuote() {
    if (!bubbleMenuTarget) return;
    const contactId = window.ChatState.currentContactId || 'c1';
    const contact = getContactById(contactId);
    const name = contact ? contact.name : '角色';
    const text = bubbleMenuTarget.textContent;
    const maxChars = 14;
    const prefix = name + '：';
    const firstLineContent = text.substring(0, maxChars - prefix.length);
    const line1 = prefix + firstLineContent;
    const remaining = text.substring(firstLineContent.length);
    let line2 = '';
    if (remaining.length > 0) {
        line2 = remaining.substring(0, maxChars);
        if (remaining.length > maxChars) line2 += '…';
    }

    window.ChatState.quotedMsg = { n: name, t: text };

    const existingPreview = document.getElementById('quotePreview');
    if (existingPreview) existingPreview.remove();

    const inputBar = document.querySelector('.chat-input-bar');
    if (inputBar) {
        const preview = document.createElement('div');
        preview.id = 'quotePreview';
        preview.className = 'quote-preview';
        preview.innerHTML = `
            <div class="quote-content">
                <div class="quote-line">${line1}</div>
                ${line2 ? '<div class="quote-line">' + line2 + '</div>' : ''}
            </div>
            <span class="quote-close" onclick="cancelQuote()">x</span>
        `;
        inputBar.insertBefore(preview, inputBar.firstChild);
    }

    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
    showToast('已引用');
}

function cancelQuote() {
    window.ChatState.quotedMsg = null;
    const preview = document.getElementById('quotePreview');
    if (preview) preview.remove();
}

function menuTranslate() {
    if (!bubbleMenuTarget) return;
    const row = bubbleMenuTarget.closest('.bubble-row');
    const next = row ? row.nextElementSibling : null;

    if (next && next.classList.contains('translate-row')) {
        next.style.display = next.style.display === 'none' ? 'flex' : 'none';
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    const text = bubbleMenuTarget.textContent;
    if (!needsTranslation(text)) {
        showToast('已是简体中文');
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    if (window._translateCache[text]) {
        appendTranslationRow(row, window._translateCache[text]);
        const menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    showToast('翻译中…');
    translateText(text).then(translated => {
        window._translateCache[text] = translated;
        appendTranslationRow(row, translated);
    }).catch(() => {
        showToast('翻译失败');
    });

    const menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
 }

// ========== 右上角 + 弹出菜单 ==========
function togglePlusMenu(e) {
    e.stopPropagation();
    const existing = document.getElementById('plusMenuPopup');
    if (existing) {
        existing.remove();
        document.removeEventListener('click', closePlusMenuOutside);
        document.removeEventListener('touchstart', closePlusMenuOutside);
        return;
    }

    const menu = document.createElement('div');
    menu.id = 'plusMenuPopup';
    menu.className = 'plus-menu-popup';
    menu.innerHTML = `
        <div class="plus-menu-item" id="menuGroupChat">发起群聊</div>
        <div class="plus-menu-divider"></div>
        <div class="plus-menu-item" id="menuAddFriend">添加好友</div>
    `;

    menu.querySelector('#menuGroupChat').onclick = function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        document.removeEventListener('click', closePlusMenuOutside);
        document.removeEventListener('touchstart', closePlusMenuOutside);
        menu.remove();
        initiateGroupChat();
    };
    menu.querySelector('#menuAddFriend').onclick = function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        document.removeEventListener('click', closePlusMenuOutside);
        document.removeEventListener('touchstart', closePlusMenuOutside);
        menu.remove();
        showCreateCharacterPage();
    };

    menu.addEventListener('click', function(ev) {
        ev.stopPropagation();
    });
    menu.addEventListener('touchstart', function(ev) {
        ev.stopPropagation();
    });

    document.body.appendChild(menu);

    const btn = e.target.closest('.nav-plus-btn');
    if (btn) {
        const rect = btn.getBoundingClientRect();
        menu.style.top = (rect.bottom + 8) + 'px';
        menu.style.right = (window.innerWidth - rect.right) + 'px';
    }

    setTimeout(function() {
        document.addEventListener('click', closePlusMenuOutside);
        document.addEventListener('touchstart', closePlusMenuOutside);
    }, 10);

    function closePlusMenuOutside(event) {
        if (!menu.contains(event.target)) {
            menu.remove();
            document.removeEventListener('click', closePlusMenuOutside);
            document.removeEventListener('touchstart', closePlusMenuOutside);
        }
    }
}

function initiateGroupChat() {
    showToast('群聊功能即将上线');
}

// ========== 添加好友页面 ==========
function showCreateCharacterPage() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    charAvatarData = '';

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="renderChatShell()">‹</span>
                    <span class="nav-title">添加好友</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;background:#f2f2f7;">

                <!-- 头像 -->
                <div style="text-align:center;margin-bottom:20px;">
                    <div id="charAvatarPreview" style="width:80px;height:80px;border-radius:40px;background:#e5e5ea;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;" onclick="document.getElementById('charAvatarInput').click()">+</div>
                    <input type="file" id="charAvatarInput" accept="image/*" style="display:none;" onchange="previewCharAvatar(event)">
                    <div style="font-size:11px;color:#8e8e93;">点击上传头像</div>
                </div>

                <!-- 姓名 -->
                <div class="settings-section-title">姓名</div>
                <div class="glass-card">
                    <input type="text" id="charNameInput" class="search-input" placeholder="请输入角色姓名">
                </div>

                <!-- 备注 -->
                <div class="settings-section-title">备注</div>
                <div class="glass-card">
                    <input type="text" id="charNoteInput" class="search-input" placeholder="请输入你给角色的备注">
                </div>

                <!-- 性别 -->
                <div class="settings-section-title">性别</div>
                <div class="glass-card">
                    <div style="display:flex;gap:16px;align-items:center;">
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="charGender" value="女" checked style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateGenderRadio()"> 女
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="charGender" value="男" style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateGenderRadio()"> 男
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="charGender" value="非人类" style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateGenderRadio()"> 非人类
                        </label>
                    </div>
                </div>

                <!-- 年龄 -->
                <div class="settings-section-title">年龄</div>
                <div class="glass-card">
                    <input type="text" id="charAgeInput" class="search-input" placeholder="请输入该角色的年龄">
                </div>

                <!-- 性格 -->
                <div class="settings-section-title">性格</div>
                <div class="glass-card">
                    <textarea id="charPersonalityInput" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的性格、人格类型、语言风格"></textarea>
                </div>

                <!-- 背景故事 -->
                <div class="settings-section-title">背景故事</div>
                <div class="glass-card">
                    <textarea id="charBackgroundInput" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的人生经历、原生家庭、与你如何相识"></textarea>
                </div>

                <!-- 外貌描述 -->
                <div class="settings-section-title">外貌描述</div>
                <div class="glass-card">
                    <textarea id="charAppearanceInput" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的外貌描述，用于引导生图API，未配置可填可不填"></textarea>
                    <div style="font-size:11px;color:#8e8e93;margin-top:6px;">选填，用于生图API生成角色形象</div>
                </div>

                <!-- 创建按钮 -->
                <button class="black-btn" id="createCharBtn" onclick="createNewCharacter()" style="margin-top:20px;margin-bottom:30px;opacity:0.4;pointer-events:none;">添加该角色</button>
            </div>
        </div>
    `;

    checkCreateButton();
}

// ========== 头像预览 ==========
function previewCharAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        charAvatarData = ev.target.result;
        const preview = document.getElementById('charAvatarPreview');
        if (preview) {
            preview.style.backgroundImage = `url(${ev.target.result})`;
            preview.innerText = '';
        }
    };
    reader.readAsDataURL(file);
}

// ========== 更新性别单选样式 ==========
function updateGenderRadio() {
    const radios = document.querySelectorAll('input[name="charGender"]');
    radios.forEach(r => {
        if (r.checked) {
            r.style.borderColor = '#1d1d1f';
            r.style.background = '#1d1d1f';
            r.style.boxShadow = 'inset 0 0 0 4px #fff';
        } else {
            r.style.borderColor = '#c7c7cc';
            r.style.background = 'transparent';
            r.style.boxShadow = 'none';
        }
    });
    checkCreateButton();
}

// ========== 检查必填项是否完成 ==========
function checkCreateButton() {
    const name = document.getElementById('charNameInput')?.value.trim() || '';
    const note = document.getElementById('charNoteInput')?.value.trim() || '';
    const age = document.getElementById('charAgeInput')?.value.trim() || '';
    const personality = document.getElementById('charPersonalityInput')?.value.trim() || '';
    const background = document.getElementById('charBackgroundInput')?.value.trim() || '';

    const allFilled = name && note && age && personality && background;
    const btn = document.getElementById('createCharBtn');

    if (btn) {
        if (allFilled) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
        }
    }
}

// ========== 监听输入变化 ==========
document.addEventListener('input', function(e) {
    if (e.target && e.target.closest('#charNameInput, #charNoteInput, #charAgeInput, #charPersonalityInput, #charBackgroundInput')) {
        checkCreateButton();
    }
});

// ========== 创建角色 ==========
function createNewCharacter() {
    const name = document.getElementById('charNameInput').value.trim();
    const note = document.getElementById('charNoteInput').value.trim();
    const genderEl = document.querySelector('input[name="charGender"]:checked');
    const gender = genderEl ? genderEl.value : '女';
    const age = document.getElementById('charAgeInput').value.trim();
    const personality = document.getElementById('charPersonalityInput').value.trim();
    const background = document.getElementById('charBackgroundInput').value.trim();
    const appearance = document.getElementById('charAppearanceInput').value.trim();

    if (!name || !note || !age || !personality || !background) {
        showToast('请填写完前6项必填内容');
        return;
    }

    let persona = '';
    persona += '【姓名】' + name + '\n';
    if (note && note !== name) persona += '【昵称/备注】' + note + '\n';
    persona += '【性别】' + gender + '\n';
    persona += '【年龄】' + age + '\n';
    persona += '【性格】' + personality + '\n';
    persona += '【背景故事】' + background + '\n';
    if (appearance) {
        persona += '【外貌描述】' + appearance + '\n';
    }

    const newContact = {
        id: 'c_' + Date.now(),
        name: note || name,
        avatar: name.charAt(0),
        avatarData: charAvatarData || '',
        persona: persona,
        preview: '点击开始对话'
    };

    window.ChatConfig.contacts.push(newContact);
    saveContactsToStorage();
    showToast('角色 ' + (note || name) + ' 创建成功');
    renderChatShell();
}

// ========== 联系人存储 ==========
function saveContactsToStorage() {
    const data = window.ChatConfig.contacts.map(c => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        avatarData: c.avatarData || '',
        persona: c.persona || '',
        preview: c.preview || ''
    }));
    localStorage.setItem('yujie_contacts', JSON.stringify(data));
}

function loadContactsFromStorage() {
    const saved = localStorage.getItem('yujie_contacts');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.length > 0) {
                window.ChatConfig.contacts = data;
            }
        } catch(e) {}
    }
}

window.addEventListener('DOMContentLoaded', function() {
    loadContactsFromStorage();
});

// ========== 联系人列表渲染（微信风格，拼音首字母分组） ==========
function renderContactsList() {
    const listView = document.getElementById('chatListView');
    if (!listView) return;

    const contacts = window.ChatConfig.contacts || [];

    const groups = {};
    contacts.forEach(c => {
        const displayName = c.name || '';
        const firstChar = displayName.charAt(0);
        const letter = getPinyinFirstLetter(firstChar);
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(c);
    });

    const sortedLetters = Object.keys(groups).sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
    });

    let html = '';

    html += `
        <div class="chat-list-item" onclick="showNewFriendsPageInList()">
            <div class="contacts-new-friend-avatar">
                <span class="person-head"></span>
                <span class="person-body"></span>
            </div>
            <div class="chat-info">
                <div class="chat-name">新的朋友</div>
            </div>
        </div>
    `;

    sortedLetters.forEach(letter => {
        html += '<div class="contacts-section-title">' + letter + '</div>';
        groups[letter].forEach(c => {
            const avatarData = c.avatarData || '';
            const avatarHTML = avatarData 
                ? `<div class="chat-avatar" style="background-image:url(${avatarData});background-size:cover;background-position:center;">&nbsp;</div>`
                : `<div class="chat-avatar">${c.avatar}</div>`;
            html += `
                <div class="chat-list-item" onclick="editContactPersona('${c.id}')">
                    ${avatarHTML}
                    <div class="chat-info">
                        <div class="chat-name">${c.name}</div>
                    </div>
                </div>
            `;
        });
    });

    let indexHTML = '<div class="contacts-index-bar">';
    sortedLetters.forEach(letter => {
        indexHTML += '<span class="contacts-index-letter" onclick="scrollToGroup(\'' + letter + '\')">' + letter + '</span>';
    });
    indexHTML += '</div>';

    listView.innerHTML = html;
    listView.style.position = 'relative';

    const oldIndex = listView.querySelector('.contacts-index-bar');
    if (oldIndex) oldIndex.remove();
    listView.insertAdjacentHTML('beforeend', indexHTML);

    listView.querySelectorAll('.contacts-section-title').forEach(title => {
        title.style.cssText = 'background:#f2f2f7;padding:6px 16px;font-size:13px;color:#8e8e93;font-weight:500;';
    });
}

function scrollToGroup(letter) {
    const listView = document.getElementById('chatListView');
    if (!listView) return;
    const titles = listView.querySelectorAll('.contacts-section-title');
    for (let i = 0; i < titles.length; i++) {
        if (titles[i].textContent === letter) {
            titles[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
            break;
        }
    }
}

// ========== 新的朋友页面（在列表区渲染） ==========
function showNewFriendsPageInList() {
    const listView = document.getElementById('chatListView');
    if (!listView) return;

    const titleEl = document.querySelector('.nav-title');
    const backBtn = document.querySelector('.nav-back');
    const plusBtn = document.querySelector('.nav-plus-btn');
    if (titleEl) titleEl.textContent = '新的朋友';
    if (plusBtn) plusBtn.style.display = 'none';
    if (backBtn) {
        backBtn.onclick = function() {
            renderContactsList();
            const tEl = document.querySelector('.nav-title');
            const pBtn = document.querySelector('.nav-plus-btn');
            if (tEl) tEl.textContent = '联系人';
            if (pBtn) pBtn.style.display = '';
        };
    }

    const requests = getFriendRequests();
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const recentRequests = requests.filter(r => r.timestamp > threeDaysAgo);
    const monthRequests = requests.filter(r => r.timestamp <= threeDaysAgo && r.timestamp > oneMonthAgo);
    const olderRequests = requests.filter(r => r.timestamp <= oneMonthAgo);

    let html = '';

    if (recentRequests.length > 0) {
        html += '<div class="contacts-section-title">最近三天</div>';
        html += recentRequests.map(r => renderFriendRequestCardHTML(r)).join('');
    }
    if (monthRequests.length > 0) {
        html += '<div class="contacts-section-title">三天前</div>';
        html += monthRequests.map(r => renderFriendRequestCardHTML(r)).join('');
    }
    if (olderRequests.length > 0) {
        html += '<div class="contacts-section-title">一月前</div>';
        html += olderRequests.map(r => renderFriendRequestCardHTML(r)).join('');
    }

    if (requests.length === 0) {
        html = '<div style="text-align:center;color:#8e8e93;padding:60px 20px;">暂无好友请求</div>';
    }

    listView.innerHTML = html;
    listView.style.position = '';

    listView.querySelectorAll('.contacts-section-title').forEach(title => {
        title.style.cssText = 'background:#f2f2f7;padding:6px 16px;font-size:13px;color:#8e8e93;font-weight:500;';
    });
}

function renderFriendRequestCardHTML(request) {
    const contact = window.ChatConfig.contacts.find(c => c.id === request.contactId);
    const name = contact ? contact.name : (request.name || '未知');
    const avatar = contact ? contact.avatar : (request.name ? request.name.charAt(0) : '?');
    const avatarData = contact ? contact.avatarData : '';

    const statusLabel = request.status === 'accepted' ? '已通过' : '未通过';
    const statusIcon = request.status === 'accepted' ? '↗' : '↘';

    const avatarHTML = avatarData 
        ? `<div class="chat-avatar" style="background-image:url(${avatarData});background-size:cover;background-position:center;">&nbsp;</div>`
        : `<div class="chat-avatar">${avatar}</div>`;

    return `
        <div class="chat-list-item" onclick="openFriendRequestChat('${request.contactId}')">
            ${avatarHTML}
            <div class="chat-info">
                <div class="chat-name">${name}</div>
                <div class="chat-preview">${request.message || ''}</div>
            </div>
            <span style="font-size:12px;color:#8e8e93;flex-shrink:0;">${statusIcon}${statusLabel}</span>
        </div>
    `;
}

// ========== 返回联系人列表辅助函数 ==========
function backToContactsFromEdit() {
    renderChatShell();
    setTimeout(function() {
        switchChatTab('contacts', document.querySelector('.tab-item:nth-child(2)'));
    }, 50);
}

// ========== 编辑角色人设页面（和添加好友同款样式） ==========
function editContactPersona(contactId) {
    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    editAvatarData = '';

    // 解析现有人设
    var existingName = contact.name || '';
    var existingNote = '';
    var existingGender = '女';
    var existingAge = '';
    var existingPersonality = '';
    var existingBackground = '';
    var existingAppearance = '';

    if (contact.persona) {
        var nameMatch = contact.persona.match(/【姓名】(.+)/);
        var noteMatch = contact.persona.match(/【昵称\/备注】(.+)/);
        var genderMatch = contact.persona.match(/【性别】(.+)/);
        var ageMatch = contact.persona.match(/【年龄】(.+)/);
        var personalityMatch = contact.persona.match(/【性格】(.+)/);
        var backgroundMatch = contact.persona.match(/【背景故事】(.+)/);
        var appearanceMatch = contact.persona.match(/【外貌描述】(.+)/);
        if (nameMatch) existingName = nameMatch[1];
        if (noteMatch) existingNote = noteMatch[1];
        if (genderMatch) existingGender = genderMatch[1];
        if (ageMatch) existingAge = ageMatch[1];
        if (personalityMatch) existingPersonality = personalityMatch[1];
        if (backgroundMatch) existingBackground = backgroundMatch[1];
        if (appearanceMatch) existingAppearance = appearanceMatch[1];
    }

    var femaleChecked = existingGender === '女' ? 'checked' : '';
    var maleChecked = existingGender === '男' ? 'checked' : '';
    var nonHumanChecked = existingGender === '非人类' ? 'checked' : '';

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="backToContactsFromEdit()">‹</span>
                    <span class="nav-title">编辑角色</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;background:#f2f2f7;">

                <!-- 头像 -->
                <div style="text-align:center;margin-bottom:20px;">
                    <div id="editAvatarPreview" style="width:80px;height:80px;border-radius:40px;background:#e5e5ea;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;${contact.avatarData ? 'background-image:url(' + contact.avatarData + ');' : ''}" onclick="document.getElementById('editAvatarInput').click()">${contact.avatarData ? '' : contact.avatar}</div>
                    <input type="file" id="editAvatarInput" accept="image/*" style="display:none;" onchange="updateEditAvatar(event)">
                    <div style="font-size:11px;color:#8e8e93;">点击更换头像</div>
                </div>

                <!-- 姓名 -->
                <div class="settings-section-title">姓名</div>
                <div class="glass-card">
                    <input type="text" id="editCharName" class="search-input" value="${existingName}" placeholder="角色姓名">
                </div>

                <!-- 备注 -->
                <div class="settings-section-title">备注</div>
                <div class="glass-card">
                    <input type="text" id="editCharNote" class="search-input" value="${existingNote}" placeholder="请输入你给角色的备注">
                </div>

                <!-- 性别 -->
                <div class="settings-section-title">性别</div>
                <div class="glass-card">
                    <div style="display:flex;gap:16px;align-items:center;">
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="editCharGender" value="女" ${femaleChecked} style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateEditGenderRadio()"> 女
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="editCharGender" value="男" ${maleChecked} style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateEditGenderRadio()"> 男
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="editCharGender" value="非人类" ${nonHumanChecked} style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateEditGenderRadio()"> 非人类
                        </label>
                    </div>
                </div>

                <!-- 年龄 -->
                <div class="settings-section-title">年龄</div>
                <div class="glass-card">
                    <input type="text" id="editCharAge" class="search-input" value="${existingAge}" placeholder="请输入该角色的年龄">
                </div>

                <!-- 性格 -->
                <div class="settings-section-title">性格</div>
                <div class="glass-card">
                    <textarea id="editCharPersonality" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的性格、人格类型、语言风格">${existingPersonality}</textarea>
                </div>

                <!-- 背景故事 -->
                <div class="settings-section-title">背景故事</div>
                <div class="glass-card">
                    <textarea id="editCharBackground" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的人生经历、原生家庭、与你如何相识">${existingBackground}</textarea>
                </div>

                <!-- 外貌描述 -->
                <div class="settings-section-title">外貌描述</div>
                <div class="glass-card">
                    <textarea id="editCharAppearance" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的外貌描述，用于引导生图API，未配置可填可不填">${existingAppearance}</textarea>
                    <div style="font-size:11px;color:#8e8e93;margin-top:6px;">选填，用于生图API生成角色形象</div>
                </div>

                <button class="black-btn" onclick="saveContactEdit('${contactId}')" style="margin-top:16px;">保存修改</button>
                <button class="white-btn" onclick="deleteContactFromEdit('${contactId}')" style="border-color:#ff3b30;color:#ff3b30;">删除角色</button>
            </div>
        </div>
    `;

    // 初始化性别单选样式
    setTimeout(updateEditGenderRadio, 50);
}

function updateEditAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        editAvatarData = ev.target.result;
        const preview = document.getElementById('editAvatarPreview');
        if (preview) {
            preview.style.backgroundImage = `url(${ev.target.result})`;
            preview.innerText = '';
        }
    };
    reader.readAsDataURL(file);
}

function updateEditGenderRadio() {
    const radios = document.querySelectorAll('input[name="editCharGender"]');
    radios.forEach(r => {
        if (r.checked) {
            r.style.borderColor = '#1d1d1f';
            r.style.background = '#1d1d1f';
            r.style.boxShadow = 'inset 0 0 0 4px #fff';
        } else {
            r.style.borderColor = '#c7c7cc';
            r.style.background = 'transparent';
            r.style.boxShadow = 'none';
        }
    });
}

function saveContactEdit(contactId) {
    const name = document.getElementById('editCharName').value.trim();
    const note = document.getElementById('editCharNote').value.trim();
    const genderEl = document.querySelector('input[name="editCharGender"]:checked');
    const gender = genderEl ? genderEl.value : '女';
    const age = document.getElementById('editCharAge').value.trim();
    const personality = document.getElementById('editCharPersonality').value.trim();
    const background = document.getElementById('editCharBackground').value.trim();
    const appearance = document.getElementById('editCharAppearance').value.trim();

    if (!name) { showToast('请填写角色名称'); return; }

    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (contact) {
        contact.name = note || name;
        contact.avatar = name.charAt(0);
        if (editAvatarData) contact.avatarData = editAvatarData;

        var persona = '';
        persona += '【姓名】' + name + '\n';
        if (note && note !== name) persona += '【昵称/备注】' + note + '\n';
        persona += '【性别】' + gender + '\n';
        persona += '【年龄】' + age + '\n';
        persona += '【性格】' + personality + '\n';
        persona += '【背景故事】' + background + '\n';
        if (appearance) persona += '【外貌描述】' + appearance + '\n';
        contact.persona = persona;

        saveContactsToStorage();
        showToast('角色信息已更新');
        backToContactsFromEdit();
    }
}

function deleteContactFromEdit(contactId) {
    if (confirm('确定删除该角色？删除后可从聊天记录中恢复。')) {
        const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
        if (contact) {
            const requests = getFriendRequests();
            requests.push({
                contactId: contactId,
                name: contact.name,
                message: '我重新申请添加你为好友',
                status: 'pending',
                timestamp: Date.now()
            });
            saveFriendRequests(requests);
        }

        window.ChatConfig.contacts = window.ChatConfig.contacts.filter(c => c.id !== contactId);
        saveContactsToStorage();
        showToast('角色已删除');
        backToContactsFromEdit();
    }
}

// ========== 聊天详情半屏面板 ==========
function openChatSettings() {
    const oldMask = document.getElementById('chatSettingsMask');
    if (oldMask) oldMask.remove();

    const config = window.ChatConfig || {};
    const settings = config.settings || {};
    const api = settings.api || {};

    const mask = document.createElement('div');
    mask.className = 'sheet-mask show';
    mask.id = 'chatSettingsMask';
    mask.innerHTML = `
        <div class="half-sheet" id="chatSettingsSheet" onclick="event.stopPropagation()">
            <div class="sheet-handle" id="sheetHandle">
                <div class="handle-bar"></div>
            </div>
            <div class="sheet-scroll">

                <div class="settings-section-title">API消耗详情</div>
                <div class="glass-card">
                    <div class="api-row"><span class="label">全部点数</span><span class="value" id="apiTotal">${api.total || 0} token</span></div>
                    <div class="api-row"><span class="label">API</span><span class="value" id="apiOnline">${api.online || 0} token</span><span class="label">副API</span><span class="value" id="apiOffline">${api.offline || 0} token</span></div>
                    <div class="api-row"><span class="label">生图</span><span class="value" id="apiImage">${api.image || 0} token</span><span class="label">语音</span><span class="value" id="apiVoice">${api.voice || 0} token</span></div>
                </div>

                <div class="settings-section-title">搜索聊天记录</div>
                <div class="glass-card">
                    <input type="text" class="search-input" id="chatSearchInput" placeholder="请输入内容…" oninput="searchChatHistory(this.value)">
                    <div class="search-result" id="chatSearchResult"></div>
                </div>

                <div class="settings-section-title">聊天总结</div>
                <div class="glass-card">
                    <div class="slider-row"><span class="hint">提示：默认50轮自动总结，你可调自动总结轮数又或是手动总结。</span></div>
                    <div class="slider-row" style="margin-top:8px;"><span class="hint">自动总结轮数</span><span class="val" id="summaryVal">${settings.summaryCount || 50}轮</span></div>
                    <input type="range" min="10" max="200" value="${settings.summaryCount || 50}" class="ios-slider" oninput="updateSummaryCount(this.value)">
                    <button class="black-btn" onclick="manualSummary()">手动总结</button>
                </div>

                <div class="settings-section-title">聊天背景图</div>
                <div class="glass-card">
                    <div class="bg-preview-2x4" id="chatBgPreview" style="background-image:url(${config.chatBg || ''});" onclick="pickChatBg()">${!config.chatBg ? '点击添加聊天背景图' : ''}</div>
                    <button class="black-btn" onclick="clearChatBg()">清除当前背景</button>
                </div>

                <div class="settings-section-title">角色回复条数</div>
                <div class="glass-card">
                    <div class="slider-row"><span class="hint">回复最少</span><span class="val" id="replyMinVal">${settings.replyMin || 1}</span></div>
                    <input type="range" min="1" max="10" value="${settings.replyMin || 1}" class="ios-slider" oninput="updateReplyMin(this.value)">
                    <div class="slider-row" style="margin-top:10px;"><span class="hint">回复最多</span><span class="val" id="replyMaxVal">${settings.replyMax || 3}</span></div>
                    <input type="range" min="1" max="10" value="${settings.replyMax || 3}" class="ios-slider" oninput="updateReplyMax(this.value)">
                </div>

                <div class="settings-section-title">线上聊天旁白</div>
                <div class="glass-card">
                    <div class="switch-row"><span>开启旁白</span><input type="checkbox" class="ios-switch-sm" ${settings.onlineNarration !== false ? 'checked' : ''} onchange="toggleNarration(this.checked)"></div>
                </div>

                <div class="settings-section-title">人称选择</div>
                <div class="glass-card">
                    <div class="switch-row"><span>第一人称"我"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'me' ? 'checked' : ''} onchange="setPronoun('me', this)"></div>
                    <div class="switch-row"><span>第二人称"你"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'you' ? 'checked' : ''} onchange="setPronoun('you', this)"></div>
                    <div class="switch-row"><span>第三人称"ta"</span><input type="checkbox" class="ios-switch-sm" ${settings.pronoun === 'ta' ? 'checked' : ''} onchange="setPronoun('ta', this)"></div>
                </div>

                <div class="settings-section-title">自动发消息</div>
                <div class="glass-card">
                    <div class="switch-row"><span>自动发消息</span><input type="checkbox" class="ios-switch-sm" ${settings.autoMsg === true ? 'checked' : ''} onchange="toggleAutoMsg(this.checked)"></div>
                    <div class="slider-row" style="margin-top:8px;"><span class="hint">提示：角色会主动向你发消息。</span></div>
                    <div class="slider-row" style="margin-top:6px;"><span class="hint">角色发消息的频率</span><span class="val" id="autoMsgFreqVal">${getAutoMsgLabel(settings.autoMsgFreq || 0)}</span></div>
                    <div class="tick-slider-wrapper">
                        <div class="tick-labels"><span>1h</span><span>5h</span><span>10h</span><span>24h</span></div>
                        <div class="tick-dots" id="tickDots"></div>
                        <input type="range" min="0" max="3" value="${settings.autoMsgFreq || 0}" class="ios-slider" step="1" oninput="updateAutoMsgFreq(this.value)">
                    </div>
                </div>

                <div class="settings-section-title">自动翻译</div>
                <div class="glass-card">
                    <div class="switch-row"><span>自动翻译</span><input type="checkbox" class="ios-switch-sm" ${settings.autoTranslate === true ? 'checked' : ''} onchange="toggleAutoTranslate(this.checked)"></div>
                    <div style="font-size:12px;color:#8e8e93;margin-top:6px;">非简体中文的内容都将自动翻译成简体中文。</div>
                </div>

                <div class="settings-section-title">危险区</div>
                <div class="danger-fold" onclick="toggleDangerZone()">
                    <span>危险区</span><span class="arrow" id="dangerArrow">></span>
                </div>
                <div class="danger-content" id="dangerContent">
                    <div class="hint" style="color:#ff3b30; margin-bottom:8px;">提示：请谨慎操作</div>
                    <button class="white-btn" onclick="clearChatHistory()">清空聊天记录</button>
                    <button class="black-btn" onclick="blockContact()">拉黑联系人</button>
                    <button class="white-btn" onclick="deleteContact()">删除联系人</button>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(mask);

    mask.onclick = function(e) {
        if (e.target === mask) closeChatSettings();
    };

    const handle = document.getElementById('sheetHandle');
    let startY = 0;
    handle.addEventListener('touchstart', function(e) { startY = e.touches[0].clientY; });
    handle.addEventListener('touchmove', function(e) {
        if (e.touches[0].clientY - startY > 60) closeChatSettings();
    });
    handle.addEventListener('click', function() { closeChatSettings(); });

    updateTickDots(settings.autoMsgFreq || 0);
}

function closeChatSettings() {
    const mask = document.getElementById('chatSettingsMask');
    if (mask) mask.remove();
}

function updateSummaryCount(val) {
    document.getElementById('summaryVal').textContent = val + '轮';
    window.ChatConfig.settings.summaryCount = parseInt(val);
    localStorage.setItem('yujie_summary_count', val);
}

function updateReplyMin(val) {
    document.getElementById('replyMinVal').textContent = val;
    window.ChatConfig.settings.replyMin = parseInt(val);
    localStorage.setItem('yujie_reply_min', val);
}

function updateReplyMax(val) {
    document.getElementById('replyMaxVal').textContent = val;
    window.ChatConfig.settings.replyMax = parseInt(val);
    localStorage.setItem('yujie_reply_max', val);
}

function toggleNarration(checked) {
    window.ChatConfig.settings.onlineNarration = checked;
    localStorage.setItem('yujie_narration', checked);
}

function setPronoun(type, el) {
    window.ChatConfig.settings.pronoun = type;
    localStorage.setItem('yujie_pronoun', type);
    const sheet = document.getElementById('chatSettingsSheet');
    if (sheet) {
        const switches = sheet.querySelectorAll('.ios-switch-sm');
        const types = ['me', 'you', 'ta'];
        switches.forEach((sw, i) => {
            if (types[i] !== type) sw.checked = false;
        });
    }
    el.checked = true;
}

function toggleAutoMsg(checked) {
    window.ChatConfig.settings.autoMsg = checked;
    localStorage.setItem('yujie_auto_msg', checked);
}

function getAutoMsgLabel(val) {
    const labels = ['1小时', '5小时', '10小时', '24小时'];
    return labels[val] || '1小时';
}

function updateAutoMsgFreq(val) {
    document.getElementById('autoMsgFreqVal').textContent = getAutoMsgLabel(parseInt(val));
    window.ChatConfig.settings.autoMsgFreq = parseInt(val);
    localStorage.setItem('yujie_auto_msg_freq', val);
    updateTickDots(parseInt(val));
}

function updateTickDots(val) {
    const dots = document.getElementById('tickDots');
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const dot = document.createElement('div');
        dot.className = 'tick-dot' + (i === val ? ' active' : '');
        dots.appendChild(dot);
    }
}

function toggleAutoTranslate(checked) {
    window.ChatConfig.settings.autoTranslate = checked;
    localStorage.setItem('yujie_translate', checked);
}

function toggleDangerZone() {
    const content = document.getElementById('dangerContent');
    const arrow = document.getElementById('dangerArrow');
    if (content && arrow) {
        const show = content.classList.toggle('show');
        arrow.textContent = show ? '∨' : '>';
    }
}

function pickChatBg() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const bg = ev.target.result;
            window.ChatConfig.chatBg = bg;
            localStorage.setItem('yujie_chat_bg', bg);
            const preview = document.getElementById('chatBgPreview');
            if (preview) {
                preview.style.backgroundImage = `url(${bg})`;
                preview.textContent = '';
            }
            const messages = document.getElementById('chatMessages');
            if (messages) messages.style.backgroundImage = `url(${bg})`;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function clearChatBg() {
    window.ChatConfig.chatBg = '';
    localStorage.removeItem('yujie_chat_bg');
    const preview = document.getElementById('chatBgPreview');
    if (preview) {
        preview.style.backgroundImage = '';
        preview.textContent = '点击添加聊天背景图';
    }
    const messages = document.getElementById('chatMessages');
    if (messages) messages.style.backgroundImage = '';
}

function searchChatHistory(query) {
    const result = document.getElementById('chatSearchResult');
    if (!result) return;
    if (!query.trim()) {
        result.classList.remove('show');
        return;
    }
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    const fullText = messages.innerText;
    const q = query.toLowerCase();

    const sentences = fullText.split(/[。\n？！!?]/);
    const matches = sentences.filter(s => s.toLowerCase().includes(q));

    if (matches.length > 0) {
        result.innerHTML = matches.slice(0, 5).map(s =>
            '<div onclick="jumpToSearchResult()" style="padding:4px 0;border-bottom:0.5px dashed rgba(0,0,0,0.05);">' +
            s.trim().replace(new RegExp(q, 'gi'), '<b>$&</b>') +
            '</div>'
        ).join('');
        result.classList.add('show');
    } else {
        result.innerHTML = '<div style="color:#8e8e93;">未找到相关内容</div>';
        result.classList.add('show');
    }
}

function jumpToSearchResult() {
    const query = document.getElementById('chatSearchInput').value.trim();
    closeChatSettings();
    if (!query) return;
    
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    
    const allBubbles = messages.querySelectorAll('.bubble-assistant, .bubble-user');
    let found = null;
    const q = query.toLowerCase();
    
    allBubbles.forEach(bubble => {
        if (bubble.textContent.toLowerCase().includes(q) && !found) {
            found = bubble;
        }
    });
    
    if (found) {
        found.scrollIntoView({ behavior: 'smooth', block: 'center' });
        found.style.transition = '0.3s';
        found.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.5)';
        setTimeout(() => {
            found.style.boxShadow = '';
        }, 2000);
        showToast('已定位到聊天记录');
    } else {
        showToast('未找到相关消息');
    }
}

function manualSummary() {
    showToast('总结功能即将上线（拾忆林开发中）');
}

function clearChatHistory() {
    const contactId = window.ChatState?.currentContactId || 'c1';
    localStorage.removeItem('chat_history_' + contactId);
    const messages = document.getElementById('chatMessages');
    if (messages) messages.innerHTML = '<div style="text-align:center;color:#c7c7cc;font-size:13px;margin-top:20px;">聊天记录已清空</div>';
    closeChatSettings();
    showToast('聊天记录已清空');
}

function blockContact() {
    showToast('拉黑功能即将上线');
}

function deleteContact() {
    showToast('删除功能即将上线');
}

