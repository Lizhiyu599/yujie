/**
 * 玉界 - 聊天软件 UI
 * 包含：会话列表、聊天窗口、标签栏导航、心理状态窗、语音模式、语音消息、
 *       发送逻辑、长按气泡菜单、右上角+弹出菜单、添加好友页面、
 *       联系人列表（字母索引+拼音首字母）、编辑角色、动态页面、聊天详情半屏面板、
 *       我的页面、钱包、收藏、表情包管理、设置、面具系统、全局背景图
 */

// ========== 聊天状态 ==========
window.ChatConfig = window.ChatConfig || {
    contacts: [
        {
            id: 'c1',
            name: '小助手',
            avatar: '助',
            preview: '点击测试功能',
            persona: `你是玉界平台的测试小助手。
你的唯一职责是协助用户测试各项功能，包括但不限于：红包、转账、表情包、图片发送、位置分享、链接分享、语音消息、旁白、心理状态更新。
用户让你测试什么功能，你就配合测试。
回复简短，无废话。
每次回复必须包含心理状态JSON。`
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
        pronoun: localStorage.getItem('yujie_pronoun') || 'you',
        autoMoment: localStorage.getItem('yujie_auto_moment') === 'true',
        autoMomentFreq: parseInt(localStorage.getItem('yujie_auto_moment_freq') || 0),
        memoryCount: 50
    }
};

// ========== 获取/设置联系人独立配置 ==========
function getContactSetting(contactId, key, defaultValue) {
    var raw = localStorage.getItem('contact_setting_' + contactId + '_' + key);
    if (raw === null) return defaultValue;
    if (defaultValue === true || defaultValue === false) return raw === 'true';
    return raw;
}

function setContactSetting(contactId, key, value) {
    localStorage.setItem('contact_setting_' + contactId + '_' + key, value);
}

function loadContactSettings(contactId) {
    var settings = window.ChatConfig.settings;
    settings.onlineNarration = getContactSetting(contactId, 'narration', true);
    settings.autoTranslate = getContactSetting(contactId, 'translate', false);
    settings.autoMsg = getContactSetting(contactId, 'autoMsg', false);
    settings.autoMsgFreq = parseInt(getContactSetting(contactId, 'autoMsgFreq', '0'));
    settings.pronoun = getContactSetting(contactId, 'pronoun', 'you');
    settings.emojiAllow = getContactSetting(contactId, 'emojiAllow', true);
    settings.autoMoment = getContactSetting(contactId, 'autoMoment', false);
    settings.autoMomentFreq = parseInt(getContactSetting(contactId, 'autoMomentFreq', '0'));
    settings.summaryCount = parseInt(getContactSetting(contactId, 'summaryCount', '50'));
    settings.replyMin = parseInt(getContactSetting(contactId, 'replyMin', '1'));
    settings.replyMax = parseInt(getContactSetting(contactId, 'replyMax', '3'));
    settings.memoryCount = parseInt(getContactSetting(contactId, 'memoryCount', '50'));
}

// ========== 语音模式状态 ==========
window._isVoiceMode = false;

// ========== 添加好友头像数据 ==========
let charAvatarData = '';

// ========== 编辑角色头像数据 ==========
let editAvatarData = '';

// ========== 拼音首字母映射 ==========
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
            'J': '蒋击机肌鸡积基激及吉级即急疾集籍几己挤计记纪技际剂季既继寄加夹佳家嘉甲假价驾架嫁尖坚间肩艰兼监减剪检简见件建剑健舰渐践鉴键箭江姜将浆讲奖降酱交郊娇浇骄胶焦角饺脚搅叫轿较教阶接揭街节劫杰洁结捷截竭姐解介戒届界借今斤金津筋仅紧尽劲近进晋浸禁京经惊晶睛精井景警净径竞竟敬境静镜纠久九酒旧救就舅拘居鞠局菊橘举矩句巨拒具俱剧据距惧锯聚捐卷倦决绝觉掘军均君菌俊峻',
            'K': '卡开凯慨刊堪砍看康抗考烤靠科棵颗壳咳可渴克刻客课肯垦恳空孔恐控口扣枯哭苦库裤酷夸跨块快宽款狂况矿框亏葵愧溃昆困扩括阔',
            'L': '拉喇腊蜡辣啦来赖兰栏蓝篮览懒烂滥郎狼廊朗浪劳牢老乐勒雷泪类累冷厘梨狸离李里理力历厉立丽利例隶粒连怜帘莲联廉脸练炼恋链良凉梁粮两亮辆量辽疗聊了料列劣烈猎裂邻林临淋灵铃陵零龄领另令刘流留硫柳六龙笼隆楼漏露卢芦炉鲁陆录鹿碌路驴旅铝履律率绿卵乱掠略伦轮论罗萝螺洛落',
            'M': '妈麻马玛码骂吗买麦卖脉蛮满曼慢忙芒盲茫猫毛矛茅茂冒贸帽貌么没玫眉梅媒煤每美妹门闷们萌盟猛梦弥迷谜米密蜜眠绵棉免勉面苗描秒妙灭民敏名明鸣命摸模膜摩磨魔抹末沫陌莫漠墨默谋某母亩牡木目牧墓幕暮慕',
            'N': '拿哪内那纳娜乃奶耐男南难囊挠恼脑闹呢嫩能尼泥你年念娘酿鸟尿捏您宁凝牛扭纽农浓弄奴努怒女暖挪诺',
            'O': '欧偶',
            'P': '爬帕怕拍排牌派攀盘判叛盼旁胖抛炮跑泡培赔佩配喷盆朋棚蓬鹏捧碰批皮疲脾匹屁譬片偏篇骗漂飘拼贫品平评凭苹瓶萍坡泼颇婆迫破剖扑铺朴普',
            'Q': '七妻栖期欺齐其奇骑棋旗企启起气弃汽器恰千迁牵铅谦签前钱潜浅遣枪腔强墙抢悄敲乔桥瞧巧切茄且窃亲侵秦琴勤青轻倾清情晴庆穷丘秋求球区曲驱屈取去趣圈全权泉拳犬劝缺却雀确群',
            'R': '然燃染让扰绕热人仁忍认任扔仍日绒荣容融柔肉如儒乳辱入软瑞锐润若弱',
            'S': '撒洒塞赛三伞散桑扫色森杀沙纱傻晒山衫闪陕扇善伤商赏上尚梢烧稍少绍哨舌蛇舍设社射涉申伸身深神审婶肾甚渗慎升生声牲省圣盛剩尸失师诗施狮湿十什石时识实拾食史使始驶士氏世市示式事侍势视试饰室是适逝收手守首寿受兽售书叔殊梳舒疏输蔬熟暑属署鼠数术束述树竖恕庶数摔衰甩帅双爽谁水税睡顺瞬说丝司私思斯撕死四寺似饲松耸宋送搜艘苏俗诉肃素速宿塑酸蒜算虽随岁碎遂孙损缩所索锁',
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
            <div class="menu-item" data-action="menuEdit">编辑</div>
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

// ========== 用户气泡菜单 ==========
function initUserBubbleMenu() {
    if (document.getElementById('userBubbleMenu')) return;
    var menu = document.createElement('div');
    menu.className = 'bubble-menu';
    menu.id = 'userBubbleMenu';
    menu.style.cssText = 'position:fixed;z-index:99999;display:none;width:auto;';
    menu.innerHTML = `
        <div class="menu-row">
            <div class="menu-item" data-action="menuCopy">复制</div>
            <div class="menu-item" data-action="menuQuote">引用</div>
            <div class="menu-item" data-action="menuEdit">编辑</div>
        </div>
    `;
    document.body.appendChild(menu);

    menu.querySelectorAll('.menu-item[data-action]').forEach(function(item) {
        item.addEventListener('touchend', function(e) {
            e.stopPropagation();
            e.preventDefault();
            var fn = window[this.getAttribute('data-action')];
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
    var globalBg = localStorage.getItem('global_chat_bg') || '';

    appWindow.innerHTML = `
        <div class="chat-shell" style="background-image:url(${globalBg});background-size:cover;background-position:center;">
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
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    // 筛选当前面具的群聊
    var myGroups = groups.filter(function(g) { return g.maskId === activeMaskId || !g.maskId; });

    if (contacts.length === 0 && myGroups.length === 0) {
        listView.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#8e8e93;">暂无联系人<br><br>点击右上角 + 添加好友</div>';
        return;
    }

    var html = '';

    // 群聊列表
    if (myGroups.length > 0) {
        myGroups.forEach(function(g) {
            html += `
                <div class="chat-list-item" onclick="enterGroupChat('${g.id}')">
                    <div class="chat-avatar" style="${g.avatar ? 'background-image:url(' + g.avatar + ');background-size:cover;background-position:center;' : ''}">${g.avatar ? '&nbsp;' : '群'}</div>
                    <div class="chat-info">
                        <div class="chat-name">${g.name}（${g.members.length + 1}）</div>
                        <div class="chat-preview"></div>
                    </div>
                </div>
            `;
        });
    }

    // 联系人列表
    html += contacts.map(c => {
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

    listView.innerHTML = html;
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
            showMomentsPage();
            break;
        case 'me':
            if (plusBtn) plusBtn.style.display = 'none';
            if (titleEl) titleEl.textContent = '我的';
            var backBtn2 = document.querySelector('.nav-back');
            if (backBtn2) backBtn2.onclick = function() { closeChat(); };
            renderMePage(listView);
            break;
    }
}

// ========== 进入聊天窗口 ==========
function enterChat(contactId) {
    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (!contact) return;

    window.ChatState = window.ChatState || {};
    window.ChatState.currentContactId = contactId;
    loadContactSettings(contactId);

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
              <div class="chat-messages" id="chatMessages" style="${savedBg ? 'background-image:url(' + savedBg + ');background-size:cover;background-position:center;' : ''}">
                <div style="text-align:center;color:#c7c7cc;font-size:13px;margin-top:20px;">现在可以开始聊天了</div>
            </div>

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

            <div class="chat-input-bar">
    <div class="input-row">
        <div class="add-circle" onclick="toggleAddPanel()">+</div>
        <div class="chat-input-wrapper" id="chatInputWrapper">
            <input type="text" class="chat-input" id="chatInput" placeholder="${window.ChatState && window.ChatState.isOfflineMode ? '输入消息…' : '输入消息…'}" onkeypress="if(event.key==='Enter') handleSendOrReply()">
            ${window.ChatState && window.ChatState.isOfflineMode ? '' : `
            <div class="mic-btn" id="micBtn" onclick="toggleVoiceMode()">
                <span class="mic-icon-body"></span>
                <span class="mic-icon-arc"></span>
            </div>`}
        </div>
        <span class="chat-send-btn" id="chatSendBtn" onclick="handleSendOrReply()">↑</span>
    </div>
    <div class="add-panel-full" id="addPanelFull" style="display:none;">
        <div class="add-panel-tabs">
            ${window.ChatState && window.ChatState.isOfflineMode ? `
            <span class="add-panel-tab active" id="tabScene" onclick="switchAddPanelTab('func', this)">场景</span>` : `
            <span class="add-panel-tab active" id="tabEmoji" onclick="switchAddPanelTab('emoji', this)">表情包</span>
            <span class="add-panel-tab" id="tabFunc" onclick="switchAddPanelTab('func', this)">功能</span>`}
        </div>
        <div class="add-panel-body" id="addPanelBody"></div>
    </div>
</div>
        </div>
    `;

    loadChatHistory(contactId);
}

// ========== 进入群聊 ==========
function enterGroupChat(groupId) {
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var group = groups.find(function(g) { return g.id === groupId; });
    if (!group) return;

    window.ChatState = window.ChatState || {};
    window.ChatState.currentContactId = null;
    window.ChatState.currentGroupId = groupId;

    var appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    var globalBg = localStorage.getItem('global_chat_bg') || '';

    appWindow.innerHTML = `
        <div class="chat-overlay" id="chatOverlay">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-title" id="chatTitle">${group.name}（${group.members.length + 1}）</span>
<span class="nav-group-menu" onclick="openGroupInfo('${groupId}')" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:20px;color:#555;cursor:pointer;z-index:5;">☰</span>
                    </div>
            </div>
            <div class="chat-messages" id="chatMessages" style="background-image:url(${globalBg});">
                <div style="text-align:center;color:#c7c7cc;font-size:13px;margin-top:20px;">欢迎来到${group.name}</div>
            </div>

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
    <div class="add-panel-full" id="addPanelFull" style="display:none;">
        <div class="add-panel-tabs">
            <span class="add-panel-tab active" id="tabEmoji" onclick="switchAddPanelTab('emoji', this)">表情包</span>
            <span class="add-panel-tab" id="tabFunc" onclick="switchAddPanelTab('func', this)">功能</span>
        </div>
        <div class="add-panel-body" id="addPanelBody"></div>
    </div>
</div>
        </div>
    `;

    loadGroupChatHistory(groupId);
}

function loadGroupChatHistory(groupId) {
    var messages = document.getElementById('chatMessages');
    if (!messages) return;
    var saved = localStorage.getItem('chat_history_group_' + groupId);
    if (saved) {
        messages.innerHTML = saved;
        messages.scrollTop = messages.scrollHeight;
    }
}

function saveGroupChatHistory(groupId) {
    var messages = document.getElementById('chatMessages');
    if (!messages) return;
    var html = messages.innerHTML;
    if (html.length > 300000) html = html.slice(html.length - 300000);
    try {
        localStorage.setItem('chat_history_group_' + groupId, html);
    } catch(e) {}
}

// ========== 群聊发送消息 ==========
async function sendGroupMessage() {
    var input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;
    if (window.ChatState.isAITyping) return;

    var text = input.value.trim();
    var groupId = window.ChatState.currentGroupId;
    if (!groupId) return;

    appendGroupMessage('user', text, '我');
    input.value = '';
    saveGroupChatHistory(groupId);

    var systemPrompt = buildGroupSystemPrompt(groupId);
    var memoryCount = 50;
    var historyMessages = getRecentGroupHistory(groupId, memoryCount);

    window.ChatState.isAITyping = true;
    var titleEl = document.getElementById('chatTitle');
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中...</span>';

    try {
        var reply = await callChatAPI([
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: text }
        ]);
        processGroupReply(reply, groupId);
    } catch(e) {
        appendGroupMessage('system', '消息发送失败：' + e.message, '');
        window.ChatState.isAITyping = false;
    }
}

function appendGroupMessage(role, text, senderName) {
    var messages = document.getElementById('chatMessages');
    if (!messages) return null;

    if (role === 'narration') {
        var bubble = document.createElement('div');
        bubble.className = 'bubble bubble-narration';
        bubble.textContent = text;
        messages.appendChild(bubble);
        return null;
    }

    var row = document.createElement('div');
    row.className = 'bubble-row ' + (role === 'user' ? 'user' : 'assistant');
    row.setAttribute('data-role', role);

    var avatar = document.createElement('div');
    avatar.className = 'bubble-avatar ' + (role === 'user' ? 'user-avatar' : 'bot-avatar');
    if (role === 'user') {
        avatar.textContent = '我';
    } else {
        avatar.textContent = senderName ? senderName.charAt(0) : 'AI';
    }

    var nameLabel = document.createElement('div');
    nameLabel.className = 'group-sender-name';
    nameLabel.textContent = senderName || 'AI';
    nameLabel.style.cssText = 'font-size:11px;color:#8e8e93;margin-bottom:2px;padding-left:4px;';

    var bubble = document.createElement('div');
    bubble.className = 'bubble bubble-' + role;
    bubble.textContent = text;
    bubble.id = 'msg-' + Date.now();

    row.appendChild(avatar);
    var contentWrap = document.createElement('div');
    contentWrap.style.cssText = 'display:flex;flex-direction:column;';
    contentWrap.appendChild(nameLabel);
    contentWrap.appendChild(bubble);
    row.appendChild(contentWrap);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
}

function getRecentGroupHistory(groupId, maxCount) {
    var messages = document.getElementById('chatMessages');
    if (!messages) return [];
    var result = [];
    var rows = messages.querySelectorAll('.bubble-row');
    var total = rows.length;
    var start = Math.max(0, total - maxCount);
    for (var i = start; i < total; i++) {
        var row = rows[i];
        var bubble = row.querySelector('.bubble');
        if (!bubble) continue;
        var role = row.classList.contains('user') ? 'user' : 'assistant';
        var nameEl = row.querySelector('.group-sender-name');
        var senderName = nameEl ? nameEl.textContent : '';
        result.push({ role: role, content: (senderName ? senderName + '：' : '') + bubble.textContent });
    }
    return result;
}

function buildGroupSystemPrompt(groupId) {
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var group = groups.find(function(g) { return g.id === groupId; });
    if (!group) return '';

    var contacts = window.ChatConfig.contacts || [];
    var membersInfo = group.members.map(function(mid) {
        var c = contacts.find(function(ct) { return ct.id === mid; });
        if (!c) return '';
        return '- ' + c.name + '（性格：' + (c.persona ? c.persona.substring(0, 80) : '未知') + '）';
    }).join('\n');

    var prompt = '【群聊模式】你现在在一个群聊中。群名：' + group.name + '。\n\n';
    prompt += '群成员（包括用户"我"）：\n' + membersInfo + '\n- 我（用户）\n\n';
    prompt += '【发言规则-最高优先级】\n';
    prompt += '1. 每次回复时，你必须从群成员中选择一个人来发言。在回复开头用【发言人：名字】标明是谁在说话。\n';
    prompt += '2. 选择谁发言要基于：该角色的性格是否会在此时说话、该角色和当前话题的相关度、该角色的活跃度。\n';
    prompt += '3. 不同角色轮流发言，不要总是同一个人说话。\n';
    prompt += '4. 每个角色发言时必须严格符合自己的人设和性格。\n';
    prompt += '5. 用户以"我"的身份发言。\n';
    prompt += '6. 可以在一条回复中让多个人发言，用【发言人：名字】分隔。\n';
    return prompt;
}

function processGroupReply(rawContent, groupId) {
    var titleEl = document.getElementById('chatTitle');
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var group = groups.find(function(g) { return g.id === groupId; });
    var groupName = group ? group.name : '群聊';

    var contacts = window.ChatConfig.contacts || [];
    
    // 解析发言人
    var parts = rawContent.split(/【发言人：(.+?)】/);
    if (parts.length > 1) {
        for (var i = 1; i < parts.length; i += 2) {
            var senderName = parts[i].trim();
            var content = (parts[i + 1] || '').replace(/\{[^}]*\}/g, '').trim();
            if (content) {
                appendGroupMessage('assistant', content, senderName);
            }
        }
    } else {
        // 没有发言人标记，用群名
        var cleanContent = rawContent.replace(/\{[^}]*\}/g, '').trim();
        if (cleanContent) {
            appendGroupMessage('assistant', cleanContent, '群消息');
        }
    }
    
    if (titleEl) titleEl.textContent = groupName + '（' + (group.members.length + 1) + '）';
    window.ChatState.isAITyping = false;
    saveGroupChatHistory(groupId);
}

// ========== 群聊信息页面 ==========
function openGroupInfo(groupId) {
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var group = groups.find(function(g) { return g.id === groupId; });
    if (!group) return;

    var appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    var contacts = window.ChatConfig.contacts || [];
    var membersHTML = '';
    var memberCount = group.members.length;
    var displayMembers = group.members.slice(0, 3);
    
    displayMembers.forEach(function(mid) {
        var c = contacts.find(function(ct) { return ct.id === mid; });
        if (c) {
            membersHTML += '<div class="group-member-avatar" style="background-image:url(' + (c.avatarData || '') + ');background-size:cover;background-position:center;">' + (c.avatarData ? '' : c.avatar) + '</div>';
        }
    });

    var globalBg = localStorage.getItem('global_chat_bg') || '';

    appWindow.innerHTML = `
        <div class="chat-shell" style="background-image:url(${globalBg});background-size:cover;background-position:center;">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="enterGroupChat('${groupId}')">‹</span>
                    <span class="nav-title">群聊信息</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;">

                <div style="text-align:center;margin-bottom:20px;">
                    <div id="groupInfoAvatar" style="width:80px;height:80px;border-radius:40px;background:#e5e5ea;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8e8e93;background-size:cover;background-position:center;${group.avatar ? 'background-image:url(' + group.avatar + ');' : ''}" onclick="document.getElementById('groupInfoAvatarInput').click()">${group.avatar ? '' : '群'}</div>
                    <input type="file" id="groupInfoAvatarInput" accept="image/*" style="display:none;" onchange="updateGroupAvatar('${groupId}', event)">
                    <div style="font-size:18px;font-weight:600;color:#000;margin-top:8px;">${group.name}</div>
                </div>

                                <div class="settings-section-title">群成员 <span style="color:#8e8e93;font-size:14px;">${memberCount + 1}人</span></div>
                <div class="group-members-grid">
                    ${displayMembers.map(function(mid) {
                        var c = contacts.find(function(ct) { return ct.id === mid; });
                        if (!c) return '';
                        return '<div class="group-member-cell"><div class="group-member-avatar" style="background-image:url(' + (c.avatarData || '') + ');background-size:cover;background-position:center;">' + (c.avatarData ? '' : c.avatar) + '</div><div class="group-member-name">' + c.name + '</div></div>';
                    }).join('')}
                    <div class="group-member-cell" onclick="inviteToGroup('${groupId}')">
                        <div class="group-member-avatar group-add-btn">+</div>
                        <div class="group-member-name">邀请</div>
                    </div>
                    ${memberCount > 3 ? '<div class="group-member-cell" onclick="viewAllMembers(\'' + groupId + '\')"><div class="group-member-avatar group-more-btn">…</div><div class="group-member-name">更多</div></div>' : ''}
                </div>

                <div class="settings-section-title">群信息</div>
                <div class="glass-card">
                    <div class="ios-row" onclick="editGroupName('${groupId}')">
                        <span>群聊名称</span>
                        <span style="color:#555;">${group.name} ></span>
                    </div>
                    <div class="ios-row" style="border-bottom:none;" onclick="editGroupNote('${groupId}')">
                        <span>群备注</span>
                        <span style="color:#8e8e93;">${group.note || '未设置'} ></span>
                    </div>
                </div>

                <div class="settings-section-title">搜索聊天记录</div>
                <div class="glass-card">
                    <input type="text" class="search-input" placeholder="搜索群聊记录..." oninput="searchGroupHistory('${groupId}', this.value)">
                    <div class="search-result" id="groupSearchResult"></div>
                </div>

                <div class="danger-fold" onclick="toggleDangerZone()">
                    <span>危险区</span><span class="arrow" id="dangerArrow">></span>
                </div>
                <div class="danger-content" id="dangerContent">
                    <button class="white-btn" onclick="clearGroupHistory('${groupId}')">清空聊天记录</button>
                    <button class="white-btn" style="border-color:#ff3b30;color:#ff3b30;" onclick="disbandGroup('${groupId}')">解散群聊</button>
                </div>

            </div>
        </div>
    `;
}

function updateGroupAvatar(groupId, e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
        var group = groups.find(function(g) { return g.id === groupId; });
        if (group) {
            group.avatar = ev.target.result;
            localStorage.setItem('group_chats', JSON.stringify(groups));
            var preview = document.getElementById('groupInfoAvatar');
            if (preview) { preview.style.backgroundImage = 'url(' + ev.target.result + ')'; preview.innerText = ''; }
        }
    };
    reader.readAsDataURL(file);
}

function inviteToGroup(groupId) {
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var group = groups.find(function(g) { return g.id === groupId; });
    if (!group) return;
    var activeMaskId = group.maskId || localStorage.getItem('active_mask_id') || '';
    var contacts = window.ChatConfig.contacts || [];
    var availableContacts = contacts.filter(function(c) {
        return (c.maskId || '') === activeMaskId && group.members.indexOf(c.id) < 0;
    });
    if (availableContacts.length === 0) {
        showToast('没有可邀请的好友');
        return;
    }
    // 简化版：直接选第一个可用联系人加入
    var toAdd = availableContacts[0].id;
    group.members.push(toAdd);
    localStorage.setItem('group_chats', JSON.stringify(groups));
    showToast('已邀请 ' + availableContacts[0].name + ' 加入群聊');
    openGroupInfo(groupId);
}

function viewAllMembers(groupId) {
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var group = groups.find(function(g) { return g.id === groupId; });
    if (!group) return;
    var contacts = window.ChatConfig.contacts || [];
    var memberNames = group.members.map(function(mid) {
        var c = contacts.find(function(ct) { return ct.id === mid; });
        return c ? c.name : '未知';
    }).join('、');
    alert('全部成员（' + (group.members.length + 1) + '人）：\n' + memberNames + '\n以及你（用户）');
}

function editGroupName(groupId) {
    var newName = prompt('修改群聊名称：');
    if (!newName || !newName.trim()) return;
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var group = groups.find(function(g) { return g.id === groupId; });
    if (group) {
        group.name = newName.trim();
        localStorage.setItem('group_chats', JSON.stringify(groups));
        showToast('群名已修改');
        openGroupInfo(groupId);
    }
}

function editGroupNote(groupId) {
    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    var group = groups.find(function(g) { return g.id === groupId; });
    var currentNote = group ? (group.note || '') : '';
    var newNote = prompt('修改群备注：', currentNote);
    if (newNote === null) return;
    if (group) {
        group.note = newNote.trim();
        localStorage.setItem('group_chats', JSON.stringify(groups));
        showToast('群备注已修改');
        openGroupInfo(groupId);
    }
}

function searchGroupHistory(groupId, query) {
    var result = document.getElementById('groupSearchResult');
    if (!result) return;
    if (!query.trim()) { result.classList.remove('show'); return; }
    var saved = localStorage.getItem('chat_history_group_' + groupId);
    if (!saved) { result.innerHTML = '<div style="color:#8e8e93;">暂无聊天记录</div>'; result.classList.add('show'); return; }
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = saved;
    var text = tempDiv.innerText;
    var q = query.toLowerCase();
    var sentences = text.split(/[。\n？！!?]/);
    var matches = sentences.filter(function(s) { return s.toLowerCase().indexOf(q) >= 0; });
    if (matches.length > 0) {
        result.innerHTML = matches.slice(0, 5).map(function(s) {
            return '<div style="padding:4px 0;border-bottom:0.5px dashed rgba(0,0,0,0.05);">' + s.trim().replace(new RegExp(q, 'gi'), '<b>$&</b>') + '</div>';
        }).join('');
    } else {
        result.innerHTML = '<div style="color:#8e8e93;">未找到相关内容</div>';
    }
    result.classList.add('show');
}

function clearGroupHistory(groupId) {
    if (confirm('确定清空所有群聊记录？')) {
        localStorage.removeItem('chat_history_group_' + groupId);
        showToast('聊天记录已清空');
    }
}

function disbandGroup(groupId) {
    if (confirm('确定解散该群聊？此操作不可恢复。')) {
        var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
        groups = groups.filter(function(g) { return g.id !== groupId; });
        localStorage.setItem('group_chats', JSON.stringify(groups));
        localStorage.removeItem('chat_history_group_' + groupId);
        showToast('群聊已解散');
        closeChat();
        setTimeout(function() { openChat(); }, 100);
    }
}

// ========== 返回会话列表 ==========
function backToChatList() {
    window.ChatState.currentContactId = null;
    window._isVoiceMode = false;
    renderChatShell();
}

// ========== 让AI先说话 ==========
function triggerAIReply() {
    if (window.ChatState.isAITyping) return;
    
    const contactId = window.ChatState.currentContactId || 'c1';
    const contact = getContactById(contactId);
    const contactName = contact ? contact.name : 'AI';

    window.ChatState.isAITyping = true;
    const titleEl = document.getElementById('chatTitle');
    if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中...</span>';

    const systemPrompt = buildSystemPrompt(contactId);
    const memoryCount = parseInt(getContactSetting(contactId, 'memoryCount', '50'));
    const historyMessages = getRecentHistory(contactId, memoryCount);
    var stickerNote = '';
var messagesEl2 = document.getElementById('chatMessages');
if (messagesEl2) {
    var hiddenNarrations2 = messagesEl2.querySelectorAll('.bubble-narration[style*="display: none"]');
    hiddenNarrations2.forEach(function(n) {
        var nt = n.textContent.trim();
        if (nt && nt.indexOf('发送了表情包') >= 0) {
            stickerNote = nt;
        }
    });
}
    
    const userMessage = stickerNote ? stickerNote : '（用户暂时没有说话，你可以先开口）';
    
    callChatAPI([
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage }
    ]).then(reply => {
        processAIReply(reply, contactName, contactId);
    }).catch(error => {
        appendMessage('assistant', '抱歉，消息发送失败：' + error.message);
        if (titleEl) titleEl.textContent = contactName;
        window.ChatState.isAITyping = false;
    });
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
    // 群聊模式
    if (window.ChatState.currentGroupId) {
    var groupInput = document.getElementById('chatInput');
    if (!groupInput) return;
    if (groupInput.value.trim()) {
        sendGroupMessage();
    }
    return;
    }

    const input = document.getElementById('chatInput');
    if (!input) return;

    if (window.ChatState && window.ChatState.isOfflineMode) {
        if (input.value.trim()) {
            sendChatMessage();
        } else {
            triggerAIReply();
        }
        return;
    }

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
    if (document.getElementById('chatMessages')) saveChatHistory(contactId);

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
    if (!panel) return;
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        switchAddPanelTab('emoji', document.getElementById('tabEmoji'));
    } else {
        panel.style.display = 'none';
    }
}

