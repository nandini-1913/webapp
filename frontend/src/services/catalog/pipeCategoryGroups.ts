import type { ProductVariant } from './catalogModels';
import type { PipesFittingProduct } from './pipesFittingModels';

/** Flutter `_CategoryProductGroup` (pipes_fitting_category_screen.dart). */
export interface CategoryProductGroup {
  title: string;
  categoryId: string;
  categoryName: string;
  subCategory: string;
  subcategoryId: string;
  className: string;
  products: PipesFittingProduct[];
  imageAsset: string;
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

/** Maps a live catalog product into a cart `ProductVariant`. */
export function variantFor(
  product: PipesFittingProduct,
  group: CategoryProductGroup,
): ProductVariant {
  const specifications: Record<string, string> = {};
  if (product.size != null) specifications['Size'] = product.size;
  if (product.length != null) specifications['Length'] = product.length;
  if (product.stdPkg != null) specifications['Std. Packaging'] = product.stdPkg;

  return {
    id: `pipe-${product.id}`,
    productId: product.id,
    productName: product.productName,
    sku: product.productCode ?? '',
    brandId: product.brandId ?? product.brand.toLowerCase(),
    brandName: product.brand,
    categoryId: group.categoryId,
    categoryName: group.categoryName,
    subCategoryId: group.subcategoryId,
    subCategoryName: group.subCategory,
    description: group.title,
    price: product.mrp,
    unit: product.unit || group.unit,
    icon: 'plumbing',
    rating: 0,
    reviewCount: 0,
    stockStatus: 'inStock',
    specifications,
    imageAsset: product.imageUrl ?? group.imageAsset,
    mrp: product.mrp,
    minimumOrderQuantity: 1,
  };
}
