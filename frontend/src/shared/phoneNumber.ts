/** Firebase console test number: +1 876-940-6339. */
const TEST_LOCAL = '8769406339';
const TEST_E164 = '+18769406339';

export function isFirebaseTestPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits === TEST_LOCAL || digits === `1${TEST_LOCAL}`;
}

/** E.164 value Firebase expects. Indian numbers stay +91; the console test number is +1. */
export function toE164(mobileNumber: string): string {
  if (isFirebaseTestPhone(mobileNumber)) return TEST_E164;
  const digits = mobileNumber.replace(/\D/g, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return `+91${local}`;
}

export function phonePrefix(mobileNumber: string): string {
  return isFirebaseTestPhone(mobileNumber) ? '+1' : '+91';
}

export function formatPhoneDisplay(raw: string): string {
  if (isFirebaseTestPhone(raw)) return '+1 876-940-6339';
  const digits = raw.replace(/\D/g, '');
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  return raw;
}
