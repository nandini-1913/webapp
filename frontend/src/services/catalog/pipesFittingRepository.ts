import { apiGet } from '../api/apiClient';
import type { ApiCatalogItem, ApiCategory, ApiSubcategory } from './catalogApiTypes';
import { pickPipesCategoryName } from './catalogCategory';
import { buildPipesFittingCatalog } from './pipesFittingCatalogAdapter';
import type { PipesFittingCatalog } from './pipesFittingModels';

/** Loads Pipes & Fitting products from the FastAPI backend only (no mock catalog). */
export async function loadPipesFittingCatalog(signal?: AbortSignal): Promise<PipesFittingCatalog> {
  const categories = await apiGet<ApiCategory[]>('categories', signal);
  const categoryName = pickPipesCategoryName(categories);
  if (!categoryName) {
    throw new Error('No pipes category was found on the server.');
  }

  const [items, subcategories] = await Promise.all([
    apiGet<ApiCatalogItem[]>(`catalog?category=${encodeURIComponent(categoryName)}`, signal),
    apiGet<ApiSubcategory[]>('subcategories', signal),
  ]);

  if (items.length === 0) {
    throw new Error('No products were returned for the pipes category.');
  }

  return buildPipesFittingCatalog(categoryName, items, subcategories);
}
