import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../../routes/appRoutes';
import type { OtpVerificationArgs, SignupFlowArgs } from '../../../routes/appRoutes';
import { useSession } from '../../../session/SessionContext';
import {
  confirmPhoneOtp,
  firebaseAuthMessage,
  sendPhoneOtp,
  toAuthUser,
} from '../../../services/auth/phoneAuth';
import { AuthOtpFields } from '../../../shared/AuthOtpFields';
import type { AuthOtpFieldsHandle } from '../../../shared/AuthOtpFields';
import { LoginFlowBackButton } from '../../../shared/LoginFlowBackButton';
import { LoginFlowOtpIcon } from '../../../shared/LoginFlowOtpIcon';
import { LoginFlowContinueButton } from '../../../shared/LoginFlowContinueButton';
import { SnackBar } from '../../../shared/SnackBar';
import { AuthWebLayout } from '../../../shared/AuthWebLayout';
import mockData from '../../../mocks/mockData.json';
import {
  Screen,
  Content,
  Header,
  Title,
  HeaderTrailing,
  IconWrap,
  SentTo,
  Contact,
  FieldsWrap,
  ErrorText,
  Hint,
  ButtonWrap,
  Resend,
  ResendLink,
} from './OtpVerification.styles';

const { otpLength, otpResendSeconds } = mockData.appConstants;

/** Step 2 — OTP verification (login flow). */
export function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setFromAuth } = useSession();

  const args = location.state as OtpVerificationArgs | null;
  const contact = args?.contactDisplay ?? '';
  const rawMobile = args?.mobileNumber ?? '';

  const otpRef = useRef<AuthOtpFieldsHandle>(null);
  const [otp, setOtp] = useState('');
  const [seconds, setSeconds] = useState(otpResendSeconds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackBar, setSnackBar] = useState<{ id: number; message: string } | null>(null);

  // Flutter `mounted` check after awaits.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!args?.mobileNumber) navigate(AppRoutes.login, { replace: true });
  }, [args?.mobileNumber, navigate]);

  // Timer.periodic(1s) counting down to 0.
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const startTimer = () => setSeconds(otpResendSeconds);

  const handleChanged = useCallback((value: string) => {
    setOtp(value);
    setError(null);
  }, []);

  const dismissSnackBar = useCallback(() => setSnackBar(null), []);

  const verify = async (code?: string) => {
    const value = code ?? otp;
    if (value.length !== otpLength) return;

    setLoading(true);
    setError(null);

    try {
      const result = await confirmPhoneOtp(value);
      if (!mounted.current) return;
      setFromAuth(toAuthUser(result.user));
      setLoading(false);

      if (result.isNewUser) {
        const signupArgs: SignupFlowArgs = { mobileNumber: rawMobile, fullName: '' };
        navigate(AppRoutes.createAccount, { replace: true, state: signupArgs });
        return;
      }

      navigate(AppRoutes.main, { replace: true });
    } catch (verifyError) {
      if (!mounted.current) return;
      setLoading(false);
      // As in Flutter, clear() reports '' through onChanged, which also resets the error.
      otpRef.current?.clear();
      setError(firebaseAuthMessage(verifyError));
    }
  };

  const resend = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendPhoneOtp(rawMobile);
      if (!mounted.current) return;
      otpRef.current?.clear();
      startTimer();
      setSnackBar((previous) => ({ id: (previous?.id ?? 0) + 1, message: 'Verification code resent.' }));
    } catch (resendError) {
      if (mounted.current) setError(firebaseAuthMessage(resendError));
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <AuthWebLayout>
      <Screen>
        <Content>
          <Header>
            <LoginFlowBackButton onPressed={() => navigate(-1)} />
            <Title>Verify your number</Title>
            <HeaderTrailing />
          </Header>
          <IconWrap>
            <LoginFlowOtpIcon />
          </IconWrap>
          <SentTo>We've sent a 6-digit code to</SentTo>
          <Contact>{contact}</Contact>
          <FieldsWrap>
            <AuthOtpFields
              ref={otpRef}
              hasError={error !== null}
              onChanged={handleChanged}
              onCompleted={verify}
            />
          </FieldsWrap>
          {error !== null && <ErrorText>{error}</ErrorText>}
          <Hint>Tap the boxes to enter or paste your code</Hint>
          <ButtonWrap>
            <LoginFlowContinueButton
              label="Enter 6-digit code"
              enabled={otp.length === otpLength}
              loading={loading}
              onPressed={() => verify()}
            />
          </ButtonWrap>
          <Resend>
            Didn't receive the code?{' '}
            {seconds > 0 ? (
              `Resend OTP in 0:${String(seconds).padStart(2, '0')}`
            ) : (
              <ResendLink type="button" disabled={loading} onClick={resend}>
                Resend OTP
              </ResendLink>
            )}
          </Resend>
        </Content>
        <div id="firebase-recaptcha" />
        {snackBar && (
          <SnackBar key={snackBar.id} message={snackBar.message} onDismissed={dismissSnackBar} />
        )}
      </Screen>
    </AuthWebLayout>
  );
}
