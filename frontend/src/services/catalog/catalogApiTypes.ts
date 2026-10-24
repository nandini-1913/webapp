export interface ApiCategory {
  id: string;
  name: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface ApiSubcategory {
  id: string;
  name: string;
  categoryId: string;
  category?: string;
}

export interface ApiCatalogItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  standardRate: number;
  productName?: string | null;
  brand?: string | null;
  brandId?: string | null;
  productCode?: string | null;
  type?: string | null;
  productClass?: string | null;
  class?: string | null;
  subcategory?: string | null;
  subcategoryId?: string | null;
  size?: string | null;
  length?: string | null;
  stdPkg?: string | null;
  imageUrl?: string | null;
  discount?: number | null;
  regularDiscount?: number | null;
}
