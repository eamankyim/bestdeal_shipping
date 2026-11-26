import { countSmsParts, previewMessage } from './sms';

test('plain texts are 160 characters, then 153 per part', () => {
  expect(countSmsParts('')).toMatchObject({ length: 0, parts: 0 });
  expect(countSmsParts('a'.repeat(160))).toMatchObject({ parts: 1, isGsm: true });
  expect(countSmsParts('a'.repeat(161)).parts).toBe(2);
  expect(countSmsParts('a'.repeat(306)).parts).toBe(2);
  expect(countSmsParts('a'.repeat(307)).parts).toBe(3);
  expect(countSmsParts('£10 for you').isGsm).toBe(true);
  expect(countSmsParts('€').length).toBe(2);
});

test('special letters and emoji shorten every part', () => {
  expect(countSmsParts('Mepa wo kyɛw')).toMatchObject({ isGsm: false, parts: 1 });
  expect(countSmsParts(`${'a'.repeat(70)}ɛ`).parts).toBe(2);
  expect(countSmsParts('📦').length).toBe(2);
});

test('previews fill in example values and leave unknown placeholders visible', () => {
  expect(previewMessage('Hi {{customerName}} {{ trackingId }} {{oops}}', [{ key: 'customerName', sample: 'Jane' }, { key: 'trackingId', sample: 'T1' }])).toBe('Hi Jane T1 {{oops}}');
});
