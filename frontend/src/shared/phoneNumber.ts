/**
 * Firebase console test numbers (Jamaica, +1 876). These are registered under
 * Authentication → Sign-in method → Phone → Phone numbers for testing.
 * Any other 10-digit value is an Indian mobile and is sent as +91.
 */
const TEST_PHONES: Record<string, string> = {
  '8769406319': '+18769406319',
  '8769406339': '+18769406339',
};

function testLocal(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (TEST_PHONES[digits]) return digits;
  const withoutCountry = digits.startsWith('1') ? digits.slice(1) : digits;
  return TEST_PHONES[withoutCountry] ? withoutCountry : null;
}

export function isFirebaseTestPhone(value: string): boolean {
  return testLocal(value) !== null;
}

/** Keep 10 local digits. A pasted +1 test number stays the test number. */
export function normalizePhoneInput(raw: string): string {
  const local = testLocal(raw);
  if (local) return local;
  return raw.replace(/\D/g, '').slice(0, 10);
}

/** E.164 value Firebase expects. Indian numbers stay +91; console test numbers are +1. */
export function toE164(mobileNumber: string): string {
  const local = testLocal(mobileNumber);
  if (local) return TEST_PHONES[local];
  const digits = mobileNumber.replace(/\D/g, '');
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  return `+91${national}`;
}

export function phonePrefix(mobileNumber: string): string {
  return isFirebaseTestPhone(mobileNumber) ? '+1' : '+91';
}

export function formatPhoneDisplay(raw: string): string {
  const local = testLocal(raw);
  if (local) {
    return `+1 ${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }
  const digits = raw.replace(/\D/g, '');
  const national = digits.length > 10 ? digits.slice(-10) : digits;
  if (national.length === 10) {
    return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
  }
  return raw;
}
