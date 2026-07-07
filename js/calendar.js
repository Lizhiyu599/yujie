/**
 * 玉界 - 日历
 * 4x4小组件 + 完整月视图 + 事件管理
 */

var _calYear, _calMonth, _calSelectedDay;
var _calEvents = {};

function _calLoadEvents() {
    try {
        var raw = localStorage.getItem('calendar_events');
        _calEvents = raw ? JSON.parse(raw) : {};
    } catch(e) { _calEvents = {}; }
}
function _calSaveEvents() {
    localStorage.setItem('calendar_events', JSON.stringify(_calEvents));
}

function openCalendar() {
    var appWindow = document.getElementById('calendarAppWindow');
    if (!appWindow) {
        appWindow = document.createElement('div');
        appWindow.id = 'calendarAppWindow';
        appWindow.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#f2f2f7;z-index:200;display:none;flex-direction:column;';
        document.getElementById('desktop').appendChild(appWindow);
    }
    _calLoadEvents();
    var now = new Date();
    _calYear = now.getFullYear();
    _calMonth = now.getMonth() + 1;
    _calSelectedDay = now.getDate();
    _calRenderMonth();
    appWindow.style.display = 'flex';
}

function closeCalendar() {
    var appWindow = document.getElementById('calendarAppWindow');
    if (appWindow) appWindow.style.display = 'none';
}

// ========== 月视图 ==========
function _calRenderMonth() {
    var appWindow = document.getElementById('calendarAppWindow');
    if (!appWindow) return;

    var today = new Date();
    var daysInMonth = new Date(_calYear, _calMonth, 0).getDate();
    var firstDay = new Date(_calYear, _calMonth - 1, 1).getDay();
    var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

    var gridHTML = '';
    // 星期头
    var dayNames = ['日','一','二','三','四','五','六'];
    dayNames.forEach(function(d) {
        gridHTML += '<div class="cal-month-day-name">' + d + '</div>';
    });
    // 空白
    for (var i = 0; i < firstDay; i++) {
        gridHTML += '<div class="cal-month-day other-month"></div>';
    }
    // 日期
    for (var d = 1; d <= daysInMonth; d++) {
        var dateKey = _calYear + '-' + _calMonth + '-' + d;
        var isToday = _calYear === today.getFullYear() && _calMonth === (today.getMonth()+1) && d === today.getDate();
        var events = _calEvents[dateKey] || [];
        var dotsHTML = '';
        if (events.length > 0) {
            dotsHTML += '<div class="cal-month-dots">';
            events.forEach(function(ev) {
                dotsHTML += '<div class="cal-month-dot ' + ev.type + '"></div>';
            });
            dotsHTML += '</div>';
        }
        gridHTML += ''
            + '<div class="cal-month-day' + (isToday ? ' today' : '') + '" onclick="_calSelectDay(' + d + ')">'
            + d + dotsHTML
            + '</div>';
    }

    // 当天事件列表
    var selectedKey = _calYear + '-' + _calMonth + '-' + _calSelectedDay;
    var selectedEvents = _calEvents[selectedKey] || [];
    var eventsHTML = '';
    selectedEvents.forEach(function(ev, i) {
        var typeLabel = ev.type === 'period' ? '经期' : (ev.type === 'anniversary' ? '纪念日' : '生日');
        eventsHTML += ''
            + '<div class="cal-event-item">'
            + '<div class="cal-event-dot ' + ev.type + '" style="background:' + (ev.type === 'period' ? '#ff6b6b' : ev.type === 'anniversary' ? '#ffb347' : '#64b5f6') + ';"></div>'
            + '<div class="cal-event-text">' + ev.text + '<span style="color:#8e8e93;font-size:11px;margin-left:6px;">' + typeLabel + '</span></div>'
            + '<div class="cal-event-del" onclick="event.stopPropagation();_calDeleteEvent(' + d + ', ' + i + ')">×</div>'
            + '</div>';
    });

    appWindow.innerHTML = ''
        + '<div class="cal-app">'
        + '<div class="cal-nav">'
        + '<div class="cal-nav-back" onclick="closeCalendar()">‹</div>'
        + '<div class="cal-nav-title">日历</div>'
        + '</div>'
        + '<div class="cal-body">'
        + '<div class="cal-month-header">'
        + '<span class="cal-month-arrow" onclick="_calPrevMonth()">‹</span>'
        + '<span>' + _calYear + '年' + monthNames[_calMonth-1] + '</span>'
        + '<span class="cal-month-arrow" onclick="_calNextMonth()">›</span>'
        + '</div>'
        + '<div class="cal-month-grid">' + gridHTML + '</div>'
        + '<div class="cal-events">'
        + '<div class="cal-events-title">' + _calMonth + '月' + _calSelectedDay + '日</div>'
        + eventsHTML
        + '<button class="cal-add-btn" onclick="_calAddEvent()">+ 添加事件</button>'
        + '</div>'
        + '</div>'
        + '</div>';
}

