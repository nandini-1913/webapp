import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { AppRoutes } from '../../../routes/appRoutes';
import { useSession } from '../../../session/SessionContext';
import { mockProfileService } from '../../../services/profile/mockProfileService';
import { hasPendingApproval } from '../../../services/profile/profileModels';
import type { ProfileDetails, ProfileDocument } from '../../../services/profile/profileModels';
import { profileValidators as v } from '../../../services/profile/profileValidators';
import { mockRewardService } from '../../../services/rewards/mockRewardService';
import { CircularProgress } from '../../../shared/CircularProgress';
import { SnackBar } from '../../../shared/SnackBar';
import { StorefrontHeader } from '../../../shared/StorefrontHeader';
import { userInitials } from '../../../shared/userInitials';
import { ProfileSection } from './ProfileSection';
import type { SectionValues } from './ProfileSection';
import mock from './Profile.mock.json';
import {
  Screen,
  Root,
  MobileHeader,
  MobileBack,
  HeaderRow,
  Avatar,
  CameraButton,
  HeaderTitle,
  HeaderSubtitle,
  Page,
  WebHead,
  WebHeadMain,
  BackLink,
  WebTitle,
  WebSubtitle,
  Banner,
  Sections,
  AccountTitle,
  AccountRow,
  AccountTile,
  AccountText,
  Loading,
} from './Profile.styles';

const { _sections, _fields, _snack, _buttons, _account } = mock;

type SectionKey = keyof typeof _sections;

const toDocument = (file: File): ProfileDocument => ({
  fileName: file.name,
  uploadedOn: new Date().toISOString().slice(0, 10),
  previewUrl: URL.createObjectURL(file),
});

function ApprovalBanner({ placement }: { placement: 'mobile' | 'web' }) {
  return (
    <Banner $placement={placement} role="note">
      <i className="pi pi-info-circle" aria-hidden />
      <span>
        <strong>{mock._approvalBanner.title}</strong> {mock._approvalBanner.body}
      </span>
    </Banner>
  );
}

interface ProfileContentProps {
  /** True for the standalone `/profile` route (back button); false in the shell tab. */
  showBack?: boolean;
}

/**
 * Flutter `ProfileTabBody` — personal info + PAN / GST / Bank KYC sections.
 * Mobile mirrors the Flutter card list; web (≥ md) shows boxed fields in a
 * grid with inline editing. Approved sections are locked, and saving a KYC
 * section sends it back for approval.
 */
