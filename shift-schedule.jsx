import React, { useState } from 'react';
import { Calendar, Clock, Users } from 'lucide-react';

export default function ShiftScheduleApp() {
  const ISRAEL_TIME_ZONE = 'Asia/Jerusalem';
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const formatDatePartsToIso = (year, month, day) =>
    `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  const parseIsoDateString = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return { year, month, day };
  };

  const getIsraelTodayIsoDate = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: ISRAEL_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());

    const year = Number(parts.find((part) => part.type === 'year').value);
    const month = Number(parts.find((part) => part.type === 'month').value);
    const day = Number(parts.find((part) => part.type === 'day').value);

    return formatDatePartsToIso(year, month, day);
  };

  const createUtcDateFromIso = (dateString) => {
    const { year, month, day } = parseIsoDateString(dateString);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const createDisplayDateForIsrael = (dateString) => {
    const { year, month, day } = parseIsoDateString(dateString);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  };

  const getDayOfWeekInIsrael = (dateString) => createUtcDateFromIso(dateString).getUTCDay();

  const addDaysToIsoDate = (dateString, daysToAdd) => {
    const utcDate = createUtcDateFromIso(dateString);
    utcDate.setUTCDate(utcDate.getUTCDate() + daysToAdd);

    return formatDatePartsToIso(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth() + 1,
      utcDate.getUTCDate()
    );
  };

  const [selectedDate, setSelectedDate] = useState(getIsraelTodayIsoDate);
  const [selectedShift, setSelectedShift] = useState('morning');
  const [viewMode, setViewMode] = useState('daily');

  const shifts = {
    morning: { name: 'משמרת בוקר', time: 'תדריך 06:30 | תחילת משמרת 07:00', icon: '🌅' },
    noon: { name: 'משמרת צהריים', time: 'תדריך 13:30 | תחילת משמרת 14:00', icon: '☀️' },
    noonLate: { name: 'משמרת צהריים', time: 'תדריך 14:30 | תחילת משמרת 15:00', icon: '☀️' },
    night: { name: 'משמרת לילה', time: 'תדריך 20:30 | תחילת משמרת 21:00', icon: '🌙' }
  };

  const getNoonShiftForDay = (dateString) => {
    const dayOfWeek = getDayOfWeekInIsrael(dateString);
    // Sunday = 0, Tuesday = 2, Thursday = 4
    if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4) {
      return 'noonLate';
    }
    return 'noon';
  };

  const getUnitByOffset = (offset, shift) => {
    const shiftToPosition = {
      noon: 0,
      morning: 1,
      night: 2
    };
    const position = shiftToPosition[shift];
    return ((offset + position) % 3) + 1;
  };

  const getUnitOnShift = (date, shift) => {
    const targetDate = createUtcDateFromIso(date);
    // Reference date: February 22, 2026 (Sunday) with W=0
    const cycleStartDate = createUtcDateFromIso('2026-02-22');
    const timeDiff = targetDate - cycleStartDate;
    const daysDiff = Math.floor(timeDiff / DAY_IN_MS);
    const totalDays = daysDiff >= 0 ? daysDiff : daysDiff + Math.ceil(Math.abs(daysDiff) / 21) * 21;
    const W = Math.floor(totalDays / 7) % 3;
    const dayOfWeek = getDayOfWeekInIsrael(date);
    
    let offset;
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      // Block 1 (Sun-Mon): Offset = (W * 2) mod 3
      offset = (W * 2) % 3;
    } else if (dayOfWeek === 2 || dayOfWeek === 3) {
      // Block 2 (Tue-Wed): Offset = (2 - W + 3) mod 3
      offset = (2 - W + 3) % 3;
    } else if (dayOfWeek === 4 || dayOfWeek === 5) {
      // Block 3 (Thu-Fri): Offset = (1 - W + 3) mod 3
      offset = (1 - W + 3) % 3;
    } else {
      // Block 4 (Saturday): Offset = (W * 2) mod 3 (same as Sun-Mon)
      offset = (W * 2) % 3;
    }
    
    return getUnitByOffset(offset, shift);
  };

  const formatDate = (dateString) => {
    const date = createDisplayDateForIsrael(dateString);
    return date.toLocaleDateString('he-IL', { 
      timeZone: ISRAEL_TIME_ZONE,
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDayOfWeekHebrew = (dateString) => {
    const dayOfWeek = getDayOfWeekInIsrael(dateString);
    return HEBREW_DAYS[dayOfWeek];
  };

  const getWeekStartDate = (dateString) => {
    const dayOfWeek = getDayOfWeekInIsrael(dateString);
    return addDaysToIsoDate(dateString, -dayOfWeek);
  };

  const generateWeeklySchedule = (weekStartDate) => {
    const schedule = [];
    
    for (let i = 0; i < 7; i++) {
      const dateStr = addDaysToIsoDate(weekStartDate, i);
      const noonShiftKey = getNoonShiftForDay(dateStr);
      
      schedule.push({
        day: HEBREW_DAYS[i],
        date: dateStr,
        dateDisplay: createDisplayDateForIsrael(dateStr).toLocaleDateString('he-IL', {
          timeZone: ISRAEL_TIME_ZONE,
          day: 'numeric',
          month: 'numeric'
        }),
        morning: getUnitOnShift(dateStr, 'morning'),
        noon: getUnitOnShift(dateStr, 'noon'),
        night: getUnitOnShift(dateStr, 'night'),
        noonTime: shifts[noonShiftKey].time
      });
    }
    
    return schedule;
  };

  const currentUnit = getUnitOnShift(selectedDate, selectedShift);
  const weekStartDate = getWeekStartDate(selectedDate);
  const weeklySchedule = generateWeeklySchedule(weekStartDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">לוח משמרות יח"ס</h1>
          <p className="text-gray-600">בחר תאריך ומשמרת כדי לראות איזו יח"ס במשמרת</p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-md inline-flex">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-6 py-2 rounded-md transition-all ${
                viewMode === 'daily'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              תצוגה יומית
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-6 py-2 rounded-md transition-all ${
                viewMode === 'weekly'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              תצוגה שבועית
            </button>
          </div>
        </div>

        {viewMode === 'daily' ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 ml-2" />
                בחר תאריך
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                {formatDate(selectedDate)} • יום {getDayOfWeekHebrew(selectedDate)}
              </p>
            </div>

            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                <Clock className="w-4 h-4 ml-2" />
                בחר משמרת
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedShift('morning')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedShift === 'morning'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-1">{shifts.morning.icon}</div>
                  <div className="font-semibold text-gray-800">{shifts.morning.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{shifts.morning.time}</div>
                </button>
                <button
                  onClick={() => setSelectedShift('noon')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedShift === 'noon'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-1">{shifts.noon.icon}</div>
                  <div className="font-semibold text-gray-800">{shifts.noon.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {shifts[getNoonShiftForDay(selectedDate)].time}
                  </div>
                </button>
                <button
                  onClick={() => setSelectedShift('night')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedShift === 'night'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-1">{shifts.night.icon}</div>
                  <div className="font-semibold text-gray-800">{shifts.night.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{shifts.night.time}</div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-white text-lg font-medium mb-2">יח"ס במשמרת</h2>
              <div className="text-6xl font-bold text-white mb-2">יח"ס {currentUnit}</div>
              <div className="text-blue-100 text-sm">
                {shifts[selectedShift].name} • יום {getDayOfWeekHebrew(selectedDate)}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 ml-2" />
                בחר שבוע
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                שבוע המתחיל ב-{formatDate(weekStartDate)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-right font-semibold text-gray-700 border-b-2 border-gray-200 sticky right-0 bg-gray-50">משמרת</th>
                    {weeklySchedule.map((daySchedule, index) => (
                      <th key={index} className="p-3 text-center font-semibold text-gray-700 border-b-2 border-gray-200 min-w-[100px]">
                        <div>{daySchedule.day}</div>
                        <div className="text-xs font-normal text-gray-500">{daySchedule.dateDisplay}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Morning Row */}
                  <tr className="hover:bg-blue-50 transition-colors">
                    <td className="p-3 border-b border-gray-200 font-semibold text-gray-800 sticky right-0 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🌅</span>
                        <div>
                          <div>בוקר</div>
                          <div className="text-xs font-normal text-gray-500">תדריך 06:30</div>
                        </div>
                      </div>
                    </td>
                    {weeklySchedule.map((daySchedule, index) => (
                      <td key={index} className="p-3 border-b border-gray-200 text-center">
                        <span className={`inline-block px-4 py-2 rounded-full font-bold text-white ${
                          daySchedule.morning === 1 ? 'bg-blue-500' :
                          daySchedule.morning === 2 ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}>
                          יח"ס {daySchedule.morning}
                        </span>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Noon Row */}
                  <tr className="hover:bg-orange-50 transition-colors">
                    <td className="p-3 border-b border-gray-200 font-semibold text-gray-800 sticky right-0 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">☀️</span>
                        <div>
                          <div>צהריים</div>
                          <div className="text-xs font-normal text-gray-500">תדריך 13:30/14:30</div>
                        </div>
                      </div>
                    </td>
                    {weeklySchedule.map((daySchedule, index) => (
                      <td key={index} className="p-3 border-b border-gray-200 text-center">
                        <span className={`inline-block px-4 py-2 rounded-full font-bold text-white ${
                          daySchedule.noon === 1 ? 'bg-blue-500' :
                          daySchedule.noon === 2 ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}>
                          יח"ס {daySchedule.noon}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{daySchedule.noonTime}</div>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Night Row */}
                  <tr className="hover:bg-indigo-50 transition-colors">
                    <td className="p-3 border-b border-gray-200 font-semibold text-gray-800 sticky right-0 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🌙</span>
                        <div>
                          <div>לילה</div>
                          <div className="text-xs font-normal text-gray-500">תדריך 20:30</div>
                        </div>
                      </div>
                    </td>
                    {weeklySchedule.map((daySchedule, index) => (
                      <td key={index} className="p-3 border-b border-gray-200 text-center">
                        <span className={`inline-block px-4 py-2 rounded-full font-bold text-white ${
                          daySchedule.night === 1 ? 'bg-blue-500' :
                          daySchedule.night === 2 ? 'bg-green-500' :
                          'bg-purple-500'
                        }`}>
                          יח"ס {daySchedule.night}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              
              {/* Legend */}
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-blue-500 rounded-full"></span>
                  <span>יח"ס 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                  <span>יח"ס 2</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-purple-500 rounded-full"></span>
                  <span>יח"ס 3</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
