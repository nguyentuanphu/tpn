/** One destination card per named place; retain the nearest physical boarding stop. */
export function destinationStops<S extends { x: number; z: number; icon: string; place?: { id?: string } | null; name(): string }>(stops: readonly S[], from: { x: number; z: number }): S[] {
  const unique = new Map<string, S>();
  const distance = (s: S) => Math.hypot(s.x - from.x, s.z - from.z);
  for (const stop of stops) {
    if (distance(stop) <= 12) continue;
    const key = stop.name().normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase() || stop.place?.id || `${stop.x}:${stop.z}`;
    const old = unique.get(key);
    if (!old || distance(stop) < distance(old)) unique.set(key, stop);
  }
  return [...unique.values()];
}
