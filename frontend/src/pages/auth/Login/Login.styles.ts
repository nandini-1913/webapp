import styled from 'styled-components';
import { textStyle } from '../../../theme';
import { authWebCard, authWebStage } from '../../../shared/AuthWebLayout';

/** Flutter: TextButton minimumSize height 34 */
const SKIP_MIN_HEIGHT = 34;

/** Scaffold(surface) + DecoratedBox(backdropGradient, top → bottom) + SafeArea */
export const Screen = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  background: linear-gradient(
    to bottom,
    ${({ theme }) => theme.loginFlow.backdropGradient[0]},
    ${({ theme }) => theme.loginFlow.backdropGradient[1]}
  );
  ${authWebStage}
`;

/** Padding(LTRB: space6, space4, space6, space6) > Column */
export const Content = styled.div`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.authMaxWidth}px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: ${({ theme }) =>
    `${theme.spacing.space4}px ${theme.spacing.space6}px ${theme.spacing.space6}px`};

  ${authWebCard}
`;

/** Spacer(flex: n) */
export const Spacer = styled.div<{ $flex: number }>`
  flex: ${({ $flex }) => $flex};

  ${({ theme }) => theme.media.md} {
    flex: none;
    height: ${({ theme }) => theme.spacing.space6}px;
  }
`;

/** Align(centerRight) > TextButton('Skip login') */
export const SkipButton = styled.button`
  align-self: flex-end;
  min-height: ${SKIP_MIN_HEIGHT}px;
  padding: ${({ theme }) => `${theme.spacing.space1}px ${theme.spacing.space4}px`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.loginFlow.fieldBorder};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  cursor: pointer;
  ${({ theme }) => textStyle(theme.typography.labelLarge)}
  font-weight: 600;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
`;

export const BadgeWrap = styled.div`
  display: flex;
  justify-content: center;

  ${({ theme }) => theme.media.md} {
    display: none;
  }
`;

/** SizedBox(space5) + Text(appName, headlineLarge w800, letterSpacing -0.5) */
export const Title = styled.h1`
  margin: ${({ theme }) => theme.spacing.space5}px 0 0;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.headlineLarge)}
  font-weight: 800;
  letter-spacing: -0.5px;

  ${({ theme }) => theme.media.md} {
    display: none;
  }
`;

/** SizedBox(space2) + Text(titleMedium w400, onSurfaceVariant) */
export const Subtitle = styled.p`
  margin: ${({ theme }) => theme.spacing.space2}px 0 ${({ theme }) => theme.spacing.space8}px;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.titleMedium)}
  font-weight: 400;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};

  /* Web: the subtitle becomes the card heading */
  ${({ theme }) => theme.media.md} {
    margin-top: 0;
    text-align: left;
    ${({ theme }) => textStyle(theme.typography.headlineSmall)}
    font-weight: 800;
  }
`;

/** SizedBox(space6) + Text('Mobile Number', titleSmall w700) + SizedBox(space2) */
export const FieldLabel = styled.p`
  margin: ${({ theme }) => theme.spacing.space6}px 0 ${({ theme }) => theme.spacing.space2}px;
  ${({ theme }) => textStyle(theme.typography.titleSmall)}
  font-weight: 700;
`;

/** SizedBox(space2) + Text(bodySmall, onSurfaceVariant) + SizedBox(space6) */
export const Hint = styled.p`
  margin: ${({ theme }) => theme.spacing.space2}px 0 ${({ theme }) => theme.spacing.space6}px;
  ${({ theme }) => textStyle(theme.typography.bodySmall)}
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
`;

export const ErrorText = styled.p`
  margin: ${({ theme }) => theme.spacing.space2}px 0 0;
  ${({ theme }) => textStyle(theme.typography.bodySmall)}
  color: ${({ theme }) => theme.colors.error};
`;
