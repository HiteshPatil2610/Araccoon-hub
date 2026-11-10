// A find's shareable address: /find/<readable-title>-<first 8 characters of its id>.
// Only the id part identifies the find, so a link still works after the title is edited.

const ID_PART = /(?:^|-)([0-9a-f]{8})$/;

/** Lower-case words joined by dashes, at most 60 characters; may be empty for titles with no letters or digits. */
export function findSlug(title: string): string {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
}

export function findPath(find: { id: string; title: string }): string {
  const slug = findSlug(find.title);
  return `/find/${slug ? `${slug}-` : ''}${find.id.slice(0, 8).toLowerCase()}`;
}

/** The id prefix at the end of a /find/ slug, or null when the slug has none. */
export function findIdPrefix(slug: string | undefined): string | null {
  return slug && slug.length <= 80 ? ID_PART.exec(slug)?.[1] ?? null : null;
}

/** The find a slug points at. Ids are random, so two finds sharing 8 characters is not a practical concern; the first in list order wins. */
export function findBySlug<T extends { id: string }>(finds: readonly T[], slug: string | undefined): T | null {
  const prefix = findIdPrefix(slug);
  return prefix ? finds.find(f => f.id.toLowerCase().startsWith(prefix)) ?? null : null;
}
