// NextAuth client-side error reporter posts to {basePath}/api/auth/_log
// The [...nextauth] catch-all does not handle this path in NextAuth v4 App Router → 404
// This handler absorbs the request silently so the 404 disappears from logs.
export async function POST() {
  return new Response(null, { status: 200 });
}
