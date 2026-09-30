"use client";

// Voter sign-in / sign-out for v2 templates — one copy instead of one per family.
// (The v1 families each carry their own copy of the same sequence; they are left
// untouched on purpose.)

import { signIn, signOut } from "next-auth/react";

export function voterSignIn() {
  signIn("authentik", { callbackUrl: (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/vote" });
}

// Signing out of this app alone is not enough: the PSU SSO session outlives it,
// so the next sign-in would silently re-authenticate the same person. Clear the
// local session, then hand off to the IdP's end-session endpoint — a voter must
// be able to hand the phone or laptop to the next person.
export function voterSignOut(session) {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const ret = `${window.location.origin}${bp}`;
  let url = `https://psusso.psu.ac.th/application/o/fms-ovs/end-session/?post_logout_redirect_uri=${encodeURIComponent(ret)}`;
  if (session?.id_token) url += `&id_token_hint=${session.id_token}`;
  signOut({ redirect: false }).finally(() => { window.location.href = url; });
}
