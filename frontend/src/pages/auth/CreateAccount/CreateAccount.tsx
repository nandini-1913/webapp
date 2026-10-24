import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../../routes/appRoutes';
import type { SignupFlowArgs } from '../../../routes/appRoutes';
import { LoginFlowBackButton } from '../../../shared/LoginFlowBackButton';
import { LoginFlowIconBadge } from '../../../shared/LoginFlowIconBadge';
import { LoginFlowOutlinedField } from '../../../shared/LoginFlowOutlinedField';
import { LoginFlowContinueButton } from '../../../shared/LoginFlowContinueButton';
import { LoginFlowTermsFooter } from '../../../shared/LoginFlowTermsFooter';
import { AuthWebLayout } from '../../../shared/AuthWebLayout';
import createAccountMock from './CreateAccount.mock.json';
import {
  Screen,
  Content,
  BadgeWrap,
  Title,
  Subtitle,
  NameFieldWrap,
  EmailFieldWrap,
  ReferralFieldWrap,
  Spacer,
  FooterWrap,
} from './CreateAccount.styles';

/** Step 3 — collect full name before profession selection. */
export function CreateAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const args = location.state as SignupFlowArgs | null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referral, setReferral] = useState('');

  const handleContinue = () => {
    const mobile = args?.mobileNumber;
    if (!mobile) {
      // Navigator.pop()
      navigate(-1);
      return;
    }

    const referralCode = referral.trim();
    const nextArgs: SignupFlowArgs = {
      mobileNumber: mobile,
      fullName: name.trim(),
      email: email.trim(),
      referralCode: referralCode === '' ? undefined : referralCode,
    };
    navigate(AppRoutes.chooseLocation, { state: nextArgs });
  };

  return (
    <AuthWebLayout>
      <Screen>
        <Content>
          <LoginFlowBackButton onPressed={() => navigate(-1)} />
          <BadgeWrap>
            <LoginFlowIconBadge
              icon={createAccountMock.iconBadge.icon}
              size={createAccountMock.iconBadge.size}
            />
          </BadgeWrap>
          <Title>Create Your Account</Title>
          <Subtitle>Just a couple of details to get you started</Subtitle>
          <NameFieldWrap>
            <LoginFlowOutlinedField
              label="Full Name"
              value={name}
              onChanged={setName}
              hintText="Enter your full name"
              textCapitalization="words"
              prefixIcon="pi pi-user"
            />
          </NameFieldWrap>
          <EmailFieldWrap>
            <LoginFlowOutlinedField
              label="Email Address"
              value={email}
              onChanged={setEmail}
              hintText="Enter your email address"
              inputMode="email"
              prefixIcon="pi pi-envelope"
            />
          </EmailFieldWrap>
          <ReferralFieldWrap>
            <LoginFlowOutlinedField
              label="Referral Code (Optional)"
              value={referral}
              onChanged={setReferral}
              hintText="Enter referral code, if you have one"
              textCapitalization="characters"
              prefixIcon="pi pi-gift"
            />
          </ReferralFieldWrap>
          <Spacer />
          <LoginFlowContinueButton label="Continue" onPressed={handleContinue} />
          <FooterWrap>
            <LoginFlowTermsFooter />
          </FooterWrap>
        </Content>
      </Screen>
    </AuthWebLayout>
  );
}
