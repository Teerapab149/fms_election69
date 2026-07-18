// previewNav — shared click-interception seam for the auth-free preview surfaces
// (/template-playground + /template-preview?interact=1). Both render the REAL page
// components with mock data, so their in-page <a href={getPath(…)}> links (dock +
// scattered links across families) must be caught and translated to a LOCAL page
// switch instead of navigating to the auth-gated real route. This is the single
// source of that translation — do not duplicate it (repo convention: one seam).

const BP = process.env.NEXT_PUBLIC_BASE_PATH || '/fms-ovs';

// Resolve an internal app href (absolute, getPath-prefixed) → a preview destination
// { page, partyNumber? }. Returns null for external links (let them through).
export function hrefToDest(absHref) {
  try {
    const u = new URL(absHref, window.location.origin);
    if (u.origin !== window.location.origin) return null;
    let p = u.pathname;
    if (BP && p.startsWith(BP)) p = p.slice(BP.length);
    p = p.replace(/\/+$/, '');
    const id = u.searchParams.get('id');
    if (p === '') return { page: 'home' };
    if (p.endsWith('/candidates')) return { page: 'candidates' };
    if (p.endsWith('/party')) return { page: 'party', partyNumber: id ? parseInt(id, 10) : null };
    if (p.endsWith('/vote')) return { page: 'vote' };
    if (p.endsWith('/results')) return { page: 'results' };
    if (p.endsWith('/success')) return { page: 'success' };
    if (p.endsWith('/closed')) return { page: 'closed' };
    return { page: 'home' }; // unknown internal route → don't escape the sandbox
  } catch { return null; }
}
