import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { AppRoutes } from '../../../routes/appRoutes';
import { useMaybePop } from '../../../hooks/useMaybePop';
import { CartIconButton } from '../../../shared/CartIconButton';
import { StorefrontHeader } from '../../../shared/StorefrontHeader';
import { CircularProgress } from '../../../shared/CircularProgress';
import { CategoryImage } from '../../../shared/CategoryImage';
import { loadPipesFittingCatalog } from '../../../services/catalog/pipesFittingRepository';
import type { PipesFittingCatalog } from '../../../services/catalog/pipesFittingModels';
import { groupMinMrp, pipeSizeMmValue } from '../../../services/catalog/pipeCategoryGroups';
import type { CategoryProductGroup } from '../../../services/catalog/pipeCategoryGroups';
import type { PipeConfiguratorArgs } from '../PipeConfigurator';
import pipesConfig from './PipesFittingCategory.config.json';
import {
  Screen,
  AppHeaderSlot,
  Header,
  HeaderInner,
  BackSlot,
  SearchSlot,
  HeaderTitle,
  ToolbarHeading,
  FilterRow,
  HeaderIconButton,
  FilterButton,
  MenuBackdrop,
  MenuCard,
  MenuSearchWrap,
  MenuSearchField,
  MenuList,
  MenuEmpty,
  MenuTile,
  MenuTileLabel,
  MenuCheck,
  Centered,
  Sidebar,
  SidebarBrand,
  SidebarBrandText,
  SidebarBrandTitle,
  SidebarBrandMeta,
  SidebarNav,
  AllIcon,
  CountPill,
  SidebarGap,
  SidebarSectionLabel,
  SidebarAllRow,
  SidebarTypeRow,
  TypeThumb,
  RowLabel,
  SidebarSubRow,
  Content,
  ContentHeading,
  ContentTitle,
  ContentSubtitle,
  ResultsBar,
  ResultsCount,
  FilterChip,
  Grid,
  StateMessage,
  StateIcon,
  StateTitle,
  StateSubtitle,
  Card,
  CardMedia,
  AddBadge,
  AddBadgeLabel,
  AddBadgeCount,
  CardBody,
  CardPrice,
  Rupee,
  PriceUnit,
  CardDiscount,
  CardTitle,
} from './PipesFittingCategory.styles';

// ── Screen configuration ────────────────────────────────────────────────

/** Flutter `_CatSection`. */
type CatSection = 'all' | 'upvc' | 'pvc' | 'cpvc';

/** Flutter `PipeModuleSort`. */
type PipeModuleSort = 'all' | 'discount' | 'priceLowHigh' | 'whatsNew' | 'priceHighLow' | 'ratings';

interface CatSectionMeta {
  section: CatSection;
  label: string;
  /** `_typeNameForSection` result (null for All). */
  typeName: string | null;
}

const sidebarImages = pipesConfig._CatSidebarImages;
const sections = pipesConfig._sections as CatSectionMeta[];
const sortOptions = pipesConfig._SortDropdownMenu._options as {
  sort: PipeModuleSort;
  label: string;
}[];

/** Flutter `Icons.plumbing_rounded` has no primeicons match — nearest glyph. */
const plumbingIcon = 'pi-wrench';

type OpenMenu = 'sort' | 'size' | 'brand' | 'class' | null;

// ── Pure helpers (ported 1:1 from _PipesFittingCategoryScreenState) ────

const typeNameForSection = (section: CatSection): string | null =>
  sections.find((s) => s.section === section)?.typeName ?? null;

function imageForType(typeName: string): string {
  switch (typeName) {
    case 'PVC':
      return sidebarImages.pvc;
    case 'UPVC':
      return sidebarImages.upvc;
    case 'CPVC':
      return sidebarImages.cpvc;
    default:
      return sidebarImages.all;
  }
}

function subCategoryNames(catalog: PipesFittingCatalog): string[] {
  const names: string[] = [];
  for (const type of catalog.types) {
    for (const sub of type.subCategories) {
      if (!names.some((n) => n.toLowerCase() === sub.subCategory.toLowerCase())) {
        names.push(sub.subCategory);
      }
    }
  }
  return names;
}

