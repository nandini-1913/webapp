/**
 * Mirrors Flutter `features/auth/presentation/widgets/auth_validators.dart`.
 * Each validator returns an error message, or null when valid.
 */

import { formatPhoneDisplay, isFirebaseTestPhone } from './phoneNumber';

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
    const digits = v.replace(/^\+91/, '').replace(/^\+1/, '').replace(/\D/g, '');
    if (digits === '') return 'Mobile number is required';
    if (isFirebaseTestPhone(digits) || MOBILE.test(digits)) return null;
    return 'Enter a valid 10-digit mobile number';
  },

  formatMobileDisplay(raw: string): string {
    return formatPhoneDisplay(raw);
  },
};
