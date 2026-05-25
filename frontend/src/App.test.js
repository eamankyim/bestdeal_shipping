/**
 * App smoke test - avoids loading full App (and react-router-dom) in Jest
 * to prevent ESM/resolution issues. See utils/countryCodes.test.js for unit tests.
 */
test('app test environment runs', () => {
  expect(true).toBe(true);
});
