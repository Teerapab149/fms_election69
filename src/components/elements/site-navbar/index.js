// site-navbar element type — component map ("where the variants live"), kept
// decoupled from registry.js metadata per ADR-001 v1.2. Add future template
// navbars here as new variants (classic / editorial / …).

import gumroad from "./gumroad";

export const SITE_NAVBAR_VARIANTS = {
  gumroad,
};

export default SITE_NAVBAR_VARIANTS;
