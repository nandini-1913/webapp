import mockData from '../../mocks/mockData.json';
import type { ProductVariant } from './catalogModels';
import type { PipesFittingProduct } from './pipesFittingModels';

/** Flutter `_CategoryProductGroup` (pipes_fitting_category_screen.dart). */
export interface CategoryProductGroup {
  title: string;
  subCategory: string;
  className: string;
  products: PipesFittingProduct[];
  imageAsset: string;
  /** Flutter getter `unit` — always `'pcs'`. */
  unit: string;
}

export const groupMinMrp = (group: CategoryProductGroup): number =>
  Math.min(...group.products.map((p) => p.mrp));

/** Flutter `pipeSizeMmValue` — numeric mm from labels like `15 mm`. */
export function pipeSizeMmValue(raw: string): number | null {
  const match = /(\d+(?:\.\d+)?)/.exec(raw.trim());
  return match ? Number.parseFloat(match[1]) : null;
}

/** Flutter `_PipeConfiguratorScreenState._typeLabelFor` — text inside `(...)`. */
export function typeLabelFor(group: CategoryProductGroup): string {
  const match = /\(([^)]+)\)/.exec(group.title);
  return match?.[1] ?? group.title;
}

/**
 * Stand-in for Dart `String.hashCode` (not reproducible in JS). Only used to
 * build stable variant ids, so any deterministic hash keeps the cart behaviour.
 */
function stringHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return hash;
}

/** Flutter `_variantFor` — maps a mock product into a cart `ProductVariant`. */
export function variantFor(
  product: PipesFittingProduct,
  group: CategoryProductGroup,
): ProductVariant {
  const idParts = [
    product.brand,
    product.productName,
    product.size ?? '',
    product.productCode ?? '',
  ]
    .join('|')
    .toLowerCase();
  const hash = stringHash(idParts);
  const backendId = product.id?.trim();

  const specifications: Record<string, string> = {};
  if (product.size != null) specifications['Size'] = product.size;
  if (product.length != null) specifications['Length'] = product.length;
  if (product.stdPkg != null) specifications['Std. Packaging'] = product.stdPkg;

  const imageAsset = product.imageUrl?.trim() || group.imageAsset;

  return {
    id: backendId ? `pipe-${backendId}` : `pipe-${hash}`,
    productId: backendId ?? `pipe-product-${hash}`,
    productName: product.productName,
    sku: product.productCode ?? '',
    brandId: product.brand.toLowerCase(),
    brandName: product.brand,
    categoryId: mockData.catalog.pipesTubingCategoryId,
    categoryName: mockData.catalog.pipesTubingCategoryName,
    subCategoryId: group.subCategory.toLowerCase(),
    subCategoryName: group.subCategory,
    description: group.title,
    price: product.mrp,
    unit: group.unit,
    icon: 'plumbing',
    rating: 0,
    reviewCount: 0,
    stockStatus: 'inStock',
    specifications,
    imageAsset,
    mrp: product.mrp,
    minimumOrderQuantity: 1,
  };
}
