/**
 * Domain models for the "Pipes & Fitting" mock catalog
 * (src/mocks/pipes_fitting_mock_data.json) — mirrors Flutter
 * `pipes_fitting_catalog_models.dart`.
 *
 * Hierarchy: Category -> Type (UPVC/CPVC/PVC) -> SubCategory -> Class -> Product.
 */

export interface PipesFittingProduct {
  /** Backend catalog id when loaded from the API. */
  id?: string;
  brand: string;
  productName: string;
  length: string | null;
  size: string | null;
  productCode: string | null;
  stdPkg: string | null;
  mrp: number;
  imageUrl?: string | null;
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
  types: PipesFittingType[];
}

type Json = Record<string, unknown>;

const str = (v: unknown): string | null => (v == null ? null : String(v));
const list = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);

/** `PipesFittingCatalog.fromJson` (same null/default handling as Flutter). */
export function pipesFittingCatalogFromJson(json: Json): PipesFittingCatalog {
  return {
    category: str(json.category) ?? '',
    types: list(json.types).map((t) => ({
      type: str(t.type) ?? '',
      subCategories: list(t.subCategories).map((s) => ({
        subCategory: str(s.subCategory) ?? '',
        classes: list(s.classes).map((c) => ({
          className: str(c.class) ?? '',
          products: list(c.products).map((p) => ({
            id: str(p.id) ?? undefined,
            brand: str(p.brand) ?? '',
            productName: str(p.productName) ?? '',
            length: str(p.length),
            size: str(p.size),
            productCode: str(p.productCode),
            stdPkg: str(p.stdPkg),
            mrp: typeof p.mrp === 'number' ? p.mrp : 0,
            imageUrl: str(p.imageUrl),
          })),
        })),
      })),
    })),
  };
}
