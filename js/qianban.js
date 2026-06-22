/**
 * 牵绊 - 关系图谱
 * 用户与角色/NPC的关系可视化
 * 支持面具切换（独立关系网）、NPC管理、连线显示、自定义关系类型
 * 支持双向独立关系、角色↔角色、角色↔NPC关系
 * 仅显示有关系网的节点
 */

// ========== 预设感情标签 ==========
var RELATION_TAGS = [
    '爱慕', '暗恋', '依赖', '信任', '尊敬', '感激', '欣赏',
    '心动', '好感', '无感', '疏远', '厌烦', '敌视', '仇恨',
    '愧疚', '仰慕', '暧昧', '纠结', '拉扯', '躲闪',
    '冷战', '错过', '单恋', '双向奔赴', '热恋',
    '知己', '家人', '守护', '嫌弃', '埋怨', '想念', '吃醋'
];

// ========== 按面具存储数据 ==========
function getQianbanData() {
    var raw = localStorage.getItem('qianban_data');
    var allData = raw ? JSON.parse(raw) : {};
    var maskId = getActiveMaskId();
    if (!allData[maskId]) allData[maskId] = { relations: [], npcs: [] };
    return allData[maskId];
}

function saveQianbanData(data) {
    var raw = localStorage.getItem('qianban_data');
    var allData = raw ? JSON.parse(raw) : {};
    var maskId = getActiveMaskId();
    allData[maskId] = data;
    localStorage.setItem('qianban_data', JSON.stringify(allData));
}

// ========== 当前激活的面具ID ==========
function getActiveMaskId() {
    return localStorage.getItem('active_mask_id') || '';
}

// ========== 获取节点名称 ==========
function getNodeName(nodeId) {
    if (nodeId === 'user') {
        var userInfo = getActiveUserInfo();
        return userInfo.name || '我';
    }
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var contact = contacts.find(function(c) { return c.id === nodeId; });
    if (contact) return contact.name;
    var data = getQianbanData();
    var npcs = data.npcs || [];
    var npc = npcs.find(function(n) { return n.id === nodeId; });
    if (npc) return npc.name;
    return '未知';
}

// ========== 获取节点头像 ==========
function getNodeAvatar(nodeId) {
    if (nodeId === 'user') {
        var userInfo = getActiveUserInfo();
        return userInfo.avatar || '';
    }
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var contact = contacts.find(function(c) { return c.id === nodeId; });
    if (contact) return contact.avatarData || '';
    var data = getQianbanData();
    var npcs = data.npcs || [];
    var npc = npcs.find(function(n) { return n.id === nodeId; });
    if (npc) return npc.avatar || '';
    return '';
}

// ========== 图谱节点布局计算 ==========
function calcNodePositions(nodeCount) {
    var positions = [];
    var cx = 50, cy = 42, rx = 38, ry = 30;
    if (nodeCount === 0) return [];
    for (var i = 0; i < nodeCount; i++) {
        var angle = (2 * Math.PI / Math.max(nodeCount, 1)) * i - Math.PI / 2;
        var x = cx + rx * Math.cos(angle);
        var y = cy + ry * Math.sin(angle);
        positions.push({ x: x, y: y });
    }
    return positions;
}

// ========== 获取用户当前显示名称和头像 ==========
function getActiveUserInfo() {
    var masks = getMasks ? getMasks() : [];
    var activeId = getActiveMaskId();
    var mask = null;
    for (var i = 0; i < masks.length; i++) {
        if (masks[i].id === activeId) { mask = masks[i]; break; }
    }
    if (!mask && masks.length > 0) mask = masks[0];
    return {
        name: mask ? mask.name : '用户',
        avatar: mask ? mask.avatar || '' : ''
    };
}

