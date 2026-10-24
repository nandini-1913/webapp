import styled, { css, keyframes } from 'styled-components';
import { textStyle, withAlpha } from '../../../theme';

const focusRing = css`
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const resetButton = css`
  appearance: none;
  border: 0;
  margin: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
  background: none;
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const bump = keyframes`
  0% { transform: scale(0.6); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

export const Page = styled.div`
  min-height: 100%;
  background: ${({ theme }) => theme.colors.background};
`;

// ── Header: HomeAppBar + HomeLocationBar + HomeSearchBar ────────────────

/**
 * Mobile: white 56px app bar, then location + search on the page
 * background (as in Flutter). Web: only the location bar is kept — the shell's
 * app-wide `StorefrontHeader` already carries the brand, search and actions.
 */
export const Header = styled.header``;

export const AppBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space1}px;
  height: ${({ theme }) => theme.spacing.space14}px;
  padding: 0 ${({ theme }) => theme.spacing.space4}px;
  background: ${({ theme }) => theme.colors.surface};

  ${({ theme }) => theme.media.md} {
    display: none;
  }
`;

export const Brand = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space2}px;

  ${({ theme }) => theme.media.md} {
    display: none;
  }
`;

export const BrandLogo = styled.img`
  height: ${({ theme }) => theme.spacing.space6}px;
  width: auto;
`;

export const BrandText = styled.span`
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  ${({ theme }) => textStyle(theme.typography.titleMedium)}
  font-weight: 400;

  strong {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.space3}px;
  padding: ${({ theme }) => `${theme.spacing.space3}px ${theme.spacing.space4}px 0`};

  ${({ theme }) => theme.media.md} {
    flex-direction: row;
    align-items: center;
    padding: ${({ theme }) => `${theme.spacing.space6}px ${theme.spacing.space10}px 0`};
  }
`;

export const LocationBar = styled.button`
  ${resetButton}
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space2}px;
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.space3}px ${theme.spacing.space4}px`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: ${({ theme }) => theme.radius.md}px;
  text-align: left;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  ${focusRing}

  > i {
    font-size: 14px;
  }

  &:hover {
    border-color: ${({ theme }) => withAlpha(theme.colors.primary, 0.4)};
  }

  ${({ theme }) => theme.media.md} {
    flex: 0 1 ${({ theme }) => theme.layout.homeLocationMaxWidth}px;
    min-width: 0;
    height: ${({ theme }) => theme.spacing.space12}px;
    padding: 0 ${({ theme }) => theme.spacing.space4}px 0 ${({ theme }) => theme.spacing.space2}px;
    border-radius: ${({ theme }) => theme.radius.pill}px;

    &:hover {
      box-shadow: 0 4px 14px ${({ theme }) => withAlpha(theme.colors.primary, 0.12)};
    }
  }
`;

export const LocationIcon = styled.i`
  flex-shrink: 0;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.primary};

  ${({ theme }) => theme.media.md} {
    width: ${({ theme }) => theme.spacing.space8}px;
    height: ${({ theme }) => theme.spacing.space8}px;
    display: grid;
    place-items: center;
    font-size: 16px;
    border-radius: ${({ theme }) => theme.radius.pill}px;
    background: ${({ theme }) => theme.colors.primaryContainer};
  }
`;

export const LocationText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const LocationLabel = styled.span`
  ${({ theme }) => textStyle(theme.typography.labelLarge)}
  font-weight: 700;
  margin-right: ${({ theme }) => theme.spacing.space2}px;
`;

export const LocationAddress = styled.span`
  ${({ theme }) => textStyle(theme.typography.bodySmall)}
`;

export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space1}px;
  height: ${({ theme }) => theme.spacing.space14}px;
  padding: 0 ${({ theme }) => theme.spacing.space2}px 0 0;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => withAlpha(theme.colors.primary, 0.22)};
  border-radius: ${({ theme }) => theme.radius.lg}px;
  box-shadow: ${({ theme }) => theme.elevation.level2};
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => withAlpha(theme.colors.primary, 0.5)};
  }

  ${({ theme }) => theme.media.md} {
    display: none;
  }
`;

/** The Flutter search bar is a tap target that opens /search, not an input. */
export const SearchField = styled.button`
  ${resetButton}
  flex: 1;
  min-width: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space3}px;
  padding-left: ${({ theme }) => theme.spacing.space4}px;
  border-radius: inherit;
  color: ${({ theme }) => theme.colors.primary};
  text-align: left;
  ${focusRing}

  i {
    font-size: 18px;
  }
`;

export const SearchPlaceholder = styled.span`
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  ${({ theme }) => textStyle(theme.typography.bodyMedium)}
  color: ${({ theme }) => theme.colors.outline};
`;

export const SearchAction = styled.button`
  ${resetButton}
  flex-shrink: 0;
  width: ${({ theme }) => theme.spacing.space8}px;
  height: ${({ theme }) => theme.spacing.space8}px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  ${focusRing}

  i {
    font-size: 18px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainer};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Actions = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space1}px;

  ${({ theme }) => theme.media.md} {
    order: 2;
    margin-left: auto;
    gap: ${({ theme }) => theme.spacing.space2}px;
  }
`;

export const IconButton = styled.button`
  ${resetButton}
  position: relative;
  width: ${({ theme }) => theme.spacing.space10}px;
  height: ${({ theme }) => theme.spacing.space10}px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  transition:
    background 0.15s ease,
    color 0.15s ease;
  ${focusRing}

  > i {
    font-size: 20px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainer};
    color: ${({ theme }) => theme.colors.primary};
  }

  ${({ theme }) => theme.media.md} {
    width: 44px;
    height: 44px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.divider};
  }
