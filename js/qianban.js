/**
 * 牵绊 - 关系图谱
 * 用户与角色/NPC的关系可视化
 */

// ========== 关系数据存储 ==========
function getQianbanData() {
    var raw = localStorage.getItem('qianban_data');
    return raw ? JSON.parse(raw) : { relations: [], npcs: [] };
}

function saveQianbanData(data) {
    localStorage.setItem('qianban_data', JSON.stringify(data));
}

// ========== 预设关系类型 ==========
var RELATION_TYPES = [
    '恋人', '挚友', '搭档', '家人', '青梅竹马',
    '同学', '同事', '邻居', '敌人', '陌生人',
    '暗恋', '师徒', '上司', '下属', '网友'
];

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

// ========== 获取连线中点 ==========
function getMidPoint(x1, y1, x2, y2) {
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
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

    var allNodes = [];
    allNodes.push({ id: 'user', name: '我', type: 'user', avatar: '' });

    contacts.forEach(function(c) {
        allNodes.push({ id: c.id, name: c.name, type: 'role', avatar: c.avatarData || '', avatarText: c.avatar });
    });

    npcs.forEach(function(n) {
        allNodes.push({ id: n.id, name: n.name, type: 'npc', avatar: '' });
    });

    var graphNodes = allNodes.filter(function(n) { return n.type !== 'user'; });
    var positions = calcNodePositions(graphNodes.length);

    var nodesHTML = '';
    nodesHTML += '<div class="qb-node" style="left:50%;top:38%;transform:translate(-50%,-50%);" onclick="openQianbanDetail(\'user\')"><div class="qb-node-avatar user">我</div><div class="qb-node-name">我</div></div>';

    graphNodes.forEach(function(node, i) {
        var pos = positions[i];
        var avatarHTML = '';
        if (node.avatar) {
            avatarHTML = '<div class="qb-node-avatar' + (node.type === 'npc' ? '' : '') + '" style="background-image:url(' + node.avatar + ');background-size:cover;background-position:center;">&nbsp;</div>';
        } else {
            avatarHTML = '<div class="qb-node-avatar' + (node.type === 'npc' ? '' : '') + '">' + (node.name ? node.name.charAt(0) : '?') + '</div>';
        }
        nodesHTML += '<div class="qb-node" style="left:' + pos.x + '%;top:' + pos.y + '%;transform:translate(-50%,-50%);" onclick="openQianbanDetail(\'' + node.id + '\')">' + avatarHTML + '<div class="qb-node-name">' + node.name + '</div></div>';
    });

    appWindow.innerHTML = `
        <div class="qianban-app">
            <div class="qb-top-bar">
                <div class="qb-back-btn" onclick="closeQianban()">‹</div>
                <div class="qb-title">牵 绊</div>
                <div style="width:36px;"></div>
            </div>
            <div class="qb-graph-area" id="qbGraphArea">
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

// ========== 添加关系面板 ==========
function openAddRelation() {
    var data = getQianbanData();
    var contacts = window.ChatConfig && window.ChatConfig.contacts ? window.ChatConfig.contacts : [];
    var npcs = data.npcs || [];

    var targetOptions = '';
    contacts.forEach(function(c) {
        targetOptions += '<div class="qb-add-option" onclick="selectRelationTarget(\'' + c.id + '\', \'' + c.name + '\', this)">' + c.name + '</div>';
    });
    npcs.forEach(function(n) {
        targetOptions += '<div class="qb-add-option" onclick="selectRelationTarget(\'' + n.id + '\', \'' + n.name + '\', this)">' + n.name + '</div>';
    });

    var typeOptions = '';
    RELATION_TYPES.forEach(function(t) {
        typeOptions += '<div class="qb-add-option" onclick="selectRelationType(\'' + t + '\', this)">' + t + '</div>';
    });

    var overlay = document.createElement('div');
    overlay.className = 'qb-edit-overlay';
    overlay.id = 'qbAddRelationOverlay';
    overlay.innerHTML = `
        <div class="qb-edit-panel" onclick="event.stopPropagation()">
            <div class="qb-edit-handle"></div>
            <div class="qb-edit-title">添加关系</div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;">选择对象</div>
            <div class="qb-add-options" id="qbTargetOptions">${targetOptions}</div>
            <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;">选择关系类型</div>
            <div class="qb-add-options" id="qbTypeOptions">${typeOptions}</div>
            <div class="qb-edit-buttons">
                <div class="qb-edit-btn-cancel" onclick="closeAddRelation()">取消</div>
                <div class="qb-edit-btn-confirm" onclick="confirmAddRelation()">确认</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeAddRelation(); };
}

