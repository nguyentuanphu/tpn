// Original Sparkle Valley illustrations for virtual Bịt mắt bắt dê.
// These children are drawn shapes, never platform emoji or externally sourced images.
export function goatChildArt(id: number, blindfold = false): string {
 const shirt=['#9a6bff','#ff779e','#43c4c3','#ffb74d'][id%4],skin=['#e2ad83','#c38a64','#efc4a0','#9d6b50'][id%4];
 return `<g stroke="#44305f" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
 <ellipse cx="0" cy="25" rx="17" ry="5" fill="#3b8458" opacity=".2" stroke="none"/>
 <path d="M-7 12L-9 24M7 12L9 24" stroke="#6354a0" stroke-width="7"/><path d="M-14 26h8M6 26h8" stroke-width="5"/>
 <path d="M-11 0Q0-5 11 0L10 14H-10Z" fill="${shirt}"/>
 <path d="${blindfold?'M-12 2L-25-4M12 2L25-4':'M-12 2L-18 12M12 2L18 12'}" stroke="${skin}" stroke-width="6"/>
 <circle cy="-16" r="14" fill="${skin}"/><path d="M-14-17Q-16-36 3-31Q17-30 14-16Q6-28-3-23Q-8-15-14-17Z" fill="#4a3440"/>
 ${blindfold?'<path d="M-15-21Q0-25 15-21L14-13Q0-17-14-13Z" fill="#a879e9"/><path d="M14-18l8-5-1 9-7-2" fill="#a879e9"/>':'<path d="M-7-18v2M7-18v2"/><path d="M-4-9q4 4 8 0" fill="none"/>'}
 <circle cx="-9" cy="-11" r="2.5" fill="#f18e9b" stroke="none"/><circle cx="9" cy="-11" r="2.5" fill="#f18e9b" stroke="none"/>
 </g>`;
}
export function goatArrowArt(dx: number,dy: number): string {
 const angle=Math.atan2(dy,dx)*180/Math.PI+90;
 return `<svg viewBox="0 0 48 48" aria-hidden="true"><path transform="rotate(${angle} 24 24)" d="M24 6L8 23h10v18h12V23h10Z" fill="#a879e9" stroke="#44305f" stroke-width="3" stroke-linejoin="round"/></svg>`;
}
export const GOAT_LISTEN_ART='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 33c-1-8-8-7-8-17a13 13 0 0 1 26 0c0 9-9 8-9 16 0 9-9 9-9 1Z" fill="#f6d1ad" stroke="#44305f" stroke-width="3"/><path d="M17 19c-2-11 13-11 11 0-1 4-6 2-6 7M39 10q8 8 0 16" fill="none" stroke="#9a6bff" stroke-width="3" stroke-linecap="round"/></svg>';
export const GOAT_CATCH_ART='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 39L7 27c-3-6 2-8 5-4l4 6V12c0-5 6-5 6 0v11V7c0-5 6-5 6 0v16V11c0-5 6-5 6 0v14-8c0-5 6-5 6 0v13c0 11-7 13-16 13-5 0-8-1-10-4Z" fill="#f6d1ad" stroke="#44305f" stroke-width="2.5" stroke-linejoin="round"/></svg>';
