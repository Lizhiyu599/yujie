/**
 * 牵绊 - 关系图谱
 * 支持面具切换、NPC管理、双向感情标签、角色↔角色/NPC关系
 * 点击节点切换中心、箭头在线两侧
 */

// ========== 预设感情标签 ==========
var RELATION_TAGS = [
    '爱慕', '暗恋', '依赖', '信任', '尊敬', '感激', '欣赏',
    '心动', '好感', '无感', '疏远', '厌烦', '敌视', '仇恨',
    '愧疚', '仰慕', '暧昧', '拉扯', '躲闪',
    '冷战', '单恋', '双向奔赴', '热恋',
    '知己', '家人', '守护', '嫌弃', '埋怨', '想念',
    '情敌', '上司', '下属'
];

// ========== 当前中心节点 ==========
var qbCurrentCenter = 'user';

// ========== 数据存储 ==========
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

function getActiveMaskId() {
    return localStorage.getItem('active_mask_id') || '';
}

function getNodeName(nodeId) {
    if (nodeId === 'user') {
        var u = getActiveUserInfo();
        return u.name || '我';
    }
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var c = contacts.find(function(x) { return x.id === nodeId; });
    if (c) return c.name;
    var npcs = getQianbanData().npcs || [];
    var n = npcs.find(function(x) { return x.id === nodeId; });
    if (n) return n.name;
    return '未知';
}

function getNodeAvatar(nodeId) {
    if (nodeId === 'user') return getActiveUserInfo().avatar || '';
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var c = contacts.find(function(x) { return x.id === nodeId; });
    if (c) return c.avatarData || '';
    var npcs = getQianbanData().npcs || [];
    var n = npcs.find(function(x) { return x.id === nodeId; });
    if (n) return n.avatar || '';
    return '';
}

function getNodeType(nodeId) {
    if (nodeId === 'user') return 'user';
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    if (contacts.find(function(x) { return x.id === nodeId; })) return 'role';
    return 'npc';
}

function getActiveUserInfo() {
    var masks = getMasks ? getMasks() : [];
    var activeId = getActiveMaskId();
    var m = null;
    for (var i = 0; i < masks.length; i++) { if (masks[i].id === activeId) { m = masks[i]; break; } }
    if (!m && masks.length > 0) m = masks[0];
    return { name: m ? m.name : '用户', avatar: m ? m.avatar || '' : '' };
}

// ========== 布局 ==========
function calcNodePositions(nodeCount, centerX, centerY, rx, ry) {
    var positions = [];
    if (nodeCount === 0) return [];
    for (var i = 0; i < nodeCount; i++) {
        var angle = (2 * Math.PI / nodeCount) * i - Math.PI / 2;
        positions.push({
            x: centerX + rx * Math.cos(angle),
            y: centerY + ry * Math.sin(angle)
        });
    }
    return positions;
}