export function ProfileContent({ showBack = false }: ProfileContentProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, setFromProfile, logout } = useSession();
  const [details, setDetails] = useState<ProfileDetails | null>(null);
  const [balance, setBalance] = useState(0);
  const [editing, setEditing] = useState<SectionKey | null>(null);
  const [snack, setSnack] = useState<{ id: number; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      mockProfileService.fetch(user),
      mockRewardService.getBalanceForUser(user.id),
    ]).then(([nextDetails, nextBalance]) => {
      if (!active) return;
      setDetails(nextDetails);
      setBalance(nextBalance);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const showSnack = (message: string) =>
    setSnack((previous) => ({ id: (previous?.id ?? 0) + 1, message }));
  const hideSnack = useCallback(() => setSnack(null), []);

  const goBack = () => navigate(-1);

  const signOut = async () => {
    try {
      await logout();
      navigate(AppRoutes.login, { replace: true });
    } catch {
      showSnack('Could not sign out. Please try again.');
    }
  };

  const preview = (document: ProfileDocument) => {
    if (document.previewUrl) window.open(document.previewUrl, '_blank', 'noopener');
    else showSnack(_snack.previewUnavailable);
  };

  const lockedSnack = (key: SectionKey) => () =>
    showSnack(`${_sections[key].snackName}${_snack.lockedSuffix}`);

  const kycSaved = (key: SectionKey, next: ProfileDetails) => {
    setDetails(next);
    setEditing(null);
    showSnack(`${_sections[key].snackName}${_snack.kycSubmittedSuffix}`);
  };

  const savePersonal = async (values: SectionValues) => {
    if (!details) return;
    const next = await mockProfileService.savePersonal(user.id, {
      ...details.personal,
      fullName: values.fullName,
      email: values.email,
      address: values.address,
    });
    setDetails(next);
    setEditing(null);
    // Keep the session (header, initials) in sync with the new name/email.
    setFromProfile({ ...user, name: values.fullName, email: values.email });
    showSnack(_snack.personalSaved);
  };

  const savePan = async (values: SectionValues, file: File | null) => {
    const next = await mockProfileService.savePan(user.id, {
      panNumber: values.panNumber,
      nameOnDocument: values.nameOnDocument,
      document: file ? toDocument(file) : undefined,
    });
    kycSaved('pan', next);
  };

  const saveGst = async (values: SectionValues, file: File | null) => {
    const next = await mockProfileService.saveGst(user.id, {
      gstNumber: values.gstNumber,
      nameOnDocument: values.nameOnDocument,
      document: file ? toDocument(file) : undefined,
    });
    kycSaved('gst', next);
  };

  const saveBank = async (values: SectionValues, file: File | null) => {
    const next = await mockProfileService.saveBank(user.id, {
      accountNumber: values.accountNumber,
      ifscCode: values.ifscCode,
      nameOnAccount: values.nameOnAccount,
      document: file ? toDocument(file) : undefined,
    });
    kycSaved('bank', next);
  };

  const sectionProps = (key: SectionKey) => ({
    icon: _sections[key].icon,
    title: _sections[key].title,
    subtitle: _sections[key].subtitle,
    editing: editing === key,
    onEdit: () => setEditing(key),
    onCancel: () => setEditing(null),
    onLocked: lockedSnack(key),
    onPreview: preview,
  });

  const initials = userInitials(user.name);
  const photoSoon = () => showSnack(_snack.photoComingSoon);

  return (
    <Root>
      <MobileHeader>
        {showBack && (
          <MobileBack type="button" aria-label={mock._backLabel} onClick={goBack}>
            <i className="pi pi-chevron-left" aria-hidden />
          </MobileBack>
        )}
        <HeaderRow>
          <Avatar>
            {initials}
            <CameraButton type="button" aria-label={_buttons.changePhoto} onClick={photoSoon}>
              <i className="pi pi-camera" aria-hidden />
            </CameraButton>
          </Avatar>
          <div>
            <HeaderTitle>{mock._title}</HeaderTitle>
            <HeaderSubtitle>{mock._subtitle}</HeaderSubtitle>
          </div>
        </HeaderRow>
      </MobileHeader>

      <Page>
        <WebHead>
          <div>
            {showBack && (
              <BackLink type="button" onClick={goBack}>
                <i className="pi pi-arrow-left" aria-hidden />
                {mock._backLabel}
              </BackLink>
            )}
            <WebHeadMain>
              <Avatar $wide>
                {initials}
                <CameraButton type="button" aria-label={_buttons.changePhoto} onClick={photoSoon}>
                  <i className="pi pi-camera" aria-hidden />
                </CameraButton>
              </Avatar>
              <div>
                <WebTitle>{mock._title}</WebTitle>
                <WebSubtitle>{mock._webSubtitle}</WebSubtitle>
              </div>
            </WebHeadMain>
          </div>
          {details && hasPendingApproval(details) && <ApprovalBanner placement="web" />}
        </WebHead>

        {!details ? (
          <Loading>
            <CircularProgress size={32} color={theme.colors.primary} />
          </Loading>
        ) : (
          <>
            {hasPendingApproval(details) && <ApprovalBanner placement="mobile" />}

            <Sections>
              <ProfileSection
                {...sectionProps('personal')}
                cols={2}
                fields={[
                  {
                    key: 'fullName',
                    label: _fields.fullName,
                    value: details.personal.fullName,
                    validator: v.fullName,
                  },
                  {
                    key: 'mobileNumber',
                    label: _fields.mobileNumber,
                    value: details.personal.mobileNumber,
                    readOnly: true,
                  },
                  {
                    key: 'email',
                    label: _fields.email,
                    value: details.personal.email,
                    validator: v.email,
                    type: 'email',
                    inputMode: 'email',
                  },
                  {
                    key: 'address',
                    label: _fields.address,
                    value: details.personal.address,
                    validator: v.address,
                    multiline: true,
                  },
                ]}
                onSave={savePersonal}
              />

              <ProfileSection
                {...sectionProps('pan')}
                status={details.pan.status}
                cols={3}
                document={details.pan.document}
                fields={[
                  {
                    key: 'panNumber',
                    label: _fields.panNumber,
                    value: details.pan.panNumber,
                    validator: v.pan,
                    uppercase: true,
                    maxLength: 10,
                  },
                  {
                    key: 'nameOnDocument',
                    label: _fields.nameOnDocument,
                    value: details.pan.nameOnDocument,
                    validator: v.name,
                  },
                ]}
                onSave={savePan}
              />

              <ProfileSection
                {...sectionProps('gst')}
                status={details.gst.status}
                cols={3}
                document={details.gst.document}
                fields={[
                  {
                    key: 'gstNumber',
                    label: _fields.gstNumber,
                    value: details.gst.gstNumber,
                    validator: v.gst,
                    uppercase: true,
                    maxLength: 15,
                  },
                  {
                    key: 'nameOnDocument',
                    label: _fields.nameOnDocument,
                    value: details.gst.nameOnDocument,
                    validator: v.name,
                  },
                ]}
                onSave={saveGst}
              />

              <ProfileSection
                {...sectionProps('bank')}
                status={details.bank.status}
                cols={4}
                document={details.bank.document}
                fields={[
                  {
                    key: 'accountNumber',
                    label: _fields.accountNumber,
                    value: details.bank.accountNumber,
                    validator: v.accountNumber,
                    digitsOnly: true,
                    inputMode: 'numeric',
                    maxLength: 18,
                    // Stored masked — the full number must be re-entered.
                    editInitial: '',
                    placeholder: details.bank.accountNumber,
                  },
                  {
                    key: 'ifscCode',
                    label: _fields.ifscCode,
                    value: details.bank.ifscCode,
                    validator: v.ifsc,
                    uppercase: true,
                    maxLength: 11,
                  },
                  {
                    key: 'nameOnAccount',
                    label: _fields.nameOnAccount,
                    value: details.bank.nameOnAccount,
                    validator: v.name,
                  },
                ]}
                onSave={saveBank}
              />
            </Sections>

            <AccountTitle>{_account.title}</AccountTitle>
            <AccountRow>
              <AccountTile type="button" onClick={() => navigate(AppRoutes.myRewards)}>
                <i className="pi pi-star-fill" aria-hidden />
                <AccountText>
                  <strong>{_account.rewardsTitle}</strong>
                  <small>
                    {balance}
                    {_account.rewardsSuffix}
                  </small>
                </AccountText>
                <i className="pi pi-chevron-right" aria-hidden />
              </AccountTile>
              <AccountTile type="button" $danger onClick={signOut}>
                <i className="pi pi-sign-out" aria-hidden />
                <AccountText>
                  <strong>{_account.signOut}</strong>
                </AccountText>
                <i className="pi pi-chevron-right" aria-hidden />
              </AccountTile>
            </AccountRow>
          </>
        )}
      </Page>

      {snack && (
        <SnackBar
          key={snack.id}
          message={snack.message}
          onDismissed={hideSnack}
          webAlign="center"
        />
      )}
    </Root>
  );
}

/** `/profile` route — storefront header on web + the profile content. */
export function Profile() {
  return (
    <Screen>
      <StorefrontHeader webOnly />
      <ProfileContent showBack />
    </Screen>
  );
}
