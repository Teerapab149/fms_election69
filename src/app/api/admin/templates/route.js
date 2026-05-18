import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/auth/adminCheck";
import { listTemplates, isBuiltInSlug } from "../../../../components/admin/editor/templates";

// GET /api/admin/templates — list (built-ins + DB)
export async function GET(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const filters = {};

  if (searchParams.get("isBuiltIn") === "true")  filters.isBuiltIn = true;
  if (searchParams.get("isBuiltIn") === "false") filters.isBuiltIn = false;
  if (searchParams.get("isLocked")  === "true")  filters.isLocked  = true;
  if (searchParams.get("isLocked")  === "false") filters.isLocked  = false;
  if (searchParams.get("authorId")) {
    const n = parseInt(searchParams.get("authorId"), 10);
    if (!Number.isNaN(n)) filters.authorId = n;
  }

  try {
    const templates = await listTemplates(db, filters);
    return NextResponse.json({ templates, count: templates.length });
  } catch (err) {
    console.error("[GET /api/admin/templates]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/admin/templates — create new (DB-stored, user template)
export async function POST(request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug, name, description, pages, elements, theme, forkedFrom, visibility } = body;

  if (!slug || typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug must be lowercase alphanumeric with hyphens" },
      { status: 400 }
    );
  }

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (!pages || !elements || !theme) {
    return NextResponse.json(
      { error: "pages, elements, and theme are required" },
      { status: 400 }
    );
  }

  if (isBuiltInSlug(slug)) {
    return NextResponse.json(
      { error: `Slug "${slug}" is reserved for built-in template` },
      { status: 400 }
    );
  }

  const existing = await db.template.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Template with slug "${slug}" already exists` },
      { status: 409 }
    );
  }

  try {
    const template = await db.template.create({
      data: {
        slug,
        name,
        description: description || null,
        authorId: auth.user.id ? parseInt(auth.user.id, 10) || null : null,
        isBuiltIn: false,
        isLocked: false,
        forkedFrom: forkedFrom || null,
        visibility: visibility || "private",
        pages,
        elements,
        theme,
        schemaVersion: "v1"
      }
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/templates]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