function groupsForSection(
  catalog: PipesFittingCatalog,
  section: CatSection,
  subCategory: string | null,
): CategoryProductGroup[] {
  const typeName = typeNameForSection(section);
  const types = typeName == null ? catalog.types : catalog.types.filter((t) => t.type === typeName);

  const groups: CategoryProductGroup[] = [];
  for (const type of types) {
    for (const sub of type.subCategories) {
      if (subCategory != null && sub.subCategory.toLowerCase() !== subCategory.toLowerCase()) {
        continue;
      }
      for (const cls of sub.classes) {
        if (cls.products.length === 0) continue;
        const titleParts = [
          type.type === 'Other' ? null : type.type,
          sub.subCategory === 'Other' ? null : sub.subCategory,
          cls.className === 'Products' ? null : `(${cls.className})`,
        ].filter((part): part is string => part != null);
        groups.push({
          title: titleParts.join(' ') || 'Products',
          categoryId: catalog.categoryId,
          categoryName: catalog.category,
          subCategory: sub.subCategory,
          subcategoryId: cls.products[0].subcategoryId,
          className: cls.className,
          products: cls.products,
          imageAsset:
            cls.products.find((product) => product.imageUrl)?.imageUrl ?? imageForType(type.type),
          unit: cls.products[0].unit,
        });
      }
    }
  }
  return groups;
}

const matchesBrand = (group: CategoryProductGroup, brand: string) =>
  group.products.some((p) => p.brand.toLowerCase() === brand.toLowerCase());

function matchesSize(group: CategoryProductGroup, sizeLabel: string): boolean {
  const targetMm = pipeSizeMmValue(sizeLabel);
  if (targetMm == null) return false;
  return group.products.some((p) => {
    const raw = p.size ?? '';
    const mm = pipeSizeMmValue(raw);
    if (mm != null && mm === targetMm) return true;
    return raw.toLowerCase().includes(`${Math.trunc(targetMm)}`);
  });
}

/** Available classes are derived from the current backend response. */
function classesForType(catalog: PipesFittingCatalog, typeName: string | null): string[] {
  const names: string[] = [];
  for (const type of catalog.types) {
    if (typeName != null && type.type !== typeName) continue;
    for (const subCategory of type.subCategories) {
      for (const productClass of subCategory.classes) {
        if (!names.includes(productClass.className)) names.push(productClass.className);
      }
    }
  }
  return names;
}

const classMatches = (a: string, b: string) =>
  a.replace(/\s/g, '').toLowerCase() === b.replace(/\s/g, '').toLowerCase();

const pluralize = (value: string) => (value.toLowerCase().endsWith('s') ? value : `${value}s`);

function sizesInCatalog(catalog: PipesFittingCatalog): string[] {
  const sizes = new Set<string>();
  for (const type of catalog.types) {
    for (const subCategory of type.subCategories) {
      for (const productClass of subCategory.classes) {
        for (const product of productClass.products) {
          if (product.size) sizes.add(product.size);
        }
      }
    }
  }
  return [...sizes].sort(
    (a, b) => (pipeSizeMmValue(a) ?? Number.MAX_VALUE) - (pipeSizeMmValue(b) ?? Number.MAX_VALUE),
  );
}

function brandsInCatalog(catalog: PipesFittingCatalog): string[] {
  const brands = new Set<string>();
  for (const type of catalog.types) {
    for (const subCategory of type.subCategories) {
      for (const productClass of subCategory.classes) {
        for (const product of productClass.products) {
          if (product.brand) brands.add(product.brand);
        }
      }
    }
  }
  return [...brands].sort((a, b) => a.localeCompare(b));
}

// ── Header dropdowns ────────────────────────────────────────────────────

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * Flutter `_showDropdown` — anchored to the button's right edge, clamped so
 * the menu never spills off either side of the viewport.
 */
