// Customers' numbers are typed by hand in many ways. SMS providers need +<country><number>.

/**
 * @returns {string|null} E.164 number such as +447700900123, or null when it cannot be worked out.
 * Local numbers are only accepted where the country is certain:
 *   UK mobiles are 07 + 9 digits, Ghana mobiles are 02 or 05 + 8 digits.
 */
const toE164 = (input) => {
  let value = String(input ?? '').trim();
  // "+44 (0)7700 900123": the bracketed zero is not dialled after a country code
  value = value.replace(/\(0\)/g, '').replace(/[\s().\-/]/g, '');
  if (value.startsWith('00')) value = `+${value.slice(2)}`;

  const international = value.startsWith('+');
  const digits = international ? value.slice(1) : value;
  if (!/^\d+$/.test(digits)) return null;

  // Country code included, with or without "+", and with or without a stray 0 after it
  const uk = digits.match(/^440?(7\d{9})$/);
  if (uk) return `+44${uk[1]}`;
  const ghana = digits.match(/^2330?([25]\d{8})$/);
  if (ghana) return `+233${ghana[1]}`;

  if (international) return /^[1-9]\d{7,14}$/.test(digits) && !/^(44|233)/.test(digits) ? `+${digits}` : null;

  if (/^0?7\d{9}$/.test(digits)) return `+44${digits.replace(/^0/, '')}`;
  if (/^0?[25]\d{8}$/.test(digits)) return `+233${digits.replace(/^0/, '')}`;
  return null;
};

module.exports = { toE164 };
