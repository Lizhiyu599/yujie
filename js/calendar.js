/**
 * 玉界 - 日历
 * 4x4小组件 + 完整月视图 + 事件管理 + 经期追踪
 */

var _calYear, _calMonth, _calSelectedDay;
var _calEvents = {};
var _calPeriodStart = null;
var _calPeriodEnd = null;

// ========== 农历数据（1900-2100） ==========
var _lunarInfo = [0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,0x0d520];
var _lunarMonthNames = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
var _lunarDayNames = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

function _calGetLunar(year, month, day) {
    var offset = 0;
    for (var i = 1900; i < year; i++) offset += _calLunarYearDays(i);
    for (var m = 1; m < month; m++) offset += _calSolarMonthDays(year, m);
    offset += day - 1;
    var lunarYear, lunarMonth, lunarDay, isLeap = false;
    for (lunarYear = 1900; lunarYear < 2100 && offset > 0; lunarYear++) { var days = _calLunarYearDays(lunarYear); if (offset < days) break; offset -= days; }
    var leapMonth = _lunarInfo[lunarYear - 1900] & 0xf;
    var lunarMonthIdx = 0;
    for (lunarMonthIdx = 1; lunarMonthIdx <= 12 && offset > 0; lunarMonthIdx++) {
        var mDays = _calLunarMonthDays(lunarYear, lunarMonthIdx);
        if (offset < mDays) break; offset -= mDays;
        if (lunarMonthIdx === leapMonth) { mDays = _calLeapMonthDays(lunarYear); if (offset < mDays) { isLeap = true; break; } offset -= mDays; }
    }
    lunarMonth = lunarMonthIdx; lunarDay = offset + 1;
    if (lunarDay === 1) return (isLeap ? '闰' : '') + _lunarMonthNames[lunarMonth - 1] + '月';
    return _lunarDayNames[lunarDay - 1];
}
function _calLunarYearDays(y) { var sum = 348; for (var i = 0x8000; i > 0x8; i >>= 1) sum += (_lunarInfo[y - 1900] & i) ? 1 : 0; return sum + _calLeapMonthDays(y); }
function _calLeapMonthDays(y) { if (_lunarInfo[y - 1900] & 0xf) return (_lunarInfo[y - 1900] & 0x10000) ? 30 : 29; return 0; }
function _calLunarMonthDays(y, m) { return (_lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29; }
function _calSolarMonthDays(y, m) { if (m === 2) return ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 29 : 28; return [31,0,31,30,31,30,31,31,30,31,30,31][m-1]; }

function _calLoadEvents() {
    try { var raw = localStorage.getItem('calendar_events'); _calEvents = raw ? JSON.parse(raw) : {}; } catch(e) { _calEvents = {}; }
    _calPeriodStart = localStorage.getItem('cal_period_start') || null;
    _calPeriodEnd = localStorage.getItem('cal_period_end') || null;
}
function _calSaveEvents() { localStorage.setItem('calendar_events', JSON.stringify(_calEvents)); }
function _calSavePeriod() {
    if (_calPeriodStart) localStorage.setItem('cal_period_start', _calPeriodStart); else localStorage.removeItem('cal_period_start');
    if (_calPeriodEnd) localStorage.setItem('cal_period_end', _calPeriodEnd); else localStorage.removeItem('cal_period_end');
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
    var now = new Date(); _calYear = now.getFullYear(); _calMonth = now.getMonth() + 1; _calSelectedDay = now.getDate();
    _calRenderMonth(); appWindow.style.display = 'flex';
}
function closeCalendar() { var appWindow = document.getElementById('calendarAppWindow'); if (appWindow) appWindow.style.display = 'none'; }

function _calGetDayType(year, month, day) {
    if (!_calPeriodStart) return '';
    var d = new Date(year, month - 1, day);
    var start = new Date(_calPeriodStart);
    var end = _calPeriodEnd ? new Date(_calPeriodEnd) : null;
    if (d.toDateString() === start.toDateString()) return 'period';
    if (end && d >= start && d <= end) return 'period';
    var nextStart = new Date(start); nextStart.setDate(nextStart.getDate() + 28);
    var predictStart = new Date(nextStart); predictStart.setDate(predictStart.getDate() - 2);
    if (d >= predictStart && d < nextStart) return 'predict';
    var ovulation = new Date(nextStart); ovulation.setDate(ovulation.getDate() - 14);
    var ovStart = new Date(ovulation); ovStart.setDate(ovStart.getDate() - 2);
    var ovEnd = new Date(ovulation); ovEnd.setDate(ovEnd.getDate() + 2);
    if (d >= ovStart && d <= ovEnd) return 'ovulation';
    return '';
}

function _calRenderMonth() {
    var appWindow = document.getElementById('calendarAppWindow');
    if (!appWindow) return;
    var daysInMonth = new Date(_calYear, _calMonth, 0).getDate();
    var firstDay = new Date(_calYear, _calMonth - 1, 1).getDay();
    var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

    var gridHTML = '';
    ['日','一','二','三','四','五','六'].forEach(function(d) { gridHTML += '<div class="cal-month-day-name">' + d + '</div>'; });
    for (var i = 0; i < firstDay; i++) gridHTML += '<div class="cal-month-day other-month"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
        var isToday = (_calYear === new Date().getFullYear() && _calMonth === (new Date().getMonth()+1) && d === new Date().getDate());
        var isSelected = d === _calSelectedDay;
        var highlightClass = isSelected ? ' selected' : (isToday ? ' today' : '');
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
        gridHTML += '<div class="cal-month-day' + highlightClass + typeClass + '" onclick="_calSelectDay(' + d + ')" oncontextmenu="event.preventDefault();" ontouchstart="_calLongPressTimer=setTimeout(function(){_calAddEvent(' + d + ');},600);" ontouchend="clearTimeout(_calLongPressTimer);" ontouchmove="clearTimeout(_calLongPressTimer);">' + d + '<div class="cal-month-dots">' + dotsHTML + '</div></div>';
    }

    var selectedKey = _calYear + '-' + _calMonth + '-' + _calSelectedDay;
    var selectedEvents = _calEvents[selectedKey] || [];
    var eventsHTML = '';
    if (selectedEvents.length === 0) {
        eventsHTML = '<div style="color:#c7c7cc;font-size:13px;padding:8px 0;">长按日期添加事件</div>';
    } else {
        selectedEvents.forEach(function(ev, i) {
            var typeLabel = ev.type === 'period' ? '经期' : (ev.type === 'anniversary' ? '纪念日' : '生日');
            var dotColor = ev.type === 'period' ? '#ff6b6b' : (ev.type === 'anniversary' ? '#a8d8a8' : '#c0c0c0');
            eventsHTML += '<div class="cal-event-item"><div class="cal-event-dot" style="background:' + dotColor + ';"></div><div class="cal-event-text">' + ev.text + '<span style="color:#8e8e93;font-size:11px;margin-left:6px;">' + typeLabel + '</span></div><div class="cal-event-del" onclick="event.stopPropagation();_calDeleteEvent(' + _calSelectedDay + ', ' + i + ')">×</div></div>';
        });
    }

    var periodSwitchHTML = '';
    if (!_calPeriodStart && !_calPeriodEnd) {
        periodSwitchHTML = '<div class="cal-switch-row"><span>经期开始了吗？</span><input type="checkbox" class="ios-switch-sm" onchange="_calTogglePeriodStart(this.checked)"></div>';
    } else if (_calPeriodStart && !_calPeriodEnd) {
        periodSwitchHTML = '<div class="cal-switch-row"><span>经期结束了吗？</span><input type="checkbox" class="ios-switch-sm" onchange="_calTogglePeriodEnd(this.checked)"></div>';
    }

    appWindow.innerHTML = '<div class="cal-app">'
        + '<div class="cal-nav"><div class="cal-nav-back" onclick="closeCalendar()">‹</div><div class="cal-nav-title">日历</div></div>'
        + '<div class="cal-body">'
        + '<div class="cal-month-header"><span class="cal-month-arrow" onclick="_calPrevMonth()">‹</span><span>' + _calYear + '年' + monthNames[_calMonth-1] + '</span><span class="cal-month-arrow" onclick="_calNextMonth()">›</span></div>'
        + '<div class="cal-month-grid">' + gridHTML + '</div>'
        + '<div class="cal-events">' + eventsHTML + '</div>'
        + (periodSwitchHTML ? '<div class="cal-period-switch">' + periodSwitchHTML + '</div>' : '')
        + '</div></div>';
}

