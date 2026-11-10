(function (root, factory) {
  const schedule = factory();
  if (typeof module === 'object' && module.exports) module.exports = schedule;
  else root.WaterlooSchedule = schedule;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const timeZone = 'America/Denver';
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const localDate = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const heading = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });

  function dateKey(now = new Date()) {
    const parts = Object.fromEntries(localDate.formatToParts(now).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function upcomingDays(specials, now = new Date()) {
    const today = dateKey(now);
    const start = new Date(`${today}T12:00:00Z`);
    const byWeekday = new Map(specials.map(day => [day.weekday || day.name.split(/[ ,]/)[0], day]));
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + offset);
      const weekday = weekdays[date.getUTCDay()];
      const source = byWeekday.get(weekday);
      if (!source) throw new Error(`Missing recurring specials for ${weekday}`);
      return {
        weekday,
        date: date.toISOString().slice(0, 10),
        label: heading.format(date),
        isToday: offset === 0,
        entries: source.entries
      };
    });
  }

  function millisecondsToMidnight(now = new Date()) {
    const current = dateKey(now);
    const start = now.getTime();
    let low = start;
    let high = start + 36 * 60 * 60 * 1000;
    // Find the next local calendar boundary, including 23- and 25-hour days.
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      if (dateKey(new Date(middle)) === current) low = middle;
      else high = middle;
    }
    return high - start;
  }

  return { dateKey, upcomingDays, millisecondsToMidnight, timeZone };
});
