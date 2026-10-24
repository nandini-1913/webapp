import {
  getAdditionalUserInfo,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { auth, requireFirebaseConfig } from '../../firebase';
import type { AuthUser } from './authModels';

const RECAPTCHA_CONTAINER_ID = 'firebase-recaptcha';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

function toE164(mobileNumber: string): string {
  const digits = mobileNumber.replace(/\D/g, '');
  const localNumber = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  return `+91${localNumber}`;
}

function clearRecaptcha() {
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
}

export async function sendPhoneOtp(mobileNumber: string): Promise<void> {
  requireFirebaseConfig();
  clearRecaptcha();

  if (!document.getElementById(RECAPTCHA_CONTAINER_ID)) {
    throw new Error('Phone verification could not start. Reload the page and try again.');
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
    size: 'invisible',
  });

  try {
    confirmationResult = await signInWithPhoneNumber(auth, toE164(mobileNumber), recaptchaVerifier);
    clearRecaptcha();
  } catch (error) {
    clearRecaptcha();
    throw error;
  }
}

export async function confirmPhoneOtp(code: string): Promise<{ user: User; isNewUser: boolean }> {
  if (!confirmationResult) {
    throw new Error('Request a verification code before entering an OTP.');
  }

  const credential = await confirmationResult.confirm(code);
  confirmationResult = null;

  return {
    user: credential.user,
    isNewUser: getAdditionalUserInfo(credential)?.isNewUser ?? false,
  };
}

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.uid,
    email: user.email ?? '',
    fullName: user.displayName,
    mobileNumber: user.phoneNumber,
  };
}

export function firebaseAuthMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Enter a valid mobile number.';
    case 'auth/invalid-verification-code':
      return 'That verification code is incorrect. Check it and try again.';
    case 'auth/code-expired':
    case 'auth/session-expired':
    case 'auth/invalid-verification-id':
      return 'That verification code has expired. Request a new code.';
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded':
      return 'Too many attempts. Wait a while before trying again.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is not enabled for this Firebase project.';
    case 'auth/invalid-app-credential':
    case 'auth/captcha-check-failed':
      return 'App verification failed. Check the Firebase authorized domains and try again.';
    case 'auth/billing-not-enabled':
      return 'Firebase phone authentication requires billing to be enabled for this project.';
    default:
      if (error instanceof Error && error.message) return error.message;
      return 'Phone verification failed. Please try again.';
  }
}