function _calPrevMonth() { if (_calMonth === 1) { _calMonth = 12; _calYear--; } else _calMonth--; _calSelectedDay = 1; _calRenderMonth(); }
function _calNextMonth() { if (_calMonth === 12) { _calMonth = 1; _calYear++; } else _calMonth++; _calSelectedDay = 1; _calRenderMonth(); }
function _calSelectDay(d) { _calSelectedDay = d; _calRenderMonth(); }

function _calTogglePeriodStart(checked) {
    if (checked) { _calPeriodStart = _calYear + '-' + _calMonth + '-' + _calSelectedDay; _calPeriodEnd = null; }
    else { _calPeriodStart = null; }
    _calSavePeriod(); _calRenderMonth();
}
function _calTogglePeriodEnd(checked) {
    if (checked) { _calPeriodEnd = _calYear + '-' + _calMonth + '-' + _calSelectedDay; }
    else { _calPeriodEnd = null; }
    _calSavePeriod(); _calRenderMonth();
}

var _calLongPressTimer = null;
function _calAddEvent(d) {
    _calSelectedDay = d;
    var overlay = document.createElement('div'); overlay.className = 'caption-modal-overlay'; overlay.id = 'calEventOverlay';
    overlay.innerHTML = '<div class="caption-modal">'
        + '<div style="font-size:15px;font-weight:600;margin-bottom:10px;color:#000;">添加事件 - ' + _calMonth + '月' + d + '日</div>'
        + '<input type="text" class="payment-note" id="calEventText" placeholder="事件名称">'
        + '<div style="display:flex;gap:8px;margin-top:8px;">'
        + '<div class="ac-cat-item" onclick="_calPickType(this,\'period\')" style="flex:1;">经期</div>'
        + '<div class="ac-cat-item" onclick="_calPickType(this,\'anniversary\')" style="flex:1;">纪念日</div>'
        + '<div class="ac-cat-item" onclick="_calPickType(this,\'birthday\')" style="flex:1;">生日</div>'
        + '</div>'
        + '<div class="caption-buttons" style="margin-top:12px;"><div class="payment-btn-cancel" onclick="_calCloseEvent()">取消</div><div class="payment-btn-confirm" onclick="_calConfirmEvent()">确定</div></div></div>';
    document.body.appendChild(overlay);
    overlay.onclick = function(e) { if (e.target === overlay) _calCloseEvent(); };
    window._calPickedType = 'period'; window._calEventDay = d;
}
function _calPickType(el, type) { window._calPickedType = type; var items = el.parentElement.querySelectorAll('.ac-cat-item'); items.forEach(function(i) { i.classList.remove('selected'); }); el.classList.add('selected'); }
function _calCloseEvent() { var o = document.getElementById('calEventOverlay'); if (o) o.remove(); }
function _calConfirmEvent() {
    var text = document.getElementById('calEventText').value.trim(); var type = window._calPickedType || 'period'; var d = window._calEventDay || _calSelectedDay;
    _calCloseEvent(); if (!text) return;
    var key = _calYear + '-' + _calMonth + '-' + d;
    if (!_calEvents[key]) _calEvents[key] = []; _calEvents[key].push({ text: text, type: type });
    _calSaveEvents(); _calRenderMonth();
}
function _calDeleteEvent(d, index) {
    var key = _calYear + '-' + _calMonth + '-' + d;
    if (_calEvents[key]) { _calEvents[key].splice(index, 1); if (_calEvents[key].length === 0) delete _calEvents[key]; }
    _calSaveEvents(); _calRenderMonth();
}
