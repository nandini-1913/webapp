/** Category names accepted for the Pipes & Fitting storefront module (API match). */
const PIPES_CATEGORY_ALIASES = [
  'pipes & fitting',
  'pipes & fittings',
  'pipes & tubing',
  'plumbing pipes & fittings',
  'pipes and fitting',
  'pipes and fittings',
];

export function isPipesFittingCategoryName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (PIPES_CATEGORY_ALIASES.includes(normalized)) return true;
  return normalized.includes('pipe') && (normalized.includes('fitting') || normalized.includes('tubing'));
}

export function pickPipesCategoryName(categories: { name: string }[]): string | null {
  for (const alias of PIPES_CATEGORY_ALIASES) {
    const exact = categories.find((c) => c.name.trim().toLowerCase() === alias);
    if (exact) return exact.name;
  }
  return categories.find((c) => isPipesFittingCategoryName(c.name))?.name ?? null;
}