// ========== 打开牵绊 ==========
function openQianban() {
    var appWindow = document.getElementById('qianbanAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'qianbanAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    renderQianban();
    appWindow.style.display = 'flex';
}

function closeQianban() {
    var appWindow = document.getElementById('qianbanAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染牵绊主界面 ==========
function renderQianban() {
    var appWindow = document.getElementById('qianbanAppWindow');
    if (!appWindow) return;

    var data = getQianbanData();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = data.npcs || [];
    var relations = data.relations || [];
    var userInfo = getActiveUserInfo();

    // 收集所有参与关系的节点ID
    var relatedIds = {};
    relatedIds['user'] = true;
    relations.forEach(function(r) {
        relatedIds[r.from] = true;
        relatedIds[r.to] = true;
    });

    // 所有节点（仅显示有关系网的）
    var allNodes = [];
    allNodes.push({ id: 'user', name: userInfo.name, type: 'user', avatar: userInfo.avatar });

    contacts.forEach(function(c) {
        if (relatedIds[c.id]) {
            allNodes.push({ id: c.id, name: c.name, type: 'role', avatar: c.avatarData || '', avatarText: c.avatar });
        }
    });

    npcs.forEach(function(n) {
        if (relatedIds[n.id]) {
            allNodes.push({ id: n.id, name: n.name, type: 'npc', avatar: n.avatar || '', avatarText: n.name ? n.name.charAt(0) : '?' });
        }
    });

    // 创建节点map
    var nodeMap = {};
    allNodes.forEach(function(n) { nodeMap[n.id] = n; });

    // 绘制连线SVG（双向箭头+双标签）
    var svgElements = '';
    relations.forEach(function(r) {
        var fromNode = nodeMap[r.from];
        var toNode = nodeMap[r.to];
        if (!fromNode || !toNode) return;

        var graphNodes = allNodes.filter(function(n) { return n.type !== 'user'; });
        var positions = calcNodePositions(graphNodes.length);

        var fromX, fromY, toX, toY;

        if (r.from === 'user') {
            fromX = 50; fromY = 38;
            var toPos = positions[graphNodes.indexOf(toNode)];
            toX = toPos.x; toY = toPos.y;
        } else if (r.to === 'user') {
            toX = 50; toY = 38;
            var fromPos = positions[graphNodes.indexOf(fromNode)];
            fromX = fromPos.x; fromY = fromPos.y;
        } else {
            var fPos = positions[graphNodes.indexOf(fromNode)];
            var tPos = positions[graphNodes.indexOf(toNode)];
            fromX = fPos.x; fromY = fPos.y;
            toX = tPos.x; toY = tPos.y;
        }

        var midX = (fromX + toX) / 2;
        var midY = (fromY + toY) / 2;

        // 连线
        svgElements += '<line x1="' + fromX + '%" y1="' + fromY + '%" x2="' + toX + '%" y2="' + toY + '%" stroke="#c7c7cc" stroke-width="1" stroke-dasharray="4 3"/>';

        // fromToType标签（靠起点侧）
        if (r.fromToType) {
            var ftX = fromX + (midX - fromX) * 0.35;
            var ftY = fromY + (midY - fromY) * 0.35;
            svgElements += '<text x="' + ftX + '%" y="' + ftY + '%" text-anchor="middle" font-size="7" fill="#8e8e93">' + r.fromToType + '</text>';
            svgElements += '<text x="' + ftX + '%" y="' + (ftY - 3) + '%" text-anchor="middle" font-size="5" fill="#c7c7cc">→</text>';
        }

        // toFromType标签（靠终点侧）
        if (r.toFromType) {
            var tfX = toX + (midX - toX) * 0.35;
            var tfY = toY + (midY - toY) * 0.35;
            svgElements += '<text x="' + tfX + '%" y="' + tfY + '%" text-anchor="middle" font-size="7" fill="#8e8e93">' + r.toFromType + '</text>';
            svgElements += '<text x="' + tfX + '%" y="' + (tfY - 3) + '%" text-anchor="middle" font-size="5" fill="#c7c7cc">→</text>';
        }
    });

    // 节点HTML
    var graphNodes = allNodes.filter(function(n) { return n.type !== 'user'; });
    var positions = calcNodePositions(graphNodes.length);

    var nodesHTML = '';
    // 用户节点
    var userAvatarHTML = userInfo.avatar
        ? '<div class="qb-node-avatar user" style="background-image:url(' + userInfo.avatar + ');background-size:cover;background-position:center;">&nbsp;</div>'
        : '<div class="qb-node-avatar user">' + (userInfo.name ? userInfo.name.charAt(0) : '我') + '</div>';
    nodesHTML += '<div class="qb-node" style="left:50%;top:38%;transform:translate(-50%,-50%);" onclick="openQianbanDetail(\'user\')">' + userAvatarHTML + '<div class="qb-node-name">' + userInfo.name + '</div></div>';

    // 其他节点
    graphNodes.forEach(function(node, i) {
        var pos = positions[i];
        var avatarHTML = '';
        if (node.avatar) {
            avatarHTML = '<div class="qb-node-avatar" style="background-image:url(' + node.avatar + ');background-size:cover;background-position:center;">&nbsp;</div>';
        } else {
            avatarHTML = '<div class="qb-node-avatar">' + (node.name ? node.name.charAt(0) : '?') + '</div>';
        }
        nodesHTML += '<div class="qb-node" style="left:' + pos.x + '%;top:' + pos.y + '%;transform:translate(-50%,-50%);" onclick="openQianbanDetail(\'' + node.id + '\')">' + avatarHTML + '<div class="qb-node-name">' + node.name + '</div></div>';
    });

    appWindow.innerHTML = `
        <div class="qianban-app">
            <div class="qb-top-bar">
                <div class="qb-back-btn" onclick="closeQianban()">‹</div>
                <div class="qb-title">牵 绊</div>
                <div class="qb-settings-btn" onclick="openQianbanSettings()">○</div>
            </div>
            <div class="qb-graph-area" id="qbGraphArea" style="position:relative;">
                <svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">
                    ${svgElements}
                </svg>
                ${nodesHTML}
            </div>
            <div class="qb-legend">
                <div class="qb-legend-item"><span class="qb-legend-dot user"></span> 用户</div>
                <div class="qb-legend-item"><span class="qb-legend-dot role"></span> 角色</div>
                <div class="qb-legend-item"><span class="qb-legend-dot npc"></span> NPC</div>
            </div>
            <div class="qb-bottom-bar">
                <button class="qb-btn qb-btn-white" onclick="openAddRelation()">+ 添加关系</button>
                <button class="qb-btn qb-btn-black" onclick="openAddNPC()">+ 添加NPC</button>
            </div>
        </div>
    `;
 }

// ========== 设置面板 ==========
function openQianbanSettings() {
    var masks = getMasks ? getMasks() : [];
    var activeId = getActiveMaskId();
    var data = getQianbanData();
    var npcs = data.npcs || [];

    var maskHTML = '<div class="qb-mask-grid">';
    masks.forEach(function(m) {
        var isActive = m.id === activeId;
        var avatarHTML = m.avatar
            ? '<div style="width:36px;height:36px;border-radius:50%;background-image:url(' + m.avatar + ');background-size:cover;background-position:center;flex-shrink:0;"></div>'
            : '<div style="width:36px;height:36px;border-radius:50%;background:#e5e5ea;display:flex;align-items:center;justify-content:center;font-size:16px;color:#8e8e93;flex-shrink:0;">' + (m.name ? m.name.charAt(0) : '?') + '</div>';
        maskHTML += '<div class="qb-mask-item' + (isActive ? ' active' : '') + '" onclick="selectQianbanMask(\'' + m.id + '\')">' + avatarHTML + '<span style="font-size:13px;">' + m.name + '</span></div>';
    });
    maskHTML += '</div>';

    var npcHTML = '';
    if (npcs.length === 0) {
        npcHTML = '<div style="text-align:center;color:#8e8e93;padding:16px;">暂无NPC</div>';
    } else {
        npcs.forEach(function(n) {
            npcHTML += '<div class="qb-edit-row" style="justify-content:space-between;"><span>' + n.name + '</span><span style="color:#ff3b30;font-size:13px;cursor:pointer;" onclick="deleteNPC(\'' + n.id + '\')">删除</span></div>';
        });
    }

    var overlay = document.createElement('div');
    overlay.className = 'qb-edit-overlay';
    overlay.id = 'qbSettingsOverlay';
    overlay.innerHTML = `
        <div class="qb-edit-panel" onclick="event.stopPropagation()">
            <div class="qb-edit-handle"></div>
            <div class="qb-edit-title">牵绊设置</div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;">切换面具关系网</div>
            ${maskHTML}
            <div style="font-size:13px;color:#8e8e93;margin:16px 0 8px;">管理NPC</div>
            ${npcHTML}
            <div class="qb-edit-buttons">
                <div class="qb-edit-btn-cancel" onclick="closeQianbanSettings()">关闭</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeQianbanSettings(); };
}

function selectQianbanMask(id) {
    localStorage.setItem('active_mask_id', id);
    closeQianbanSettings();
    showToast('面具已切换');
    renderQianban();
}

function closeQianbanSettings() {
    var overlay = document.getElementById('qbSettingsOverlay');
    if (overlay) overlay.remove();
}

function deleteNPC(id) {
    var data = getQianbanData();
    data.npcs = data.npcs.filter(function(n) { return n.id !== id; });
    data.relations = data.relations.filter(function(r) { return r.from !== id && r.to !== id; });
    saveQianbanData(data);
    closeQianbanSettings();
    showToast('NPC已删除');
    renderQianban();
}

// ========== 添加关系面板（双向感情标签） ==========
function openAddRelation() {
    var data = getQianbanData();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = data.npcs || [];
    var userInfo = getActiveUserInfo();

    var fromOptions = '<div class="qb-add-option selected" onclick="selectRelationFrom(\'user\', this)">' + userInfo.name + '</div>';

    var toOptions = '';
    toOptions += '<div class="qb-add-section"><div class="qb-add-section-title">角色</div><div class="qb-add-options" id="qbToRoleOptions">';
    contacts.forEach(function(c) {
        toOptions += '<div class="qb-add-option" onclick="selectRelationTo(\'' + c.id + '\', this)">' + c.name + '</div>';
    });
    toOptions += '</div></div>';
    toOptions += '<div class="qb-add-section-divider"></div>';
    toOptions += '<div class="qb-add-section"><div class="qb-add-section-title">NPC</div><div class="qb-add-options" id="qbToNpcOptions">';
    npcs.forEach(function(n) {
        toOptions += '<div class="qb-add-option" onclick="selectRelationTo(\'' + n.id + '\', this)">' + n.name + '</div>';
    });
    toOptions += '</div></div>';

    var typeOptions = '';
    RELATION_TAGS.forEach(function(t) {
        typeOptions += '<div class="qb-add-option" onclick="selectRelationTag(\'' + t + '\', \'fromTo\', this)">' + t + '</div>';
    });
    typeOptions += '<div class="qb-add-option" onclick="showCustomTagInput(\'fromTo\', this)">自定义</div>';

    var typeOptions2 = '';
    RELATION_TAGS.forEach(function(t) {
        typeOptions2 += '<div class="qb-add-option" onclick="selectRelationTag(\'' + t + '\', \'toFrom\', this)">' + t + '</div>';
    });
    typeOptions2 += '<div class="qb-add-option" onclick="showCustomTagInput(\'toFrom\', this)">自定义</div>';

    var overlay = document.createElement('div');
    overlay.className = 'qb-edit-overlay';
    overlay.id = 'qbAddRelationOverlay';
    overlay.innerHTML = `
        <div class="qb-edit-panel" onclick="event.stopPropagation()">
            <div class="qb-edit-handle"></div>
            <div class="qb-edit-title">添加关系</div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;">我的面具</div>
            <div class="qb-add-options" id="qbFromOptions">${fromOptions}</div>
            <div style="font-size:13px;color:#8e8e93;margin:12px 0 8px;">选择关系对象</div>
            ${toOptions}
            <div style="font-size:13px;color:#8e8e93;margin:12px 0 8px;">我对ta的感情</div>
            <div class="qb-add-options" id="qbFromToTypeOptions">${typeOptions}</div>
            <div id="qbCustomFromToInput" style="display:none;margin:8px 0;">
                <input type="text" class="ios-input" id="qbCustomFromToField" placeholder="输入自定义感情类型">
            </div>
            <div style="font-size:13px;color:#8e8e93;margin:12px 0 8px;">ta对我的感情</div>
            <div class="qb-add-options" id="qbToFromTypeOptions">${typeOptions2}</div>
            <div id="qbCustomToFromInput" style="display:none;margin:8px 0;">
                <input type="text" class="ios-input" id="qbCustomToFromField" placeholder="输入自定义感情类型">
            </div>
            <div class="qb-edit-buttons">
                <div class="qb-edit-btn-cancel" onclick="closeAddRelation()">取消</div>
                <div class="qb-edit-btn-confirm" onclick="confirmAddRelation()">确认</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeAddRelation(); };

    qbSelectedFrom = { id: 'user' };
    qbSelectedTo = null;
    qbSelectedFromToType = null;
    qbSelectedToFromType = null;
}

var qbSelectedFrom = { id: 'user' };
var qbSelectedTo = null;
var qbSelectedFromToType = null;
var qbSelectedToFromType = null;

function selectRelationFrom(id, el) {
    qbSelectedFrom = { id: id };
    var opts = document.querySelectorAll('#qbFromOptions .qb-add-option');
    opts.forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
    refreshToOptions(id);
}

function refreshToOptions(excludeId) {
    var data = getQianbanData();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = data.npcs || [];

    var roleContainer = document.getElementById('qbToRoleOptions');
    var npcContainer = document.getElementById('qbToNpcOptions');

    if (roleContainer) {
        var roleHTML = '';
        contacts.forEach(function(c) {
            if (c.id === excludeId) return;
            roleHTML += '<div class="qb-add-option" onclick="selectRelationTo(\'' + c.id + '\', this)">' + c.name + '</div>';
        });
        roleContainer.innerHTML = roleHTML || '<div style="color:#8e8e93;font-size:12px;padding:4px;">暂无角色</div>';
    }
    if (npcContainer) {
        var npcHTML = '';
        npcs.forEach(function(n) {
            if (n.id === excludeId) return;
            npcHTML += '<div class="qb-add-option" onclick="selectRelationTo(\'' + n.id + '\', this)">' + n.name + '</div>';
        });
        npcContainer.innerHTML = npcHTML || '<div style="color:#8e8e93;font-size:12px;padding:4px;">暂无NPC</div>';
    }
    qbSelectedTo = null;
}

function selectRelationTo(id, el) {
    qbSelectedTo = { id: id };
    var opts = document.querySelectorAll('#qbToRoleOptions .qb-add-option, #qbToNpcOptions .qb-add-option');
    opts.forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
}

function selectRelationTag(type, target, el) {
    if (target === 'fromTo') {
        qbSelectedFromToType = type;
        var opts = document.querySelectorAll('#qbFromToTypeOptions .qb-add-option');
        opts.forEach(function(o) { o.classList.remove('selected'); });
        document.getElementById('qbCustomFromToInput').style.display = 'none';
    } else {
        qbSelectedToFromType = type;
        var opts2 = document.querySelectorAll('#qbToFromTypeOptions .qb-add-option');
        opts2.forEach(function(o) { o.classList.remove('selected'); });
        document.getElementById('qbCustomToFromInput').style.display = 'none';
    }
    el.classList.add('selected');
}

function showCustomTagInput(target, el) {
    if (target === 'fromTo') {
        qbSelectedFromToType = '__custom__';
        var opts = document.querySelectorAll('#qbFromToTypeOptions .qb-add-option');
        opts.forEach(function(o) { o.classList.remove('selected'); });
        document.getElementById('qbCustomFromToInput').style.display = 'block';
    } else {
        qbSelectedToFromType = '__custom__';
        var opts2 = document.querySelectorAll('#qbToFromTypeOptions .qb-add-option');
        opts2.forEach(function(o) { o.classList.remove('selected'); });
        document.getElementById('qbCustomToFromInput').style.display = 'block';
    }
    el.classList.add('selected');
}

function closeAddRelation() {
    qbSelectedFrom = { id: 'user' };
    qbSelectedTo = null;
    qbSelectedFromToType = null;
    qbSelectedToFromType = null;
    var overlay = document.getElementById('qbAddRelationOverlay');
    if (overlay) overlay.remove();
}

function confirmAddRelation() {
    if (!qbSelectedFrom || !qbSelectedTo) {
        showToast('请选择关系双方');
        return;
    }
    if (qbSelectedFrom.id === qbSelectedTo.id) {
        showToast('双方不能相同');
        return;
    }
    var fromToType = qbSelectedFromToType;
    if (fromToType === '__custom__') {
        fromToType = document.getElementById('qbCustomFromToField').value.trim();
        if (!fromToType) { showToast('请输入自定义感情类型'); return; }
    }
    var toFromType = qbSelectedToFromType;
    if (toFromType === '__custom__') {
        toFromType = document.getElementById('qbCustomToFromField').value.trim();
        if (!toFromType) { showToast('请输入自定义感情类型'); return; }
    }
    var data = getQianbanData();
    if (!data.relations) data.relations = [];
    data.relations.push({
        id: 'rel_' + Date.now(),
        from: qbSelectedFrom.id,
        to: qbSelectedTo.id,
        fromToType: fromToType || '',
        toFromType: toFromType || '',
        createdAt: Date.now()
    });
    saveQianbanData(data);
    closeAddRelation();
    showToast('关系已添加');
    renderQianban();
}

// ========== 添加NPC ==========
function openAddNPC() {
    var overlay = document.createElement('div');
    overlay.className = 'qb-edit-overlay';
    overlay.id = 'qbAddNPCOverlay';
    overlay.innerHTML = `
        <div class="qb-edit-panel" onclick="event.stopPropagation()">
            <div class="qb-edit-handle"></div>
            <div class="qb-edit-title">添加NPC</div>
            <div style="text-align:center;margin-bottom:12px;">
                <div id="qbNpcAvatarPreview" style="width:64px;height:64px;border-radius:50%;background:#e5e5ea;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;" onclick="document.getElementById('qbNpcAvatarInput').click()">+</div>
                <input type="file" id="qbNpcAvatarInput" accept="image/*" style="display:none;" onchange="previewQbNpcAvatar(event)">
            </div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:4px;">NPC名称</div>
            <input type="text" class="ios-input" id="qbNpcName" placeholder="输入NPC名称">
            <div style="font-size:13px;color:#8e8e93;margin:12px 0 4px;">性别</div>
            <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
                <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                    <input type="radio" name="qbNpcGender" value="女" checked style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateQbNpcGenderRadio()"> 女
                </label>
                <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                    <input type="radio" name="qbNpcGender" value="男" style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateQbNpcGenderRadio()"> 男
                </label>
            </div>
            <div class="qb-edit-buttons">
                <div class="qb-edit-btn-cancel" onclick="closeAddNPC()">取消</div>
                <div class="qb-edit-btn-confirm" onclick="confirmAddNPC()">确认</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeAddNPC(); };
    updateQbNpcGenderRadio();
}

var qbNpcAvatarData = '';

function previewQbNpcAvatar(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        qbNpcAvatarData = ev.target.result;
        var preview = document.getElementById('qbNpcAvatarPreview');
        if (preview) { preview.style.backgroundImage = 'url(' + ev.target.result + ')'; preview.innerText = ''; }
    };
    reader.readAsDataURL(file);
}

function updateQbNpcGenderRadio() {
    var radios = document.querySelectorAll('input[name="qbNpcGender"]');
    radios.forEach(function(r) {
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

function closeAddNPC() {
    qbNpcAvatarData = '';
    var overlay = document.getElementById('qbAddNPCOverlay');
    if (overlay) overlay.remove();
}

function confirmAddNPC() {
    var name = document.getElementById('qbNpcName').value.trim();
    if (!name) { showToast('请输入NPC名称'); return; }
    var genderEl = document.querySelector('input[name="qbNpcGender"]:checked');
    var gender = genderEl ? genderEl.value : '女';
    var data = getQianbanData();
    if (!data.npcs) data.npcs = [];
    data.npcs.push({
        id: 'npc_' + Date.now(),
        name: name,
        gender: gender,
        avatar: qbNpcAvatarData || ''
    });
    saveQianbanData(data);
    closeAddNPC();
    showToast('NPC已添加');
    renderQianban();
}

// ========== 编辑NPC ==========
function openEditNPC(npcId) {
    var data = getQianbanData();
    var npc = data.npcs.find(function(n) { return n.id === npcId; });
    if (!npc) return;
    qbNpcAvatarData = npc.avatar || '';

    var overlay = document.createElement('div');
    overlay.className = 'qb-edit-overlay';
    overlay.id = 'qbEditNPCOverlay';
    overlay.innerHTML = `
        <div class="qb-edit-panel" onclick="event.stopPropagation()">
            <div class="qb-edit-handle"></div>
            <div class="qb-edit-title">编辑NPC</div>
            <div style="text-align:center;margin-bottom:12px;">
                <div id="qbEditNpcAvatarPreview" style="width:64px;height:64px;border-radius:50%;background:#e5e5ea;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;${npc.avatar ? 'background-image:url(' + npc.avatar + ');' : ''}" onclick="document.getElementById('qbEditNpcAvatarInput').click()">${npc.avatar ? '' : (npc.name ? npc.name.charAt(0) : '?')}</div>
                <input type="file" id="qbEditNpcAvatarInput" accept="image/*" style="display:none;" onchange="previewQbEditNpcAvatar(event)">
            </div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:4px;">NPC名称</div>
            <input type="text" class="ios-input" id="qbEditNpcName" value="${npc.name}" placeholder="输入NPC名称">
            <div style="font-size:13px;color:#8e8e93;margin:12px 0 4px;">性别</div>
            <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
                <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                    <input type="radio" name="qbEditNpcGender" value="女" ${npc.gender === '女' ? 'checked' : ''} style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateQbEditNpcGenderRadio()"> 女
                </label>
                <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;">
                    <input type="radio" name="qbEditNpcGender" value="男" ${npc.gender === '男' ? 'checked' : ''} style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateQbEditNpcGenderRadio()"> 男
                </label>
            </div>
            <div class="qb-edit-buttons">
                <div class="qb-edit-btn-cancel" onclick="closeEditNPC()">取消</div>
                <div class="qb-edit-btn-confirm" onclick="confirmEditNPC('${npcId}')">保存</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeEditNPC(); };
    updateQbEditNpcGenderRadio();
}

function previewQbEditNpcAvatar(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        qbNpcAvatarData = ev.target.result;
        var preview = document.getElementById('qbEditNpcAvatarPreview');
        if (preview) { preview.style.backgroundImage = 'url(' + ev.target.result + ')'; preview.innerText = ''; }
    };
    reader.readAsDataURL(file);
}

