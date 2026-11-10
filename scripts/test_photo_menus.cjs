'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'photo-menus.json'), 'utf8'));
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), sandbox);
const content = JSON.parse(JSON.stringify(sandbox.window.WATERLOO_DATA));

test('published drink list contains only the photographed sections and recipes', () => {
  assert.deepEqual(content.drinks, source.drinks);
  assert.equal(content.drinks.length, 20);
  const names = content.drinks.flatMap(section => section.items.map(item => item.name));
  for (const removed of ['BEE Merry', 'Orange Whip', 'Red-Faced Willie', 'Nikka Coffey Grain', 'Ocho Blanco']) {
    assert.ok(!names.includes(removed), `${removed} should not return from the old website import`);
  }
});

test('prices absent from the beer and cider photos remain unlisted', () => {
  for (const name of ['Drafts', 'Bottles & Cans', 'Ciders & Seltzers']) {
    for (const item of content.drinks.find(section => section.name === name).items) {
      assert.deepEqual(item.prices, []);
    }
  }
});

test('happy hour uses the photographed food prices and individual taco servings', () => {
  const groups = content.happyHour.sections;
  assert.equal(groups.flatMap(group => group.items).length, 22);
  assert.deepEqual(groups[0].items.map(item => item.prices[0]), ['$5.00', '$5.00', '$5.00']);
  assert.equal(groups[1].items.find(item => item.name === 'Infamous Poppers').prices[0], '$11.00');
  for (const taco of groups[2].items) {
    assert.deepEqual(taco.prices, ['$3.00']);
    assert.equal(taco.priceNote, '1 taco');
  }
  assert.ok(!('items' in content.happyHour), 'obsolete well/wine/draft happy hour items should not be carried over');
});

test('weekly specials match the new printed schedule and retain weekday keys', () => {
  assert.deepEqual(content.specials, source.specials);
  assert.equal(new Set(content.specials.map(day => day.weekday)).size, 7);
  assert.match(content.specials.find(day => day.weekday === 'Tuesday').entries[0].text, /two tacos/);
  assert.ok(content.specials.find(day => day.weekday === 'Thursday').entries.some(entry => /Schnitzel/.test(entry.text)));
  assert.match(content.specials.find(day => day.weekday === 'Sunday').entries[0].text, /10 AM–2 PM/);
});