function switchAddPanelTab(tab, el) {
    if (el) {
        el.parentElement.querySelectorAll('.add-panel-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
    if (typeof renderAddPanelContent === 'function') {
        renderAddPanelContent(tab);
    }
}

// ========== 长按气泡菜单 ==========
let bubbleMenuTarget = null;

document.addEventListener('touchstart', function(e) {
    var bubble = e.target.closest('.bubble-assistant');
    var isUserBubble = false;
    if (!bubble) {
        bubble = e.target.closest('.bubble-user');
        if (bubble) isUserBubble = true;
    }
    if (!bubble) {
        if (e.target.closest('.bubble-menu')) return;
        var menu1 = document.getElementById('bubbleMenu');
        var menu2 = document.getElementById('userBubbleMenu');
        if (menu1) menu1.style.display = 'none';
        if (menu2) menu2.style.display = 'none';
        return;
    }
    bubbleMenuTarget = bubble;
    var pressTimer = setTimeout(function() {
        initBubbleMenu();
        initUserBubbleMenu();
        var menu = isUserBubble ? document.getElementById('userBubbleMenu') : document.getElementById('bubbleMenu');
        if (!menu) return;
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        var menuH = menu.offsetHeight || 80;
        var menuW = menu.offsetWidth || (isUserBubble ? 200 : 260);
        var rect = bubble.getBoundingClientRect();
        menu.style.top = Math.max(10, rect.top - menuH - 8) + 'px';
        menu.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - menuW - 10)) + 'px';
        menu.style.visibility = '';
    }, 500);
    bubble.addEventListener('touchend', function() { clearTimeout(pressTimer); }, { once: true });
    bubble.addEventListener('touchmove', function() { clearTimeout(pressTimer); }, { once: true });
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('.bubble-menu') && !e.target.closest('.bubble-assistant') && !e.target.closest('.bubble-user')) {
        var menu1 = document.getElementById('bubbleMenu');
        var menu2 = document.getElementById('userBubbleMenu');
        if (menu1) menu1.style.display = 'none';
        if (menu2) menu2.style.display = 'none';
    }
});