function _calPrevMonth() {
    if (_calMonth === 1) { _calMonth = 12; _calYear--; }
    else { _calMonth--; }
    _calSelectedDay = 1;
    _calRenderMonth();
}
function _calNextMonth() {
    if (_calMonth === 12) { _calMonth = 1; _calYear++; }
    else { _calMonth++; }
    _calSelectedDay = 1;
    _calRenderMonth();
}
function _calSelectDay(d) {
    _calSelectedDay = d;
    _calRenderMonth();
}

// ========== 事件 ==========
function _calAddEvent() {
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'calEventOverlay';
    overlay.innerHTML = ''
        + '<div class="caption-modal">'
        + '<div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">添加事件 - ' + _calMonth + '月' + _calSelectedDay + '日</div>'
        + '<input type="text" class="payment-note" id="calEventText" placeholder="事件名称">'
        + '<div style="display:flex;gap:8px;margin-top:8px;">'
        + '<div class="ac-cat-item" onclick="_calPickType(this, \'period\')" style="flex:1;">经期</div>'
        + '<div class="ac-cat-item" onclick="_calPickType(this, \'anniversary\')" style="flex:1;">纪念日</div>'
        + '<div class="ac-cat-item" onclick="_calPickType(this, \'birthday\')" style="flex:1;">生日</div>'
        + '</div>'
        + '<div class="caption-buttons" style="margin-top:12px;">'
        + '<div class="payment-btn-cancel" onclick="_calCloseEvent()">取消</div>'
        + '<div class="payment-btn-confirm" onclick="_calConfirmEvent()">确定</div>'
        + '</div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) _calCloseEvent(); };
    window._calPickedType = 'period';
}
function _calPickType(el, type) {
    window._calPickedType = type;
    var items = el.parentElement.querySelectorAll('.ac-cat-item');
    items.forEach(function(i) { i.classList.remove('selected'); });
    el.classList.add('selected');
}
function _calCloseEvent() {
    var o = document.getElementById('calEventOverlay');
    if (o) o.remove();
}
function _calConfirmEvent() {
    var text = document.getElementById('calEventText').value.trim();
    var type = window._calPickedType || 'period';
    _calCloseEvent();
    if (!text) return;
    var key = _calYear + '-' + _calMonth + '-' + _calSelectedDay;
    if (!_calEvents[key]) _calEvents[key] = [];
    _calEvents[key].push({ text: text, type: type });
    _calSaveEvents();
    _calRenderMonth();
}
function _calDeleteEvent(d, index) {
    var key = _calYear + '-' + _calMonth + '-' + d;
    if (_calEvents[key]) {
        _calEvents[key].splice(index, 1);
        if (_calEvents[key].length === 0) delete _calEvents[key];
    }
    _calSaveEvents();
    _calRenderMonth();
}