// ========== 打开/关闭 ==========
function openQianban() {
    var appWindow = document.getElementById('qianbanAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'qianbanAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    qbCurrentCenter = 'user';
    renderQianban();
    appWindow.style.display = 'flex';
}

function closeQianban() {
    document.getElementById('qianbanAppWindow').style.display = 'none';
}

// ========== 渲染主界面 ==========
function renderQianban() {
    var appWindow = document.getElementById('qianbanAppWindow');
    if (!appWindow) return;

    var data = getQianbanData();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = data.npcs || [];
    var relations = data.relations || [];

    // 收集有关系网的节点
    var relatedIds = {};
    relations.forEach(function(r) { relatedIds[r.from] = true; relatedIds[r.to] = true; });
    relatedIds[qbCurrentCenter] = true;

    var allNodes = [];
    var centerNode = null;
    var others = [];

    // 中心节点
    var centerName = getNodeName(qbCurrentCenter);
    var centerAvatar = getNodeAvatar(qbCurrentCenter);
    var centerType = getNodeType(qbCurrentCenter);
    centerNode = { id: qbCurrentCenter, name: centerName, type: centerType, avatar: centerAvatar };
    allNodes.push(centerNode);

    // 其他节点
    contacts.forEach(function(c) {
        if (c.id !== qbCurrentCenter && relatedIds[c.id]) {
            others.push({ id: c.id, name: c.name, type: 'role', avatar: c.avatarData || '', avatarText: c.avatar });
        }
    });
    npcs.forEach(function(n) {
        if (n.id !== qbCurrentCenter && relatedIds[n.id]) {
            others.push({ id: n.id, name: n.name, type: 'npc', avatar: n.avatar || '', avatarText: n.name.charAt(0) });
        }
    });

    allNodes = allNodes.concat(others);
    var nodeMap = {};
    allNodes.forEach(function(n) { nodeMap[n.id] = n; });

    // 布局
    var cx = 50, cy = 42, rx = 36, ry = 28;
    var positions = calcNodePositions(others.length, cx, cy, rx, ry);

    // SVG连线（双向箭头在线两侧）
    var svgElements = '';
    relations.forEach(function(r) {
        var fn = nodeMap[r.from], tn = nodeMap[r.to];
        if (!fn || !tn) return;

        var fIdx = others.indexOf(fn), tIdx = others.indexOf(tn);
        var fx, fy, tx, ty;

        if (r.from === qbCurrentCenter) {
            fx = cx; fy = cy;
            var tp = positions[tIdx]; tx = tp.x; ty = tp.y;
        } else if (r.to === qbCurrentCenter) {
            tx = cx; ty = cy;
            var fp = positions[fIdx]; fx = fp.x; fy = fp.y;
        } else {
            var fp = positions[fIdx], tp = positions[tIdx];
            fx = fp.x; fy = fp.y; tx = tp.x; ty = tp.y;
        }

        svgElements += '<line x1="' + fx + '%" y1="' + fy + '%" x2="' + tx + '%" y2="' + ty + '%" stroke="#c7c7cc" stroke-width="1" stroke-dasharray="4 3"/>';

        // 起点侧标签+箭头（指向终点）
        if (r.fromToType) {
            var lx1 = fx + (tx - fx) * 0.22;
            var ly1 = fy + (ty - fy) * 0.22 - 3;
            svgElements += '<text x="' + lx1 + '%" y="' + ly1 + '%" text-anchor="middle" font-size="7" fill="#8e8e93">' + r.fromToType + '</text>';
            svgElements += '<text x="' + (lx1 + 1.5) + '%" y="' + (ly1 + 5) + '%" text-anchor="middle" font-size="6" fill="#c7c7cc">▼</text>';
        }

        // 终点侧标签+箭头（指向起点）
        if (r.toFromType) {
            var lx2 = tx + (fx - tx) * 0.22;
            var ly2 = ty + (fy - ty) * 0.22 - 3;
            svgElements += '<text x="' + lx2 + '%" y="' + ly2 + '%" text-anchor="middle" font-size="7" fill="#8e8e93">' + r.toFromType + '</text>';
            svgElements += '<text x="' + (lx2 + 1.5) + '%" y="' + (ly2 + 5) + '%" text-anchor="middle" font-size="6" fill="#c7c7cc">▼</text>';
        }
    });

    // 节点HTML
    var nodesHTML = '';
    // 中心节点
    var centerAvatarHTML = centerAvatar
        ? '<div class="qb-node-avatar ' + centerType + '" style="background-image:url(' + centerAvatar + ');background-size:cover;background-position:center;' + (centerType === 'user' ? 'width:64px;height:64px;border:3px solid #fff;' : '') + '">&nbsp;</div>'
        : '<div class="qb-node-avatar ' + centerType + '" style="' + (centerType === 'user' ? 'width:64px;height:64px;' : '') + '">' + (centerName ? centerName.charAt(0) : '?') + '</div>';
    nodesHTML += '<div class="qb-node" style="left:' + cx + '%;top:' + cy + '%;transform:translate(-50%,-50%);" onclick="switchQianbanCenter(\'' + qbCurrentCenter + '\')">' + centerAvatarHTML + '<div class="qb-node-name">' + centerName + '</div></div>';

    // 其他节点
    others.forEach(function(node, i) {
        var pos = positions[i];
        var avt = node.avatar
            ? '<div class="qb-node-avatar" style="background-image:url(' + node.avatar + ');background-size:cover;background-position:center;">&nbsp;</div>'
            : '<div class="qb-node-avatar">' + (node.name ? node.name.charAt(0) : '?') + '</div>';
        nodesHTML += '<div class="qb-node" style="left:' + pos.x + '%;top:' + pos.y + '%;transform:translate(-50%,-50%);" onclick="switchQianbanCenter(\'' + node.id + '\')">' + avt + '<div class="qb-node-name">' + node.name + '</div></div>';
    });

    appWindow.innerHTML = `
        <div class="qianban-app">
            <div class="qb-top-bar"><div class="qb-back-btn" onclick="closeQianban()">‹</div><div class="qb-title">牵 绊</div><div class="qb-settings-btn" onclick="openQianbanSettings()">○</div></div>
            <div class="qb-graph-area" style="position:relative;">
                <svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">${svgElements}</svg>
                ${nodesHTML}
            </div>
            <div class="qb-legend">
                <div class="qb-legend-item"><span class="qb-legend-dot user"></span>用户</div>
                <div class="qb-legend-item"><span class="qb-legend-dot role"></span>角色</div>
                <div class="qb-legend-item"><span class="qb-legend-dot npc"></span>NPC</div>
            </div>
            <div class="qb-bottom-bar">
                <button class="qb-btn qb-btn-white" onclick="openAddRelation()">+ 添加关系</button>
                <button class="qb-btn qb-btn-black" onclick="openAddNPC()">+ 添加NPC</button>
            </div>
        </div>`;
}

function switchQianbanCenter(nodeId) {
    qbCurrentCenter = nodeId;
    renderQianban();
}

// ========== 设置面板 ==========
function openQianbanSettings() {
    var masks = getMasks ? getMasks() : [];
    var activeId = getActiveMaskId();
    var data = getQianbanData();
    var npcs = data.npcs || [];
    var relations = data.relations || [];

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

    var relHTML = '';
    if (relations.length === 0) {
        relHTML = '<div style="text-align:center;color:#8e8e93;padding:12px;">暂无关系</div>';
    } else {
        relations.forEach(function(r) {
            var fromName = getNodeName(r.from);
            var toName = getNodeName(r.to);
            var label = fromName + ' ↔ ' + toName;
            relHTML += '<div class="qb-edit-row" style="justify-content:space-between;"><span style="font-size:13px;">' + label + '</span><span style="color:#ff3b30;font-size:13px;cursor:pointer;" onclick="deleteRelation(\'' + r.id + '\')">删除</span></div>';
        });
    }

    var overlay = document.createElement('div');
    overlay.className = 'qb-edit-overlay';
    overlay.id = 'qbSettingsOverlay';
    overlay.innerHTML = `
        <div class="qb-edit-panel" onclick="event.stopPropagation()">
            <div class="qb-edit-handle"></div><div class="qb-edit-title">牵绊设置</div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;">切换面具关系网</div>${maskHTML}
            <div style="font-size:13px;color:#8e8e93;margin:16px 0 8px;">管理关系</div>${relHTML}
            <div style="font-size:13px;color:#8e8e93;margin:16px 0 8px;">管理NPC</div>${npcHTML}
            <div class="qb-edit-buttons"><div class="qb-edit-btn-cancel" onclick="closeQianbanSettings()">关闭</div></div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeQianbanSettings(); };
}

function deleteRelation(relId) {
    var data = getQianbanData();
    data.relations = data.relations.filter(function(r) { return r.id !== relId; });
    saveQianbanData(data);
    closeQianbanSettings();
    showToast('关系已删除');
    renderQianban();
}

function selectQianbanMask(id) { localStorage.setItem('active_mask_id', id); closeQianbanSettings(); showToast('面具已切换'); renderQianban(); }
function closeQianbanSettings() { var o = document.getElementById('qbSettingsOverlay'); if (o) o.remove(); }
function deleteNPC(id) {
    var data = getQianbanData();
    data.npcs = data.npcs.filter(function(n) { return n.id !== id; });
    data.relations = data.relations.filter(function(r) { return r.from !== id && r.to !== id; });
    saveQianbanData(data); closeQianbanSettings(); showToast('NPC已删除'); renderQianban();
}

// ========== 添加关系面板 ==========
function openAddRelation() {
    var data = getQianbanData();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = data.npcs || [];
    var userInfo = getActiveUserInfo();

    // 起点：用户面具单独一行 + 角色分区 + NPC分区
    var fromHTML = '';
    fromHTML += '<div class="qb-add-section"><div class="qb-add-section-title">我的面具</div><div class="qb-add-options" id="qbFromUserOptions">';
    fromHTML += '<div class="qb-add-option selected" onclick="selectRelationFrom(\'user\', this)">' + userInfo.name + '</div>';
    fromHTML += '</div></div>';

    fromHTML += '<div class="qb-add-section-divider"></div>';
    fromHTML += '<div class="qb-add-section"><div class="qb-add-section-title">角色</div><div class="qb-add-options" id="qbFromRoleOptions">';
    contacts.forEach(function(c) { fromHTML += '<div class="qb-add-option" onclick="selectRelationFrom(\'' + c.id + '\', this)">' + c.name + '</div>'; });
    fromHTML += '</div></div>';

    fromHTML += '<div class="qb-add-section-divider"></div>';
    fromHTML += '<div class="qb-add-section"><div class="qb-add-section-title">NPC</div><div class="qb-add-options" id="qbFromNpcOptions">';
    npcs.forEach(function(n) { fromHTML += '<div class="qb-add-option" onclick="selectRelationFrom(\'' + n.id + '\', this)">' + n.name + '</div>'; });
    fromHTML += '</div></div>';

    // 终点：角色 + NPC
    var toHTML = '';
    toHTML += '<div class="qb-add-section"><div class="qb-add-section-title">角色</div><div class="qb-add-options" id="qbToRoleOptions">';
    contacts.forEach(function(c) { toHTML += '<div class="qb-add-option" onclick="selectRelationTo(\'' + c.id + '\', this)">' + c.name + '</div>'; });
    toHTML += '</div></div>';
    toHTML += '<div class="qb-add-section-divider"></div>';
    toHTML += '<div class="qb-add-section"><div class="qb-add-section-title">NPC</div><div class="qb-add-options" id="qbToNpcOptions">';
    npcs.forEach(function(n) { toHTML += '<div class="qb-add-option" onclick="selectRelationTo(\'' + n.id + '\', this)">' + n.name + '</div>'; });
    toHTML += '</div></div>';

    var overlay = document.createElement('div');
    overlay.className = 'qb-edit-overlay';
    overlay.id = 'qbAddRelationOverlay';
    overlay.innerHTML = `
        <div class="qb-edit-panel" onclick="event.stopPropagation()">
            <div class="qb-edit-handle"></div><div class="qb-edit-title">添加关系</div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;">关系起点（点击取消选中）</div>${fromHTML}
            <div style="font-size:13px;color:#8e8e93;margin:12px 0 8px;">关系终点</div>${toHTML}
            <div id="qbTagSection"></div>
            <div class="qb-edit-buttons"><div class="qb-edit-btn-cancel" onclick="closeAddRelation()">取消</div><div class="qb-edit-btn-confirm" onclick="confirmAddRelation()">确认</div></div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeAddRelation(); };

    qbSelectedFrom = { id: 'user' }; qbSelectedTo = null; qbSelectedFromToType = null; qbSelectedToFromType = null;
    renderTagSection();
}

