const test = require('node:test');
const assert = require('node:assert/strict');
const { runLater, drain } = require('../src/utils/background');

test('background work starts after the caller has moved on, and a failure never reaches the caller', async () => {
  const order = [];
  runLater('first', async () => { order.push('message sent'); });
  runLater('broken', async () => { throw new Error('provider down'); });
  order.push('answer sent');
  assert.deepEqual(order, ['answer sent'], 'nothing ran before the answer');
  await drain();
  assert.deepEqual(order, ['answer sent', 'message sent']);
});

test('drain waits for work that starts more work', async () => {
  let done = false;
  runLater('outer', async () => { runLater('inner', async () => { done = true; }); });
  await drain();
  assert.equal(done, true);
});
