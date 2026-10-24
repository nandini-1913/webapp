import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../routes/appRoutes';
import type { CategoryBrowseArgs } from '../../routes/appRoutes';
import type { HomeCategory } from '../../services/catalog/catalogModels';
import catalogMock from '../../mocks/catalog_mock_data.json';
import mock from './StorefrontFooter.mock.json';
import {
  Footer,
  FooterInner,
  Columns,
  BrandColumn,
  Brand,
  BrandMark,
  BrandName,
  Tagline,
  SocialRow,
  SocialLink,
  LinkColumn,
  ColumnTitle,
  LinkList,
  FooterLink,
  CategoryList,
  Download,
  DownloadTitle,
  StoreRow,
  StoreBadge,
  StoreText,
  Copyright,
} from './StorefrontFooter.styles';

const { _brand, _social, _companyTitle, _companyLinks, _categoriesTitle, _downloadTitle, _stores } =
  mock;
const categories: HomeCategory[] = catalogMock.categories;

interface StorefrontFooterProps {
  /** Hidden below `md` — for pages whose mobile layout keeps the Flutter bottom nav. */
  webOnly?: boolean;
}

/**
 * The app-wide web footer: brand + social links, company pages, every catalog
 * category, app store badges and the copyright line. Pairs with `StorefrontHeader`.
 */
export function StorefrontFooter({ webOnly }: StorefrontFooterProps) {
  const navigate = useNavigate();

  const openCategory = (category: HomeCategory) => {
    const args: CategoryBrowseArgs = { categoryId: category.id };
    navigate(AppRoutes.categoryBrowse, { state: args });
  };

  return (
    <Footer $webOnly={webOnly}>
      <FooterInner>
        <Columns>
          <BrandColumn>
            <Brand
              type="button"
              aria-label={`${_brand.name}${_brand.accent}`}
              onClick={() => navigate(AppRoutes.main)}
            >
              <BrandMark src={_brand.logo} alt="" />
              <BrandName>
                {_brand.name}
                <span>{_brand.accent}</span>
              </BrandName>
            </Brand>
            <Tagline>{_brand.tagline}</Tagline>
            <SocialRow>
              {_social.map((s) => (
                <SocialLink
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  aria-label={s.label}
                >
                  <i className={`pi ${s.icon}`} aria-hidden="true" />
                </SocialLink>
              ))}
            </SocialRow>
          </BrandColumn>

          <LinkColumn aria-labelledby="footer-company-title">
            <ColumnTitle id="footer-company-title">{_companyTitle}</ColumnTitle>
            <LinkList>
              {_companyLinks.map((link) => (
                <li key={link.route}>
                  <FooterLink
                    type="button"
                    onClick={() => navigate(AppRoutes[link.route as keyof typeof AppRoutes])}
                  >
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </LinkList>
          </LinkColumn>

          <LinkColumn aria-labelledby="footer-categories-title">
            <ColumnTitle id="footer-categories-title">{_categoriesTitle}</ColumnTitle>
            <CategoryList>
              {categories.map((category) => (
                <li key={category.id}>
                  <FooterLink type="button" onClick={() => openCategory(category)}>
                    {category.name}
                  </FooterLink>
                </li>
              ))}
            </CategoryList>
          </LinkColumn>
        </Columns>

        <Download>
          <DownloadTitle>{_downloadTitle}</DownloadTitle>
          <StoreRow>
            {_stores.map((store) => (
              <StoreBadge
                key={store.label}
                href={store.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${store.caption} ${store.label}`}
              >
                <i className={`pi ${store.icon}`} aria-hidden="true" />
                <StoreText>
                  <small>{store.caption}</small>
                  {store.label}
                </StoreText>
              </StoreBadge>
            ))}
          </StoreRow>
        </Download>

        <Copyright>
          © {new Date().getFullYear()} {mock._copyright}
        </Copyright>
      </FooterInner>
    </Footer>
  );
}
