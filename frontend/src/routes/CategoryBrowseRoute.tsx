import { useLocation } from 'react-router-dom';
import mockData from '../mocks/mockData.json';
import { PipesFittingCategory } from '../pages/catalog/PipesFittingCategory';
import catalogMock from '../mocks/catalog_mock_data.json';
import { CategoryComingSoon } from '../pages/catalog/CategoryComingSoon';
import { isPipesFittingCategoryName } from '../services/catalog/catalogCategory';
import type { CategoryBrowseArgs } from './appRoutes';

/**
 * Flutter `AppRouter` case `AppRoutes.categoryBrowse`: no args defaults to
 * the Pipes & Tubing category, which opens PipesFittingCategory; any other
 * category shows the web Coming Soon page for now.
 */
export function CategoryBrowseRoute() {
  const args = useLocation().state as CategoryBrowseArgs | null;
  const categoryId = args?.categoryId ?? mockData.catalog.pipesTubingCategoryId;
  const categoryName =
    args?.categoryName ??
    catalogMock.categories.find((c) => c.id === categoryId)?.name ??
    '';

  if (
    categoryId === mockData.catalog.pipesTubingCategoryId ||
    isPipesFittingCategoryName(categoryName)
  ) {
    return <PipesFittingCategory />;
  }

  const mockCategory = catalogMock.categories.find((c) => c.id === categoryId);
  return <CategoryComingSoon category={mockCategory} />;
}
