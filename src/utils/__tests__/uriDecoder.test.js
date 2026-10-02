const decode = require('../../../vendor/decode-uri-component/index.cjs');
test('vendored URI decoder handles valid UTF-8 and preserves malformed escapes', () => {
  expect(decode('%E2%82%AC%20%F0%9F%8C%B1')).toBe('€ 🌱');
  expect(decode('%FF%41%ZZ')).toBe('%FFA%ZZ');
  expect(() => decode(null)).toThrow(TypeError);
  const malformed = '%FF'.repeat(10000);
  expect(decode(malformed)).toBe(malformed);
});
