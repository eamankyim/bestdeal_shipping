import { COUNTRY_CODES, getCountryCodeLabel, FREIGHT_TYPES, PRIORITY_LEVELS } from './countryCodes';

describe('countryCodes', () => {
  it('exports COUNTRY_CODES with UK and Ghana', () => {
    expect(COUNTRY_CODES.length).toBeGreaterThan(0);
    expect(COUNTRY_CODES.find(c => c.country === 'UK')).toEqual({ code: '+44', country: 'UK', flag: '🇬🇧' });
    expect(COUNTRY_CODES.find(c => c.country === 'Ghana')).toBeDefined();
  });

  it('getCountryCodeLabel returns label for code', () => {
    expect(getCountryCodeLabel('+44')).toMatch(/UK/);
    expect(getCountryCodeLabel('+233')).toMatch(/Ghana/);
    expect(getCountryCodeLabel('+99')).toBe('+99');
  });

  it('exports FREIGHT_TYPES and PRIORITY_LEVELS', () => {
    expect(FREIGHT_TYPES.AIR).toBe('Air Freight');
    expect(FREIGHT_TYPES.SEA).toBe('Sea Freight');
    expect(PRIORITY_LEVELS.STANDARD).toBe('Standard');
  });
});