var qbSelectedTarget = null;
var qbSelectedType = null;

function selectRelationTarget(id, name, el) {
    qbSelectedTarget = { id: id, name: name };
    var opts = document.querySelectorAll('#qbTargetOptions .qb-add-option');
    opts.forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
}

function selectRelationType(type, el) {
    qbSelectedType = type;
    var opts = document.querySelectorAll('#qbTypeOptions .qb-add-option');
    opts.forEach(function(o) { o.classList.remove('selected'); });
    el.classList.add('selected');
}

function closeAddRelation() {
    qbSelectedTarget = null;
    qbSelectedType = null;
    var overlay = document.getElementById('qbAddRelationOverlay');
    if (overlay) overlay.remove();
}

function confirmAddRelation() {
    if (!qbSelectedTarget || !qbSelectedType) {
        showToast('请选择对象和关系类型');
        return;
    }
    var data = getQianbanData();
    if (!data.relations) data.relations = [];
    data.relations.push({
        id: 'rel_' + Date.now(),
        from: 'user',
        to: qbSelectedTarget.id,
        toName: qbSelectedTarget.name,
        type: qbSelectedType,
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
            <div style="font-size:13px;color:#8e8e93;margin-bottom:4px;">NPC名称</div>
            <input type="text" class="ios-input" id="qbNpcName" placeholder="输入NPC名称">
            <div class="qb-edit-buttons" style="margin-top:16px;">
                <div class="qb-edit-btn-cancel" onclick="closeAddNPC()">取消</div>
                <div class="qb-edit-btn-confirm" onclick="confirmAddNPC()">确认</div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) closeAddNPC(); };
}

function closeAddNPC() {
    var overlay = document.getElementById('qbAddNPCOverlay');
    if (overlay) overlay.remove();
}

function confirmAddNPC() {
    var name = document.getElementById('qbNpcName').value.trim();
    if (!name) { showToast('请输入NPC名称'); return; }
    var data = getQianbanData();
    if (!data.npcs) data.npcs = [];
    data.npcs.push({ id: 'npc_' + Date.now(), name: name });
    saveQianbanData(data);
    closeAddNPC();
    showToast('NPC已添加');
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
        node = { id: 'user', name: '我', type: 'user' };
    } else {
        node = contacts.find(function(c) { return c.id === nodeId; });
        if (!node) {
            node = npcs.find(function(n) { return n.id === nodeId; });
            if (node) node.type = 'npc';
        } else {
            node.type = 'role';
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
            var otherName = r.from === nodeId ? r.toName : '我';
            if (r.from === 'user' || r.to === 'user') {
                otherName = r.from === 'user' ? r.toName : '我';
            }
            relatedHTML += '<div class="qb-detail-stat"><span>' + otherName + '</span><span class="stat-value">' + r.type + '</span></div>';
        });
    }

    var overlay = document.createElement('div');
    overlay.className = 'qb-detail-overlay';
    overlay.id = 'qbDetailOverlay';
    overlay.innerHTML = `
        <div class="qb-detail-panel" onclick="event.stopPropagation()">
            <div class="qb-detail-handle"></div>
            <div class="qb-detail-head">
                <div class="qb-detail-avatar user">我</div>
                <div class="qb-detail-connector">——</div>
                <div class="qb-detail-avatar">${node.name ? node.name.charAt(0) : '?'}</div>
            </div>
            <div class="qb-detail-relation">${node.name}</div>
            <div class="qb-detail-meta">${node.type === 'npc' ? 'NPC' : '角色'}</div>
            <div class="qb-detail-section-title">关系列表</div>
            ${relatedHTML}
            <div class="qb-detail-actions">
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

// ========== 注册桌面和Dock ==========
window.addEventListener('DOMContentLoaded', function() {
    var dockBar = document.getElementById('dockBar');
    if (!dockBar) return;

    var qbItem = document.createElement('div');
    qbItem.className = 'dock-item';
    qbItem.innerHTML = `
        <div class="dock-icon">
            <div class="dock-icon-img">
                <svg width="28" height="28" viewBox="0 0 100 100" fill="none" stroke="#555" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="50" cy="50" r="18"/>
                    <circle cx="35" cy="38" r="5"/>
                    <circle cx="65" cy="38" r="5"/>
                    <path d="M35 60 Q50 70 65 60"/>
                </svg>
            </div>
        </div>
        <div class="dock-label">牵绊</div>
    `;
    qbItem.onclick = function() { openQianban(); };
    dockBar.appendChild(qbItem);
});
