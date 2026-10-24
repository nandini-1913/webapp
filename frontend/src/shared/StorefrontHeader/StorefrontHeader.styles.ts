/** Styles for the app-wide web header (brand, search, account, rewards, cart, notifications). */
import styled, { css, keyframes } from 'styled-components';
import { textStyle } from '../../theme';

const resetButton = css`
  appearance: none;
  border: none;
  margin: 0;
  padding: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const ellipsis = css`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const pop = keyframes`
  0% { transform: scale(0.6); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

export const Header = styled.header<{ $webOnly?: boolean; $sticky?: boolean }>`
  position: ${({ $sticky }) => ($sticky ? 'sticky' : 'relative')};
  top: 0;
  z-index: 20;
  flex-shrink: 0;
  display: ${({ $webOnly }) => ($webOnly ? 'none' : 'block')};
  background: ${({ theme }) => theme.storefront.headerBackground};
  color: ${({ theme }) => theme.storefront.headerForeground};

  ${({ theme }) => theme.media.md} {
    display: block;
  }
`;

/** Full-bleed on every page — brand and actions sit near the viewport edges. */
export const HeaderInner = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.space4}px;
  height: ${({ theme }) => theme.layout.checkoutHeaderHeight}px;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space4}px;

  ${({ theme }) => theme.media.md} {
    padding: 0 ${({ theme }) => theme.spacing.space6}px;
    gap: ${({ theme }) => theme.spacing.space10}px;
  }
`;

export const Brand = styled.button`
  ${resetButton}
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space3}px;
  flex-shrink: 0;
  text-align: left;
`;

export const BrandMark = styled.img`
  width: ${({ theme }) => theme.spacing.space10}px;
  height: ${({ theme }) => theme.spacing.space10}px;
  border-radius: ${({ theme }) => theme.radius.sm}px;
  background: ${({ theme }) => theme.colors.surface};
  object-fit: contain;
`;

export const BrandText = styled.span`
  display: none;
  flex-direction: column;

  ${({ theme }) => theme.media.sm} {
    display: flex;
  }
`;

export const BrandName = styled.span`
  ${({ theme }) => textStyle(theme.typography.headlineSmall)}
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
  color: ${({ theme }) => theme.storefront.headerForeground};

  /* Flutter header: "BuildMate" bold + " 24x7" regular. */
  span {
    font-weight: 400;
  }
`;

export const SearchPill = styled.button`
  ${resetButton}
  flex: 1;
  min-width: 0;
  max-width: ${({ theme }) => theme.layout.checkoutSearchMaxWidth}px;
  height: ${({ theme }) => theme.spacing.space10 + theme.spacing.space1}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.space3}px;
  padding: 0 ${({ theme }) => theme.spacing.space5}px;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background: ${({ theme }) => theme.colors.surface};
  ${({ theme }) => textStyle(theme.typography.bodyMedium)}
  color: ${({ theme }) => theme.colors.outline};

  span {
    ${ellipsis}
  }

  i {
    font-size: 18px;
    color: ${({ theme }) => theme.colors.onSurface};
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space2}px;

  ${({ theme }) => theme.media.md} {
    gap: ${({ theme }) => theme.spacing.space4}px;
  }
  margin-left: auto;
  flex-shrink: 0;
`;

export const AccountButton = styled.button`
  ${resetButton}
  display: none;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space2}px;
  ${({ theme }) => textStyle(theme.typography.labelLarge)}
  color: ${({ theme }) => theme.storefront.headerForeground};

  i:first-child {
    font-size: 20px;
  }

  i:last-child {
    font-size: 10px;
  }

  ${({ theme }) => theme.media.md} {
    display: flex;
  }
`;

export const CartButton = styled.button`
  ${resetButton}
  position: relative;
  display: grid;
  place-items: center;
  width: ${({ theme }) => theme.spacing.space10}px;
  height: ${({ theme }) => theme.spacing.space10}px;
  color: ${({ theme }) => theme.storefront.headerForeground};

  i {
    font-size: 24px;
  }
`;

export const CartBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 ${({ theme }) => theme.spacing.space1}px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background: ${({ theme }) => theme.storefront.brandAccent};
  ${({ theme }) => textStyle(theme.typography.labelMedium)}
  font-weight: 700;
  color: ${({ theme }) => theme.storefront.headerBackground};
  animation: ${pop} 0.3s ease;
`;

/** Unread-notifications count — red like the Flutter app bar's bell badge. */
export const NotificationBadge = styled(CartBadge)`
  background: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.onError};
`;
