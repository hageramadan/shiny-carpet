const assert = require("node:assert/strict");
const { test } = require("node:test");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const {
  internationalPhone,
  normalizeDigits,
  validPhone,
  validApiPhone,
  validCountryCallingCode,
} = require("../lib/phone.ts");

test("phone utilities and auth helpers load in the React Server Components environment", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--require",
      "./tests/register-typescript.cjs",
      "--eval",
      `
      const assert = require('node:assert/strict');
      const { authDestination, validPhone } = require('./lib/auth-flow.ts');
      assert.equal(authDestination('/profile'), '/profile');
      assert.equal(validPhone('+966551234567'), true);
      assert.equal(Object.keys(require.cache).some(file => file.includes('react-phone-number-input')), false);
    `,
    ],
    { cwd: path.resolve(__dirname, ".."), encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("country codes must match a supported country and cannot absorb part of the phone", () => {
  for (const code of ["+966", "+20", "+971", "+965", "+974"])
    assert.equal(validCountryCallingCode(code), true);
  for (const code of ["", "+2", "+201", "+999", "20", "0020", "+020", "+20 ", null])
    assert.equal(validCountryCallingCode(code), false);
  assert.equal(validApiPhone("1012345678", "+20"), true);
  assert.equal(validApiPhone("551234567", "+966"), true);
  assert.equal(validApiPhone("01012345678", "+20"), false);
  assert.equal(validApiPhone("012345678", "+201"), false);
  assert.equal(validApiPhone("1012345678", "+966"), false);
});

test("a matching length is not enough when the national prefix is invalid", () => {
  for (const phone of [
    "+966151234567",
    "+201312345678",
    "+971401234567",
    "+96510123456",
    "+97415123456",
  ])
    assert.equal(validPhone(phone), false);
});

test("server-safe phone utilities retain international and Arabic-digit handling", () => {
  assert.equal(normalizeDigits("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹"), "01234567890123456789");
  assert.equal(internationalPhone("٠٥٥ ١٢٣ ٤٥٦٧"), "+966551234567");
  assert.equal(internationalPhone("+20 (10) 1234-5678"), "+201012345678");
  for (const phone of ["+966551234567", "+201012345678", "+971501234567"]) {
    assert.equal(validPhone(phone), true);
  }
  for (const phone of ["", "+966", "+966123", "abc", "+999123456789"]) {
    assert.equal(validPhone(phone), false);
  }
});

test("phone validation checks the selected country's calling code and number length", () => {
  for (const [country, phone] of [
    ["SA", "+966551234567"],
    ["EG", "+201012345678"],
    ["AE", "+971501234567"],
    ["KW", "+96550123456"],
    ["QA", "+97455123456"],
  ]) {
    assert.equal(validPhone(phone, country), true);
    assert.equal(validPhone(phone.slice(0, 6), country), false);
  }
  assert.equal(validPhone("+201012345678", "SA"), false);
  assert.equal(validPhone("", "SA"), false);
  assert.equal(validPhone("abc123", "SA"), false);
});
