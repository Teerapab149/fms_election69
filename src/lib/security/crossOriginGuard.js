// The one place that turns a request's headers into a 403 BAD_ORIGIN response, shared
// by src/middleware.js and by the upload routes that the middleware matcher skips.
//
// Why some routes call this themselves: Next 15.5 buffers every request body that
// passes through middleware and cuts it at 10 MB, so a party form with a few dozen
// member photos cannot go through middleware (measured: an 11.5 MB multipart PUT
// to /api/admin/candidates returned 500). Those routes are listed in the matcher
// exclusions of src/middleware.js and must call rejectCrossOrigin() first in every
// POST, PUT, PATCH and DELETE handler. scripts/smoke/crossOriginCoverage.test.mjs
// fails when a route that reads a body is covered by neither.
import { NextResponse } from "next/server";
import { checkSameOrigin, UNSAFE_METHODS, BAD_ORIGIN_BODY } from "./sameOrigin.mjs";

/**
 * @param {Request} request
 * @returns {NextResponse | null} the 403 to return, or null when the request may proceed
 */
export function rejectCrossOrigin(request) {
  if (!UNSAFE_METHODS.has(request.method)) return null;
  const verdict = checkSameOrigin({
    secFetchSite: request.headers.get("sec-fetch-site"),
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
    nextAuthUrl: process.env.NEXTAUTH_URL,
  });
  if (verdict.ok) return null;
  // Only the verdict reason is logged, never headers or cookies.
  console.warn(`[csrf] refused ${request.method} ${new URL(request.url).pathname}: ${verdict.reason}`);
  return NextResponse.json(BAD_ORIGIN_BODY, { status: 403 });
}
