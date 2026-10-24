/**
 * Mirrors Flutter `features/auth/presentation/widgets/auth_validators.dart`.
 * Each validator returns an error message, or null when valid.
 */

const MOBILE = /^[6-9]\d{9}$/;

export const AuthValidators = {
  fullName(value?: string | null): string | null {
    const v = value?.trim() ?? '';
    if (v === '') return 'Full name is required';
    if (v.length < 2) return 'Enter a valid full name';
    return null;
  },

  mobile(value?: string | null): string | null {
    const v = (value ?? '').replace(/\s+/g, '');
    const digits = v.replace(/^\+91/, '').replace(/\D/g, '');
    if (digits === '') return 'Mobile number is required';
    if (!MOBILE.test(digits)) return 'Enter a valid 10-digit mobile number';
    return null;
  },

  formatMobileDisplay(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    const local = digits.length > 10 ? digits.slice(digits.length - 10) : digits;
    if (local.length === 10) {
      return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
    }
    return raw;
  },
};
