/** Styles for the app-wide web footer (brand, company links, categories, app badges). */
import styled, { css } from 'styled-components';
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
  text-align: left;
`;

const focusRing = css`
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const resetList = css`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const Footer = styled.footer<{ $webOnly?: boolean }>`
  display: ${({ $webOnly }) => ($webOnly ? 'none' : 'block')};
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.divider};

  ${({ theme }) => theme.media.md} {
    display: block;
  }
`;

export const FooterInner = styled.div`
  max-width: ${({ theme }) => theme.layout.rewardsMaxWidth}px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing.space8}px ${theme.spacing.space4}px`};

  ${({ theme }) => theme.media.md} {
    padding: ${({ theme }) => `${theme.spacing.space10}px ${theme.spacing.space6}px`};
  }
`;

/** Mobile: stacked. Web (≥ md): brand | company | categories (two sub-columns). */
export const Columns = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.space8}px;
  padding-bottom: ${({ theme }) => theme.spacing.space8}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: 1.2fr 1fr 1.8fr;
    gap: ${({ theme }) => theme.spacing.space10}px;
  }
`;

export const BrandColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.space4}px;
`;

export const Brand = styled.button`
  ${resetButton}
  ${focusRing}
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space3}px;
  align-self: flex-start;
`;

export const BrandMark = styled.img`
  width: ${({ theme }) => theme.spacing.space10}px;
  height: ${({ theme }) => theme.spacing.space10}px;
  border-radius: ${({ theme }) => theme.radius.sm}px;
  object-fit: contain;
`;

export const BrandName = styled.span`
  ${({ theme }) => textStyle(theme.typography.headlineSmall)}
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
  color: ${({ theme }) => theme.storefront.headerBackground};

  span {
    font-weight: 400;
  }
`;

export const Tagline = styled.p`
  margin: 0;
  max-width: 340px;
  ${({ theme }) => textStyle(theme.typography.bodyMedium)}
`;

export const SocialRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.space4}px;
`;

export const SocialLink = styled.a`
  ${focusRing}
  display: grid;
  place-items: center;
  width: ${({ theme }) => theme.spacing.space8}px;
  height: ${({ theme }) => theme.spacing.space8}px;
  border-radius: ${({ theme }) => theme.radius.sm}px;
  color: ${({ theme }) => theme.colors.outline};
  transition: color 0.2s ease;

  i {
    font-size: 22px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const LinkColumn = styled.nav`
  min-width: 0;
`;

export const ColumnTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.space4}px;
  ${({ theme }) => textStyle(theme.typography.titleMedium)}
  font-size: 18px;
`;

export const LinkList = styled.ul`
  ${resetList}
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.space3}px;
`;

/** Every catalog category, flowing into two columns. */
export const CategoryList = styled.ul`
  ${resetList}
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: ${({ theme }) => theme.spacing.space6}px;
  row-gap: ${({ theme }) => theme.spacing.space3}px;
`;

export const FooterLink = styled.button`
  ${resetButton}
  ${focusRing}
  ${({ theme }) => textStyle(theme.typography.bodyMedium)}
  font-size: 15px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Download = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space5}px;
  padding: ${({ theme }) => theme.spacing.space8}px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider};
`;

export const DownloadTitle = styled.h2`
  margin: 0;
  ${({ theme }) => textStyle(theme.typography.titleLarge)}
  font-weight: 600;
`;

export const StoreRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.space6}px;

  ${({ theme }) => theme.media.md} {
    gap: ${({ theme }) => theme.spacing.space12}px;
  }
`;

/** Black store badge (icon + "GET IT ON" / store name), like the official artwork. */
export const StoreBadge = styled.a`
  ${focusRing}
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space2}px;
  min-width: 160px;
  height: ${({ theme }) => theme.spacing.space12 + theme.spacing.space1}px;
  padding: 0 ${({ theme }) => theme.spacing.space4}px;
  border-radius: ${({ theme }) => theme.radius.sm}px;
  border: 1px solid ${({ theme }) => theme.colors.outline};
  background: ${({ theme }) => theme.colors.black};
  color: ${({ theme }) => theme.colors.white};
  text-decoration: none;
  transition: transform 0.2s ease;

  i {
    font-size: 26px;
  }

  &:hover {
    transform: translateY(-2px);
  }
`;

export const StoreText = styled.span`
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.fontFamily.display};
  font-size: 20px;
  font-weight: 600;
  line-height: 1.1;

  small {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
`;

export const Copyright = styled.p`
  margin: 0;
  padding-top: ${({ theme }) => theme.spacing.space6}px;
  text-align: center;
  ${({ theme }) => textStyle(theme.typography.bodySmall)}
  font-size: 13px;
`;
