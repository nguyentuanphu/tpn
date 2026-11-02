// (#341, v1.07) Which graphics chip draws the valley. A computer whose browser draws without a working graphics chip
// (Chrome with the chip turned off or blocked, a remote desktop, a virtual machine) draws every 3D object with the main
// processor: the test browser does the same (SwiftShader) and draws the valley about 3 times slower with shadows on,
// which matches a tester's computer at 3 frames a second. On Graphics Auto such a computer gets the lighter picture
// (no shadows, no smoothing) and may draw fewer pixels; every tester report names the kind of graphics it ran on.
export type GpuInfo = { name: string, soft: boolean };
const SOFT = /SwiftShader|llvmpipe|softpipe|lavapipe|Software|Basic Render|Mesa OffScreen|Microsoft Basic/i;
let known: GpuInfo | null = null;
/** the graphics name a page may read (shortened, nothing that tells one device from another beyond the chip's model) */
export function gpuName(gl: WebGLRenderingContext | WebGL2RenderingContext | null): string {
  if (!gl) return '';
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const raw = String((ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '');
    // "ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00005917) Direct3D11 vs_5_0 ps_5_0, D3D11)" -> "Intel(R) UHD Graphics 620"
    const parts = raw.replace(/^ANGLE \((.*)\)$/, '$1').split(',').map(p => p.trim());
    return (parts.length > 1 ? parts[1] : parts[0]).replace(/\s*\(0x[0-9a-f]+\)/ig, '').replace(/\s*(Direct3D|vs_\d).*$/i, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  } catch (e) { return ''; }
}
/** read once with a small canvas of its own, before the game's 3D picture is made (it is then given back) */
export function gpuInfo(): GpuInfo {
  if (known) return known;
  let name = '';
  try {
    const c = document.createElement('canvas'); c.width = c.height = 1;
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGL2RenderingContext | WebGLRenderingContext | null;
    if (gl) { const full = (() => { try { const e = gl.getExtension('WEBGL_debug_renderer_info'); return String((e && gl.getParameter(e.UNMASKED_RENDERER_WEBGL)) || ''); } catch (e) { return ''; } })();
      name = SOFT.test(full) ? 'software: ' + gpuName(gl) : gpuName(gl);
      gl.getExtension('WEBGL_lose_context')?.loseContext(); }
  } catch (e) { name = ''; }
  known = { name: name.slice(0, 40), soft: /^software/.test(name) };
  return known;
}