var qbSelectedFrom = { id: 'user' }, qbSelectedTo = null, qbSelectedFromToType = null, qbSelectedToFromType = null;

function selectRelationFrom(id, el) {
    if (qbSelectedFrom && qbSelectedFrom.id === id) { qbSelectedFrom = null; el.classList.remove('selected'); }
    else {
        qbSelectedFrom = { id: id };
        document.querySelectorAll('#qbFromUserOptions .qb-add-option, #qbFromRoleOptions .qb-add-option, #qbFromNpcOptions .qb-add-option').forEach(function(o) { o.classList.remove('selected'); });
        el.classList.add('selected');
    }
    refreshToOptions(qbSelectedFrom ? qbSelectedFrom.id : null);
    renderTagSection();
}

function refreshToOptions(excludeId) {
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = getQianbanData().npcs || [];
    var rc = document.getElementById('qbToRoleOptions'), nc = document.getElementById('qbToNpcOptions');
    if (rc) { var rh = ''; contacts.forEach(function(c) { if (c.id !== excludeId) rh += '<div class="qb-add-option" onclick="selectRelationTo(\'' + c.id + '\', this)">' + c.name + '</div>'; }); rc.innerHTML = rh || '<div style="color:#8e8e93;font-size:12px;padding:4px;">暂无</div>'; }
    if (nc) { var nh = ''; npcs.forEach(function(n) { if (n.id !== excludeId) nh += '<div class="qb-add-option" onclick="selectRelationTo(\'' + n.id + '\', this)">' + n.name + '</div>'; }); nc.innerHTML = nh || '<div style="color:#8e8e93;font-size:12px;padding:4px;">暂无</div>'; }
    qbSelectedTo = null;
}

