import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { AppRoutes } from '../../../routes/appRoutes';
import { useMaybePop } from '../../../hooks/useMaybePop';
import { useCart } from '../../../session/CartContext';
import { CategoryImage } from '../../../shared/CategoryImage';
import { CartIconButton } from '../../../shared/CartIconButton';
import { StorefrontHeader } from '../../../shared/StorefrontHeader';
import { SnackBar } from '../../../shared/SnackBar';
import { typeLabelFor, variantFor } from '../../../services/catalog/pipeCategoryGroups';
import type { CategoryProductGroup } from '../../../services/catalog/pipeCategoryGroups';
import type { PipesFittingProduct } from '../../../services/catalog/pipesFittingModels';
import configuratorMock from './PipeConfigurator.mock.json';
import {
  Screen,
  TopBar,
  TopBarInner,
  BackButton,
  TopBarContext,
  SearchPill,
  MobileCartSlot,
  Body,
  Media,
  Details,
  DetailsInner,
  Eyebrow,
  BrandChip,
  Title,
  FieldLabel,
  FieldGap,
  DropdownWrap,
  DropdownBox,
  DropdownValue,
  MenuCard,
  MenuSearchWrap,
  MenuSearchField,
  MenuList,
  MenuEmpty,
  MenuTile,
  MenuTileLabel,
  MenuCheck,
  CartCard,
  CartInfo,
  CartLabel,
  CartPrice,
  CartUnit,
  CartSize,
  AddToCartButton,
} from './PipeConfigurator.styles';

/**
 * Route `state` for the configurator. Flutter passes `groups`,
 * `initialGroup` and `initialProduct` (always `initialGroup.products.first`);
 * router state is structured-cloned, so the group is passed by index to keep
 * the `newGroup == _group` identity check working.
 */
export interface PipeConfiguratorArgs {
  groups: CategoryProductGroup[];
  initialGroupIndex: number;
}

/** Flutter `Icons.plumbing_rounded` has no primeicons match — nearest glyph. */
const plumbingIcon = 'pi-wrench';