function updateQbEditNpcGenderRadio() {
    var radios = document.querySelectorAll('input[name="qbEditNpcGender"]');
    radios.forEach(function(r) {
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

function closeEditNPC() {
    qbNpcAvatarData = '';
    var overlay = document.getElementById('qbEditNPCOverlay');
    if (overlay) overlay.remove();
}

function confirmEditNPC(npcId) {
    var name = document.getElementById('qbEditNpcName').value.trim();
    if (!name) { showToast('请输入NPC名称'); return; }
    var genderEl = document.querySelector('input[name="qbEditNpcGender"]:checked');
    var gender = genderEl ? genderEl.value : '女';
    var data = getQianbanData();
    var npc = data.npcs.find(function(n) { return n.id === npcId; });
    if (npc) {
        npc.name = name;
        npc.gender = gender;
        npc.avatar = qbNpcAvatarData || '';
    }
    saveQianbanData(data);
    closeEditNPC();
    showToast('NPC已更新');
    renderQianban();
}

// ========== 关系详情 ==========
function openQianbanDetail(nodeId) {
    var data = getQianbanData();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = data.npcs || [];
    var relations = data.relations || [];

    var node;
    if (nodeId === 'user') {
        var userInfo = getActiveUserInfo();
        node = { id: 'user', name: userInfo.name, type: 'user', avatar: userInfo.avatar };
    } else {
        node = contacts.find(function(c) { return c.id === nodeId; });
        if (!node) {
            node = npcs.find(function(n) { return n.id === nodeId; });
            if (node) { node.type = 'npc'; node.avatar = node.avatar || ''; }
        } else {
            node.type = 'role';
            node.avatar = node.avatarData || '';
        }
    }
    if (!node) return;

    var relatedRelations = relations.filter(function(r) {
        return r.from === nodeId || r.to === nodeId;
    });

    var relatedHTML = '';
    if (relatedRelations.length === 0) {
        relatedHTML = '<div style="text-align:center;color:#8e8e93;padding:20px;">暂无关系记录</div>';
    } else {
        relatedRelations.forEach(function(r) {
            var otherId = r.from === nodeId ? r.to : r.from;
            var otherName = getNodeName(otherId);
            var direction = r.from === nodeId ? '→' : '←';
            var tag = r.from === nodeId ? (r.fromToType || '') : (r.toFromType || '');
            relatedHTML += '<div class="qb-detail-stat"><span>' + direction + ' ' + otherName + '</span><span class="stat-value">' + tag + '</span></div>';
        });
    }

    var nodeName = nodeId === 'user' ? getActiveUserInfo().name : getNodeName(nodeId);
    var nodeAvatar = nodeId === 'user' ? getActiveUserInfo().avatar : getNodeAvatar(nodeId);

    var overlay = document.createElement('div');
    overlay.className = 'qb-detail-overlay';
    overlay.id = 'qbDetailOverlay';
    overlay.innerHTML = `
        <div class="qb-detail-panel" onclick="event.stopPropagation()">
            <div class="qb-detail-handle"></div>
            <div class="qb-detail-head">
                <div class="qb-detail-avatar user">${(getActiveUserInfo().name || '我').charAt(0)}</div>
                <div class="qb-detail-connector">——</div>
                <div class="qb-detail-avatar" style="${nodeAvatar ? 'background-image:url(' + nodeAvatar + ');background-size:cover;background-position:center;' : ''}">${nodeAvatar ? '' : (nodeName ? nodeName.charAt(0) : '?')}</div>
            </div>
            <div class="qb-detail-relation">${nodeName}</div>
            <div class="qb-detail-meta">${node.type === 'npc' ? 'NPC' : node.type === 'user' ? '用户' : '角色'}</div>
            <div class="qb-detail-section-title">关系列表</div>
            ${relatedHTML}
            <div class="qb-detail-actions">
                ${node.type === 'npc' ? '<div class="qb-detail-btn qb-detail-btn-black" onclick="closeQianbanDetail();openEditNPC(\'' + nodeId + '\')">编辑NPC</div>' : ''}
                <div class="qb-detail-btn qb-detail-btn-white" onclick="closeQianbanDetail()">关闭</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeQianbanDetail(); };
}

function closeQianbanDetail() {
    var overlay = document.getElementById('qbDetailOverlay');
    if (overlay) overlay.remove();
}
