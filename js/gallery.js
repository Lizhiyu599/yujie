/**
 * 映像馆 - 生图自动存档
 * 按年月日分区，长按删除
 */

// ========== 数据存储 ==========
function getGalleryImages() {
    var raw = localStorage.getItem('gallery_images');
    return raw ? JSON.parse(raw) : [];
}

function saveGalleryImages(images) {
    localStorage.setItem('gallery_images', JSON.stringify(images));
}

// ========== 添加图片（供 chat_addons.js 调用） ==========
function addGalleryImage(src, prompt) {
    var images = getGalleryImages();
    var now = new Date();
    var dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
    images.unshift({
        id: 'img_' + Date.now(),
        src: src,
        date: dateStr,
        prompt: prompt || ''
    });
    saveGalleryImages(images);
}

// ========== 打开映像馆 ==========
function openGallery() {
    var appWindow = document.getElementById('galleryAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'galleryAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    renderGallery();
    appWindow.style.display = 'flex';
}

function closeGallery() {
    var appWindow = document.getElementById('galleryAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 渲染映像馆 ==========
function renderGallery() {
    var appWindow = document.getElementById('galleryAppWindow');
    if (!appWindow) return;

    var images = getGalleryImages();

    // 按日期分组
    var groups = {};
    images.forEach(function(img) {
        if (!groups[img.date]) groups[img.date] = [];
        groups[img.date].push(img);
    });

    var dates = Object.keys(groups).sort(function(a, b) { return b.localeCompare(a); });

    var bodyHTML = '';
    if (dates.length === 0) {
        bodyHTML = '<div class="gl-empty">映像馆为空<br>生成图片后将自动存入</div>';
    } else {
        dates.forEach(function(date) {
            bodyHTML += '<div class="gl-date-title">' + date + '</div>';
            bodyHTML += '<div class="gl-grid">';
            groups[date].forEach(function(img) {
                bodyHTML += '<div class="gl-item" style="background-image:url(' + img.src + ');" onclick="openGalleryViewer(\'' + img.id + '\')" ontouchstart="startGalleryLongPress(event, \'' + img.id + '\')" ontouchend="cancelGalleryLongPress()" ontouchmove="cancelGalleryLongPress()"></div>';
            });
            bodyHTML += '</div>';
        });
    }

    appWindow.innerHTML = ''
        + '<div class="gallery-app">'
        + '<div class="gl-top-bar">'
        + '<div class="gl-back-btn" onclick="closeGallery()">‹</div>'
        + '<div class="gl-title">图 库</div>'
        + '<div style="width:36px;"></div>'
        + '</div>'
        + '<div class="gl-body">' + bodyHTML + '</div>'
        + '</div>';
}

// ========== 全屏查看 ==========
function openGalleryViewer(imgId) {
    var images = getGalleryImages();
    var img = images.find(function(i) { return i.id === imgId; });
    if (!img) return;

    var overlay = document.createElement('div');
    overlay.className = 'gl-viewer';
    overlay.id = 'galleryViewer';
    overlay.innerHTML = '<img src="' + img.src + '">';
    overlay.onclick = function() { overlay.remove(); };
    document.body.appendChild(overlay);
}

// ========== 长按删除 ==========
var galleryLongPressTimer = null;
var galleryLongPressTarget = null;

function startGalleryLongPress(e, imgId) {
    galleryLongPressTarget = imgId;
    galleryLongPressTimer = setTimeout(function() {
        showGalleryDeleteConfirm(imgId);
    }, 600);
}

function cancelGalleryLongPress() {
    if (galleryLongPressTimer) {
        clearTimeout(galleryLongPressTimer);
        galleryLongPressTimer = null;
    }
    galleryLongPressTarget = null;
}

function showGalleryDeleteConfirm(imgId) {
    var overlay = document.createElement('div');
    overlay.className = 'gl-confirm-overlay';
    overlay.id = 'galleryConfirmOverlay';
    overlay.innerHTML = ''
        + '<div class="gl-confirm-dialog">'
        + '<p>确认删除该图片？</p>'
        + '<div class="gl-confirm-buttons">'
        + '<div class="gl-confirm-btn-cancel" onclick="closeGalleryConfirm()">取消</div>'
        + '<div class="gl-confirm-btn-delete" onclick="confirmDeleteGalleryImage(\'' + imgId + '\')">确定</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
}

function closeGalleryConfirm() {
    var overlay = document.getElementById('galleryConfirmOverlay');
    if (overlay) overlay.remove();
}

function confirmDeleteGalleryImage(imgId) {
    var images = getGalleryImages();
    images = images.filter(function(i) { return i.id !== imgId; });
    saveGalleryImages(images);
    closeGalleryConfirm();
    showToast('图片已删除');
    renderGallery();
}

// ========== 注册桌面图标 ==========
window.addEventListener('DOMContentLoaded', function() {
    // 通过 desktop.js 的 addDesktopIcon 注册，这里不操作 Dock
});