function menuPositionFor(
  anchor: HTMLElement | null,
  menuWidth: number,
  edgeMargin: number,
  gap: number,
): MenuPosition | null {
  if (!anchor) return null;
  const rect = anchor.getBoundingClientRect();
  const maxLeft = window.innerWidth - menuWidth - edgeMargin;
  const rawLeft = rect.right - menuWidth;
  const left = Math.min(Math.max(rawLeft, edgeMargin), maxLeft < edgeMargin ? edgeMargin : maxLeft);
  return { top: rect.bottom + gap, left, width: menuWidth };
}

interface DropdownTileItem {
  key: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

/** `_DropdownMenuChrome` + `_DropdownSearchField` + `_DropdownTile`s. */
function DropdownMenu({
  position,
  searchHint,
  onClose,
  buildTiles,
}: {
  position: MenuPosition;
  searchHint: string;
  onClose: () => void;
  buildTiles: (query: string) => DropdownTileItem[];
}) {
  const [query, setQuery] = useState('');
  const tiles = buildTiles(query);

  return (
    <>
      <MenuBackdrop onClick={onClose} />
      <MenuCard $top={position.top} $left={position.left} $width={position.width} role="menu">
        <MenuSearchWrap>
          <MenuSearchField>
            <i className="pi pi-search" aria-hidden="true" />
            <input
              type="text"
              placeholder={searchHint}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </MenuSearchField>
        </MenuSearchWrap>
        {tiles.length === 0 ? (
          <MenuEmpty>No matches found</MenuEmpty>
        ) : (
          <MenuList>
            {tiles.map((tile) => (
              <MenuTile
                key={tile.key}
                type="button"
                role="menuitemradio"
                aria-checked={tile.selected}
                $selected={tile.selected}
                onClick={tile.onSelect}
              >
                <MenuCheck $selected={tile.selected}>
                  {tile.selected && <i className="pi pi-check" aria-hidden="true" />}
                </MenuCheck>
                <MenuTileLabel $selected={tile.selected}>{tile.label}</MenuTileLabel>
              </MenuTile>
            ))}
          </MenuList>
        )}
      </MenuCard>
    </>
  );
}

function FilterDropdownButton({
  buttonRef,
  label,
  onClick,
}: {
  buttonRef: RefObject<HTMLButtonElement | null>;
  label: string;
  onClick: () => void;
}) {
  return (
    <FilterButton ref={buttonRef} type="button" onClick={onClick} aria-haspopup="menu">
      <span>{label}</span>
      <i className="pi pi-chevron-down" aria-hidden="true" />
    </FilterButton>
  );
}

// ── Body widgets ────────────────────────────────────────────────────────

function CatalogStateMessage({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <StateMessage>
      <StateIcon>
        <i className={`pi ${icon}`} aria-hidden="true" />
      </StateIcon>
      <StateTitle>{title}</StateTitle>
      {subtitle != null && <StateSubtitle>{subtitle}</StateSubtitle>}
    </StateMessage>
  );
}

function CategoryProductCard({
  group,
  onOpen,
}: {
  group: CategoryProductGroup;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const price = groupMinMrp(group);

  return (
    <Card type="button" onClick={onOpen}>
      <CardMedia>
        <CategoryImage
          imageAsset={group.imageAsset}
          fallbackIcon={plumbingIcon}
          fallbackIconColor={theme.colors.outline}
          fallbackBackground={theme.colors.surfaceContainer}
          fit="contain"
          radius={theme.radius.md}
          iconSize={theme.spacing.space8}
        />
        <AddBadge>
          <AddBadgeLabel>ADD</AddBadgeLabel>
          <AddBadgeCount>{group.products.length} Products</AddBadgeCount>
        </AddBadge>
      </CardMedia>
      <CardBody>
        <CardPrice>
          <Rupee>₹</Rupee>
          {price.toFixed(0)}
          <PriceUnit> /{group.unit}</PriceUnit>
        </CardPrice>
        {Math.max(...group.products.map((product) => product.regularDiscount ?? 0)) > 0 && (
          <CardDiscount>
            discount {Math.max(...group.products.map((product) => product.regularDiscount ?? 0))}%
          </CardDiscount>
        )}
        <CardTitle title={group.title}>{group.title}</CardTitle>
      </CardBody>
    </Card>
  );
}

/** Web-only sidebar top: back button + category name + group count. */
function SidebarBrandBlock({ onBack, meta }: { onBack: () => void; meta?: string }) {
  return (
    <SidebarBrand>
      <HeaderIconButton type="button" aria-label="Back" onClick={onBack}>
        <i className="pi pi-arrow-left" aria-hidden="true" />
      </HeaderIconButton>
      <SidebarBrandText>
        <SidebarBrandTitle>Plumbing Pipes &amp; Fittings</SidebarBrandTitle>
        {meta != null && <SidebarBrandMeta>{meta}</SidebarBrandMeta>}
      </SidebarBrandText>
    </SidebarBrand>
  );
}

function CategorySidebar({
  selected,
  sectionCounts,
  subCategories,
  selectedSubCategory,
  onSectionSelected,
  onSubCategorySelected,
}: {
  selected: CatSection;
  sectionCounts: Record<CatSection, number>;
  subCategories: string[];
  selectedSubCategory: string | null;
  onSectionSelected: (section: CatSection) => void;
  onSubCategorySelected: (name: string | null) => void;
}) {
  const theme = useTheme();
  const [allMeta, ...typeMetas] = sections;

  return (
    <SidebarNav aria-label="Pipe categories">
      <SidebarAllRow
        type="button"
        $selected={selected === 'all'}
        aria-pressed={selected === 'all'}
        onClick={() => onSectionSelected('all')}
      >
        <AllIcon $selected={selected === 'all'}>
          <i className="pi pi-th-large" aria-hidden="true" />
        </AllIcon>
        {allMeta.label}
        <CountPill $selected={selected === 'all'}>{sectionCounts.all}</CountPill>
      </SidebarAllRow>
      <SidebarGap $size={theme.spacing.space3} />
      <SidebarSectionLabel>Type</SidebarSectionLabel>
      {typeMetas.map((meta) => {
        const isSelected = selected === meta.section;
        return (
          <SidebarTypeRow
            key={meta.section}
            type="button"
            $selected={isSelected}
            aria-pressed={isSelected}
            onClick={() => onSectionSelected(meta.section)}
          >
            <TypeThumb $selected={isSelected}>
              <CategoryImage
                imageAsset={sidebarImages[meta.section]}
                fallbackIcon={plumbingIcon}
                fallbackIconColor={theme.colors.outline}
                fallbackBackground={theme.colors.surface}
                fit="contain"
                iconSize={16}
              />
            </TypeThumb>
            <RowLabel $selected={isSelected}>{meta.label}</RowLabel>
            <CountPill $selected={isSelected}>{sectionCounts[meta.section]}</CountPill>
          </SidebarTypeRow>
        );
      })}
      {selected !== 'all' && (
        <>
          <SidebarGap $size={theme.spacing.space3} />
          <SidebarSectionLabel>Sub-category</SidebarSectionLabel>
          <SidebarSubRow
            type="button"
            $selected={selectedSubCategory == null}
            aria-pressed={selectedSubCategory == null}
            onClick={() => onSubCategorySelected(null)}
          >
            <RowLabel $selected={selectedSubCategory == null} $sub>
              All
            </RowLabel>
          </SidebarSubRow>
          {subCategories.map((name) => {
            const isSelected = selectedSubCategory?.toLowerCase() === name.toLowerCase();
            return (
              <SidebarSubRow
                key={name}
                type="button"
                $selected={isSelected}
                aria-pressed={isSelected}
                onClick={() => onSubCategorySelected(name)}
              >
                <RowLabel $selected={isSelected} $sub>
                  {name}
                </RowLabel>
              </SidebarSubRow>
            );
          })}
        </>
      )}
      <SidebarGap $size={theme.spacing.space2} />
    </SidebarNav>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────

type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; catalog: PipesFittingCatalog };

/**
 * Category-level entry screen for Plumbing Pipes & Fittings (Flutter
 * `PipesFittingCategoryScreen`). Single-page Type → Sub-category drilldown:
 * the sidebar picks a pipe Type and Sub-category and the product grid
 * updates in place. Tapping a card opens the pipe configurator.
 */
export function PipesFittingCategory() {
  const theme = useTheme();
  const navigate = useNavigate();
  const maybePop = useMaybePop();

  const [catalogState, setCatalogState] = useState<CatalogState>({ status: 'loading' });
  const [section, setSection] = useState<CatSection>('all');
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<PipeModuleSort>('all');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const sizeButtonRef = useRef<HTMLButtonElement>(null);
  const brandButtonRef = useRef<HTMLButtonElement>(null);
  const classButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    loadPipesFittingCatalog(controller.signal)
      .then((catalog) => active && setCatalogState({ status: 'done', catalog }))
      .catch((error: unknown) => {
        if (!active) return;
        setCatalogState({
          status: 'error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const catalog = catalogState.status === 'done' ? catalogState.catalog : null;
  const filterSizes = catalog ? sizesInCatalog(catalog) : [];
  const filterBrands = catalog ? brandsInCatalog(catalog) : [];

  const groups = useMemo(() => {
    if (!catalog) return [];
    let result = groupsForSection(catalog, section, subCategory);
    if (selectedBrand != null) result = result.filter((g) => matchesBrand(g, selectedBrand));
    if (size != null && size !== '') result = result.filter((g) => matchesSize(g, size));
    if (selectedClass != null) {
      result = result.filter((g) => classMatches(g.className, selectedClass));
    }

    switch (sort) {
      case 'priceLowHigh':
        return [...result].sort((a, b) => groupMinMrp(a) - groupMinMrp(b));
      case 'whatsNew':
        return [...result].reverse();
      case 'priceHighLow':
        return [...result].sort((a, b) => groupMinMrp(b) - groupMinMrp(a));
      // all / discount / ratings: no reordering in Flutter.
      default:
        return result;
    }
  }, [catalog, section, subCategory, selectedBrand, size, selectedClass, sort]);

  const subCategories = useMemo(() => (catalog ? subCategoryNames(catalog) : []), [catalog]);

  /** Unfiltered group count per sidebar section (web count pills). */
  const sectionCounts = useMemo(() => {
    const counts = {} as Record<CatSection, number>;
    for (const { section: s } of sections) {
      counts[s] = catalog ? groupsForSection(catalog, s, null).length : 0;
    }
    return counts;
  }, [catalog]);

  const typeLabel = typeNameForSection(section);

  const title = (() => {
    if (!catalog) return '';
    if (typeLabel == null && subCategory == null) return catalog.category;
    if (typeLabel != null && subCategory != null) return `${typeLabel} ${pluralize(subCategory)}`;
    if (typeLabel != null) return `${typeLabel} Products`;
    return pluralize(subCategory!);
  })();

  const subtitle = (() => {
    if (!catalog) return '';
    if (selectedBrand != null)
      return `${selectedBrand} brand ${typeLabel ?? catalog.category} products`;
    if (typeLabel != null && subCategory != null) {
      return `High quality ${typeLabel} ${subCategory.toLowerCase()}s for various applications`;
    }
    if (typeLabel != null) return `Browse ${typeLabel} pipes, fittings and accessories`;
    return 'Wide range of pipes, fittings and accessories';
  })();

  const menuConfig = {
    sort: { ref: sortButtonRef, width: 240 },
    size: { ref: sizeButtonRef, width: 200 },
    brand: { ref: brandButtonRef, width: 220 },
    class: { ref: classButtonRef, width: 200 },
  } as const;

  /** `_toggleSortMenu` / `_toggleSizeMenu` / `_toggleBrandMenu` / `_toggleClassMenu`. */
  const toggleMenu = (menu: Exclude<OpenMenu, null>) => {
    if (openMenu === menu) {
      setOpenMenu(null);
      return;
    }
    const { ref, width } = menuConfig[menu];
    const position = menuPositionFor(
      ref.current,
      width,
      theme.spacing.space3,
      theme.spacing.space1,
    );
    if (!position) return;
    setMenuPosition(position);
    setOpenMenu(menu);
  };

  const closeMenu = () => setOpenMenu(null);

  const onSectionSelected = (next: CatSection) => {
    setSection(next);
    if (next === 'all') setSubCategory(null);
    // Drop a class the newly picked Type doesn't offer.
    if (
      selectedClass != null &&
      catalog != null &&
      !classesForType(catalog, typeNameForSection(next)).some((c) => classMatches(c, selectedClass))
    ) {
      setSelectedClass(null);
    }
  };

  const openConfigurator = (index: number) => {
    const state: PipeConfiguratorArgs = { groups, initialGroupIndex: index };
    navigate(AppRoutes.pipeConfigurator, { state });
  };

  let menu: ReactNode = null;
  if (openMenu && menuPosition) {
    if (openMenu === 'sort') {
      menu = (
        <DropdownMenu
          position={menuPosition}
          searchHint="Search sort options..."
          onClose={closeMenu}
          buildTiles={(query) =>
            sortOptions
              .filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
              .map((o) => ({
                key: o.sort,
                label: o.label,
                selected: sort === o.sort,
                onSelect: () => {
                  setSort(o.sort);
                  closeMenu();
                },
              }))
          }
        />
      );
    } else if (openMenu === 'size') {
      menu = (
        <DropdownMenu
          position={menuPosition}
          searchHint="Search size..."
          onClose={closeMenu}
          buildTiles={(query) => [
            ...(query === ''
              ? [
                  {
                    key: '__all',
                    label: 'All Sizes',
                    selected: size == null,
                    onSelect: () => {
                      setSize(null);
                      closeMenu();
                    },
                  },
                ]
              : []),
            ...filterSizes
              .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
              .map((s) => ({
                key: s,
                label: s,
                selected: size === s,
                onSelect: () => {
                  setSize(s);
                  closeMenu();
                },
              })),
          ]}
        />
      );
    } else if (openMenu === 'class') {
      menu = (
        <DropdownMenu
          position={menuPosition}
          searchHint="Search class..."
          onClose={closeMenu}
          buildTiles={(query) => [
            ...(query === ''
              ? [
                  {
                    key: '__all',
                    label: 'All Classes',
                    selected: selectedClass == null,
                    onSelect: () => {
                      setSelectedClass(null);
                      closeMenu();
                    },
                  },
                ]
              : []),
            ...(catalog ? classesForType(catalog, typeLabel) : [])
              .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
              .map((c) => ({
                key: c,
                label: c,
                selected: selectedClass === c,
                onSelect: () => {
                  setSelectedClass(c);
                  closeMenu();
                },
              })),
          ]}
        />
      );
    } else {
      menu = (
        <DropdownMenu
          position={menuPosition}
          searchHint="Search brand..."
          onClose={closeMenu}
          buildTiles={(query) => [
            ...(query === ''
              ? [
                  {
                    key: '__all',
                    label: 'All Brands',
                    selected: selectedBrand == null,
                    onSelect: () => {
                      setSelectedBrand(null);
                      closeMenu();
                    },
                  },
                ]
              : []),
            ...filterBrands
              .filter((b) => b.toLowerCase().includes(query.toLowerCase()))
              .map((b) => ({
                key: b,
                label: b,
                selected: selectedBrand === b,
                onSelect: () => {
                  setSelectedBrand(b);
                  closeMenu();
                },
              })),
          ]}
        />
      );
    }
  }

  return (
    <Screen>
      <AppHeaderSlot>
        <StorefrontHeader sticky={false} />
      </AppHeaderSlot>
      <Header>
        <HeaderInner>
          <BackSlot>
            <HeaderIconButton type="button" aria-label="Back" onClick={maybePop}>
              <i className="pi pi-arrow-left" aria-hidden="true" />
            </HeaderIconButton>
          </BackSlot>
          <HeaderTitle>Plumbing Pipes &amp; Fittings</HeaderTitle>
          {catalog != null && (
            <ToolbarHeading>
              <ContentTitle>{title}</ContentTitle>
              <ContentSubtitle>{subtitle}</ContentSubtitle>
            </ToolbarHeading>
          )}
          <FilterRow>
            <FilterDropdownButton
              buttonRef={sortButtonRef}
              label={
                sort === 'all'
                  ? 'Sort By'
                  : (sortOptions.find((o) => o.sort === sort)?.label ?? 'Sort By')
              }
              onClick={() => toggleMenu('sort')}
            />
            <FilterDropdownButton
              buttonRef={sizeButtonRef}
              label={size ?? 'Size'}
              onClick={() => toggleMenu('size')}
            />
            <FilterDropdownButton
              buttonRef={brandButtonRef}
              label={selectedBrand ?? 'Brand'}
              onClick={() => toggleMenu('brand')}
            />
            <FilterDropdownButton
              buttonRef={classButtonRef}
              label={selectedClass ?? 'Class'}
              onClick={() => toggleMenu('class')}
            />
          </FilterRow>
          <SearchSlot>
            <HeaderIconButton
              type="button"
              aria-label="Search"
              onClick={() => navigate(AppRoutes.search)}
            >
              <i className="pi pi-search" aria-hidden="true" />
            </HeaderIconButton>
            <CartIconButton />
          </SearchSlot>
        </HeaderInner>
      </Header>

      <Sidebar $hiddenOnMobile={catalog == null}>
        <SidebarBrandBlock
          onBack={maybePop}
          meta={catalog ? `${sectionCounts.all} product groups` : undefined}
        />
        {catalog != null && (
          <CategorySidebar
            selected={section}
            sectionCounts={sectionCounts}
            subCategories={subCategories}
            selectedSubCategory={subCategory}
            onSectionSelected={onSectionSelected}
            onSubCategorySelected={setSubCategory}
          />
        )}
      </Sidebar>

      <Content $fullOnMobile={catalog == null}>
        {catalogState.status === 'loading' ? (
          <Centered>
            <CircularProgress size={36} color={theme.colors.primary} />
          </Centered>
        ) : catalogState.status === 'error' ? (
          <CatalogStateMessage
            icon="pi-exclamation-circle"
            title="Unable to load catalog"
            subtitle={catalogState.message}
          />
        ) : (
          <>
            <ContentHeading>
              <ContentTitle>{title}</ContentTitle>
              <ContentSubtitle>{subtitle}</ContentSubtitle>
            </ContentHeading>
            <ResultsBar>
              <ResultsCount>
                <strong>{groups.length}</strong> {groups.length === 1 ? 'result' : 'results'}
              </ResultsCount>
              {size != null && (
                <FilterChip
                  type="button"
                  aria-label={`Clear size ${size}`}
                  onClick={() => setSize(null)}
                >
                  {size}
                  <i className="pi pi-times" aria-hidden="true" />
                </FilterChip>
              )}
              {selectedBrand != null && (
                <FilterChip
                  type="button"
                  aria-label={`Clear brand ${selectedBrand}`}
                  onClick={() => setSelectedBrand(null)}
                >
                  {selectedBrand}
                  <i className="pi pi-times" aria-hidden="true" />
                </FilterChip>
              )}
              {selectedClass != null && (
                <FilterChip
                  type="button"
                  aria-label={`Clear class ${selectedClass}`}
                  onClick={() => setSelectedClass(null)}
                >
                  {selectedClass}
                  <i className="pi pi-times" aria-hidden="true" />
                </FilterChip>
              )}
            </ResultsBar>
            {groups.length === 0 ? (
              <CatalogStateMessage
                icon="pi-box"
                title="No products here yet"
                subtitle="Try another category or adjust your filters."
              />
            ) : (
              <Grid>
                {groups.map((group, index) => (
                  <CategoryProductCard
                    key={group.title}
                    group={group}
                    onOpen={() => openConfigurator(index)}
                  />
                ))}
              </Grid>
            )}
          </>
        )}
      </Content>

      {menu}
    </Screen>
  );
}
