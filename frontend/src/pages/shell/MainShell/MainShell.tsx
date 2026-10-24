import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../../routes/appRoutes';
import type { CategoryBrowseArgs } from '../../../routes/appRoutes';
import type { HomeCategory } from '../../../services/catalog/catalogModels';
import catalogMock from '../../../mocks/catalog_mock_data.json';
import { useSession } from '../../../session/SessionContext';
import { useCurrentLocation } from '../../../session/LocationContext';
import { HomeDashboard } from '../../home/HomeDashboard';
import { StorefrontHeader } from '../../../shared/StorefrontHeader';
import { WebSideMenu } from '../../../shared/WebSideMenu';
import { StorefrontFooter } from '../../../shared/StorefrontFooter';
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
/** Shop by Category — full module grid with images (local catalog metadata). */
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
  const { isLoggedIn } = useSession();
  const { startLiveTracking, requestCurrentLocation } = useCurrentLocation();
  const requestedTab = (location.state as { tab?: string } | null)?.tab;
  const [index, setIndex] = useState(() => tabIndex(requestedTab));
  const [lastLocationKey, setLastLocationKey] = useState(location.key);
  useEffect(() => {
    if (!isLoggedIn) return;
    startLiveTracking();
    void requestCurrentLocation().catch(() => undefined);
  }, [isLoggedIn, requestCurrentLocation, startLiveTracking]);

  if (location.key !== lastLocationKey) {
    setLastLocationKey(location.key);
    if (requestedTab) setIndex(tabIndex(requestedTab));
  }

  const openCategory = (category: HomeCategory) => {
    const args: CategoryBrowseArgs = { categoryId: category.id, categoryName: category.name };
    navigate(AppRoutes.categoryBrowse, { state: args });
  };
  const openAiAssistant = () => navigate(AppRoutes.aiAssistant);

  const showAi = index === 0;
  const current = tabs[index];

  return (
    <Shell>
      <StorefrontHeader webOnly />

      <ShellBody>
        <WebSideMenu
          activeTab={current.tab}
          onSelectTab={(tab) => setIndex(tabs.indexOf(tab))}
          showAi={showAi}
        />

        <Main>
          {index === 0 ? (
            <HomeDashboard categories={allCategories} onCategoryTap={openCategory} />
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

      <StorefrontFooter webOnly />

      <BottomNav aria-label="Main menu">
        {tabs.map((tab, i) => (
          <BottomNavItem
            key={tab.tab}
            type="button"
            $active={i === index}
            aria-current={i === index ? 'page' : undefined}
            onClick={() => setIndex(i)}
          >
            <BottomNavIndicator $active={i === index}>
              <i className={`pi ${tab.icon}`} aria-hidden="true" />
            </BottomNavIndicator>
            <BottomNavLabel>{tab.label}</BottomNavLabel>
          </BottomNavItem>
        ))}
      </BottomNav>
    </Shell>
  );
}
