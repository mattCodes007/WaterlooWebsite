'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { upcomingDays, dateKey, millisecondsToMidnight } = require('../schedule.js');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const specials = weekdays.map(weekday => ({weekday, entries: [{text: `${weekday} offer`, time: '11 AM–close'}]}));

function dates(now) { return upcomingDays(specials, new Date(now)).map(day => day.date); }

test('uses Louisville midnight, even when UTC has advanced to the next day', () => {
  assert.equal(dateKey(new Date('2026-11-10T06:59:59Z')), '2026-11-09');
  assert.equal(dateKey(new Date('2026-11-10T07:00:00Z')), '2026-11-10');
  const result = upcomingDays(specials, new Date('2026-11-10T06:59:59Z'));
  assert.equal(result[0].weekday, 'Monday');
  assert.equal(result[0].entries[0].text, 'Monday offer');
  assert.equal(result.filter(day => day.isToday).length, 1);
  assert.equal(result[6].weekday, 'Sunday');
});

test('rolls from Sunday to Monday and crosses the year boundary', () => {
  const result = upcomingDays(specials, new Date('2026-12-27T19:00:00Z'));
  assert.equal(result[0].weekday, 'Sunday');
  assert.equal(result[1].weekday, 'Monday');
  assert.equal(result[6].date, '2027-01-02');
  assert.equal(new Set(result.map(day => day.weekday)).size, 7);
});

test('keeps seven consecutive calendar days through both daylight saving changes', () => {
  for (const now of ['2027-03-13T19:00:00Z', '2027-11-06T19:00:00Z']) {
    const values = dates(now);
    for (let index = 1; index < values.length; index++) {
      assert.equal(Date.parse(values[index]) - Date.parse(values[index - 1]), 86400000);
    }
  }
});

test('supports earlier captured menu data and does not modify the source schedule', () => {
  const earlier = specials.map(day => ({name: `${day.weekday}, November 9`, entries: day.entries}));
  const before = JSON.stringify(earlier);
  assert.equal(upcomingDays(earlier, new Date('2026-11-11T19:00:00Z'))[0].weekday, 'Wednesday');
  assert.equal(JSON.stringify(earlier), before);
});


test('rotates Monday to the bottom when Tuesday begins', () => {
  const monday = upcomingDays(specials, new Date('2026-11-10T06:59:59Z'));
  const tuesday = upcomingDays(specials, new Date('2026-11-10T07:00:00Z'));
  assert.deepEqual(tuesday.map(day => day.weekday), [...monday.slice(1), monday[0]].map(day => day.weekday));
  assert.equal(tuesday[0].weekday, 'Tuesday');
  assert.equal(tuesday[6].weekday, 'Monday');
});

test('schedules the next refresh at local midnight, including DST days', () => {
  assert.equal(millisecondsToMidnight(new Date('2026-11-10T06:59:59Z')), 1000);
  assert.equal(millisecondsToMidnight(new Date('2027-03-14T07:00:00Z')), 23 * 60 * 60 * 1000);
  assert.equal(millisecondsToMidnight(new Date('2027-11-07T06:00:00Z')), 25 * 60 * 60 * 1000);
});
