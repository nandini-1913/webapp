import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../../routes/appRoutes';
import type { SignupFlowArgs } from '../../../routes/appRoutes';
import type { UserRole } from '../../../services/auth/authModels';
import { useSession } from '../../../session/SessionContext';
import { LoginFlowBackButton } from '../../../shared/LoginFlowBackButton';
import { LoginFlowContinueButton } from '../../../shared/LoginFlowContinueButton';
import { AuthWebLayout } from '../../../shared/AuthWebLayout';
import chooseProfessionMock from './ChooseProfession.mock.json';
import {
  Screen,
  Content,
  Header,
  HeaderText,
  Title,
  Subtitle,
  List,
  Option,
  Thumb,
  ThumbImage,
  ThumbFallback,
  OptionText,
  OptionTitle,
  OptionSubtitle,
  Indicator,
  ContinueWrap,
} from './ChooseProfession.styles';

/** Flutter `_ProfessionOption`. */
interface ProfessionOption {
  title: string;
  subtitle: string;
  role: UserRole;
  imageAsset: string;
}

const options = chooseProfessionMock._options as ProfessionOption[];

/** AppRouter fallback when no SignupFlowArgs are passed. */
const fallbackArgs: SignupFlowArgs = { mobileNumber: '', fullName: '' };

/** Image.asset with its errorBuilder fallback. */
function ProfessionThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <Thumb>
      {failed ? (
        <ThumbFallback>
          <i className="pi pi-image" aria-hidden="true" />
        </ThumbFallback>
      ) : (
        <ThumbImage src={src} alt="" onError={() => setFailed(true)} />
      )}
    </Thumb>
  );
}

/** Step 4 — profession selection before entering the app. */
export function ChooseProfession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setFromAuth } = useSession();
  const args = (location.state as SignupFlowArgs | null) ?? fallbackArgs;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleContinue = () => {
    if (selectedIndex === null) return;
    const option = options[selectedIndex];

    setFromAuth({
      id: `user-mobile-${args.mobileNumber}`,
      email: args.email ?? '',
      fullName: args.fullName,
      mobileNumber: args.mobileNumber,
      role: option.role,
      referralCode: args.referralCode,
    });

    navigate(AppRoutes.main, { replace: true });
  };

  return (
    <AuthWebLayout>
      <Screen>
        <Content>
          <Header>
            <LoginFlowBackButton onPressed={() => navigate(-1)} />
            <HeaderText>
              <Title>Choose your profession</Title>
              <Subtitle>
                Pick what best describes you so we can personalize your experience.
              </Subtitle>
            </HeaderText>
          </Header>
          <List>
            {options.map((option, index) => {
              const selected = selectedIndex === index;
              return (
                <Option
                  key={option.title}
                  type="button"
                  $selected={selected}
                  aria-pressed={selected}
                  onClick={() => setSelectedIndex(index)}
                >
                  <ProfessionThumb src={option.imageAsset} />
                  <OptionText>
                    <OptionTitle>{option.title}</OptionTitle>
                    <OptionSubtitle>{option.subtitle}</OptionSubtitle>
                  </OptionText>
                  <Indicator $selected={selected}>
                    {selected && <i className="pi pi-check" aria-hidden="true" />}
                  </Indicator>
                </Option>
              );
            })}
          </List>
          <ContinueWrap>
            <LoginFlowContinueButton
              label="Continue"
              enabled={selectedIndex !== null}
              onPressed={handleContinue}
            />
          </ContinueWrap>
        </Content>
      </Screen>
    </AuthWebLayout>
  );
}
