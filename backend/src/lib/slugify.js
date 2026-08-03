// Deterministic slug generation shared in spirit with frontend/src/lib/slugify.ts —
// keep both implementations in sync if this logic ever changes.
export const slugify = (value) => {
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
