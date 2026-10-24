import type { ApiCatalogItem, ApiSubcategory } from './catalogApiTypes';
import type {
  PipesFittingCatalog,
  PipesFittingClass,
  PipesFittingProduct,
  PipesFittingSubCategory,
  PipesFittingType,
} from './pipesFittingModels';

function inferType(item: ApiCatalogItem): string {
  const explicit = item.type?.trim();
  if (explicit) {
    const upper = explicit.toUpperCase();
    if (upper.includes('UPVC')) return 'UPVC';
    if (upper.includes('CPVC')) return 'CPVC';
    if (upper.includes('PVC')) return 'PVC';
    return explicit;
  }

  const label = `${item.productName ?? ''} ${item.name}`.toUpperCase();
  if (label.includes('UPVC')) return 'UPVC';
  if (label.includes('CPVC')) return 'CPVC';
  if (label.includes('PVC')) return 'PVC';
  return 'Other';
}

function subcategoryLabel(item: ApiCatalogItem, subcategoryNameById: Map<string, string>): string {
  if (item.subcategoryId) {
    const fromApi = subcategoryNameById.get(item.subcategoryId);
    if (fromApi) return fromApi;
  }
  const direct = item.subcategory?.trim();
  if (direct) return direct;
  return 'Other';
}

function classLabel(item: ApiCatalogItem): string {
  const value = item.productClass?.trim() || item.class?.trim();
  return value || 'General';
}

function toProduct(item: ApiCatalogItem): PipesFittingProduct {
  return {
    id: item.id,
    brand: item.brand?.trim() ?? '',
    productName: item.productName?.trim() || item.name.trim(),
    length: item.length?.trim() || null,
    size: item.size?.trim() || null,
    productCode: item.productCode?.trim() || null,
    stdPkg: item.stdPkg?.trim() || null,
    mrp: typeof item.standardRate === 'number' ? item.standardRate : 0,
    imageUrl: item.imageUrl?.trim() || null,
  };
}

function pushClass(classes: PipesFittingClass[], className: string, product: PipesFittingProduct) {
  const existing = classes.find(
    (c) => c.className.toLowerCase() === className.toLowerCase(),
  );
  if (existing) {
    existing.products.push(product);
    return;
  }
  classes.push({ className, products: [product] });
}

function pushSubCategory(
  subCategories: PipesFittingSubCategory[],
  subCategory: string,
  className: string,
  product: PipesFittingProduct,
) {
  const existing = subCategories.find(
    (s) => s.subCategory.toLowerCase() === subCategory.toLowerCase(),
  );
  if (existing) {
    pushClass(existing.classes, className, product);
    return;
  }
  subCategories.push({
    subCategory,
    classes: [{ className, products: [product] }],
  });
}

function pushType(
  types: PipesFittingType[],
  type: string,
  subCategory: string,
  className: string,
  product: PipesFittingProduct,
) {
  const existing = types.find((t) => t.type.toLowerCase() === type.toLowerCase());
  if (existing) {
    pushSubCategory(existing.subCategories, subCategory, className, product);
    return;
  }
  types.push({
    type,
    subCategories: [
      {
        subCategory,
        classes: [{ className, products: [product] }],
      },
    ],
  });
}

export function buildPipesFittingCatalog(
  categoryName: string,
  items: ApiCatalogItem[],
  subcategories: ApiSubcategory[],
): PipesFittingCatalog {
  const subcategoryNameById = new Map(subcategories.map((s) => [s.id, s.name]));
  const types: PipesFittingType[] = [];

  for (const item of items) {
    pushType(
      types,
      inferType(item),
      subcategoryLabel(item, subcategoryNameById),
      classLabel(item),
      toProduct(item),
    );
  }

  const typeOrder = ['UPVC', 'PVC', 'CPVC', 'Other'];
  types.sort((a, b) => {
    const ai = typeOrder.indexOf(a.type);
    const bi = typeOrder.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return { category: categoryName, types };
}
