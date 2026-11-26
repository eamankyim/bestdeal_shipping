const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLines, describeLines, lineTotals, splitLines, splitValue } = require('../src/utils/packages');

const soapAndSugar = [
  { description: 'Soap', packageType: 'Box', quantity: 1, weight: 5, estimatedPrice: 20 },
  { description: 'Sugar', packageType: 'Box', quantity: 3, weight: 10, estimatedPrice: 30 },
];

test('totals count every item, weigh and price each line by its quantity', () => {
  assert.deepEqual(lineTotals(soapAndSugar), { quantity: 4, weight: 35, value: 110, description: '1 × Soap (box), 3 × Sugar (box)' });
  assert.equal(describeLines(soapAndSugar), '1 × Soap (box), 3 × Sugar (box)');
});

test('older lines without a quantity count as one item, as before', () => {
  assert.deepEqual(lineTotals([{ description: 'TV', weight: '12.5' }, { packageType: 'Barrel', weight: 30 }]), {
    quantity: 2, weight: 42.5, value: null, description: '1 × TV, 1 × Barrel',
  });
});

test('a total price only when every line has one; bad numbers and empty lines are ignored', () => {
  assert.equal(lineTotals([{ description: 'A', estimatedPrice: 5 }, { description: 'B' }]).value, null);
  assert.deepEqual(normalizeLines([null, {}, { description: ' ', weight: '' }, { description: 'Rice', quantity: '2.7', weight: -3 }]), [
    { description: 'Rice', packageType: null, quantity: 2, weight: null, estimatedPrice: null },
  ]);
});

test('splitting: the sugar goes now and the soap waits; a line can be split too', () => {
  assert.deepEqual(splitLines(soapAndSugar, [0, 3]).now.map((line) => [line.description, line.quantity]), [['Sugar', 3]]);
  assert.deepEqual(splitLines(soapAndSugar, [0, 3]).later.map((line) => [line.description, line.quantity]), [['Soap', 1]]);
  const partly = splitLines(soapAndSugar, [1, 2]);
  assert.deepEqual(partly.now.map((line) => line.quantity), [1, 2]);
  assert.deepEqual(partly.later.map((line) => [line.description, line.quantity]), [['Sugar', 1]]);
  assert.deepEqual(splitLines(soapAndSugar, [1, 3]).later, [], 'everything goes: nothing to split');
});

test('splitting refuses numbers that do not fit', () => {
  for (const going of [[0, 0], [2, 3], [1, -1], [1, 1.5], [1], 'all']) assert.ok(splitLines(soapAndSugar, going).error, JSON.stringify(going));
  assert.match(splitLines([], [1]).error, /no item lines/);
});

test('the price follows the items, or the weight when the items have no prices', () => {
  const { now, later } = splitLines(soapAndSugar, [0, 3]);
  assert.deepEqual(splitValue(110, soapAndSugar, now, later), { now: 90, later: 20 });
  const unpriced = soapAndSugar.map(({ estimatedPrice, ...line }) => line);
  const split = splitLines(unpriced, [0, 3]);
  assert.deepEqual(splitValue(70, unpriced, split.now, split.later), { now: 60, later: 10 });
  const noWeights = unpriced.map(({ weight, ...line }) => line);
  const byCount = splitLines(noWeights, [0, 3]);
  assert.deepEqual(splitValue(100, noWeights, byCount.now, byCount.later), { now: 75, later: 25 });
  assert.deepEqual(splitValue(null, noWeights, byCount.now, byCount.later), { now: null, later: null });
});
