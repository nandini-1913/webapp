import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../routes/appRoutes';
import { useCart } from '../../session/CartContext';
import mock from './StorefrontHeader.mock.json';
import {
  Header,
  HeaderInner,
  Brand,
  BrandMark,
  BrandText,
  BrandName,
  SearchPill,
  HeaderActions,
  AccountButton,
  CartButton,
  CartBadge,
  NotificationBadge,
} from './StorefrontHeader.styles';

const { _brand, _searchPlaceholder, _accountLabel, _rewardPoints, _notificationCount, _tooltips } =
  mock;

const capBadge = (n: number, max: number) => (n > max ? `${max}+` : `${n}`);

interface StorefrontHeaderProps {
  /** Hidden below `md` — for pages whose mobile layout keeps the Flutter app bar. */
  webOnly?: boolean;
  /** Sticks to the top of the viewport (off for fixed-height shells that scroll inside). */
  sticky?: boolean;
}

/**
 * The app-wide web header: navy bar with the BuildMate brand, search, account
 * rewards, cart, wishlist and notifications. Every web page renders this one so the chrome stays identical.
 */
export function StorefrontHeader({ webOnly, sticky = true }: StorefrontHeaderProps) {
  const navigate = useNavigate();
  const { items } = useCart();
  const count = items.length;

  return (
    <Header $webOnly={webOnly} $sticky={sticky}>
      <HeaderInner>
        <Brand
          type="button"
          aria-label={`${_brand.name}${_brand.accent}`}
          onClick={() => navigate(AppRoutes.main)}
        >
          <BrandMark src={_brand.logo} alt="" />
          <BrandText>
            <BrandName>
              {_brand.name}
              <span>{_brand.accent}</span>
            </BrandName>
          </BrandText>
        </Brand>
        <SearchPill type="button" onClick={() => navigate(AppRoutes.search)}>
          <span>{_searchPlaceholder}</span>
          <i className="pi pi-search" aria-hidden />
        </SearchPill>
        <HeaderActions>
          <AccountButton type="button" onClick={() => navigate(AppRoutes.profile)}>
            <i className="pi pi-user" aria-hidden />
            {_accountLabel}
            <i className="pi pi-chevron-down" aria-hidden />
          </AccountButton>
          <CartButton
            type="button"
            title={_tooltips.rewards}
            aria-label={_tooltips.rewards}
            onClick={() => navigate(AppRoutes.myRewards)}
          >
            <i className="pi pi-star-fill" aria-hidden />
            {_rewardPoints > 0 && <CartBadge>{capBadge(_rewardPoints, 999)}</CartBadge>}
          </CartButton>
          <CartButton
            type="button"
            title={_tooltips.cart}
            aria-label={count > 0 ? `${_tooltips.cart}, ${count} items` : _tooltips.cart}
            onClick={() => navigate(AppRoutes.cart)}
          >
            <i className="pi pi-shopping-cart" aria-hidden />
            {count > 0 && <CartBadge key={count}>{capBadge(count, 99)}</CartBadge>}
          </CartButton>
          <CartButton
            type="button"
            title={_tooltips.wishlist}
            aria-label={_tooltips.wishlist}
            onClick={() => navigate(AppRoutes.main, { state: { tab: 'wishlist' } })}
          >
            <i className="pi pi-heart" aria-hidden />
          </CartButton>
          <CartButton
            type="button"
            title={_tooltips.notifications}
            aria-label={
              _notificationCount > 0
                ? `${_tooltips.notifications}, ${_notificationCount} unread`
                : _tooltips.notifications
            }
            onClick={() => navigate(AppRoutes.notifications)}
          >
            <i className="pi pi-bell" aria-hidden />
            {_notificationCount > 0 && (
              <NotificationBadge>{capBadge(_notificationCount, 99)}</NotificationBadge>
            )}
          </CartButton>
        </HeaderActions>
      </HeaderInner>
    </Header>
  );
}