function selectRelationTo(id, el) {
    qbSelectedTo = { id: id };
    document.querySelectorAll('#qbToRoleOptions .qb-add-option, #qbToNpcOptions .qb-add-option').forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
}

function renderTagSection() {
    var s = document.getElementById('qbTagSection'); if (!s) return;
    var hasUser = qbSelectedFrom && qbSelectedFrom.id === 'user';
    if (hasUser) {
        var t1 = ''; RELATION_TAGS.forEach(function(t) { t1 += '<div class="qb-add-option" onclick="selectRelationTag(\'' + t + '\',\'fromTo\',this)">' + t + '</div>'; });
        t1 += '<div class="qb-add-option" onclick="showCustomTagInput(\'fromTo\',this)">自定义</div>';
        var t2 = ''; RELATION_TAGS.forEach(function(t) { t2 += '<div class="qb-add-option" onclick="selectRelationTag(\'' + t + '\',\'toFrom\',this)">' + t + '</div>'; });
        t2 += '<div class="qb-add-option" onclick="showCustomTagInput(\'toFrom\',this)">自定义</div>';
        s.innerHTML = '<div style="font-size:13px;color:#8e8e93;margin:12px 0 8px;">我对ta的感情</div><div class="qb-add-options" id="qbFromToTypeOptions">' + t1 + '</div><div id="qbCustomFromToInput" style="display:none;margin:8px 0;"><input type="text" class="ios-input" id="qbCustomFromToField" placeholder="自定义"></div><div style="font-size:13px;color:#8e8e93;margin:12px 0 8px;">ta对我的感情</div><div class="qb-add-options" id="qbToFromTypeOptions">' + t2 + '</div><div id="qbCustomToFromInput" style="display:none;margin:8px 0;"><input type="text" class="ios-input" id="qbCustomToFromField" placeholder="自定义"></div>';
    } else {
        s.innerHTML = '<div style="font-size:13px;color:#8e8e93;margin:12px 0 8px;">A对B的感情</div><div style="margin:0 0 8px;"><input type="text" class="ios-input" id="qbCustomAtoB" placeholder="A对B的感情"></div><div style="font-size:13px;color:#8e8e93;margin:8px 0;">B对A的感情</div><div style="margin:0 0 8px;"><input type="text" class="ios-input" id="qbCustomBtoA" placeholder="B对A的感情"></div>';
    }
    qbSelectedFromToType = null; qbSelectedToFromType = null;
}

