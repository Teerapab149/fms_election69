"use client";

// ImageErrorGuard — one app-wide safety net so a dead image path can never render
// the browser's broken-file icon on a public page.
//
// Why: image URLs live in the DB and the files live on disk; an admin can rename,
// re-upload or delete a file and leave a record pointing at something that no
// longer exists (this happened for real on 2026-07-19 — two members and one party
// hero). Every surface has its own placeholder for a MISSING url, but none of them
// could tell that a PRESENT url fails to load, so the broken icon leaked through.
//
// How: image load errors do not bubble, but they DO fire during the capture phase
// on window. One listener marks the element; CSS fades it out so the container's
// own background / placeholder shows instead of a broken glyph. Layout is kept
// (opacity, not display) so nothing shifts.
//
// This is a net, not a fix: the real repair is correcting the record in admin.

import { useEffect } from "react";

export default function ImageErrorGuard() {
  useEffect(() => {
    const onError = (e) => {
      const el = e.target;
      if (el && el.tagName === "IMG" && !el.dataset.imgBroken) {
        el.dataset.imgBroken = "1";
      }
    };
    window.addEventListener("error", onError, true); // capture — img errors don't bubble
    return () => window.removeEventListener("error", onError, true);
  }, []);

  return (
    <style jsx global>{`
      img[data-img-broken="1"] { opacity:0 !important; }
    `}</style>
  );
}