/** `_ConfiguratorDropdown` — DropdownButton inside an outlined box. */
function ConfiguratorDropdown({
  value,
  options,
  hint,
  onChange,
}: {
  value: string | null;
  options: string[];
  hint: string;
  /** `null` disables the dropdown (Flutter `onChanged: null`). */
  onChange: ((value: string) => void) | null;
}) {
  const selected = value != null && options.includes(value) ? value : null;
  const enabled = onChange != null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // Close on outside click / Escape, like the category page's header menus.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <DropdownWrap ref={wrapRef}>
      <DropdownBox
        type="button"
        $enabled={enabled}
        $open={open}
        disabled={!enabled}
        aria-label={hint}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <DropdownValue $enabled={enabled} $placeholder={selected == null}>
          {selected ?? hint}
        </DropdownValue>
        <i className="pi pi-chevron-down" aria-hidden="true" />
      </DropdownBox>

      {open && (
        <MenuCard role="listbox" aria-label={hint}>
          <MenuSearchWrap>
            <MenuSearchField>
              <i className="pi pi-search" aria-hidden="true" />
              <input
                type="text"
                autoFocus
                placeholder={`Search ${hint.replace(/^Select /, '')} options...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </MenuSearchField>
          </MenuSearchWrap>
          {filtered.length === 0 ? (
            <MenuEmpty>No matches found</MenuEmpty>
          ) : (
            <MenuList>
              {filtered.map((option) => {
                const isSelected = option === selected;
                return (
                  <MenuTile
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    $selected={isSelected}
                    onClick={() => {
                      onChange?.(option);
                      close();
                    }}
                  >
                    <MenuCheck $selected={isSelected}>
                      {isSelected && <i className="pi pi-check" aria-hidden="true" />}
                    </MenuCheck>
                    <MenuTileLabel $selected={isSelected}>{option}</MenuTileLabel>
                  </MenuTile>
                );
              })}
            </MenuList>
          )}
        </MenuCard>
      )}
    </DropdownWrap>
  );
}

function PipeConfiguratorView({ groups, initialGroupIndex }: PipeConfiguratorArgs) {
  const theme = useTheme();
  const navigate = useNavigate();
  const maybePop = useMaybePop();
  const { addVariant } = useCart();

  const initialGroup = groups[initialGroupIndex];
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [product, setProduct] = useState<PipesFittingProduct>(initialGroup.products[0]);
  const [snackBar, setSnackBar] = useState<{ id: number; message: string } | null>(null);
  const dismissSnackBar = useCallback(() => setSnackBar(null), []);

  const group = groups[groupIndex];

  /** `_siblingGroups` — same sub-category as the initially opened group. */
  const siblingIndexes = groups
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => g.subCategory.toLowerCase() === initialGroup.subCategory.toLowerCase())
    .map(({ i }) => i);

  const sizeOptions = [
    ...new Set(group.products.map((p) => p.size).filter((s): s is string => !!s)),
  ].sort();

  const typeOptions = [...new Set(siblingIndexes.map((i) => typeLabelFor(groups[i])))].sort();

  const onSizeChanged = (size: string) => {
    const match = group.products.find((p) => p.size === size);
    if (match) setProduct(match);
  };

  const onTypeChanged = (type: string) => {
    const nextIndex = siblingIndexes.find((i) => typeLabelFor(groups[i]) === type);
    if (nextIndex == null || nextIndex === groupIndex) return;
    const newGroup = groups[nextIndex];
    const sameSize = newGroup.products.find((p) => p.size === product.size);
    setGroupIndex(nextIndex);
    setProduct(sameSize ?? newGroup.products[0]);
  };

  const addToCart = () => {
    addVariant(variantFor(product, group));
    // hideCurrentSnackBar + showSnackBar → remount with a new key.
    setSnackBar((prev) => ({
      id: (prev?.id ?? 0) + 1,
      message: `${product.brand} ${product.productName} added to cart`,
    }));
  };

  const title = (() => {
    const code = product.productCode;
    const namePart = code ? `${code}_${product.productName}` : product.productName;
    const details = [typeLabelFor(group)];
    if (product.size) details.push(product.size);
    if (product.length) details.push(product.length);
    return `${namePart}, ${details.join(', ')} ${product.brand}`;
  })();

  return (
    <Screen>
      <StorefrontHeader webOnly sticky={false} />
      <TopBar>
        <TopBarInner>
          <BackButton type="button" aria-label="Back" onClick={maybePop}>
            <i className="pi pi-arrow-left" aria-hidden="true" />
          </BackButton>
          <TopBarContext>{group.subCategory}</TopBarContext>
          <SearchPill type="button" onClick={() => navigate(AppRoutes.search)}>
            <i className="pi pi-search" aria-hidden="true" />
            Search products
          </SearchPill>
          <MobileCartSlot>
            <CartIconButton />
          </MobileCartSlot>
        </TopBarInner>
      </TopBar>

      <Body>
        <Media>
          <CategoryImage
            imageAsset={group.imageAsset}
            fallbackIcon={plumbingIcon}
            fallbackIconColor={theme.colors.outline}
            fallbackBackground={theme.colors.surfaceContainer}
            fit="contain"
            radius={theme.radius.lg}
            iconSize={theme.spacing.space8}
          />
        </Media>

        <Details>
          <DetailsInner>
            <Eyebrow>
              <BrandChip>{product.brand}</BrandChip>
              {group.subCategory}
            </Eyebrow>
            <Title>{title}</Title>
            <FieldLabel>{configuratorMock._webLabels.size}</FieldLabel>
            <ConfiguratorDropdown
              value={product.size}
              options={sizeOptions}
              hint="Select size"
              onChange={sizeOptions.length === 0 ? null : onSizeChanged}
            />
            <FieldGap $size={theme.spacing.space2} />
            <FieldLabel>{configuratorMock._webLabels.type}</FieldLabel>
            <ConfiguratorDropdown
              value={typeLabelFor(group)}
              options={typeOptions}
              hint="Select type"
              onChange={typeOptions.length <= 1 ? null : onTypeChanged}
            />

            <CartCard>
              <CartInfo>
                <CartLabel>Selected Product Size</CartLabel>
                <CartPrice>
                  ₹{product.mrp.toFixed(0)}
                  <CartUnit>/ {group.unit}</CartUnit>
                </CartPrice>
                <CartSize>{product.size ?? '—'}</CartSize>
              </CartInfo>
              <AddToCartButton type="button" onClick={addToCart}>
                <i className="pi pi-cart-plus" aria-hidden="true" />
                Add to Cart
              </AddToCartButton>
            </CartCard>
          </DetailsInner>
        </Details>
      </Body>

      {snackBar && (
        <SnackBar
          key={snackBar.id}
          message={snackBar.message}
          onDismissed={dismissSnackBar}
          durationMs={configuratorMock._addToCart.snackBarDurationMs}
          webAlign="center"
          action={{
            label: configuratorMock._addToCart.viewCartLabel,
            onPressed: () => navigate(AppRoutes.cart),
          }}
        />
      )}
    </Screen>
  );
}

/**
 * Product configurator opened from a product card in PipesFittingCategory
 * (Flutter `_PipeConfiguratorScreen`): the tapped product with size and type
 * pickers plus an "Add to Cart" action.
 */
export function PipeConfigurator() {
  const args = useLocation().state as PipeConfiguratorArgs | null;

  // Web-only: the page has no data without router state (e.g. opened by URL
  // or after a refresh), so fall back to the category screen.
  if (!args || !args.groups?.[args.initialGroupIndex]?.products.length) {
    return <Navigate to={AppRoutes.categoryBrowse} replace />;
  }

  return <PipeConfiguratorView {...args} />;
}