`;

export const Badge = styled.span<{ $color: string }>`
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.fontFamily.body};
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: ${({ theme }) => theme.colors.onPrimary};
  animation: ${bump} 0.3s ease-out;

  ${({ theme }) => theme.media.md} {
    top: -2px;
    right: -2px;
  }
`;

export const Avatar = styled.button`
  ${resetButton}
  flex-shrink: 0;
  width: ${({ theme }) => theme.spacing.space8}px;
  height: ${({ theme }) => theme.spacing.space8}px;
  margin-left: ${({ theme }) => theme.spacing.space1}px;
  display: grid;
  place-items: center;
  border-radius: ${({ theme }) => theme.radius.pill}px;
  background: ${({ theme }) => theme.colors.primaryContainer};
  ${({ theme }) => textStyle(theme.typography.labelMedium)}
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  ${focusRing}

  ${({ theme }) => theme.media.md} {
    width: 44px;
    height: 44px;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.onPrimary};
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.loginFlow.accentGradient[0]},
      ${({ theme }) => theme.loginFlow.accentDeep}
    );
    box-shadow: 0 4px 12px ${({ theme }) => withAlpha(theme.colors.primary, 0.3)};
  }
`;

// ── Content ─────────────────────────────────────────────────────────────

export const Content = styled.div`
  padding: ${({ theme }) =>
    `${theme.spacing.space5}px ${theme.spacing.space4}px ${theme.spacing.space6}px`};

  ${({ theme }) => theme.media.md} {
    padding: ${({ theme }) =>
      `${theme.spacing.space6}px ${theme.spacing.space10}px ${theme.spacing.space12}px`};
  }
`;

/** Flutter `HomeSectionHeader`. */
export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.space2}px;
  margin-bottom: ${({ theme }) => theme.spacing.space3}px;

  ${({ theme }) => theme.media.md} {
    align-items: baseline;
    margin-bottom: ${({ theme }) => theme.spacing.space5}px;
  }
`;

export const SectionTitle = styled.h2`
  flex: 1;
  margin: 0;
  ${({ theme }) => textStyle(theme.typography.titleMedium)}

  ${({ theme }) => theme.media.md} {
    ${({ theme }) => textStyle(theme.typography.headlineMedium)}
    font-weight: 800;
    letter-spacing: -0.5px;
  }
`;

export const ViewAll = styled.button`
  ${resetButton}
  display: inline-flex;
  align-items: center;
  gap: 2px;
  ${({ theme }) => textStyle(theme.typography.labelLarge)}
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.pill}px;
  transition: background 0.15s ease;
  ${focusRing}

  i {
    font-size: 12px;
    transition: transform 0.15s ease;
  }

  &:hover i {
    transform: translateX(2px);
  }

  ${({ theme }) => theme.media.md} {
    padding: ${({ theme }) => `${theme.spacing.space2}px ${theme.spacing.space4}px`};

    &:hover {
      background: ${({ theme }) => theme.colors.primaryContainer};
    }
  }
`;

/**
 * Compact grid so every category fits on one screen: 4 per row on phones,
 * then as many ~132px tiles as the width allows (8 across on a laptop).
 */
export const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => `${theme.spacing.space4}px ${theme.spacing.space2}px`};

  ${({ theme }) => theme.media.sm} {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: ${({ theme }) => `${theme.spacing.space5}px ${theme.spacing.space3}px`};
  }

  ${({ theme }) => theme.media.md} {
    grid-template-columns: repeat(
      auto-fill,
      minmax(${({ theme }) => theme.layout.homeCategoryTileMinWidth}px, 1fr)
    );
    gap: ${({ theme }) => `${theme.spacing.space6}px ${theme.spacing.space5}px`};
  }
`;

/** Square image box with a light border, as on quick-commerce home grids. */
export const CardMedia = styled.span`
  display: block;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: ${({ theme }) => theme.radius.md}px;
  background: ${({ theme }) => theme.colors.surface};
  transition:
    transform 0.2s ${({ theme }) => theme.motion.easeOutCubic},
    box-shadow 0.2s ease,
    border-color 0.2s ease;
`;

export const CardBody = styled.span`
  display: block;
  margin-top: ${({ theme }) => theme.spacing.space2}px;
  text-align: center;
`;

export const CardName = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  ${({ theme }) => textStyle(theme.typography.labelMedium)}
  font-weight: 600;
  line-height: 1.25;
  color: ${({ theme }) => theme.colors.onSurface};

  ${({ theme }) => theme.media.md} {
    ${({ theme }) => textStyle(theme.typography.labelLarge)}
    font-weight: 600;
    line-height: 1.3;
  }
`;

/** Hidden in the compact grid; kept for screen readers. */
export const CardCount = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

/** Compact category tile: square photo on top, centred name underneath. */
export const CategoryCard = styled.button<{ $accent: string; $tint: string; $index: number }>`
  ${resetButton}
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
  text-align: center;
  border-radius: ${({ theme }) => theme.radius.md}px;
  animation: ${fadeUp} 0.35s ${({ theme }) => theme.motion.easeOutCubic} both;
  animation-delay: ${({ $index }) => $index * 30}ms;
  ${focusRing}

  &:hover ${CardMedia} {
    transform: translateY(-2px);
    border-color: ${({ $accent }) => withAlpha($accent, 0.45)};
    box-shadow: 0 8px 18px ${({ $accent }) => withAlpha($accent, 0.18)};
  }
`;
