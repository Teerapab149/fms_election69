import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { requireAdmin } from "../../../../../../lib/auth/adminCheck";
import { getTemplate, isBuiltInSlug } from "../../../../../../components/admin/editor/templates";

// Next 15: params ใน route handler เป็น Promise แล้ว ต้อง await ก่อนใช้
// (ของเดิม `{ params }` แล้วอ่าน params.id ตรง ๆ ได้ เพราะ 14 ส่งเป็น object)

// POST /api/admin/templates/:id/fork — clone existing template under new slug
export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const source = await getTemplate(id, db);
  if (!source) {
    return NextResponse.json({ error: "Source template not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug: newSlug, name: newName, description } = body;

  if (!newSlug || !/^[a-z0-9-]+$/.test(newSlug)) {
    return NextResponse.json(
      { error: "newSlug must be lowercase alphanumeric with hyphens" },
      { status: 400 }
    );
  }

  if (!newName) {
    return NextResponse.json({ error: "newName required" }, { status: 400 });
  }

  if (isBuiltInSlug(newSlug)) {
    return NextResponse.json({ error: "Slug reserved for built-in" }, { status: 400 });
  }

  const existing = await db.template.findUnique({ where: { slug: newSlug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  try {
    const fork = await db.template.create({
      data: {
        slug: newSlug,
        name: newName,
        description: description || `Fork of ${source.name}`,
        authorId: auth.user.id ? parseInt(auth.user.id, 10) || null : null,
        isBuiltIn: false,
        isLocked: false,
        forkedFrom: source.slug,
        visibility: "private",
        pages: source.pages,
        elements: source.elements,
        theme: source.theme,
        schemaVersion: "v1"
      }
    });

    return NextResponse.json({ template: fork }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/templates/:id/fork]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
