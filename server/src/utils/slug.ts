export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = slugify(base) || "item";
  let slug = baseSlug;
  let i = 2;
  while (await exists(slug)) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }
  return slug;
}
