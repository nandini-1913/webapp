import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { AppRoutes } from '../../../routes/appRoutes';
import type { SignupFlowArgs } from '../../../routes/appRoutes';
import type { HomeCategory } from '../../../services/catalog/catalogModels';
import type { AddressLookupStatus } from '../../../session/LocationContext';
import type { CurrentLocation } from '../../../session/LocationContext';
import { useSession } from '../../../session/SessionContext';
import { useCart } from '../../../session/CartContext';
import { CategoryImage } from '../../../shared/CategoryImage';
import { userInitials } from '../../../shared/userInitials';
import mock from './HomeDashboard.mock.json';
import {
  Page,
  Header,
  AppBarRow,
  Brand,
  BrandLogo,
  BrandText,
  Controls,
  LocationBar,
  LocationIcon,
  LocationText,
  LocationLabel,
  LocationAddress,
  SearchBar,
  SearchField,
  SearchAction,
  Actions,
  IconButton,
  Badge,
  Avatar,
  Content,
  SectionHeader,
  SectionTitle,
  ViewAll,
  CategoryGrid,
  CategoryCard,
  CardMedia,
  CardBody,
  CardName,
  CardCount,
} from './HomeDashboard.styles';

const appBar = mock.HomeAppBar;
const section = mock.CategoriesSection;

const capBadge = (n: number, max: number) => (n > max ? `${max}+` : `${n}`);

interface HomeDashboardProps {
  categories: HomeCategory[];
  currentLocation: CurrentLocation | null;
  addressLookupStatus: AddressLookupStatus;
  addressError?: string | null;
  locationError?: string | null;
  onCategoryTap: (category: HomeCategory) => void;
}

/**
 * Flutter `HomeDashboardScreen` — app bar, location bar, search bar and
 * "Shop by Category". Web (≥ md): the shell's `StorefrontHeader` holds the
 * brand, search and actions, so only the location bar stays above the
 * categories, shown as a compact grid of small square tiles so every category
 * fits on one screen. Tapping the location bar opens
 * ChooseLocation in update mode (confirm returns here).
 */
export function HomeDashboard({
  categories,
  currentLocation,
  addressLookupStatus,
  addressError,
  locationError,
  onCategoryTap,
}: HomeDashboardProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useSession();
  const { totalQuantity: cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  const openLocation = () => {
    const args: SignupFlowArgs = {
      mobileNumber: user.phone ?? '',
      fullName: user.name,
      isLocationUpdate: true,
    };
    navigate(AppRoutes.chooseLocation, { state: args });
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) navigate(AppRoutes.search, { state: { query } });
  };

  return (
    <Page>
      <Header>
        <AppBarRow>
          <Brand>
            <BrandLogo src={appBar.logo} alt="" />
            <BrandText>
              <strong>{appBar.brandPrimary}</strong>
              {appBar.brandSecondary}
            </BrandText>
          </Brand>

          <Actions>
            <IconButton
              type="button"
              title={appBar.tooltips.rewards}
              aria-label={appBar.tooltips.rewards}
              onClick={() => navigate(AppRoutes.myRewards)}
            >
              <i className="pi pi-star-fill" aria-hidden="true" />
              {appBar.rewardPoints > 0 && (
                <Badge $color={theme.colors.secondary}>{capBadge(appBar.rewardPoints, 999)}</Badge>
              )}
            </IconButton>
            <IconButton
              type="button"
              title={appBar.tooltips.cart}
              aria-label={appBar.tooltips.cart}
              onClick={() => navigate(AppRoutes.cart)}
            >
              <i className="pi pi-shopping-cart" aria-hidden="true" />
              {cartCount > 0 && (
                <Badge key={cartCount} $color={theme.colors.primary}>
                  {capBadge(cartCount, 99)}
                </Badge>
              )}
            </IconButton>
            <IconButton
              type="button"
              title={appBar.tooltips.notifications}
              aria-label={appBar.tooltips.notifications}
              onClick={() => navigate(AppRoutes.notifications)}
            >
              <i className="pi pi-bell" aria-hidden="true" />
              {appBar.notificationCount > 0 && (
                <Badge $color={theme.colors.error}>{capBadge(appBar.notificationCount, 99)}</Badge>
              )}
            </IconButton>
            <Avatar
              type="button"
              title={appBar.tooltips.profile}
              aria-label={appBar.tooltips.profile}
              onClick={() => navigate(AppRoutes.profile)}
            >
              {userInitials(user.name)}
            </Avatar>
          </Actions>
        </AppBarRow>

        <Controls>
          <LocationBar
            type="button"
            title={currentLocation?.address ?? undefined}
            onClick={openLocation}
          >
            <LocationIcon className="pi pi-map-marker" aria-hidden="true" />
            <LocationText>
              <LocationLabel>
                {currentLocation ? 'Current location' : 'Location permission required'}
              </LocationLabel>
              <LocationAddress>
                {currentLocation?.address
                  ? `${currentLocation.address} · © OpenStreetMap contributors`
                  : currentLocation && addressLookupStatus === 'loading'
                    ? 'Finding your address…'
                    : currentLocation
                      ? (addressError ??
                        `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`)
                      : (locationError ?? 'Tap to find your current location')}
              </LocationAddress>
            </LocationText>
            <i className="pi pi-chevron-down" aria-hidden="true" />
          </LocationBar>

          <SearchBar onSubmit={submitSearch}>
            <SearchField
              type="search"
              aria-label="Search products"
              placeholder={mock.HomeSearchBar.placeholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <SearchAction type="submit" title="Search products" aria-label="Search products">
              <i className="pi pi-search" aria-hidden="true" />
            </SearchAction>
            <SearchAction
              type="button"
              title={mock.HomeSearchBar.voice}
              aria-label={mock.HomeSearchBar.voice}
              onClick={() => navigate(AppRoutes.search, { state: { searchMode: 'voice' } })}
            >
              <i className="pi pi-microphone" aria-hidden="true" />
            </SearchAction>
            <SearchAction
              type="button"
              title={mock.HomeSearchBar.scan}
              aria-label={mock.HomeSearchBar.scan}
              onClick={() => navigate(AppRoutes.search, { state: { searchMode: 'scan' } })}
            >
              <i className="pi pi-qrcode" aria-hidden="true" />
            </SearchAction>
          </SearchBar>
        </Controls>
      </Header>

      <Content>
        <section aria-labelledby="home-categories-title">
          <SectionHeader>
            <SectionTitle id="home-categories-title">{section.title}</SectionTitle>
            <ViewAll type="button" onClick={() => navigate(AppRoutes.categories)}>
              {section.viewAll}
              <i className="pi pi-chevron-right" aria-hidden="true" />
            </ViewAll>
          </SectionHeader>

          <CategoryGrid>
            {categories.map((category, i) => (
              <CategoryCard
                key={category.id}
                type="button"
                $accent={category.iconColor}
                $tint={category.iconBackground}
                $index={i}
                onClick={() => onCategoryTap(category)}
              >
                <CardMedia>
                  <CategoryImage
                    imageAsset={category.imageAsset}
                    fallbackIcon={category.icon}
                    fallbackIconColor={category.iconColor}
                    fallbackBackground={category.iconBackground}
                    iconSize={theme.spacing.space6}
                  />
                </CardMedia>
                <CardBody>
                  <CardName>{category.name}</CardName>
                  <CardCount>
                    {category.itemCount} {section.itemCountSuffix}
                  </CardCount>
                </CardBody>
              </CategoryCard>
            ))}
          </CategoryGrid>
        </section>
      </Content>
    </Page>
  );
}