function selectRelationTag(type, target, el) {
    if (target === 'fromTo') { qbSelectedFromToType = type; document.querySelectorAll('#qbFromToTypeOptions .qb-add-option').forEach(function(o) { o.classList.remove('selected'); }); document.getElementById('qbCustomFromToInput').style.display = 'none'; }
    else { qbSelectedToFromType = type; document.querySelectorAll('#qbToFromTypeOptions .qb-add-option').forEach(function(o) { o.classList.remove('selected'); }); document.getElementById('qbCustomToFromInput').style.display = 'none'; }
    el.classList.add('selected');
}

function showCustomTagInput(target, el) {
    if (target === 'fromTo') { qbSelectedFromToType = '__custom__'; document.getElementById('qbCustomFromToInput').style.display = 'block'; }
    else { qbSelectedToFromType = '__custom__'; document.getElementById('qbCustomToFromInput').style.display = 'block'; }
    el.classList.add('selected');
}

function closeAddRelation() { qbSelectedFrom = { id: 'user' }; qbSelectedTo = null; qbSelectedFromToType = null; qbSelectedToFromType = null; var o = document.getElementById('qbAddRelationOverlay'); if (o) o.remove(); }

function confirmAddRelation() {
    if (!qbSelectedFrom || !qbSelectedTo) { showToast('请选择双方'); return; }
    if (qbSelectedFrom.id === qbSelectedTo.id) { showToast('双方不能相同'); return; }
    var hasUser = qbSelectedFrom.id === 'user';
    var fromTo = '', toFrom = '';
    if (hasUser) {
        fromTo = qbSelectedFromToType || ''; if (fromTo === '__custom__') fromTo = (document.getElementById('qbCustomFromToField') || {}).value || '';
        toFrom = qbSelectedToFromType || ''; if (toFrom === '__custom__') toFrom = (document.getElementById('qbCustomToFromField') || {}).value || '';
    } else {
        fromTo = (document.getElementById('qbCustomAtoB') || {}).value || '';
        toFrom = (document.getElementById('qbCustomBtoA') || {}).value || '';
    }
    var data = getQianbanData(); if (!data.relations) data.relations = [];
    data.relations.push({ id: 'rel_' + Date.now(), from: qbSelectedFrom.id, to: qbSelectedTo.id, fromToType: fromTo, toFromType: toFrom, createdAt: Date.now() });
    saveQianbanData(data); closeAddRelation(); showToast('关系已添加'); renderQianban();
}

