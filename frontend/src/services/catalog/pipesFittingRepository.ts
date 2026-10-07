import type {
  PipesFittingCatalog,
  PipesFittingProduct,
  PipesFittingType,
} from './pipesFittingModels';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://187.127.148.44').replace(
  /\/$/,
  '',
);
const categoryNames = [
  'Pipes & Fitting',
  'Pipes & Fittings',
  'Pipes & Tubing',
  'Plumbing Pipes & Fittings',
];

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

interface CatalogItem {
  id: string;
  productCode?: string | null;
  name: string;
  productName?: string | null;
  category: string;
  unit: string;
  standardRate: number;
  brand?: string | null;
  brandId?: string | null;
  imageUrl?: string | null;
  subcategoryId?: string | null;
  size?: string | null;
  length?: string | null;
  stdPkg?: string | null;
  class?: string | null;
  productClass?: string | null;
  type?: string | null;
  subcategory?: string | null;
  regularDiscount?: number | null;
  discount?: number | null;
}

interface ApiSubcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface ApiCategory {
  id: string;
  name: string;
}

export interface SearchCatalogProduct extends PipesFittingProduct {
  categoryId: string;
  categoryName: string;
  subcategoryName: string;
}

function normalizedSearchTokens(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => (token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token));
}

async function requestData<T>(path: string, signal: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/${path}`, {
      cache: 'no-store',
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(
      `Could not reach the backend at ${apiBaseUrl}. Check that the API URL is correct, the server is online, and CORS permits this website.`,
      { cause: error },
    );
  }
  if (!response.ok) {
    throw new Error(`Catalog request failed (${response.status} ${response.statusText}).`);
  }

  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error(
      `The server at ${apiBaseUrl} returned a non-JSON response for /api/${path}. Check that VITE_API_BASE_URL points to the FastAPI server, not the web app.`,
    );
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`The backend returned invalid JSON for /api/${path}.`, { cause: error });
    }
    throw error;
  }
  if (!envelope.success || envelope.data == null) {
    throw new Error(envelope.error || 'The catalog API returned an invalid response.');
  }
  return envelope.data;
}

function productType(item: CatalogItem): string {
  const declaredType = item.type?.trim();
  if (declaredType) return declaredType.toUpperCase();
  return /\b(UPVC|CPVC|PVC)\b/i.exec(item.name)?.[1]?.toUpperCase() ?? 'Other';
}

function productClass(item: CatalogItem): string {
  const declaredClass = (item.productClass ?? item.class)?.trim();
  if (declaredClass) return declaredClass;
  return (
    /(?:Sch(?:edule)?\s*\d+|SDR\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*kg)/i.exec(item.name)?.[0] ??
    'Products'
  );
}

function optionalText(
  value: string | null | undefined,
  fallback: RegExpMatchArray | null,
): string | null {
  const normalized = value?.trim();
  return normalized || fallback?.[0] || null;
}

function productFromApi(item: CatalogItem, subcategoryId: string): PipesFittingProduct {
  if (!item.id || !item.name.trim() || !item.unit.trim() || !Number.isFinite(item.standardRate)) {
    throw new Error('The catalog API returned a product without a valid ID, name, unit, or price.');
  }

  return {
    id: item.id,
    productCode: item.productCode ?? null,
    brandId: item.brandId ?? null,
    brand: item.brand ?? '',
    imageUrl: item.imageUrl?.trim() || null,
    productName: item.productName?.trim() || item.name,
    length: optionalText(item.length, /\b\d+(?:\.\d+)?\s*(?:mtr|meters?|m)\b/i.exec(item.name)),
    size: optionalText(item.size, /\b\d+(?:\.\d+)?\s*mm\b/i.exec(item.name)),
    stdPkg: item.stdPkg ?? null,
    className: productClass(item),
    type: productType(item),
    subcategoryId,
    unit: item.unit,
    regularDiscount:
      typeof item.discount === 'number' && Number.isFinite(item.discount)
        ? item.discount
        : typeof item.regularDiscount === 'number' && Number.isFinite(item.regularDiscount)
          ? item.regularDiscount
          : undefined,
    mrp: item.standardRate,
  };
}

function catalogFromApi(
  items: CatalogItem[],
  category: ApiCategory,
  subcategories: ApiSubcategory[],
): PipesFittingCatalog {
  const matchingItems = items.filter(
    (item) => item.category.toLowerCase() === category.name.toLowerCase(),
  );

  const subcategoriesById = new Map(subcategories.map((item) => [item.id, item]));
  const groupedTypes = new Map<string, Map<string, Map<string, PipesFittingProduct[]>>>();

  for (const item of matchingItems) {
    const subcategory = item.subcategoryId ? subcategoriesById.get(item.subcategoryId) : undefined;
    const subcategoryName = subcategory?.name ?? item.subcategory?.trim() ?? 'Other';
    const subcategoryId = subcategory?.id ?? item.subcategoryId ?? '';
    const product = productFromApi(item, subcategoryId);
    let subcategoryGroups = groupedTypes.get(product.type);
    if (!subcategoryGroups) {
      subcategoryGroups = new Map();
      groupedTypes.set(product.type, subcategoryGroups);
    }
    let classGroups = subcategoryGroups.get(subcategoryName);
    if (!classGroups) {
      classGroups = new Map();
      subcategoryGroups.set(subcategoryName, classGroups);
    }
    const products = classGroups.get(product.className) ?? [];
    products.push(product);
    classGroups.set(product.className, products);
  }

  const types: PipesFittingType[] = [...groupedTypes.entries()].map(
    ([type, subcategoryGroups]) => ({
      type,
      subCategories: [...subcategoryGroups.entries()].map(([subCategory, classGroups]) => ({
        subCategory,
        classes: [...classGroups.entries()].map(([className, products]) => ({
          className,
          products,
        })),
      })),
    }),
  );

  return {
    category: category.name,
    categoryId: category.id,
    types,
  };
}

export async function searchCatalogProducts(
  query: string,
  signal: AbortSignal,
): Promise<SearchCatalogProduct[]> {
  const tokens = normalizedSearchTokens(query);
  const categories = await requestData<ApiCategory[]>('categories', signal);
  const categoryMatch = categories.find((category) => {
    const categoryTokens = new Set(normalizedSearchTokens(category.name));
    return tokens.length > 0 && tokens.every((token) => categoryTokens.has(token));
  });

  const [items, subcategories] = await Promise.all([
    categoryMatch
      ? requestData<CatalogItem[]>(
          `catalog?category=${encodeURIComponent(categoryMatch.name)}`,
          signal,
        )
      : requestData<CatalogItem[]>(`catalog?search=${encodeURIComponent(query.trim())}`, signal),
    requestData<ApiSubcategory[]>('subcategories', signal),
  ]);

  const categoriesByName = new Map(
    categories.map((category) => [category.name.toLowerCase(), category]),
  );
  const subcategoriesById = new Map(subcategories.map((item) => [item.id, item]));

  const matchingItems = categoryMatch
    ? items
    : items.filter((item) => {
        const category = categoriesByName.get(item.category.toLowerCase());
        const subcategory = item.subcategoryId ? subcategoriesById.get(item.subcategoryId) : null;
        const searchableText = [
          item.name,
          item.productName,
          item.productCode,
          item.brand,
          item.type,
          item.productClass,
          item.subcategory,
          subcategory?.name,
          category?.name,
        ]
          .filter(Boolean)
          .join(' ');
        const productTokens = new Set(normalizedSearchTokens(searchableText));
        return tokens.every((token) => productTokens.has(token));
      });

  return matchingItems.map((item) => {
    const category = categoriesByName.get(item.category.toLowerCase());
    if (!category) {
      throw new Error(`Product "${item.name}" refers to an unknown category.`);
    }
    const subcategory = item.subcategoryId ? subcategoriesById.get(item.subcategoryId) : undefined;
    return {
      ...productFromApi(item, subcategory?.id ?? item.subcategoryId ?? ''),
      categoryId: category.id,
      categoryName: category.name,
      subcategoryName: subcategory?.name ?? item.subcategory?.trim() ?? '',
    };
  });
}

/** Fetch a fresh catalog snapshot whenever the Pipes & Fitting screen opens. */
export async function loadPipesFittingCatalog(signal: AbortSignal): Promise<PipesFittingCatalog> {
  const categories = await requestData<ApiCategory[]>('categories', signal);
  const category = categoryNames
    .map((name) => categories.find((item) => item.name.toLowerCase() === name.toLowerCase()))
    .find((item): item is ApiCategory => item != null);
  if (!category) {
    throw new Error(
      `The backend is reachable, but /api/categories did not return Pipes & Fitting, Pipes & Fittings, Pipes & Tubing, or Plumbing Pipes & Fittings. Add the category to the backend database and make sure the API is using the expected database.`,
    );
  }

  const [items, subcategories] = await Promise.all([
    requestData<CatalogItem[]>(`catalog?category=${encodeURIComponent(category.name)}`, signal),
    requestData<ApiSubcategory[]>('subcategories', signal),
  ]);

  return catalogFromApi(items, category, subcategories);
}
