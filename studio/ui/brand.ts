// Read the game's colour tokens without importing its fixed-canvas layout into Studio.
// Both online Studio and the desktop app expose this same game asset root.
export async function loadGameBrand(gameRoot = '/studio/game/'): Promise<void> {
  const root = document.documentElement;
  // The game currently has a light palette; do not combine its dark ink with Studio's old automatic dark background.
  root.dataset.theme = 'light';root.style.colorScheme='light';
  try {
    const response = await fetch(gameRoot + 'css/style.css');
    if (!response.ok) throw new Error('game_palette_unavailable');
    const css = await response.text(), block = /:root\s*\{([\s\S]*?)\}/.exec(css)?.[1] || '';
    const names = ['purple','cyan','cyan2','gold','orange','red','green','pink','text','paper','panel','panel2','line'];
    let found = 0;
    for (const name of names) {
      const value = new RegExp('--' + name + '\\s*:\\s*([^;]+);').exec(block)?.[1]?.trim();
      if (value && CSS.supports('color', value)) { root.style.setProperty('--game-' + name, value); found++; }
    }
    root.dataset.gameBrand = found === names.length ? 'shared' : 'partial';
  } catch { root.dataset.gameBrand = 'unavailable'; }
}
