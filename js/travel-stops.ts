/** One destination card per named place; retain the nearest physical boarding stop. */
export function destinationStops<S extends { x: number; z: number; icon: string; place?: { id?: string } | null; name(): string }>(stops: readonly S[], from: { x: number; z: number }): S[] {
  const unique = new Map<string, S>();
  const distance = (s: S) => Math.hypot(s.x - from.x, s.z - from.z);
  for (const stop of stops) {
    if (distance(stop) <= 12) continue;
    // (one place is one destination, by its id when it has one; zero-width characters do not make a name different)
    const key = stop.place?.id || stop.name().normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase() || `${stop.x}:${stop.z}`;
    const old = unique.get(key);
    if (!old || distance(stop) < distance(old)) unique.set(key, stop);
  }
  return [...unique.values()];
}
