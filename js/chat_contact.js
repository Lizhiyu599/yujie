/**
 * 玉界 - 联系人管理
 * 包含：添加好友页面、角色创建
 */

// ========== 添加好友页面 ==========
let charAvatarData = '';

function showCreateCharacterPage() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

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

    // 初始化按钮状态
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

    // 拼装完整人设
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
