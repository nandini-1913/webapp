import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../../routes/appRoutes';
import type { OtpVerificationArgs } from '../../../routes/appRoutes';
import { useSession } from '../../../session/SessionContext';
import { firebaseAuthMessage, sendPhoneOtp } from '../../../services/auth/phoneAuth';
import type { AuthUser } from '../../../services/auth/authModels';
import { AuthValidators } from '../../../shared/authValidators';
import { LoginFlowIconBadge } from '../../../shared/LoginFlowIconBadge';
import { LoginFlowModeToggle } from '../../../shared/LoginFlowModeToggle';
import { LoginFlowPhoneField } from '../../../shared/LoginFlowPhoneField';
import { LoginFlowContinueButton } from '../../../shared/LoginFlowContinueButton';
import { LoginFlowTermsFooter } from '../../../shared/LoginFlowTermsFooter';
import { AuthWebLayout } from '../../../shared/AuthWebLayout';
import mockData from '../../../mocks/mockData.json';
import loginMock from './Login.mock.json';
import {
  Screen,
  Content,
  Spacer,
  SkipButton,
  BadgeWrap,
  Title,
  Subtitle,
  FieldLabel,
  Hint,
  ErrorText,
} from './Login.styles';

const { appName } = mockData.appConstants;

/** Step 1 — phone number entry. */
export function Login() {
  const navigate = useNavigate();
  const { setFromAuth } = useSession();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flutter `mounted` check after awaits.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const canContinue = AuthValidators.mobile(mobile) === null;

  const handleContinue = async () => {
    const value = mobile.trim();
    if (AuthValidators.mobile(value) !== null) return;

    setLoading(true);
    setError(null);
    try {
      await sendPhoneOtp(value);
      if (!mounted.current) return;

      const args: OtpVerificationArgs = {
        contactDisplay: AuthValidators.formatMobileDisplay(value),
        mobileNumber: value,
      };
      navigate(AppRoutes.otpVerification, { state: args });
    } catch (sendError) {
      if (mounted.current) setError(firebaseAuthMessage(sendError));
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const handleSkipLogin = () => {
    const guest: AuthUser = { id: 'guest', email: '', fullName: 'Guest', isGuest: true };
    setFromAuth(guest);
    navigate(AppRoutes.main, { replace: true });
  };

  return (
    <AuthWebLayout>
      <Screen>
        <Content>
          <SkipButton type="button" onClick={handleSkipLogin}>
            Skip login
          </SkipButton>
          <Spacer $flex={2} />
          <BadgeWrap>
            <LoginFlowIconBadge
              imageSrc={loginMock.iconBadge.imageAsset}
              size={loginMock.iconBadge.size}
            />
          </BadgeWrap>
          <Title>{appName}</Title>
          <Subtitle>
            {isLogin ? 'Welcome back! Login to continue' : 'Create an account to get started'}
          </Subtitle>
          <LoginFlowModeToggle isLogin={isLogin} onChanged={setIsLogin} />
          <FieldLabel>Mobile Number</FieldLabel>
          <LoginFlowPhoneField
            value={mobile}
            onChanged={(value) => {
              setMobile(value);
              setError(null);
            }}
          />
          <Hint>We'll send a 6-digit OTP to verify this number</Hint>
          {error && <ErrorText role="alert">{error}</ErrorText>}
          <LoginFlowContinueButton
            label="Send OTP"
            enabled={canContinue}
            loading={loading}
            onPressed={handleContinue}
          />
          <div id="firebase-recaptcha" />
          <Spacer $flex={3} />
          <LoginFlowTermsFooter />
        </Content>
      </Screen>
    </AuthWebLayout>
  );
}
