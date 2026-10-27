// Scoped mini-game controls; world controls remain owned by input.js.
export function paradeInput(root: HTMLElement, seats: () => number[], stop: (seat: number, lane: number) => void, primary: () => void = () => {}) {
  const held = new Set<string>();
  const key = (event: KeyboardEvent) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || !root.isConnected || event.target instanceof Element && event.target.closest('input,textarea,[contenteditable]')) return;
    const code = ['Digit1', 'Digit2', 'Digit3', 'KeyJ', 'KeyK', 'KeyL'].indexOf(event.code);
    if (code < 0) return;
    const seat = seats()[Math.floor(code / 3)]; if (seat === undefined) return;
    event.preventDefault();event.stopPropagation();stop(seat, code % 3);
  };
  addEventListener('keydown', key, true);
  return {
    poll() {
      const pads = typeof navigator.getGamepads === 'function' ? Array.from(navigator.getGamepads()).filter((pad): pad is Gamepad => pad !== null) : [];
      pads.slice(0, 2).forEach((pad, index) => {
        const seat = seats()[index];
        [0, 2, 3].forEach((button, lane) => {
          const id = `${index}:${button}`, down = !!pad.buttons[button]?.pressed;
          if (down && !held.has(id)) { if (seat !== undefined) stop(seat, lane);else if (index === 0 && button === 0) primary(); }
          if (down) held.add(id); else held.delete(id);
        });
      });
    },
    dispose() { removeEventListener('keydown', key, true);held.clear(); }
  };
}
