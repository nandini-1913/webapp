/** Live Pipes & Fitting catalog models consumed by the storefront. */

export interface PipesFittingProduct {
  id: string;
  brandId: string | null;
  brand: string;
  imageUrl: string | null;
  productName: string;
  length: string | null;
  size: string | null;
  productCode: string | null;
  stdPkg: string | null;
  className: string;
  type: string;
  subcategoryId: string;
  unit: string;
  regularDiscount?: number;
  mrp: number;
}

export interface PipesFittingClass {
  /** JSON key `class`. */
  className: string;
  products: PipesFittingProduct[];
}

export interface PipesFittingSubCategory {
  subCategory: string;
  classes: PipesFittingClass[];
}

export interface PipesFittingType {
  type: string;
  subCategories: PipesFittingSubCategory[];
}

export interface PipesFittingCatalog {
  category: string;
  categoryId: string;
  types: PipesFittingType[];
}
