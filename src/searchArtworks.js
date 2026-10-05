export function artworkMatchesQuery(art, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [
    art.title,
    art.artist,
    art.medium,
    art.artistLocation,
    art.price,
    art.dimensions,
    art.year != null ? String(art.year) : null,
  ]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q));
}
