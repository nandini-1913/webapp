import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { toE164 } from '../../shared/phoneNumber';
import type { AuthUser } from './authModels';

const RECAPTCHA_ID = 'firebase-recaptcha';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

function recaptchaContainer(): HTMLElement {
  document.getElementById(RECAPTCHA_ID)?.remove();
  const container = document.createElement('div');
  container.id = RECAPTCHA_ID;
  document.body.appendChild(container);
  return container;
}

function clearVerifier() {
  try {
    recaptchaVerifier?.clear();
  } catch {
    // Widget was already removed.
  }
  recaptchaVerifier = null;
  document.getElementById(RECAPTCHA_ID)?.remove();
}

/**
 * Starts Firebase phone sign-in. Test numbers registered in the Firebase
 * console do not receive an SMS; the code is the one set next to that number.
 */
export async function sendFirebaseOtp(mobileNumber: string): Promise<void> {
  clearVerifier();
  recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer(), {
    size: 'invisible',
  });
  try {
    confirmationResult = await signInWithPhoneNumber(
      auth,
      toE164(mobileNumber),
      recaptchaVerifier,
    );
  } catch (error) {
    clearVerifier();
    confirmationResult = null;
    throw error;
  }
}

export async function confirmFirebaseOtp(code: string): Promise<User> {
  if (!confirmationResult) {
    throw new Error('Request a verification code first.');
  }
  return (await confirmationResult.confirm(code)).user;
}

export function userFromFirebase(user: User, mobileNumber: string): AuthUser {
  return {
    id: user.uid,
    email: user.email ?? '',
    fullName: user.displayName,
    mobileNumber: user.phoneNumber ?? toE164(mobileNumber),
  };
}

export function firebaseAuthMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Firebase is blocking SMS for this number’s country. Enter 8769406319 or 8769406339 so the number is sent as +1. For a real number, allow that country under Authentication → Settings → SMS region policy.';
    case 'auth/invalid-phone-number':
      return 'This number is not valid for verification.';
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/invalid-verification-code':
      return 'That code does not match. Enter the OTP set for this test number in Firebase.';
    case 'auth/invalid-verification-id':
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'This code has expired. Request a new one.';
    case 'auth/invalid-app-credential':
    case 'auth/captcha-check-failed':
    case 'auth/missing-client-identifier':
      return 'Verification could not start. Use a phone number added under Firebase test numbers, then enter its OTP.';
    default:
      if (error instanceof Error && error.message) return error.message;
      return 'Could not verify this number. Try again.';
  }
}