// ========== 添加NPC ==========
function openAddNPC() {
    var overlay = document.createElement('div');
    overlay.className = 'qb-edit-overlay';
    overlay.id = 'qbAddNPCOverlay';
    overlay.innerHTML = `
        <div class="qb-edit-panel" onclick="event.stopPropagation()">
            <div class="qb-edit-handle"></div><div class="qb-edit-title">添加NPC</div>
            <div style="text-align:center;margin-bottom:12px;">
                <div id="qbNpcAvatarPreview" style="width:64px;height:64px;border-radius:50%;background:#e5e5ea;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;" onclick="document.getElementById('qbNpcAvatarInput').click()">+</div>
                <input type="file" id="qbNpcAvatarInput" accept="image/*" style="display:none;" onchange="previewQbNpcAvatar(event)">
            </div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:4px;">NPC名称</div>
            <input type="text" class="ios-input" id="qbNpcName" placeholder="输入NPC名称">
            <div style="font-size:13px;color:#8e8e93;margin:12px 0 4px;">性别</div>
            <div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;">
                <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;"><input type="radio" name="qbNpcGender" value="女" checked style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateQbNpcGenderRadio()"> 女</label>
                <label style="display:flex;align-items:center;gap:6px;font-size:15px;color:#000;cursor:pointer;"><input type="radio" name="qbNpcGender" value="男" style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateQbNpcGenderRadio()"> 男</label>
            </div>
            <div class="qb-edit-buttons"><div class="qb-edit-btn-cancel" onclick="closeAddNPC()">取消</div><div class="qb-edit-btn-confirm" onclick="confirmAddNPC()">确认</div></div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeAddNPC(); };
    updateQbNpcGenderRadio();
}

var qbNpcAvatarData = '';
function previewQbNpcAvatar(e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(ev) { qbNpcAvatarData = ev.target.result; var p = document.getElementById('qbNpcAvatarPreview'); if (p) { p.style.backgroundImage = 'url(' + ev.target.result + ')'; p.innerText = ''; } }; r.readAsDataURL(f); }
function updateQbNpcGenderRadio() { document.querySelectorAll('input[name="qbNpcGender"]').forEach(function(r) { if (r.checked) { r.style.borderColor = '#1d1d1f'; r.style.background = '#1d1d1f'; r.style.boxShadow = 'inset 0 0 0 4px #fff'; } else { r.style.borderColor = '#c7c7cc'; r.style.background = 'transparent'; r.style.boxShadow = 'none'; } }); }
function closeAddNPC() { qbNpcAvatarData = ''; var o = document.getElementById('qbAddNPCOverlay'); if (o) o.remove(); }
function confirmAddNPC() {
    var name = document.getElementById('qbNpcName').value.trim(); if (!name) { showToast('请输入NPC名称'); return; }
    var g = document.querySelector('input[name="qbNpcGender"]:checked'); var gender = g ? g.value : '女';
    var data = getQianbanData(); if (!data.npcs) data.npcs = [];
    data.npcs.push({ id: 'npc_' + Date.now(), name: name, gender: gender, avatar: qbNpcAvatarData || '' });
    saveQianbanData(data); closeAddNPC(); showToast('NPC已添加'); renderQianban();
}

// ========== 编辑NPC ==========
function openEditNPC(npcId) {
    var data = getQianbanData(); var npc = data.npcs.find(function(n) { return n.id === npcId; }); if (!npc) return;
    qbNpcAvatarData = npc.avatar || '';
    var overlay = document.createElement('div'); overlay.className = 'qb-edit-overlay'; overlay.id = 'qbEditNPCOverlay';
    overlay.innerHTML = '<div class="qb-edit-panel" onclick="event.stopPropagation()"><div class="qb-edit-handle"></div><div class="qb-edit-title">编辑NPC</div><div style="text-align:center;margin-bottom:12px;"><div id="qbEditNpcAvatarPreview" style="width:64px;height:64px;border-radius:50%;background:#e5e5ea;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#8e8e93;cursor:pointer;background-size:cover;background-position:center;' + (npc.avatar ? 'background-image:url(' + npc.avatar + ');' : '') + '" onclick="document.getElementById(\'qbEditNpcAvatarInput\').click()">' + (npc.avatar ? '' : (npc.name ? npc.name.charAt(0) : '?')) + '</div><input type="file" id="qbEditNpcAvatarInput" accept="image/*" style="display:none;" onchange="previewQbEditNpcAvatar(event)"></div><div style="font-size:13px;color:#8e8e93;margin-bottom:4px;">NPC名称</div><input type="text" class="ios-input" id="qbEditNpcName" value="' + npc.name + '" placeholder="输入NPC名称"><div style="font-size:13px;color:#8e8e93;margin:12px 0 4px;">性别</div><div style="display:flex;gap:16px;align-items:center;margin-bottom:12px;"><label><input type="radio" name="qbEditNpcGender" value="女" ' + (npc.gender === '女' ? 'checked' : '') + ' style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateQbEditNpcGenderRadio()"> 女</label><label><input type="radio" name="qbEditNpcGender" value="男" ' + (npc.gender === '男' ? 'checked' : '') + ' style="appearance:none;width:20px;height:20px;border:2px solid #c7c7cc;border-radius:50%;outline:none;cursor:pointer;transition:0.2s;position:relative;" onchange="updateQbEditNpcGenderRadio()"> 男</label></div><div class="qb-edit-buttons"><div class="qb-edit-btn-cancel" onclick="closeEditNPC()">取消</div><div class="qb-edit-btn-confirm" onclick="confirmEditNPC(\'' + npcId + '\')">保存</div></div></div>';
    document.body.appendChild(overlay); overlay.onclick = function(e) { if (e.target === overlay) closeEditNPC(); }; updateQbEditNpcGenderRadio();
}

function previewQbEditNpcAvatar(e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(ev) { qbNpcAvatarData = ev.target.result; var p = document.getElementById('qbEditNpcAvatarPreview'); if (p) { p.style.backgroundImage = 'url(' + ev.target.result + ')'; p.innerText = ''; } }; r.readAsDataURL(f); }
function updateQbEditNpcGenderRadio() { document.querySelectorAll('input[name="qbEditNpcGender"]').forEach(function(r) { if (r.checked) { r.style.borderColor = '#1d1d1f'; r.style.background = '#1d1d1f'; r.style.boxShadow = 'inset 0 0 0 4px #fff'; } else { r.style.borderColor = '#c7c7cc'; r.style.background = 'transparent'; r.style.boxShadow = 'none'; } }); }
function closeEditNPC() { qbNpcAvatarData = ''; var o = document.getElementById('qbEditNPCOverlay'); if (o) o.remove(); }
function confirmEditNPC(npcId) {
    var name = document.getElementById('qbEditNpcName').value.trim(); if (!name) { showToast('请输入NPC名称'); return; }
    var g = document.querySelector('input[name="qbEditNpcGender"]:checked'); var gender = g ? g.value : '女';
    var data = getQianbanData(); var npc = data.npcs.find(function(n) { return n.id === npcId; });
    if (npc) { npc.name = name; npc.gender = gender; npc.avatar = qbNpcAvatarData || ''; }
    saveQianbanData(data); closeEditNPC(); showToast('NPC已更新'); renderQianban();
}

// ========== 关系详情 ==========
function openQianbanDetail(nodeId) {
    var data = getQianbanData(); var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = data.npcs || []; var relations = data.relations || [];
    var nodeName = getNodeName(nodeId), nodeAvatar = getNodeAvatar(nodeId), nodeType = getNodeType(nodeId);
    var related = relations.filter(function(r) { return r.from === nodeId || r.to === nodeId; });
    var rh = ''; if (related.length === 0) rh = '<div style="text-align:center;color:#8e8e93;padding:20px;">暂无关系</div>';
    else related.forEach(function(r) { var oid = r.from === nodeId ? r.to : r.from; var oname = getNodeName(oid); var dir = r.from === nodeId ? '→' : '←'; var tag = r.from === nodeId ? (r.fromToType || '') : (r.toFromType || ''); rh += '<div class="qb-detail-stat"><span>' + dir + ' ' + oname + '</span><span class="stat-value">' + tag + '</span></div>'; });
    var overlay = document.createElement('div'); overlay.className = 'qb-detail-overlay'; overlay.id = 'qbDetailOverlay';
    overlay.innerHTML = '<div class="qb-detail-panel" onclick="event.stopPropagation()"><div class="qb-detail-handle"></div><div class="qb-detail-head"><div class="qb-detail-avatar user">' + (getActiveUserInfo().name || '我').charAt(0) + '</div><div class="qb-detail-connector">——</div><div class="qb-detail-avatar" style="' + (nodeAvatar ? 'background-image:url(' + nodeAvatar + ');background-size:cover;background-position:center;' : '') + '">' + (nodeAvatar ? '' : (nodeName ? nodeName.charAt(0) : '?')) + '</div></div><div class="qb-detail-relation">' + nodeName + '</div><div class="qb-detail-meta">' + (nodeType === 'npc' ? 'NPC' : nodeType === 'user' ? '用户' : '角色') + '</div><div class="qb-detail-section-title">关系列表</div>' + rh + '<div class="qb-detail-actions">' + (nodeType === 'npc' ? '<div class="qb-detail-btn qb-detail-btn-black" onclick="closeQianbanDetail();openEditNPC(\'' + nodeId + '\')">编辑NPC</div>' : '') + '<div class="qb-detail-btn qb-detail-btn-white" onclick="closeQianbanDetail()">关闭</div></div></div>';
    document.body.appendChild(overlay); overlay.onclick = function(e) { if (e.target === overlay) closeQianbanDetail(); };
}

function closeQianbanDetail() { var o = document.getElementById('qbDetailOverlay'); if (o) o.remove(); }
