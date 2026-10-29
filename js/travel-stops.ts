/** One destination card per named place; retain the nearest physical boarding stop. */
export function destinationStops<S extends { x: number; z: number; icon: string; place?: { id?: string } | null; name(): string }>(stops: readonly S[], from: { x: number; z: number }): S[] {
  const unique = new Map<string, S>();
  const distance = (s: S) => Math.hypot(s.x - from.x, s.z - from.z);
  for (const stop of stops) {
    if (distance(stop) <= 12) continue;
    // (one name is one destination, whichever platform or place id it belongs to; zero-width characters do not make a
    // name different; a stop with no name falls back to its place, then its spot)
    const key = stop.name().normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase() || stop.place?.id || `${stop.x}:${stop.z}`;
    const old = unique.get(key);
    if (!old || distance(stop) < distance(old)) unique.set(key, stop);
  }
  return [...unique.values()];
}
