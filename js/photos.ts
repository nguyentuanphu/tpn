// Saving a game photo to the device's own photo library.
// A web page can't write into Photos by itself. On iPhone and iPad the way in is the share sheet: the game hands
// over the picture as a file and the child (or grown-up) taps "Save Image", and it is in Photos. (A plain download
// there goes to the Files app, or does nothing when the game runs from the Home Screen: that was the bug.)
// On Android and computers the picture is downloaded, and Android's Gallery/Photos shows it under Downloads.
// The share sheet must open straight from the tap, so the file is made without waiting for anything.
const iOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
export function photoFile(dataURL) {
  const [head, b64] = String(dataURL).split(','), type = (/data:([^;]+)/.exec(head) || [])[1] || 'image/jpeg';
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new File([u], `sparkle-valley-${stamp()}.${type === 'image/png' ? 'png' : 'jpg'}`, { type });
}
// resolves to 'shared' (share sheet used), 'downloaded', 'cancelled' or 'failed'
export async function saveToDevice(dataURL) {
  let file; try { file = photoFile(dataURL); } catch (e) { return 'failed'; }
  if (iOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  try {
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    return 'downloaded';
  } catch (e) { return 'failed'; }
}
export const savesByShare = () => iOS() && !!navigator.canShare;
