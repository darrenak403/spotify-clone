// Deterministic slug generation shared in spirit with backend/src/lib/slugify.js —
// keep both implementations in sync if this logic ever changes.
export const slugify = (value: string): string => {
  return value
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