function menuCopy() {
    if (bubbleMenuTarget) {
        navigator.clipboard.writeText(bubbleMenuTarget.textContent).then(function() {
            showToast('已复制');
        });
    }
    var menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuFavorite() {
    if (!bubbleMenuTarget) return;
    var text = bubbleMenuTarget.textContent;
    var contactId = window.ChatState.currentContactId || 'c1';
    var contact = getContactById(contactId);
    var contactName = contact ? contact.name : 'AI';
    if (typeof addFavorite === 'function') {
        addFavorite(text, contactId, contactName);
        showToast('已收藏');
    } else {
        showToast('收藏功能即将上线');
    }
    var menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuRegret() {
    var menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
    var overlay = document.createElement('div');
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
    var overlay = document.getElementById('regretModalOverlay');
    if (overlay) overlay.remove();
}

function confirmRegret() {
    var hint = document.getElementById('regretTextarea').value.trim();
    closeRegretModal();

    if (!bubbleMenuTarget) return;
    var messages = document.getElementById('chatMessages');
    if (!messages) return;

    var targetRow = bubbleMenuTarget.closest('.bubble-row');
    if (!targetRow) targetRow = bubbleMenuTarget;

  var allChildren = messages.querySelectorAll('.bubble-row, .bubble-narration, .chat-time-stamp, .translate-row, .voice-transcript-row');
  var found = false;
  for (var i = 0; i < allChildren.length; i++) {
    var child = allChildren[i];
    if (child === targetRow || child.contains(bubbleMenuTarget)) found = true;
    if (found) {
        var isUserRow = child.classList.contains('user') || child.getAttribute('data-role') === 'user';
        var isTimeStamp = child.classList.contains('chat-time-stamp');
        if (!isUserRow && !isTimeStamp) {
            child.remove();
        }
    }
}
    
    saveChatHistory(window.ChatState.currentContactId);

    setTimeout(function() {
        var contactId = window.ChatState.currentContactId || 'c1';
        var contact = getContactById(contactId);
        var contactName = contact ? contact.name : 'AI';

        window.ChatState.isAITyping = true;
        var titleEl = document.getElementById('chatTitle');
        if (titleEl) titleEl.innerHTML = '<span class="nav-typing">输入中…</span>';

        var systemPrompt = buildSystemPrompt(contactId);
        var userMessage = hint || '请重新回复，换一种表达方式';
        var memoryCount = parseInt(getContactSetting(contactId, 'memoryCount', '50'));
        var historyMessages = getRecentHistory(contactId, memoryCount);
        var allMessages = [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: userMessage }
        ];

        callChatAPI(allMessages).then(function(reply) {
            processAIReply(reply, contactName, contactId);
        }).catch(function(error) {
            appendMessage('assistant', '抱歉，消息发送失败：' + error.message);
            if (titleEl) titleEl.textContent = contactName;
            window.ChatState.isAITyping = false;
        });
    }, 100);
}

var multiSelectMode = false;
var multiSelected = [];

function menuMultiSelect() {
    var menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
    
    multiSelectMode = true;
    multiSelected = [];
    
    // 给所有角色气泡加上勾选框
    var bubbles = document.querySelectorAll('#chatMessages .bubble-assistant');
    bubbles.forEach(function(bubble, index) {
        bubble.setAttribute('data-ms-index', index);
        bubble.classList.add('multi-selectable');
        var check = document.createElement('div');
        check.className = 'ms-check';
        check.innerHTML = '○';
        bubble.appendChild(check);
        
        bubble.addEventListener('click', function(e) {
            if (!multiSelectMode) return;
            e.stopPropagation();
            toggleMultiSelect(index, bubble);
        });
    });
    
    // 底部确认按钮
    showMultiSelectBar();
}

function toggleMultiSelect(index, bubble) {
    var idx = multiSelected.indexOf(index);
    if (idx >= 0) {
        multiSelected.splice(idx, 1);
        bubble.querySelector('.ms-check').innerHTML = '○';
        bubble.classList.remove('ms-selected');
    } else {
        multiSelected.push(index);
        bubble.querySelector('.ms-check').innerHTML = '●';
        bubble.classList.add('ms-selected');
    }
    updateMultiSelectCount();
}

function showMultiSelectBar() {
    var oldBar = document.getElementById('multiSelectBar');
    if (oldBar) oldBar.remove();
    
    var bar = document.createElement('div');
    bar.id = 'multiSelectBar';
    bar.className = 'multi-select-bar';
    bar.innerHTML = `
        <span class="ms-bar-cancel" onclick="cancelMultiSelect()">取消</span>
        <span class="ms-bar-count" id="msBarCount">已选 0 条</span>
        <span class="ms-bar-confirm" onclick="confirmMultiSelect()">确认收藏</span>
    `;
    document.body.appendChild(bar);
}

function updateMultiSelectCount() {
    var countEl = document.getElementById('msBarCount');
    if (countEl) countEl.textContent = '已选 ' + multiSelected.length + ' 条';
}

function cancelMultiSelect() {
    multiSelectMode = false;
    multiSelected = [];
    var bar = document.getElementById('multiSelectBar');
    if (bar) bar.remove();
    document.querySelectorAll('.ms-check').forEach(function(c) { c.remove(); });
    document.querySelectorAll('.multi-selectable').forEach(function(b) {
        b.classList.remove('multi-selectable', 'ms-selected');
        b.removeAttribute('data-ms-index');
    });
}

function confirmMultiSelect() {
    if (multiSelected.length === 0) {
        showToast('请先选择消息');
        return;
    }
    var contactId = window.ChatState.currentContactId || 'c1';
    var contact = getContactById(contactId);
    var contactName = contact ? contact.name : 'AI';
    var bubbles = document.querySelectorAll('#chatMessages .bubble-assistant');
    var count = 0;
    multiSelected.forEach(function(index) {
        if (bubbles[index]) {
            var text = bubbles[index].textContent.replace(/[○●]/g, '').trim();
            if (typeof addFavorite === 'function') {
                addFavorite(text, contactId, contactName);
                count++;
            }
        }
    });
    cancelMultiSelect();
    showToast('已收藏 ' + count + ' 条消息');
}

function menuQuote() {
    if (!bubbleMenuTarget) return;
    var contactId = window.ChatState.currentContactId || 'c1';
    var contact = getContactById(contactId);
    var isUserBubble = bubbleMenuTarget.classList.contains('bubble-user');
    var name = isUserBubble ? '我' : (contact ? contact.name : '角色');
    var text = bubbleMenuTarget.textContent;
    var maxChars = 14;
    var prefix = name + '：';
    var firstLineContent = text.substring(0, maxChars - prefix.length);
    var line1 = prefix + firstLineContent;
    var remaining = text.substring(firstLineContent.length);
    var line2 = '';
    if (remaining.length > 0) {
        line2 = remaining.substring(0, maxChars);
        if (remaining.length > maxChars) line2 += '…';
    }

    window.ChatState.quotedMsg = { n: name, t: text };

    var existingPreview = document.getElementById('quotePreview');
    if (existingPreview) existingPreview.remove();

    var inputBar = document.querySelector('.chat-input-bar');
    if (inputBar) {
        var preview = document.createElement('div');
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

    var menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
    showToast('已引用');
}

function cancelQuote() {
    window.ChatState.quotedMsg = null;
    var preview = document.getElementById('quotePreview');
    if (preview) preview.remove();
}

function menuTranslate() {
    if (!bubbleMenuTarget) return;
    var row = bubbleMenuTarget.closest('.bubble-row');
    var next = row ? row.nextElementSibling : null;

    if (next && next.classList.contains('translate-row')) {
        next.style.display = next.style.display === 'none' ? 'flex' : 'none';
        var menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    var text = bubbleMenuTarget.textContent;
    if (!needsTranslation(text)) {
        showToast('已是简体中文');
        var menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    if (window._translateCache[text]) {
        appendTranslationRow(row, window._translateCache[text]);
        var menu = document.getElementById('bubbleMenu');
        if (menu) menu.style.display = 'none';
        return;
    }

    showToast('翻译中…');
    translateText(text).then(function(translated) {
        window._translateCache[text] = translated;
        appendTranslationRow(row, translated);
    }).catch(function() {
        showToast('翻译失败');
    });

    var menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
}

function menuEdit() {
    if (!bubbleMenuTarget) return;
    var text = bubbleMenuTarget.textContent;
    var menu = document.getElementById('bubbleMenu');
    if (menu) menu.style.display = 'none';
    
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'editMsgOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">编辑消息</div>
            <textarea class="caption-textarea" id="editMsgTextarea" style="height:100px;">${text}</textarea>
            <div class="caption-buttons">
                <div class="payment-btn-cancel" onclick="closeEditMsg()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmEditMsg()">确定</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeEditMsg(); };
}

function closeEditMsg() {
    var overlay = document.getElementById('editMsgOverlay');
    if (overlay) overlay.remove();
}

function confirmEditMsg() {
    var newText = document.getElementById('editMsgTextarea').value.trim();
    closeEditMsg();
    if (!bubbleMenuTarget) return;
    
    var contactId = window.ChatState.currentContactId || 'c1';
    
    if (!newText) {
        // 删掉该气泡所在行
        var row = bubbleMenuTarget.closest('.bubble-row');
        if (row) row.remove();
    } else {
        bubbleMenuTarget.textContent = newText;
    }
    
    if (typeof saveChatHistory === 'function') saveChatHistory(contactId);
    showToast(newText ? '消息已修改' : '消息已删除');
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
    var menu = document.getElementById('plusMenuPopup');
    if (menu) menu.remove();
    showCreateGroupPage();
}

// ========== 添加好友页面 ==========
var charSelectedMaskId = localStorage.getItem('active_mask_id') || '';

function selectCharMask(maskId, el) {
    charSelectedMaskId = maskId;
    var items = document.querySelectorAll('#charMaskSelector .qw-char-select-item');
    items.forEach(function(item) { item.style.border = '1px solid rgba(0,0,0,0.06)'; item.classList.remove('active'); });
    el.style.border = '1px solid #000';
    el.classList.add('active');
}

function showCreateCharacterPage() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    charAvatarData = '';
    charSelectedMaskId = localStorage.getItem('active_mask_id') || '';
    var globalBg = localStorage.getItem('global_chat_bg') || '';

    appWindow.innerHTML = `
        <div class="chat-shell" style="background-image:url(${globalBg});background-size:cover;background-position:center;">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="renderChatShell()">‹</span>
                    <span class="nav-title">添加好友</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;">

                <div style="text-align:center;margin-bottom:20px;">
                    <div id="charAvatarPreview" style="width:80px;height:80px;border-radius:40px;background:#e5e5ea;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;" onclick="document.getElementById('charAvatarInput').click()">+</div>
                    <input type="file" id="charAvatarInput" accept="image/*" style="display:none;" onchange="previewCharAvatar(event)">
                    <div style="font-size:11px;color:#8e8e93;">点击上传头像</div>
                </div>

                <div class="settings-section-title">姓名</div>
                <div class="glass-card">
                    <input type="text" id="charNameInput" class="search-input" placeholder="请输入角色姓名">
                </div>

                <div class="settings-section-title">备注</div>
                <div class="glass-card">
                    <input type="text" id="charNoteInput" class="search-input" placeholder="请输入你给角色的备注">
                </div>

                <div class="settings-section-title">聊天使用的面具</div>
                <div class="glass-card">
                    <div id="charMaskSelector" style="display:flex;flex-direction:column;gap:6px;"></div>
                </div>

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

                <div class="settings-section-title">年龄</div>
                <div class="glass-card">
                    <input type="text" id="charAgeInput" class="search-input" placeholder="请输入该角色的年龄">
                </div>

                <div class="settings-section-title">性格</div>
                <div class="glass-card">
                    <textarea id="charPersonalityInput" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的性格、人格类型、语言风格"></textarea>
                </div>

                <div class="settings-section-title">背景故事</div>
                <div class="glass-card">
                    <textarea id="charBackgroundInput" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的人生经历、原生家庭、与你如何相识"></textarea>
                </div>

                <div class="settings-section-title">外貌描述</div>
                <div class="glass-card">
                    <textarea id="charAppearanceInput" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的外貌描述，用于引导生图API，未配置可填可不填"></textarea>
                    <div style="font-size:11px;color:#8e8e93;margin-top:6px;">选填，用于生图API生成角色形象</div>
                </div>

                <button class="black-btn" id="createCharBtn" onclick="createNewCharacter()" style="margin-top:20px;margin-bottom:30px;opacity:0.4;pointer-events:none;">添加该角色</button>
            </div>
        </div>
    `;

    // 渲染面具选择器
    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    if (masks.length === 0) {
        masks = [{ id: 'default', name: '默认面具', avatar: '' }];
    }
    var maskHTML = '';
    masks.forEach(function(m) {
        var isActive = m.id === charSelectedMaskId || (masks.length === 1 && !charSelectedMaskId);
        maskHTML += '<div class="qw-char-select-item' + (isActive ? ' active' : '') + '" onclick="selectCharMask(\'' + m.id + '\', this)" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.5);border:1px solid ' + (isActive ? '#000' : 'rgba(0,0,0,0.06)') + ';border-radius:12px;cursor:pointer;font-size:14px;color:#000;">' + (m.avatar ? '<div style="width:32px;height:32px;border-radius:50%;background-image:url(' + m.avatar + ');background-size:cover;background-position:center;"></div>' : '<div style="width:32px;height:32px;border-radius:50%;background:#e5e5ea;display:flex;align-items:center;justify-content:center;font-size:14px;color:#8e8e93;">' + (m.name ? m.name.charAt(0) : '?') + '</div>') + m.name + '</div>';
    });
    var maskEl = document.getElementById('charMaskSelector');
    if (maskEl) maskEl.innerHTML = maskHTML;

    checkCreateButton();
}

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

function checkCreateButton() {
    const name = document.getElementById('charNameInput')?.value.trim() || '';
    const note = document.getElementById('charNoteInput')?.value.trim() || '';
    const age = document.getElementById('charAgeInput')?.value.trim() || '';
    const personality = document.getElementById('charPersonalityInput')?.value.trim() || '';
    const background = document.getElementById('charBackgroundInput')?.value.trim() || '';

    const allFilled = name && age && personality && background;
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

document.addEventListener('input', function(e) {
    if (e.target && e.target.closest('#charNameInput, #charNoteInput, #charAgeInput, #charPersonalityInput, #charBackgroundInput')) {
        checkCreateButton();
    }
});

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
        preview: '点击开始对话',
        maskId: charSelectedMaskId || ''
    };

    window.ChatConfig.contacts.push(newContact);
    saveContactsToStorage();
    showToast('角色 ' + (note || name) + ' 创建成功');
    closeChat();
    setTimeout(function() { openChat(); }, 100);
}

function saveContactsToStorage() {
    const data = window.ChatConfig.contacts.map(c => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        avatarData: c.avatarData || '',
        persona: c.persona || '',
        preview: c.preview || '',
        maskId: c.maskId || ''
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

// ========== 创建群聊页面 ==========
var groupAvatarData = '';
var groupSelectedMembers = [];

function showCreateGroupPage() {
    var appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    groupAvatarData = '';
    groupSelectedMembers = [];
    
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var contacts = window.ChatConfig.contacts || [];
    // 筛选同面具的联系人
    var sameMaskContacts = contacts.filter(function(c) {
        return (c.maskId || '') === activeMaskId || !c.maskId;
    });
    
    var globalBg = localStorage.getItem('global_chat_bg') || '';

    appWindow.innerHTML = `
        <div class="chat-shell" style="background-image:url(${globalBg});background-size:cover;background-position:center;">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="renderChatShell()">‹</span>
                    <span class="nav-title">创建群聊</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;">

                <div style="text-align:center;margin-bottom:20px;">
                    <div id="groupAvatarPreview" style="width:80px;height:80px;border-radius:40px;background:#e5e5ea;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;" onclick="document.getElementById('groupAvatarInput').click()">+</div>
                    <input type="file" id="groupAvatarInput" accept="image/*" style="display:none;" onchange="previewGroupAvatar(event)">
                    <div style="font-size:11px;color:#8e8e93;">点击上传群头像（可不填）</div>
                </div>

                <div class="settings-section-title">群聊名称</div>
                <div class="glass-card">
                    <input type="text" id="groupNameInput" class="search-input" placeholder="请输入群聊名称">
                </div>

                <div class="settings-section-title">邀请好友</div>
                <div class="list-header" onclick="toggleSection('groupMemberSection', this)">
                    <span>选择成员（${sameMaskContacts.length}位好友）</span>
                    <span class="toggle-arrow">›</span>
                </div>
                <div id="groupMemberSection" class="collapsible-section" style="display:none;">
                    <div class="ios-group" id="groupMemberList">
                        ${sameMaskContacts.map(function(c) {
                            return `
                                <div class="ios-row group-member-item" data-cid="${c.id}" onclick="toggleGroupMember('${c.id}', this)">
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <div style="width:40px;height:40px;border-radius:20px;background:#1d1d1f;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;background-size:cover;background-position:center;${c.avatarData ? 'background-image:url(' + c.avatarData + ');' : ''}">${c.avatarData ? '' : c.avatar}</div>
                                        <span>${c.name}</span>
                                    </div>
                                    <div class="group-check-circle">○</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <button class="black-btn" id="createGroupBtn" onclick="createGroupChat()" style="margin-top:20px;margin-bottom:30px;opacity:0.4;pointer-events:none;">创建群聊</button>
            </div>
        </div>
    `;

    checkGroupButton();
}

function previewGroupAvatar(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        groupAvatarData = ev.target.result;
        var preview = document.getElementById('groupAvatarPreview');
        if (preview) {
            preview.style.backgroundImage = 'url(' + ev.target.result + ')';
            preview.innerText = '';
        }
    };
    reader.readAsDataURL(file);
}

function toggleGroupMember(cid, el) {
    var idx = groupSelectedMembers.indexOf(cid);
    if (idx >= 0) {
        groupSelectedMembers.splice(idx, 1);
        el.querySelector('.group-check-circle').innerHTML = '○';
        el.classList.remove('selected');
    } else {
        groupSelectedMembers.push(cid);
        el.querySelector('.group-check-circle').innerHTML = '●';
        el.classList.add('selected');
    }
    checkGroupButton();
}

function checkGroupButton() {
    var name = document.getElementById('groupNameInput')?.value.trim() || '';
    var btn = document.getElementById('createGroupBtn');
    if (btn) {
        if (name && groupSelectedMembers.length >= 2) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
        }
    }
}

document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'groupNameInput') {
        checkGroupButton();
    }
});

function createGroupChat() {
    var name = document.getElementById('groupNameInput').value.trim();
    if (!name) { showToast('请输入群聊名称'); return; }
    if (groupSelectedMembers.length < 2) { showToast('请至少选择2位好友'); return; }

    var activeMaskId = localStorage.getItem('active_mask_id') || '';

    var newGroup = {
        id: 'g_' + Date.now(),
        name: name,
        avatar: groupAvatarData || '',
        maskId: activeMaskId,
        members: groupSelectedMembers,
        adminIds: [activeMaskId],
        createdAt: Date.now()
    };

    var groups = JSON.parse(localStorage.getItem('group_chats') || '[]');
    groups.push(newGroup);
    localStorage.setItem('group_chats', JSON.stringify(groups));

    showToast('群聊 ' + name + ' 创建成功');
    closeChat();
    setTimeout(function() { openChat(); }, 100);
}

// ========== 联系人列表渲染 ==========
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
    title.style.cssText = 'background:transparent;padding:6px 16px;font-size:13px;color:#8e8e93;font-weight:500;';
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

function getFriendRequests() {
    var raw = localStorage.getItem('friend_requests');
    return raw ? JSON.parse(raw) : [];
}

function saveFriendRequests(requests) {
    localStorage.setItem('friend_requests', JSON.stringify(requests));
}           

// ========== 返回联系人列表 / 编辑角色 ==========
function backToContactsFromEdit() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;
    var globalBg = localStorage.getItem('global_chat_bg') || '';

    appWindow.innerHTML = `
        <div class="chat-shell" style="background-image:url(${globalBg});background-size:cover;background-position:center;">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="closeChat()">‹</span>
                    <span class="nav-title">联系人</span>
                    <span class="nav-plus-btn" onclick="togglePlusMenu(event)">+</span>
                </div>
            </div>
            <div class="chat-list" id="chatListView"></div>
            <div class="tab-fixed-bottom">
                <span class="tab-item" onclick="switchChatTab('chats', this)">消息</span>
                <span class="tab-item active" onclick="switchChatTab('contacts', this)">联系人</span>
                <span class="tab-item" onclick="switchChatTab('moments', this)">动态</span>
                <span class="tab-item" onclick="switchChatTab('me', this)">我的</span>
            </div>
        </div>
    `;

    renderContactsList();
}

function editContactPersona(contactId) {
    const contact = window.ChatConfig.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    editAvatarData = '';

    var existingName = contact.name || '';
    var existingNote = '';
    var existingGender = '女';
    var existingAge = '';
    var existingPersonality = '';
    var existingBackground = '';
    var existingAppearance = '';

    if (contact.persona) {
        var nameMatch = contact.persona.match(/【姓名】([\s\S]+?)(?=\n【|$)/);
        var noteMatch = contact.persona.match(/【昵称\/备注】([\s\S]+?)(?=\n【|$)/);
        var genderMatch = contact.persona.match(/【性别】([\s\S]+?)(?=\n【|$)/);
        var ageMatch = contact.persona.match(/【年龄】([\s\S]+?)(?=\n【|$)/);
        var personalityMatch = contact.persona.match(/【性格】([\s\S]+?)(?=\n【|$)/);
        var backgroundMatch = contact.persona.match(/【背景故事】([\s\S]+?)(?=\n【|$)/);
        var appearanceMatch = contact.persona.match(/【外貌描述】([\s\S]+?)(?=\n【|$)/);
        if (nameMatch) existingName = nameMatch[1];
        if (noteMatch) existingNote = noteMatch[1];
        if (genderMatch) existingGender = genderMatch[1];
        if (ageMatch) existingAge = ageMatch[1];
        if (personalityMatch) existingPersonality = personalityMatch[1];
        if (backgroundMatch) existingBackground = backgroundMatch[1];
        if (appearanceMatch) existingAppearance = appearanceMatch[1];
    }

    var globalBg = localStorage.getItem('global_chat_bg') || '';

    appWindow.innerHTML = `
        <div class="chat-shell" style="background-image:url(${globalBg});background-size:cover;background-position:center;">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="backToContactsFromEdit()">‹</span>
                    <span class="nav-title">编辑角色</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;">

                <div class="settings-section-title">角色头像</div>
                <div class="glass-card" style="text-align:center;">
                    <div id="editAvatarPreview" style="width:80px;height:80px;border-radius:40px;background:#e5e5ea;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;${contact.avatarData ? 'background-image:url(' + contact.avatarData + ');' : ''}" onclick="document.getElementById('editAvatarInput').click()">${contact.avatarData ? '' : contact.avatar}</div>
                    <input type="file" id="editAvatarInput" accept="image/*" style="display:none;" onchange="updateEditAvatar(event)">
                    <div style="font-size:11px;color:#8e8e93;">点击更换头像</div>
                </div>

                <div class="settings-section-title">角色名称</div>
                <div class="glass-card">
                    <input type="text" id="editCharName" class="search-input" value="${existingName}" placeholder="角色名称">
                </div>

                <div class="settings-section-title">备注</div>
                <div class="glass-card">
                    <input type="text" id="editCharNote" class="search-input" value="${existingNote}" placeholder="请输入你给角色的备注">
                </div>

                <div class="settings-section-title">性别</div>
                <div class="glass-card">
                    <div style="display:flex;gap:16px;align-items:center;">
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="editCharGender" value="女" ${existingGender === '女' ? 'checked' : ''} style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateEditGenderRadio()"> 女
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="editCharGender" value="男" ${existingGender === '男' ? 'checked' : ''} style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateEditGenderRadio()"> 男
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                            <input type="radio" name="editCharGender" value="非人类" ${existingGender === '非人类' ? 'checked' : ''} style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateEditGenderRadio()"> 非人类
                        </label>
                    </div>
                </div>

                <div class="settings-section-title">年龄</div>
                <div class="glass-card">
                    <input type="text" id="editCharAge" class="search-input" value="${existingAge}" placeholder="请输入该角色的年龄">
                </div>

                <div class="settings-section-title">性格</div>
                <div class="glass-card">
                    <textarea id="editCharPersonality" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的性格、人格类型、语言风格">${existingPersonality}</textarea>
                </div>

                <div class="settings-section-title">背景故事</div>
                <div class="glass-card">
                    <textarea id="editCharBackground" style="width:100%;height:100px;background:rgba(255,255,255,0.6);border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;color:#000;line-height:1.6;" placeholder="请输入该角色的人生经历、原生家庭、与你如何相识">${existingBackground}</textarea>
                </div>

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

// ========== 动态页面 ==========
let momentsData = [];
let momentsPage = 0;
let momentsLoading = false;
let momentsAllLoaded = false;
let momentsCoverBg = localStorage.getItem('moments_cover_bg') || '';
let publishImages = [];
let publishLocation = '';

function showMomentsPage() {
    momentsCoverBg = localStorage.getItem('moments_cover_bg') || '';
    loadMomentsData();
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;
    var globalBg = localStorage.getItem('global_chat_bg') || '';

    appWindow.innerHTML = `
        <div class="chat-shell" style="background-image:url(${globalBg});background-size:cover;background-position:center;">
            <div class="chat-nav" style="background:rgba(255,255,255,0.4);">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="renderChatShell()">‹</span>
                    <span class="nav-title">动态</span>
                </div>
            </div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;" id="momentsScrollArea" onscroll="handleMomentsScroll()">
                <div style="position:relative;">
                    <div class="moments-publish-btn" onclick="event.stopPropagation(); openPublishModal()" style="position:absolute; top:50px; right:16px; z-index:10;">
                        <span class="publish-icon-body"></span>
                        <span class="publish-icon-lens"></span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; padding:60px 16px 12px;">
                        <div class="moments-cover-avatar" id="momentsCoverAvatar" style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.3);border:2px solid rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;background-size:cover;background-position:center;flex-shrink:0;"></div>
                        <span id="momentsCoverName" style="font-size:16px;color:#000;font-weight:600;">用户</span>
                    </div>
                    <div style="border-bottom:1px dashed rgba(0,0,0,0.1); margin:0 16px;"></div>
                </div>
                <div class="moments-feed" id="momentsFeed"></div>
                <div class="moments-bottom-hint" id="momentsBottomHint"></div>
            </div>
            <div class="moments-back-top" id="momentsBackTop" onclick="scrollMomentsToTop()">↑</div>
        </div>
        <div class="moments-image-viewer" id="momentsImageViewer" onclick="closeMomentsImageViewer()">
            <img id="momentsViewerImg" src="" style="max-width:95%;max-height:95%;object-fit:contain;border-radius:8px;">
        </div>
        <div class="moments-interact-panel" id="momentsInteractPanel" onclick="event.stopPropagation()">
            <div class="interact-panel-header">
                <span>互动</span>
                <span class="interact-panel-close" onclick="closeInteractPanel()">x</span>
            </div>
            <div class="interact-panel-body" id="interactPanelBody"></div>
        </div>
        <div class="moments-publish-overlay" id="momentsPublishOverlay" onclick="closePublishModal()">
            <div class="moments-publish-modal" onclick="event.stopPropagation()">
                <div style="font-size:16px;font-weight:600;margin-bottom:12px;color:#000;">发布动态</div>
                <textarea class="caption-textarea" id="publishText" placeholder="分享你的想法..." style="height:100px;"></textarea>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button class="white-btn" onclick="document.getElementById('publishImageInput').click()">添加图片</button>
                    <button class="white-btn" onclick="openLocationInput()">添加位置</button>
                </div>
                <input type="file" id="publishImageInput" accept="image/*" multiple style="display:none;" onchange="handlePublishImages(event)">
                <div class="publish-image-preview" id="publishImagePreview"></div>
                <button class="black-btn" onclick="publishMoment()" style="margin-top:12px;">发布</button>
            </div>
        </div>
    `;

    momentsPage = 0;
    momentsAllLoaded = false;
    loadMomentsCoverInfo();
    if (momentsData.length === 0) {
        loadInitialMoments();
    }
    renderMomentsFeed();
}

function saveMomentsData() {
    try { localStorage.setItem('moments_data', JSON.stringify(momentsData)); } catch(e) {}
}

function loadMomentsData() {
    var raw = localStorage.getItem('moments_data');
    if (raw) { try { momentsData = JSON.parse(raw); } catch(e) { momentsData = []; } }
    else { momentsData = []; }
}

function loadInitialMoments() {
    momentsData.push({
        id: 'm_welcome',
        userName: '小助手',
        userAvatar: '助',
        text: '欢迎使用玉界平台，我是测试小助手',
        images: [],
        time: getRelativeTime(Date.now() - 86400000),
        location: '',
        likes: 0,
        comments: [],
        liked: false
    });
    saveMomentsData();
}

function loadMomentsCoverInfo() {
    var avatar = document.getElementById('momentsCoverAvatar');
    var name = document.getElementById('momentsCoverName');
    var masks = typeof getMasks === 'function' ? getMasks() : [];
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var activeMask = null;
    for (var i = 0; i < masks.length; i++) {
        if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; }
    }
    if (!activeMask && masks.length > 0) activeMask = masks[0];
    if (activeMask) {
        if (activeMask.avatar && avatar) {
            avatar.style.backgroundImage = 'url(' + activeMask.avatar + ')';
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.innerText = '';
        }
        if (activeMask.name && name) name.textContent = activeMask.name;
    }
}

function changeMomentsCover() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            momentsCoverBg = ev.target.result;
            localStorage.setItem('moments_cover_bg', momentsCoverBg);
            var cover = document.getElementById('momentsCover');
            if (cover) cover.style.backgroundImage = 'url(' + momentsCoverBg + ')';
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function handleMomentsScroll() {
    var area = document.getElementById('momentsScrollArea');
    var btn = document.getElementById('momentsBackTop');
    if (!area) return;
    if (btn) btn.style.display = area.scrollTop > 500 ? 'flex' : 'none';
    if (momentsLoading || momentsAllLoaded) return;
    var scrollBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
    if (scrollBottom < 200) loadMoreMoments();
}

function scrollMomentsToTop() {
    var area = document.getElementById('momentsScrollArea');
    if (area) area.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadMoreMoments() {
    if (momentsLoading || momentsAllLoaded) return;
    momentsLoading = true;
    momentsPage++;
    var newMoments = generateMockMoments(momentsPage);
    if (newMoments.length === 0) {
        momentsAllLoaded = true;
        var hint = document.getElementById('momentsBottomHint');
        if (hint) hint.innerHTML = '<span style="color:#8e8e93;font-size:12px;">动态到底了</span>';
    } else {
        momentsData = momentsData.concat(newMoments);
        saveMomentsData();
        renderMomentsFeed();
    }
    momentsLoading = false;
}

function generateMockMoments(page) {
    if (page > 2) return [];
    var mockTexts = ['今天天气真好，适合出去走走。', '分享一本最近在读的书，很有意思。', '好久不见，大家都还好吗？', '新学的菜谱，第一次尝试，味道还不错。', '周末愉快！享受难得的闲暇时光。'];
    var result = [];
    var count = 2;
    for (var i = 0; i < count; i++) {
        var idx = Math.floor(Math.random() * mockTexts.length);
        result.push({
            id: 'm_' + Date.now() + '_' + i,
            userName: '小助手',
            userAvatar: '助',
            text: mockTexts[idx],
            images: [],
            time: getRelativeTime(Date.now() - Math.floor(Math.random() * 86400000 * 7)),
            location: '',
            likes: Math.floor(Math.random() * 20),
            comments: [],
            liked: false
        });
    }
    return result;
}

function getRelativeTime(timestamp) {
    var now = Date.now();
    var diff = now - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    var d = new Date(timestamp);
    return (d.getMonth() + 1) + '.' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function renderMomentsFeed() {
    var feed = document.getElementById('momentsFeed');
    if (!feed) return;
    var likedMap = {};
    try { likedMap = JSON.parse(localStorage.getItem('moments_liked') || '{}'); } catch(e) {}
    var likesCountMap = {};
    try { likesCountMap = JSON.parse(localStorage.getItem('moments_likes_count') || '{}'); } catch(e) {}
    momentsData.forEach(function(m) {
        if (likedMap[m.id]) m.liked = true;
        if (likesCountMap[m.id] !== undefined) m.likes = likesCountMap[m.id];
    });
    var html = '';
    momentsData.forEach(function(m) {
        var imgHTML = '';
        if (m.images && m.images.length > 0) imgHTML = renderMomentImages(m.images);
        html += `
            <div class="moment-card">
                <div class="moment-header">
                    <div class="moment-avatar">${m.userAvatar}</div>
                    <div class="moment-user-info">
                        <div class="moment-user-name">${m.userName}</div>
                        <div class="moment-time">${m.time}${m.location ? ' · ' + m.location : ''}</div>
                    </div>
                </div>
                <div class="moment-text" id="text-${m.id}" onclick="toggleMomentText('${m.id}')">${m.text}</div>
                ${imgHTML}
                <div class="moment-actions">
                    <span onclick="toggleLike('${m.id}')">${m.liked ? '♥' : '♡'} ${m.likes || 0}</span>
                    <span onclick="openInteractPanel('${m.id}')">...</span>
                </div>
            </div>
        `;
    });
    feed.innerHTML = html;
    momentsData.forEach(function(m) { checkTextOverflow('text-' + m.id, m.text); });
}

function checkTextOverflow(id, fullText) {
    setTimeout(function() {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.scrollHeight > el.clientHeight + 2) {
            el.classList.add('collapsed');
            el.setAttribute('data-full', fullText);
            el.setAttribute('data-collapsed', 'true');
        }
    }, 100);
}

function toggleMomentText(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.classList.contains('collapsed')) {
        el.classList.remove('collapsed');
        el.textContent = el.getAttribute('data-full');
    }
}

function renderMomentImages(images) {
    var count = images.length;
    var gridClass = 'moment-images grid-' + Math.min(count, 9);
    var html = '<div class="' + gridClass + '">';
    var max = Math.min(count, 9);
    for (var i = 0; i < max; i++) {
        html += '<div class="moment-image-item" onclick="event.stopPropagation(); openMomentImageViewer(\'' + images[i] + '\')" style="background-image:url(' + images[i] + ');background-size:cover;background-position:center;"></div>';
    }
    html += '</div>';
    return html;
}

function toggleLike(momentId) {
    var m = momentsData.find(function(item) { return item.id === momentId; });
    if (!m) return;
    m.liked = !m.liked;
    m.likes = m.liked ? (m.likes || 0) + 1 : Math.max(0, (m.likes || 0) - 1);
    var likedMap = {};
    try { likedMap = JSON.parse(localStorage.getItem('moments_liked') || '{}'); } catch(e) {}
    if (m.liked) likedMap[momentId] = true; else delete likedMap[momentId];
    localStorage.setItem('moments_liked', JSON.stringify(likedMap));
    var likesCountMap = {};
    try { likesCountMap = JSON.parse(localStorage.getItem('moments_likes_count') || '{}'); } catch(e) {}
    likesCountMap[momentId] = m.likes;
    localStorage.setItem('moments_likes_count', JSON.stringify(likesCountMap));
    saveMomentsData();
    renderMomentsFeed();
}

let interactTargetId = null;

function openInteractPanel(momentId) {
    interactTargetId = momentId;
    var panel = document.getElementById('momentsInteractPanel');
    var body = document.getElementById('interactPanelBody');
    if (!panel || !body) return;
    var m = momentsData.find(function(item) { return item.id === momentId; });
    if (!m) return;
    var html = '';
    html += '<div style="margin-bottom:12px;">';
    html += '<span onclick="toggleLike(\'' + momentId + '\'); closeInteractPanel();" style="cursor:pointer;margin-right:16px;">' + (m.liked ? '♥ 已赞' : '♡ 点赞') + '</span>';
    html += '<span style="color:#8e8e93;">' + (m.likes || 0) + '人赞过</span>';
    html += '</div>';
    html += '<div style="border-top:0.5px solid rgba(0,0,0,0.05);padding-top:8px;" id="commentList">';
    if (m.comments && m.comments.length > 0) {
        m.comments.forEach(function(c) { html += '<div style="margin-bottom:6px;font-size:13px;"><b>' + c.user + '：</b>' + c.text + '</div>'; });
    } else {
        html += '<div style="color:#8e8e93;font-size:12px;" id="noCommentHint">暂无评论</div>';
    }
    html += '</div>';
    html += '<div style="display:flex;gap:8px;margin-top:10px;">';
    html += '<input type="text" id="interactCommentInput" class="chat-input" placeholder="写评论..." style="flex:1;height:32px;font-size:13px;">';
    html += '<button class="black-btn" style="width:auto;padding:6px 14px;font-size:13px;margin:0;" onclick="submitComment(\'' + momentId + '\')">发送</button>';
    html += '</div>';
    body.innerHTML = html;
    panel.classList.add('show');
}

function closeInteractPanel() {
    var panel = document.getElementById('momentsInteractPanel');
    if (panel) panel.classList.remove('show');
    interactTargetId = null;
}

function submitComment(momentId) {
    var input = document.getElementById('interactCommentInput');
    if (!input || !input.value.trim()) return;
    var m = momentsData.find(function(item) { return item.id === momentId; });
    if (!m) return;
    if (!m.comments) m.comments = [];
    var commentText = input.value.trim();
    m.comments.push({ user: '我', text: commentText });
    input.value = '';
    saveMomentsData();
    var commentList = document.getElementById('commentList');
    if (commentList) {
        var cd = document.createElement('div');
        cd.style.cssText = 'margin-bottom:6px;font-size:13px;';
        cd.innerHTML = '<b>我：</b>' + commentText;
        commentList.appendChild(cd);
        var eh = document.getElementById('noCommentHint');
        if (eh) eh.remove();
    }
    renderMomentsFeed();
}

function openMomentImageViewer(src) {
    var viewer = document.getElementById('momentsImageViewer');
    var img = document.getElementById('momentsViewerImg');
    if (!viewer || !img) return;
    img.src = src;
    viewer.style.display = 'flex';
}

function closeMomentsImageViewer() {
    var viewer = document.getElementById('momentsImageViewer');
    if (viewer) viewer.style.display = 'none';
}

function openPublishModal() {
    var overlay = document.getElementById('momentsPublishOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function closePublishModal() {
    var overlay = document.getElementById('momentsPublishOverlay');
    if (overlay) overlay.style.display = 'none';
    document.getElementById('publishText').value = '';
    publishImages = [];
    publishLocation = '';
    document.getElementById('publishImagePreview').innerHTML = '';
}

function handlePublishImages(e) {
    var files = e.target.files;
    if (!files || files.length === 0) return;
    for (var i = 0; i < Math.min(files.length, 9); i++) {
        (function(file) {
            var reader = new FileReader();
            reader.onload = function(ev) { publishImages.push(ev.target.result); renderPublishImagePreview(); };
            reader.readAsDataURL(file);
        })(files[i]);
    }
}

function renderPublishImagePreview() {
    var container = document.getElementById('publishImagePreview');
    if (!container) return;
    var html = '';
    publishImages.forEach(function(src, idx) {
        html += '<div style="width:60px;height:60px;background-image:url(' + src + ');background-size:cover;background-position:center;border-radius:8px;position:relative;display:inline-block;margin:4px;">';
        html += '<span style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;background:#ff3b30;color:#fff;border-radius:50%;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="removePublishImage(' + idx + ')">x</span>';
        html += '</div>';
    });
    container.innerHTML = html;
}

function removePublishImage(idx) { publishImages.splice(idx, 1); renderPublishImagePreview(); }

function publishMoment() {
    var text = document.getElementById('publishText').value.trim();
    if (!text && publishImages.length === 0) { showToast('请输入内容或添加图片'); return; }
    var newMoment = {
        id: 'm_' + Date.now(),
        userName: '我',
        userAvatar: '我',
        text: text || '',
        images: publishImages.slice(),
        time: '刚刚',
        location: publishLocation,
        likes: 0,
        comments: [],
        liked: false
    };
    momentsData.unshift(newMoment);
    saveMomentsData();
    renderMomentsFeed();
    closePublishModal();
    showToast('发布成功');
    var area = document.getElementById('momentsScrollArea');
    if (area) area.scrollTo({ top: 0 });
}

function openLocationInput() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'locationInputOverlay';
    overlay.innerHTML = `
        <div class="caption-modal">
            <div style="font-size:16px;font-weight:600;margin-bottom:10px;color:#000;">添加位置</div>
            <input type="text" class="payment-note" id="locationInputField" placeholder="输入地点名称" value="${publishLocation}">
            <div class="caption-buttons" style="margin-top:12px;">
                <div class="payment-btn-cancel" onclick="closeLocationInput()">取消</div>
                <div class="payment-btn-confirm" onclick="confirmLocationInput()">确定</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeLocationInput(); };
}

function closeLocationInput() { var overlay = document.getElementById('locationInputOverlay'); if (overlay) overlay.remove(); }

function confirmLocationInput() {
    var input = document.getElementById('locationInputField');
    if (input) publishLocation = input.value.trim();
    closeLocationInput();
}

// ========== 我的页面 ==========
function renderMePage(listView) {
    if (!listView) return;
    var masks = getMasks();
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var activeMask = null;
    for (var i = 0; i < masks.length; i++) {
        if (masks[i].id === activeMaskId) { activeMask = masks[i]; break; }
    }
    if (!activeMask && masks.length > 0) { activeMask = masks[0]; }
    var avatarContent = activeMask && activeMask.avatar ? '<div class="me-avatar" style="background-image:url(' + activeMask.avatar + ');"></div>' : '<div class="me-avatar" id="meAvatarPlaceholder">+</div>';
    var displayName = activeMask ? activeMask.name : '用户';

    listView.innerHTML = `
        <div class="me-card" onclick="openMaskEditor()">
            ${avatarContent}
            <div class="me-info">
                <span class="me-name">${displayName}</span>
            </div>
            <span class="me-arrow">></span>
        </div>
        <div class="me-list">
            <div class="me-list-item" onclick="openWalletPage()">
                <span class="me-list-icon">$</span> 服务
                <span class="me-list-arrow">></span>
            </div>
            <div class="me-list-item" onclick="openFavoritesPage()">
                <span class="me-list-icon">★</span> 收藏
                <span class="me-list-arrow">></span>
            </div>
            <div class="me-list-item" onclick="openEmojiManagePage()">
                <span class="me-list-icon"><span class="icon-smile"></span></span> 表情包
                <span class="me-list-arrow">></span>
            </div>
            <div class="me-list-item" onclick="openSettingsPage()">
                <span class="me-list-icon">⚙</span> 设置
                <span class="me-list-arrow">></span>
            </div>
        </div>
    `;
}

// ========== 面具数据 ==========
function getMasks() { var raw = localStorage.getItem('user_masks'); return raw ? JSON.parse(raw) : []; }
function saveMasks(masks) { localStorage.setItem('user_masks', JSON.stringify(masks)); }

function openMaskEditor() {
    var masks = getMasks();
    var activeMaskId = localStorage.getItem('active_mask_id') || '';
    var maskListHTML = '';
    for (var i = 0; i < masks.length; i++) {
        var m = masks[i];
        var isActive = m.id === activeMaskId;
        var avatarHTML = m.avatar ? '<div class="mask-item-avatar" style="background-image:url(' + m.avatar + ');"></div>' : '<div class="mask-item-avatar">' + (m.name ? m.name.charAt(0) : '?') + '</div>';
        maskListHTML += '<div class="mask-item ' + (isActive ? 'active' : '') + '" onclick="selectMask(\'' + m.id + '\')">' + avatarHTML + '<div class="mask-item-name">' + (m.name || '未命名') + '</div></div>';
    }
    var overlay = document.createElement('div');
    overlay.className = 'mask-edit-overlay';
    overlay.id = 'maskEditOverlay';
    overlay.innerHTML = '<div class="mask-edit-panel" onclick="event.stopPropagation()"><div class="mask-edit-handle"></div><div class="mask-edit-title">个人资料</div><div class="mask-list" id="maskList">' + maskListHTML + '<div class="mask-add-btn" onclick="addNewMask()">+</div></div><div id="maskDetailEditor"></div><button class="black-btn" onclick="closeMaskEditor()">完成</button></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeMaskEditor(); };
    if (activeMaskId) showMaskDetail(activeMaskId);
    else if (masks.length > 0) showMaskDetail(masks[0].id);
}

function closeMaskEditor() { var overlay = document.getElementById('maskEditOverlay'); if (overlay) overlay.remove(); var listView = document.getElementById('chatListView'); if (listView) renderMePage(listView); }

function selectMask(id) {
    localStorage.setItem('active_mask_id', id);
    var overlay = document.getElementById('maskEditOverlay');
    if (overlay) {
        overlay.querySelectorAll('.mask-item').forEach(function(el) { el.classList.remove('active'); });
        var items = overlay.querySelectorAll('.mask-item');
        var masks = getMasks();
        for (var i = 0; i < items.length; i++) { if (masks[i] && masks[i].id === id) { items[i].classList.add('active'); break; } }
    }
    showMaskDetail(id);
    showToast('已切换面具');
}

function addNewMask() {
    var masks = getMasks();
    var newMask = { id: 'mask_' + Date.now(), name: '面具' + (masks.length + 1), avatar: '', persona: '' };
    masks.push(newMask);
    saveMasks(masks);
    localStorage.setItem('active_mask_id', newMask.id);
    closeMaskEditor();
    openMaskEditor();
}

function showMaskDetail(maskId) {
    var masks = getMasks();
    var mask = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === maskId) { mask = masks[i]; break; } }
    if (!mask) return;
    var editor = document.getElementById('maskDetailEditor');
    if (!editor) return;
    editor.innerHTML = '<div style="text-align:center;margin-bottom:16px;"><div id="maskDetailAvatar" style="width:70px;height:70px;border-radius:50%;background:#e5e5ea;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:28px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;' + (mask.avatar ? 'background-image:url(' + mask.avatar + ');' : '') + '" onclick="document.getElementById(\'maskAvatarInput\').click()">' + (mask.avatar ? '' : (mask.name ? mask.name.charAt(0) : '?')) + '</div><input type="file" id="maskAvatarInput" accept="image/*" style="display:none;" onchange="updateMaskAvatar(\'' + maskId + '\', event)"></div><label class="ios-label">面具名称</label><input type="text" class="ios-input" id="maskNameInput" value="' + mask.name + '" placeholder="面具名称"><label class="ios-label">人设描述</label><textarea class="ios-input" id="maskPersonaInput" style="height:100px;resize:none;" placeholder="描述你的身份、性格、与角色的关系等...">' + (mask.persona || '') + '</textarea><button class="ios-btn-black" onclick="saveMaskDetail(\'' + maskId + '\')">保存面具</button>' + (masks.length > 1 ? '<button class="ios-btn-white" style="border-color:#ff3b30;color:#ff3b30;" onclick="deleteMask(\'' + maskId + '\')">删除面具</button>' : '');
}

function updateMaskAvatar(maskId, e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        var masks = getMasks();
        for (var i = 0; i < masks.length; i++) { if (masks[i].id === maskId) { masks[i].avatar = ev.target.result; break; } }
        saveMasks(masks);
        var avatarEl = document.getElementById('maskDetailAvatar');
        if (avatarEl) { avatarEl.style.backgroundImage = 'url(' + ev.target.result + ')'; avatarEl.innerText = ''; }
    };
    reader.readAsDataURL(file);
}

function saveMaskDetail(maskId) {
    var name = document.getElementById('maskNameInput').value.trim();
    var persona = document.getElementById('maskPersonaInput').value.trim();
    if (!name) { showToast('请输入面具名称'); return; }
    var masks = getMasks();
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === maskId) { masks[i].name = name; masks[i].persona = persona; break; } }
    saveMasks(masks);
    showToast('面具已保存');
    closeMaskEditor();
    openMaskEditor();
}

function deleteMask(maskId) {
    var masks = getMasks();
    masks = masks.filter(function(m) { return m.id !== maskId; });
    saveMasks(masks);
    if (localStorage.getItem('active_mask_id') === maskId) localStorage.setItem('active_mask_id', masks.length > 0 ? masks[0].id : '');
    showToast('面具已删除');
    closeMaskEditor();
    openMaskEditor();
}

// ========== 钱包页面 ==========
function getWalletBalance() { var raw = localStorage.getItem('wallet_balance'); return raw ? parseFloat(raw) : 5200.00; }
function setWalletBalance(amount) { localStorage.setItem('wallet_balance', amount.toFixed(2)); }
function getWalletRecords() { var raw = localStorage.getItem('wallet_records'); return raw ? JSON.parse(raw) : []; }
function addWalletRecord(type, amount, note) { var records = getWalletRecords(); records.unshift({ type: type, amount: amount, note: note, time: Date.now() }); if (records.length > 100) records = records.slice(0, 100); localStorage.setItem('wallet_records', JSON.stringify(records)); }

function openWalletPage() {
    var listView = document.getElementById('chatListView');
    if (!listView) return;
    var titleEl = document.querySelector('.nav-title');
    var backBtn = document.querySelector('.nav-back');
    var plusBtn = document.querySelector('.nav-plus-btn');
    if (titleEl) titleEl.textContent = '服务';
    if (plusBtn) plusBtn.style.display = 'none';
    backBtn.onclick = function() {
    var tabItems = document.querySelectorAll('.tab-fixed-bottom .tab-item');
    if (tabItems.length >= 4) {
        switchChatTab('me', tabItems[3]);
    }
};
    var balance = getWalletBalance();
    var records = getWalletRecords();
    var recordsHTML = records.length === 0 ? '<div class="wallet-empty">暂无记录</div>' : records.map(function(r) { var cls = r.type === 'recharge' || r.type === 'receive' ? 'in' : 'out'; var prefix = r.type === 'recharge' || r.type === 'receive' ? '+' : '-'; return '<div class="wallet-record-item"><span>' + r.note + '</span><span class="record-amount ' + cls + '">' + prefix + r.amount.toFixed(2) + '</span></div>'; }).join('');
    listView.innerHTML = '<div class="wallet-card"><div class="wallet-title">钱包</div><div class="wallet-divider"></div><div class="wallet-balance" onclick="openRechargeModal()">' + balance.toFixed(2) + '</div><div class="wallet-balance-label">零钱 · 点击充值</div></div><div class="wallet-records"><div class="wallet-record-title">充值/消耗记录</div>' + recordsHTML + '</div>';
}

function openRechargeModal() {
    var overlay = document.createElement('div');
    overlay.className = 'recharge-overlay';
    overlay.id = 'rechargeOverlay';
    overlay.innerHTML = '<div class="recharge-modal" onclick="event.stopPropagation()"><div class="recharge-modal-title">充值</div><input type="number" class="recharge-input" id="rechargeAmountInput" placeholder="0.00" step="0.01" min="0.01"><div class="recharge-buttons"><div class="recharge-btn-cancel" onclick="closeRechargeModal()">取消</div><div class="recharge-btn-confirm" onclick="confirmRecharge()">确认充值</div></div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeRechargeModal(); };
}

function closeRechargeModal() { var overlay = document.getElementById('rechargeOverlay'); if (overlay) overlay.remove(); }

function confirmRecharge() {
    var input = document.getElementById('rechargeAmountInput');
    var amount = parseFloat(input.value);
    if (!amount || amount <= 0) { showToast('请输入有效金额'); return; }
    var balance = getWalletBalance();
    setWalletBalance(balance + amount);
    addWalletRecord('recharge', amount, '充值');
    closeRechargeModal();
    showToast('充值成功');
    openWalletPage();
}

// ========== 收藏页面 ==========
function getFavorites() { var raw = localStorage.getItem('user_favorites'); return raw ? JSON.parse(raw) : []; }
function saveFavorites(favorites) { localStorage.setItem('user_favorites', JSON.stringify(favorites)); }
function addFavorite(text, contactId, contactName) { var favs = getFavorites(); favs.unshift({ id: 'fav_' + Date.now(), text: text, contactId: contactId, contactName: contactName, time: Date.now() }); saveFavorites(favs); }

var favCurrentContact = 'all';

function openFavoritesPage() {
    var listView = document.getElementById('chatListView');
    if (!listView) return;
    var titleEl = document.querySelector('.nav-title');
    var backBtn = document.querySelector('.nav-back');
    var plusBtn = document.querySelector('.nav-plus-btn');
    if (titleEl) titleEl.textContent = '收藏';
    if (plusBtn) plusBtn.style.display = 'none';
    backBtn.onclick = function() {
    var tabItems = document.querySelectorAll('.tab-fixed-bottom .tab-item');
    if (tabItems.length >= 4) {
        switchChatTab('me', tabItems[3]);
    }
};
    var favs = getFavorites();
    var contactIds = {};
    favs.forEach(function(f) { contactIds[f.contactId] = f.contactName; });
    var catHTML = '<div class="fav-category active" onclick="filterFav(\'all\', this)">全部</div>';
    for (var id in contactIds) { catHTML += '<div class="fav-category" onclick="filterFav(\'' + id + '\', this)">' + contactIds[id] + '</div>'; }
    favCurrentContact = 'all';
    listView.innerHTML = '<div class="fav-categories" id="favCategories">' + catHTML + '</div><div class="fav-list" id="favList"></div>';
    renderFavList();
}

function filterFav(contactId, el) {
    favCurrentContact = contactId;
    var cats = document.getElementById('favCategories');
    if (cats) cats.querySelectorAll('.fav-category').forEach(function(c) { c.classList.remove('active'); });
    if (el) el.classList.add('active');
    renderFavList();
}

function renderFavList() {
    var list = document.getElementById('favList');
    if (!list) return;
    var favs = getFavorites();
    if (favCurrentContact !== 'all') favs = favs.filter(function(f) { return f.contactId === favCurrentContact; });
    if (favs.length === 0) { list.innerHTML = '<div class="wallet-empty">暂无收藏</div>'; return; }
    list.innerHTML = favs.map(function(f) { return '<div class="fav-item"><div class="fav-item-text"><b>' + f.contactName + '：</b>' + f.text + '</div><div class="fav-item-del" onclick="event.stopPropagation(); deleteFav(\'' + f.id + '\')">×</div></div>'; }).join('');
}

function deleteFav(id) { var favs = getFavorites(); favs = favs.filter(function(f) { return f.id !== id; }); saveFavorites(favs); renderFavList(); showToast('已删除'); }

// ========== 表情包管理页面 ==========
function openEmojiManagePage() {
    var listView = document.getElementById('chatListView');
    if (!listView) return;
    var titleEl = document.querySelector('.nav-title');
    var backBtn = document.querySelector('.nav-back');
    var plusBtn = document.querySelector('.nav-plus-btn');
    if (titleEl) titleEl.textContent = '表情包';
    if (plusBtn) plusBtn.style.display = 'none';
    backBtn.onclick = function() {
        var tabItems = document.querySelectorAll('.tab-fixed-bottom .tab-item');
        if (tabItems.length >= 4) { switchChatTab('me', tabItems[3]); }
    };
    renderEmojiManage(listView);
}

function renderEmojiManage(listView) {
    var emojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    var banned = JSON.parse(localStorage.getItem('banned_emojis') || '[]');
    var gridHTML = '';

    gridHTML += '<div class="emoji-manage-add" onclick="importEmojiBatch()"></div>';

    for (var i = 0; i < emojis.length; i++) {
        var isBanned = banned.indexOf(i) >= 0;
        gridHTML += '<div class="emoji-manage-item ' + (isBanned ? 'banned' : '') + '" id="emojiManageItem' + i + '" style="background-image:url(' + emojis[i].src + ');" data-index="' + i + '"></div>';
    }

    var noteHTML = '';
    for (var j = 0; j < emojis.length; j++) {
        noteHTML += '<div class="emoji-manage-note">' + (j + 1) + '. ' + (emojis[j].note || '无备注') + ' <span style="color:#007aff;cursor:pointer;" onclick="editEmojiNote(' + j + ')">编辑</span></div>';
    }

    listView.innerHTML = ''
        + '<div class="emoji-manage-grid">' + gridHTML + '</div>'
        + '<div style="padding:4px 16px;font-size:12px;color:#8e8e93;">双击表情包可禁止/解禁角色使用。长按可删除。红色边框=已禁止。</div>'
        + noteHTML
        + '<button class="ios-btn-black" style="margin:16px;width:calc(100% - 32px);" onclick="importEmojiBatch()">一键导入表情包</button>';

    bindEmojiManageEvents();
}

function bindEmojiManageEvents() {
    var items = document.querySelectorAll('.emoji-manage-item');
    items.forEach(function(item) {
        var index = parseInt(item.getAttribute('data-index'));

        var clickCount = 0;
        var clickTimer = null;
        item.addEventListener('click', function() {
            clickCount++;
            if (clickCount === 1) {
                clickTimer = setTimeout(function() {
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                clickCount = 0;
                toggleBanEmoji(index);
            }
        });

        var longPressTimer = null;
        item.addEventListener('touchstart', function(e) {
            longPressTimer = setTimeout(function() {
                showEmojiManageDeleteBtn(index, item);
            }, 600);
        });
        item.addEventListener('touchend', function() { clearTimeout(longPressTimer); });
        item.addEventListener('touchmove', function() { clearTimeout(longPressTimer); });
    });
}

function showEmojiManageDeleteBtn(index, el) {
    var existing = document.getElementById('emojiManageDeleteBtn');
    if (existing) existing.remove();

    var rect = el.getBoundingClientRect();
    var btn = document.createElement('div');
    btn.id = 'emojiManageDeleteBtn';
    btn.style.cssText = 'position:fixed;z-index:9999;width:22px;height:22px;background:#ff3b30;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    btn.innerHTML = 'x';
    btn.onclick = function(e) {
        e.stopPropagation();
        deleteEmojiManageItem(index);
    };
    btn.style.top = (rect.top - 8) + 'px';
    btn.style.left = (rect.right - 14) + 'px';
    document.body.appendChild(btn);

    setTimeout(function() {
        document.addEventListener('click', function removeBtn() {
            var b = document.getElementById('emojiManageDeleteBtn');
            if (b) b.remove();
            document.removeEventListener('click', removeBtn);
        }, { once: true });
    }, 10);
}

function deleteEmojiManageItem(index) {
    var btn = document.getElementById('emojiManageDeleteBtn');
    if (btn) btn.remove();
    var emojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    if (index >= 0 && index < emojis.length) {
        emojis.splice(index, 1);
        localStorage.setItem('custom_emojis', JSON.stringify(emojis));
        var banned = JSON.parse(localStorage.getItem('banned_emojis') || '[]');
        banned = banned.filter(function(b) { return b !== index; }).map(function(b) { return b > index ? b - 1 : b; });
        localStorage.setItem('banned_emojis', JSON.stringify(banned));
        var lv = document.getElementById('chatListView');
        if (lv) renderEmojiManage(lv);
        showToast('表情包已删除');
    }
}

function importEmojiBatch() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = function(e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;
        var emojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
        var count = Math.min(files.length, 50 - emojis.length);
        var loaded = 0;
        for (var i = 0; i < count; i++) {
            (function(file) {
                var reader = new FileReader();
                reader.onload = function(ev) {
                    window._emojiNoteBatchImage = ev.target.result;
                    showEmojiNoteModalForBatch(function(note) {
                        emojis.push({ src: window._emojiNoteBatchImage, note: note || '' });
                        localStorage.setItem('custom_emojis', JSON.stringify(emojis));
                        loaded++;
                        if (loaded === count) {
                            var lv = document.getElementById('chatListView');
                            if (lv) renderEmojiManage(lv);
                            showToast('已导入 ' + loaded + ' 张表情包');
                        }
                    });
                };
                reader.readAsDataURL(file);
            })(files[i]);
        }
    };
    input.click();
}

function showEmojiNoteModalForBatch(callback) {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'emojiNoteBatchOverlay';
    overlay.innerHTML = ''
        + '<div class="caption-modal">'
        + '<div style="font-size:14px;color:#8e8e93;margin-bottom:8px;">为这个表情包添加备注</div>'
        + '<textarea class="caption-textarea" id="emojiNoteBatchTextarea" placeholder="输入备注，让AI知道它的含义"></textarea>'
        + '<div class="caption-buttons">'
        + '<div class="payment-btn-cancel" onclick="closeEmojiNoteBatch()">取消</div>'
        + '<div class="payment-btn-confirm" onclick="confirmEmojiNoteBatch()">确定</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeEmojiNoteBatch(); };
    window._emojiNoteBatchCallback = callback;
}

function closeEmojiNoteBatch() {
    var overlay = document.getElementById('emojiNoteBatchOverlay');
    if (overlay) overlay.remove();
    if (window._emojiNoteBatchCallback) { window._emojiNoteBatchCallback(''); }
    window._emojiNoteBatchCallback = null;
}

function confirmEmojiNoteBatch() {
    var note = document.getElementById('emojiNoteBatchTextarea').value.trim();
    var overlay = document.getElementById('emojiNoteBatchOverlay');
    if (overlay) overlay.remove();
    if (window._emojiNoteBatchCallback) { window._emojiNoteBatchCallback(note); }
    window._emojiNoteBatchCallback = null;
}

function toggleBanEmoji(index) {
    var banned = JSON.parse(localStorage.getItem('banned_emojis') || '[]');
    var pos = banned.indexOf(index);
    if (pos >= 0) { banned.splice(pos, 1); } else { banned.push(index); }
    localStorage.setItem('banned_emojis', JSON.stringify(banned));
    var lv = document.getElementById('chatListView');
    if (lv) renderEmojiManage(lv);
}

function editEmojiNote(index) {
    var emojis = JSON.parse(localStorage.getItem('custom_emojis') || '[]');
    var note = prompt('输入表情包含义（角色可读取）：', emojis[index].note || '');
    if (note !== null) {
        emojis[index].note = note;
        localStorage.setItem('custom_emojis', JSON.stringify(emojis));
        var lv = document.getElementById('chatListView');
        if (lv) renderEmojiManage(lv);
    }
}

// ========== 设置页面 ==========
function openSettingsPage() {
    var listView = document.getElementById('chatListView');
    if (!listView) return;
    var titleEl = document.querySelector('.nav-title');
    var backBtn = document.querySelector('.nav-back');
    var plusBtn = document.querySelector('.nav-plus-btn');
    if (titleEl) titleEl.textContent = '设置';
    if (plusBtn) plusBtn.style.display = 'none';
    if (backBtn) backBtn.onclick = function() {
    var tabItems = document.querySelectorAll('.tab-fixed-bottom .tab-item');
    if (tabItems.length >= 4) {
        switchChatTab('me', tabItems[3]);
    }
};
    var globalBg = localStorage.getItem('global_chat_bg') || '';
    listView.innerHTML = '<div class="settings-list"><div class="settings-list-item" onclick="openMaskEditor()">个人资料 <span class="settings-arrow">></span></div></div><div class="settings-section-title" style="margin-left:16px;">全局背景图</div><div class="settings-hint">提示：此处更换4个聊天页面的壁纸。</div><div class="glass-card" style="margin:0 16px 10px;"><div class="global-bg-preview" id="globalBgPreview" style="background-image:url(' + globalBg + ');" onclick="document.getElementById(\'globalBgInput\').click()">' + (globalBg ? '' : '点击更换全局背景图') + '</div><input type="file" id="globalBgInput" accept="image/*" style="display:none;" onchange="handleGlobalBg(event)"><button class="black-btn" onclick="clearGlobalBg()">清除全局背景图</button></div><div class="settings-list"><div class="settings-list-item"><span>拍拍</span><input type="checkbox" class="ios-switch-sm" id="swPat" ' + (localStorage.getItem('pat_enabled') === 'true' ? 'checked' : '') + ' onchange="togglePat(this.checked)"></div></div><div class="settings-hint">提示：拍一拍开启后，角色与你互动时将出现。</div><div class="glass-card" style="margin:0 16px 10px;"><div class="pat-input-row"><span>角色</span><input type="text" class="pat-input" id="patAction" value="' + (localStorage.getItem('pat_action') || '拍了拍') + '" maxlength="4"><span>了</span><input type="text" class="pat-input" id="patTarget" value="' + (localStorage.getItem('pat_target') || '我') + '" maxlength="4"><span>我的</span><input type="text" class="pat-input" id="patBody" value="' + (localStorage.getItem('pat_body') || '肩膀') + '" maxlength="4"></div><div class="pat-preview" id="patPreview"></div><button class="black-btn" onclick="savePat()">保存</button></div>';
    updatePatPreview();
    document.getElementById('patAction').addEventListener('input', updatePatPreview);
    document.getElementById('patTarget').addEventListener('input', updatePatPreview);
    document.getElementById('patBody').addEventListener('input', updatePatPreview);
}

function handleGlobalBg(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) { var bg = ev.target.result; localStorage.setItem('global_chat_bg', bg); document.getElementById('globalBgPreview').style.backgroundImage = 'url(' + bg + ')'; document.getElementById('globalBgPreview').innerText = ''; var shell = document.querySelector('.chat-shell'); if (shell) { shell.style.backgroundImage = 'url(' + bg + ')'; shell.style.backgroundSize = 'cover'; shell.style.backgroundPosition = 'center'; } showToast('全局背景图已保存'); };
    reader.readAsDataURL(file);
}

function clearGlobalBg() { localStorage.removeItem('global_chat_bg'); document.getElementById('globalBgPreview').style.backgroundImage = ''; document.getElementById('globalBgPreview').innerText = '点击更换全局背景图'; showToast('已清除'); }

function togglePat(checked) { localStorage.setItem('pat_enabled', checked); }

function updatePatPreview() {
    var action = document.getElementById('patAction').value || '拍拍';
    var target = document.getElementById('patTarget').value || '我';
    var body = document.getElementById('patBody').value || '肩膀';
    var preview = document.getElementById('patPreview');
    if (preview) preview.textContent = action + '了' + target + '我的' + body;
}

function savePat() {
    var action = document.getElementById('patAction').value || '拍了拍';
    var target = document.getElementById('patTarget').value || '我';
    var body = document.getElementById('patBody').value || '肩膀';
    localStorage.setItem('pat_action', action);
    localStorage.setItem('pat_target', target);
    localStorage.setItem('pat_body', body);
    showToast('拍一拍已保存');
}

// ========== 聊天详情半屏面板（独立联系人配置） ==========
function openChatSettings() {
    const oldMask = document.getElementById('chatSettingsMask');
    if (oldMask) oldMask.remove();

    const contactId = window.ChatState.currentContactId || 'c1';
    loadContactSettings(contactId);
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

                <div class="settings-section-title">记忆条数</div>
                <div class="glass-card">
                    <div class="slider-row"><span class="hint">上下文记忆条数</span><span class="val" id="memoryCountVal">${settings.memoryCount || 50}条</span></div>
                    <input type="range" min="10" max="200" value="${settings.memoryCount || 50}" class="ios-slider" oninput="updateMemoryCount(this.value)">
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
                    <div class="switch-row"><span>开启旁白</span><input type="checkbox" class="ios-switch-sm" id="swNarration" ${settings.onlineNarration !== false ? 'checked' : ''} onchange="toggleNarration(this.checked)"></div>
                </div>

                <div class="settings-section-title">人称选择</div>
                <div class="glass-card">
                    <div class="switch-row"><span>第一人称"我"</span><input type="checkbox" class="ios-switch-sm" id="swPronounMe" ${settings.pronoun === 'me' ? 'checked' : ''} onchange="setPronoun('me', this)"></div>
                    <div class="switch-row"><span>第二人称"你"</span><input type="checkbox" class="ios-switch-sm" id="swPronounYou" ${settings.pronoun !== 'me' && settings.pronoun !== 'ta' ? 'checked' : ''} onchange="setPronoun('you', this)"></div>
                    <div class="switch-row"><span>第三人称"ta"</span><input type="checkbox" class="ios-switch-sm" id="swPronounTa" ${settings.pronoun === 'ta' ? 'checked' : ''} onchange="setPronoun('ta', this)"></div>
                </div>

                <div class="settings-section-title">自动发消息</div>
                <div class="glass-card">
                    <div class="switch-row"><span>自动发消息</span><input type="checkbox" class="ios-switch-sm" id="swAutoMsg" ${settings.autoMsg === true ? 'checked' : ''} onchange="toggleAutoMsg(this.checked)"></div>
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
                    <div class="switch-row"><span>自动翻译</span><input type="checkbox" class="ios-switch-sm" id="swAutoTranslate" ${settings.autoTranslate === true ? 'checked' : ''} onchange="toggleAutoTranslate(this.checked)"></div>
                    <div style="font-size:12px;color:#8e8e93;margin-top:6px;">提示：非简体中文的内容都将自动翻译成简体中文。</div>
                </div>

                <div class="settings-section-title">角色表情包</div>
<div class="glass-card">
    <div class="switch-row"><span>允许角色发表情包</span><input type="checkbox" class="ios-switch-sm" id="swEmojiAllow" ${settings.emojiAllow !== false ? 'checked' : ''} onchange="toggleEmojiAllow(this.checked)"></div>
    <div style="font-size:12px;color:#8e8e93;margin-top:6px;">提示：关闭后角色不会发送任何表情包。开启后角色根据人设自行决定。</div>
</div>

                <div class="settings-section-title">自动发动态</div>
                <div class="glass-card">
                    <div class="switch-row"><span>自动发动态</span><input type="checkbox" class="ios-switch-sm" id="swAutoMoment" ${settings.autoMoment === true ? 'checked' : ''} onchange="toggleAutoMoment(this.checked)"></div>
                    <div class="slider-row" style="margin-top:8px;"><span class="hint">提示：角色会自动发布动态。</span></div>
                    <div class="slider-row" style="margin-top:6px;"><span class="hint">动态频率</span><span class="val" id="autoMomentFreqVal">${getAutoMomentLabel(settings.autoMomentFreq || 0)}</span></div>
                    <div class="tick-slider-wrapper">
                        <div class="tick-labels"><span>12h</span><span>24h</span><span>36h</span><span>48h</span></div>
                        <div class="tick-dots" id="momentTickDots"></div>
                        <input type="range" min="0" max="3" value="${settings.autoMomentFreq || 0}" class="ios-slider" step="1" oninput="updateAutoMomentFreq(this.value)">
                    </div>
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
    updateMomentTickDots(settings.autoMomentFreq || 0);
}

function closeChatSettings() {
    const mask = document.getElementById('chatSettingsMask');
    if (mask) mask.remove();
}

function updateMemoryCount(val) {
    document.getElementById('memoryCountVal').textContent = val + '条';
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'memoryCount', val);
}

function updateSummaryCount(val) {
    document.getElementById('summaryVal').textContent = val + '轮';
    window.ChatConfig.settings.summaryCount = parseInt(val);
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'summaryCount', val);
}

function updateReplyMin(val) {
    document.getElementById('replyMinVal').textContent = val;
    window.ChatConfig.settings.replyMin = parseInt(val);
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'replyMin', val);
}

function updateReplyMax(val) {
    document.getElementById('replyMaxVal').textContent = val;
    window.ChatConfig.settings.replyMax = parseInt(val);
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'replyMax', val);
}

function toggleNarration(checked) {
    window.ChatConfig.settings.onlineNarration = checked;
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'narration', checked);
}

function setPronoun(type, el) {
    window.ChatConfig.settings.pronoun = type;
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'pronoun', type);
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
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'autoMsg', checked);
}

function getAutoMsgLabel(val) {
    const labels = ['1小时', '5小时', '10小时', '24小时'];
    return labels[val] || '1小时';
}

function updateAutoMsgFreq(val) {
    document.getElementById('autoMsgFreqVal').textContent = getAutoMsgLabel(parseInt(val));
    window.ChatConfig.settings.autoMsgFreq = parseInt(val);
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'autoMsgFreq', val);
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
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'translate', checked);
}

function toggleAutoMoment(checked) {
    window.ChatConfig.settings.autoMoment = checked;
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'autoMoment', checked);
}

function getAutoMomentLabel(val) {
    const labels = ['12小时', '24小时', '36小时', '48小时'];
    return labels[val] || '12小时';
}

function updateAutoMomentFreq(val) {
    document.getElementById('autoMomentFreqVal').textContent = getAutoMomentLabel(parseInt(val));
    window.ChatConfig.settings.autoMomentFreq = parseInt(val);
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'autoMomentFreq', val);
    updateMomentTickDots(parseInt(val));
}

function updateMomentTickDots(val) {
    const dots = document.getElementById('momentTickDots');
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const dot = document.createElement('div');
        dot.className = 'tick-dot' + (i === val ? ' active' : '');
        dots.appendChild(dot);
    }
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
        setTimeout(() => { found.style.boxShadow = ''; }, 2000);
        showToast('已定位到聊天记录');
    } else {
        showToast('未找到相关消息');
    }
}

function manualSummary() {
    var contactId = window.ChatState.currentContactId || 'c1';
    var contact = getContactById(contactId);
    if (!contact) return;

    closeChatSettings();
    
    var loadingToast = document.createElement('div');
    loadingToast.className = 'global-toast';
    loadingToast.textContent = '正在生成总结…';
    document.body.appendChild(loadingToast);

    generateSummary(contactId).then(function(summary) {
        if (loadingToast) loadingToast.remove();
        if (!summary) {
            showToast('总结生成失败，请重试');
            return;
        }
        var now = new Date();
        var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
        saveShiyilinSummary(contactId, dateStr, summary);
        showToast('已存入拾忆林');
    }).catch(function(e) {
        if (loadingToast) loadingToast.remove();
        showToast('总结生成失败：' + (e.message || '未知错误'));
    });
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

function toggleEmojiAllow(checked) {
    window.ChatConfig.settings.emojiAllow = checked;
    var contactId = window.ChatState.currentContactId || 'c1';
    setContactSetting(contactId, 'emojiAllow', checked);
}
