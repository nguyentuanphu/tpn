/** Observe the final tick as well; an item can arrive during the last permitted pause. */
export async function waitObserved<T>(items: T[], match: (item: T) => boolean, pause: (ms: number) => Promise<void>, budget = 12000): Promise<T | null> {
  for (let elapsed = 0; elapsed < budget; elapsed += 250) {
    const item = items.find(match); if (item) return item;
    await pause(Math.min(250, budget - elapsed));
  }
  return items.find(match) || null;
}
