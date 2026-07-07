/**
 * 玉界 - 日历
 * 4x4小组件 + 完整月视图 + 事件管理 + 经期追踪
 */

var _calYear, _calMonth, _calSelectedDay;
var _calEvents = {};
var _calPeriodStart = null;
var _calPeriodEnd = null;

function _calLoadEvents() {
    try {
        var raw = localStorage.getItem('calendar_events');
        _calEvents = raw ? JSON.parse(raw) : {};
    } catch(e) { _calEvents = {}; }
    _calPeriodStart = localStorage.getItem('cal_period_start') || null;
    _calPeriodEnd = localStorage.getItem('cal_period_end') || null;
}
function _calSaveEvents() {
    localStorage.setItem('calendar_events', JSON.stringify(_calEvents));
}
function _calSavePeriod() {
    if (_calPeriodStart) localStorage.setItem('cal_period_start', _calPeriodStart);
    else localStorage.removeItem('cal_period_start');
    if (_calPeriodEnd) localStorage.setItem('cal_period_end', _calPeriodEnd);
    else localStorage.removeItem('cal_period_end');
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

// ========== 判断日期类型 ==========
function _calGetDayType(year, month, day) {
    if (!_calPeriodStart) return '';
    var d = new Date(year, month - 1, day);
    var start = new Date(_calPeriodStart);
    var end = _calPeriodEnd ? new Date(_calPeriodEnd) : null;
    
    if (d.toDateString() === start.toDateString()) return 'period';
    if (end && d >= start && d <= end) return 'period';
    
    // 预测下次经期（28天周期）
    var nextStart = new Date(start);
    nextStart.setDate(nextStart.getDate() + 28);
    var predictStart = new Date(nextStart);
    predictStart.setDate(predictStart.getDate() - 2);
    if (d >= predictStart && d < nextStart) return 'predict';
    
    // 排卵期（下次经期前14天左右）
    var ovulation = new Date(nextStart);
    ovulation.setDate(ovulation.getDate() - 14);
    var ovStart = new Date(ovulation);
    ovStart.setDate(ovStart.getDate() - 2);
    var ovEnd = new Date(ovulation);
    ovEnd.setDate(ovEnd.getDate() + 2);
    if (d >= ovStart && d <= ovEnd) return 'ovulation';
    
    return '';
}

// ========== 月视图 ==========
function _calRenderMonth() {
    var appWindow = document.getElementById('calendarAppWindow');
    if (!appWindow) return;

    var daysInMonth = new Date(_calYear, _calMonth, 0).getDate();
    var firstDay = new Date(_calYear, _calMonth - 1, 1).getDay();
    var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

    var gridHTML = '';
    var dayNames = ['日','一','二','三','四','五','六'];
    dayNames.forEach(function(d) {
        gridHTML += '<div class="cal-month-day-name">' + d + '</div>';
    });
    for (var i = 0; i < firstDay; i++) {
        gridHTML += '<div class="cal-month-day other-month"></div>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
        var isSelected = d === _calSelectedDay ? ' selected' : '';
        var dayType = _calGetDayType(_calYear, _calMonth, d);
        var typeClass = dayType ? ' ' + dayType : '';
        var dateKey = _calYear + '-' + _calMonth + '-' + d;
        var events = _calEvents[dateKey] || [];
        var dotsHTML = '';
        events.forEach(function(ev) {
            var dotClass = ev.type === 'birthday' ? ' birthday' : (ev.type === 'anniversary' ? ' anniversary' : ' period');
            dotsHTML += '<div class="cal-month-dot' + dotClass + '"></div>';
        });
        if (dayType === 'period') dotsHTML += '<div class="cal-month-dot period"></div>';
        if (dayType === 'predict') dotsHTML += '<div class="cal-month-dot predict"></div>';
        if (dayType === 'ovulation') dotsHTML += '<div class="cal-month-dot ovulation"></div>';
        gridHTML += ''
            + '<div class="cal-month-day' + isSelected + typeClass + '" onclick="_calSelectDay(' + d + ')" oncontextmenu="event.preventDefault();" '
            + 'ontouchstart="_calLongPressTimer=setTimeout(function(){_calAddEvent(' + d + ');},600);" '
            + 'ontouchend="clearTimeout(_calLongPressTimer);" ontouchmove="clearTimeout(_calLongPressTimer);">'
            + d + '<div class="cal-month-dots">' + dotsHTML + '</div>'
            + '</div>';
    }

    // 事件列表
    var selectedKey = _calYear + '-' + _calMonth + '-' + _calSelectedDay;
    var selectedEvents = _calEvents[selectedKey] || [];
    var eventsHTML = '';
    if (selectedEvents.length === 0) {
        eventsHTML = '<div style="color:#c7c7cc;font-size:13px;padding:8px 0;">长按日期添加事件</div>';
    } else {
        selectedEvents.forEach(function(ev, i) {
            var typeLabel = ev.type === 'period' ? '经期' : (ev.type === 'anniversary' ? '纪念日' : '生日');
            var dotColor = ev.type === 'period' ? '#ff6b6b' : (ev.type === 'anniversary' ? '#1a1a1a' : '#d5d5d5');
            eventsHTML += ''
                + '<div class="cal-event-item">'
                + '<div class="cal-event-dot" style="background:' + dotColor + ';"></div>'
                + '<div class="cal-event-text">' + ev.text + '<span style="color:#8e8e93;font-size:11px;margin-left:6px;">' + typeLabel + '</span></div>'
                + '<div class="cal-event-del" onclick="event.stopPropagation();_calDeleteEvent(' + _calSelectedDay + ', ' + i + ')">×</div>'
                + '</div>';
        });
    }

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
        + '<div class="cal-period-switch">'
        + '<div class="cal-switch-row"><span>经期开始了吗？</span><input type="checkbox" class="ios-switch-sm" ' + (_calPeriodStart ? 'checked' : '') + ' onchange="_calTogglePeriodStart(this.checked)"></div>'
        + '<div class="cal-switch-row"><span>经期结束了吗？</span><input type="checkbox" class="ios-switch-sm" ' + (_calPeriodEnd ? 'checked' : '') + ' onchange="_calTogglePeriodEnd(this.checked)"></div>'
        + '</div>'
        + '<div class="cal-events">'
        + '<div class="cal-events-title">' + _calMonth + '月' + _calSelectedDay + '日</div>'
        + eventsHTML
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

// ========== 经期开关 ==========
function _calTogglePeriodStart(checked) {
    if (checked) {
        var dateStr = _calYear + '-' + _calMonth + '-' + _calSelectedDay;
        _calPeriodStart = dateStr;
    } else {
        _calPeriodStart = null;
        _calPeriodEnd = null;
    }
    _calSavePeriod();
    _calRenderMonth();
}
function _calTogglePeriodEnd(checked) {
    if (checked) {
        var dateStr = _calYear + '-' + _calMonth + '-' + _calSelectedDay;
        _calPeriodEnd = dateStr;
    } else {
        _calPeriodEnd = null;
    }
    _calSavePeriod();
    _calRenderMonth();
}

// ========== 事件 ==========
var _calLongPressTimer = null;

function _calAddEvent(d) {
    _calSelectedDay = d;
    var overlay = document.createElement('div');
    overlay.className = 'caption-modal-overlay';
    overlay.id = 'calEventOverlay';
    overlay.innerHTML = ''
        + '<div class="caption-modal">'
        + '<div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">添加事件 - ' + _calMonth + '月' + d + '日</div>'
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
    window._calEventDay = d;
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
    var d = window._calEventDay || _calSelectedDay;
    _calCloseEvent();
    if (!text) return;
    var key = _calYear + '-' + _calMonth + '-' + d;
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
