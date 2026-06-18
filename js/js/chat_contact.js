/**
 * 玉界 - 添加好友（创建角色）
 * 包含：添加好友页面、表单验证、角色创建
 */

// ========== 添加好友页面 ==========
function showCreateCharacterPage() {
    const appWindow = document.getElementById('chatAppWindow');
    if (!appWindow) return;

    window._charAvatarData = '';

    appWindow.innerHTML = `
        <div class="chat-shell">
            <div class="chat-nav">
                <div class="nav-status-bar"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="renderChatShell()">‹</span>
                    <span class="nav-title">添加好友</span>
                </div>
            </div>
            <div class="contact-form-scroll">
                <div class="contact-form">

                    <!-- 头像 -->
                    <div class="contact-avatar-section">
                        <div class="contact-avatar-circle" id="contactAvatarPreview" onclick="document.getElementById('contactAvatarInput').click()">
                            <span class="contact-avatar-placeholder">+</span>
                        </div>
                        <input type="file" id="contactAvatarInput" accept="image/*" style="display:none;" onchange="previewContactAvatar(event)">
                        <div class="contact-avatar-hint">点击设置头像</div>
                    </div>

                    <!-- 姓名 -->
                    <div class="contact-field">
                        <div class="contact-label">姓名</div>
                        <input type="text" id="contactName" class="contact-input" placeholder="请输入角色姓名">
                    </div>

                    <!-- 备注 -->
                    <div class="contact-field">
                        <div class="contact-label">备注</div>
                        <input type="text" id="contactNote" class="contact-input" placeholder="请输入你给角色的备注">
                    </div>

                    <!-- 性别 -->
                    <div class="contact-field">
                        <div class="contact-label">性别</div>
                        <div class="contact-radio-group">
                            <div class="contact-radio-item" id="radioFemale" onclick="selectGender('female', this)">
                                <span class="contact-radio-circle"></span>
                                <span>女</span>
                            </div>
                            <div class="contact-radio-item" id="radioMale" onclick="selectGender('male', this)">
                                <span class="contact-radio-circle"></span>
                                <span>男</span>
                            </div>
                            <div class="contact-radio-item" id="radioNonHuman" onclick="selectGender('nonhuman', this)">
                                <span class="contact-radio-circle"></span>
                                <span>非人类</span>
                            </div>
                        </div>
                    </div>

                    <!-- 年龄 -->
                    <div class="contact-field">
                        <div class="contact-label">年龄</div>
                        <input type="text" id="contactAge" class="contact-input" placeholder="请输入该角色的年龄">
                    </div>

                    <!-- 性格 -->
                    <div class="contact-field">
                        <div class="contact-label">性格</div>
                        <textarea id="contactPersonality" class="contact-textarea" placeholder="请输入该角色的性格、人格类型、语言风格"></textarea>
                    </div>

                    <!-- 背景故事 -->
                    <div class="contact-field">
                        <div class="contact-label">背景故事</div>
                        <textarea id="contactBackground" class="contact-textarea" placeholder="请输入该角色的人生经历、原生家庭、与你如何相识"></textarea>
                    </div>

                    <!-- 外貌描述 -->
                    <div class="contact-field">
                        <div class="contact-label">外貌描述 <span class="contact-optional">（选填）</span></div>
                        <textarea id="contactAppearance" class="contact-textarea" placeholder="请输入该角色的外貌描述，用于引导生图API，未配置生图API用户可填可不填"></textarea>
                    </div>

                    <!-- 创建按钮 -->
                    <button class="contact-create-btn" id="contactCreateBtn" onclick="createContact()">添加该角色</button>

                </div>
            </div>
        </div>
    `;

    window._contactGender = '';
}

// ========== 头像预览 ==========
function previewContactAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        window._charAvatarData = ev.target.result;
        const preview = document.getElementById('contactAvatarPreview');
        if (preview) {
            preview.style.backgroundImage = `url(${ev.target.result})`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
            const placeholder = preview.querySelector('.contact-avatar-placeholder');
            if (placeholder) placeholder.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

// ========== 性别选择 ==========
function selectGender(gender, el) {
    window._contactGender = gender;
    const allItems = document.querySelectorAll('.contact-radio-item');
    allItems.forEach(function(item) {
        item.classList.remove('selected');
    });
    el.classList.add('selected');
}

// ========== 检查表单完整度 ==========
function checkContactForm() {
    const name = document.getElementById('contactName').value.trim();
    const note = document.getElementById('contactNote').value.trim();
    const age = document.getElementById('contactAge').value.trim();
    const personality = document.getElementById('contactPersonality').value.trim();
    const background = document.getElementById('contactBackground').value.trim();
    const gender = window._contactGender || '';

    return !!(name && note && gender && age && personality && background);
}

// 实时监听表单变化更新按钮状态
document.addEventListener('input', function(e) {
    const btn = document.getElementById('contactCreateBtn');
    if (!btn) return;
    if (e.target.closest('.contact-form')) {
        if (checkContactForm()) {
            btn.classList.add('ready');
        } else {
            btn.classList.remove('ready');
        }
    }
});

document.addEventListener('change', function(e) {
    const btn = document.getElementById('contactCreateBtn');
    if (!btn) return;
    if (e.target.closest('.contact-form')) {
        setTimeout(function() {
            if (checkContactForm()) {
                btn.classList.add('ready');
            } else {
                btn.classList.remove('ready');
            }
        }, 100);
    }
});

// ========== 创建角色 ==========
function createContact() {
    const name = document.getElementById('contactName').value.trim();
    const note = document.getElementById('contactNote').value.trim();
    const age = document.getElementById('contactAge').value.trim();
    const personality = document.getElementById('contactPersonality').value.trim();
    const background = document.getElementById('contactBackground').value.trim();
    const appearance = document.getElementById('contactAppearance').value.trim();
    const gender = window._contactGender || '';

    if (!name || !note || !gender || !age || !personality || !background) {
        showToast('请填写完前6项必填内容');
        return;
    }

    // 构建完整人设
    let persona = '';
    persona += '姓名：' + name + '\n';
    persona += '备注：' + note + '\n';
    persona += '性别：' + (gender === 'female' ? '女' : gender === 'male' ? '男' : '非人类') + '\n';
    persona += '年龄：' + age + '\n\n';
    persona += '性格：\n' + personality + '\n\n';
    persona += '背景故事：\n' + background;
    if (appearance) {
        persona += '\n\n外貌描述：\n' + appearance;
    }
    persona += '\n\n【重要】以上是用户给你设定的人设，你必须严格遵循，不能偏离。';

    const newContact = {
        id: 'c_' + Date.now(),
        name: name,
        avatar: name.charAt(0),
        avatarData: window._charAvatarData || '',
        persona: persona,
        preview: '点击开始对话'
    };

    window.ChatConfig.contacts.push(newContact);
    saveContactsToStorage();
    showToast('角色 ' + name + ' 创建成功');
    renderChatShell();
}
