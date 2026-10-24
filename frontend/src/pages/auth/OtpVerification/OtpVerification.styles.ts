import styled from 'styled-components';
import { textStyle } from '../../../theme';
import { authWebCard, authWebStage } from '../../../shared/AuthWebLayout';

/** Flutter: SizedBox(width: 44) balancing the back button */
const HEADER_TRAILING_WIDTH = 44;

/** Scaffold(backgroundColor: surface) + SafeArea + SingleChildScrollView */
export const Screen = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  background: ${({ theme }) => theme.colors.surface};
  ${authWebStage}
`;

/** padding LTRB(space6, space4, space6, space6) > Column(stretch) */
export const Content = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.authMaxWidth}px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: ${({ theme }) =>
    `${theme.spacing.space4}px ${theme.spacing.space6}px ${theme.spacing.space6}px`};
  ${authWebCard}
`;

/** Row(back button, Expanded(title), SizedBox(44)) */
export const Header = styled.div`
  display: flex;
  align-items: center;
`;

/** Text(titleLarge w700, center) */
export const Title = styled.h1`
  flex: 1;
  margin: 0;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.titleLarge)}
  font-weight: 700;
`;

export const HeaderTrailing = styled.div`
  flex-shrink: 0;
  width: ${HEADER_TRAILING_WIDTH}px;
`;

/** SizedBox(space10) + Center(LoginFlowOtpIcon) */
export const IconWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.space10}px;

  ${({ theme }) => theme.media.md} {
    margin-top: ${({ theme }) => theme.spacing.space6}px;
  }
`;

/** SizedBox(space8) + Text(titleMedium w500, center) */
export const SentTo = styled.p`
  margin: ${({ theme }) => theme.spacing.space8}px 0 0;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.titleMedium)}
  font-weight: 500;
`;

/** SizedBox(space1) + Text(titleMedium w700, center) */
export const Contact = styled.p`
  margin: ${({ theme }) => theme.spacing.space1}px 0 0;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.titleMedium)}
  font-weight: 700;
`;

/** SizedBox(space8) + AuthOtpFields */
export const FieldsWrap = styled.div`
  margin-top: ${({ theme }) => theme.spacing.space8}px;
`;

/** SizedBox(space2) + Text(bodySmall, error, center) */
export const ErrorText = styled.p`
  margin: ${({ theme }) => theme.spacing.space2}px 0 0;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.bodySmall)}
  color: ${({ theme }) => theme.colors.error};
`;

/** SizedBox(space3) + Text(bodySmall, onSurfaceVariant, center) */
export const Hint = styled.p`
  margin: ${({ theme }) => theme.spacing.space3}px 0 0;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.bodySmall)}
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
`;

/** SizedBox(space8) + LoginFlowContinueButton */
export const ButtonWrap = styled.div`
  margin-top: ${({ theme }) => theme.spacing.space8}px;
`;

/** SizedBox(space8) + Center(Text.rich(bodyMedium, onSurfaceVariant)) */
export const Resend = styled.p`
  margin: ${({ theme }) => theme.spacing.space8}px 0 0;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.bodyMedium)}
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
`;

/** TextSpan('Resend OTP', link color, underline, w600) + TapGestureRecognizer */
export const ResendLink = styled.button`
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  ${({ theme }) => textStyle(theme.typography.bodyMedium)}
  font-weight: 600;
  color: ${({ theme }) => theme.loginFlow.link};
  text-decoration: underline;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;
