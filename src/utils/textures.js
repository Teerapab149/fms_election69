// Background textures drawn here, as inline SVG data URIs, instead of fetched from
// a texture website. Fetching them made every visitor's browser ask a third party
// for an image, which shows that party the visitor's IP address and the page they
// were on (see /privacy). A data: URI makes no request at all, and CSP img-src
// already allows data:.
//
// Each value is a CSS `background-image` string. Use it through `style`, not a
// Tailwind arbitrary class (the quotes and percent signs do not survive there).

const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}")`;

// a fixed scatter, so a texture looks the same on every render and every tile
const DOTS = [
  [12, 18, 1.1], [41, 7, 0.7], [73, 29, 1.3], [104, 14, 0.8], [139, 36, 1.0], [171, 9, 0.6],
  [22, 58, 0.8], [58, 74, 1.2], [93, 62, 0.7], [127, 81, 1.4], [158, 66, 0.9], [188, 88, 0.7],
  [9, 109, 1.0], [47, 124, 0.6], [81, 105, 1.3], [116, 131, 0.8], [149, 117, 1.1], [183, 140, 0.7],
  [31, 163, 1.2], [66, 152, 0.7], [102, 178, 1.0], [137, 166, 0.6], [168, 181, 1.3], [193, 160, 0.8],
];

// fine grain, warm grey: stands in for a paper texture under mix-blend-multiply
export const TEXTURE_PAPER = uri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
    <filter id="n" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0.52  0 0 0 0 0.43  0 0 0 0 0.33  0 0 0 0.9 -0.18"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#n)"/>
  </svg>`);

// scattered pin-point specks
export const TEXTURE_STARDUST = uri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    ${DOTS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity="${(0.55 + r / 4).toFixed(2)}"/>`).join("")}
  </svg>`);

// an isometric cube lattice drawn with hairlines
export const TEXTURE_CUBES = uri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="104">
    <g fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="1">
      <path d="M0 26 L30 8.7 L60 26 L60 61 L30 78.3 L0 61 Z"/>
      <path d="M0 26 L30 43.3 L60 26"/>
      <path d="M30 43.3 L30 78.3"/>
      <path d="M30 78.3 L30 104"/>
      <path d="M0 61 L0 87 L30 104 L60 87 L60 61"/>
      <path d="M30 8.7 L30 0"/>
    </g>
  </svg>`);
