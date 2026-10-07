import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../../routes/appRoutes';
import type { CategoryBrowseArgs } from '../../../routes/appRoutes';
import type { HomeCategory } from '../../../services/catalog/catalogModels';
import catalogMock from '../../../mocks/catalog_mock_data.json';
import { useCurrentLocation } from '../../../session/LocationContext';
import { HomeDashboard } from '../../home/HomeDashboard';
import { StorefrontHeader } from '../../../shared/StorefrontHeader';
import { WebSideMenu } from '../../../shared/WebSideMenu';
import type { WebSideMenuTab } from '../../../shared/WebSideMenu/WebSideMenu';
import mock from './MainShell.mock.json';
import {
  Shell,
  ShellBody,
  Main,
  TabHeader,
  TabTitle,
  TabBody,
  BottomNav,
  BottomNavItem,
  BottomNavIndicator,
  BottomNavLabel,
  Fab,
} from './MainShell.styles';

const tabs = mock.AppBottomNavigation.tabs;
/** Home shows every catalog category (the side menu lists the first five only). */
const allCategories: HomeCategory[] = catalogMock.categories;
const tabIndex = (tab?: string) =>
  Math.max(
    0,
    tabs.findIndex((t) => t.tab === tab),
  );

/**
 * Flutter `MainShell` — root shell after authentication. Mobile keeps the
 * bottom `NavigationBar` + AI assistant FAB (Home tab only). Web (≥ md) moves
 * Home + Categories into a side menu under the app-wide `StorefrontHeader`
 * (Wishlist opens from the header's heart icon), with the catalog categories
 * listed under them and the FAB as a card at the bottom.
 */
export function MainShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentLocation,
    addressLookupStatus,
    addressError: reverseGeocodeError,
    requestCurrentLocation,
  } = useCurrentLocation();
  const requestedTab = (location.state as { tab?: string } | null)?.tab;
  const [selection, setSelection] = useState<{ key: string; index: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const activeIndex = selection?.key === location.key ? selection.index : tabIndex(requestedTab);
  const selectTab = (tab: WebSideMenuTab) =>
    setSelection({ key: location.key, index: tabs.indexOf(tab) });

  useEffect(() => {
    let active = true;
    requestCurrentLocation().then(
      () => active && setLocationError(null),
      (error: unknown) => {
        if (active) {
          setLocationError(error instanceof Error ? error.message : 'Unable to get your location.');
        }
      },
    );
    return () => {
      active = false;
    };
  }, [requestCurrentLocation]);

  const openCategory = (category: HomeCategory) => {
    const args: CategoryBrowseArgs = { categoryId: category.id };
    navigate(AppRoutes.categoryBrowse, { state: args });
  };
  const openAiAssistant = () => navigate(AppRoutes.aiAssistant);

  const showAi = activeIndex === 0;
  const current = tabs[activeIndex];

  return (
    <Shell>
      <StorefrontHeader webOnly />

      <ShellBody>
        <WebSideMenu activeTab={current.tab} onSelectTab={selectTab} showAi={showAi} />

        <Main>
          {activeIndex === 0 ? (
            <HomeDashboard
              categories={allCategories}
              currentLocation={currentLocation}
              addressLookupStatus={addressLookupStatus}
              addressError={reverseGeocodeError}
              locationError={locationError}
              onCategoryTap={openCategory}
            />
          ) : (
            // Tabs 1–2 are not converted yet — Flutter `_TabScaffold` title only.
            <>
              <TabHeader>
                <TabTitle>{current.label}</TabTitle>
              </TabHeader>
              <TabBody>{mock._webTabPlaceholder}</TabBody>
            </>
          )}
        </Main>
      </ShellBody>

      {showAi && (
        <Fab
          type="button"
          title={mock.floatingActionButton.tooltip}
          aria-label={mock.floatingActionButton.tooltip}
          onClick={openAiAssistant}
        >
          <i className={`pi ${mock.floatingActionButton.icon}`} aria-hidden="true" />
        </Fab>
      )}

      <BottomNav aria-label="Main menu">
        {tabs.map((tab, i) => (
          <BottomNavItem
            key={tab.tab}
            type="button"
            $active={i === activeIndex}
            aria-current={i === activeIndex ? 'page' : undefined}
            onClick={() => setSelection({ key: location.key, index: i })}
          >
            <BottomNavIndicator $active={i === activeIndex}>
              <i className={`pi ${tab.icon}`} aria-hidden="true" />
            </BottomNavIndicator>
            <BottomNavLabel>{tab.label}</BottomNavLabel>
          </BottomNavItem>
        ))}
      </BottomNav>
    </Shell>
  );
}
