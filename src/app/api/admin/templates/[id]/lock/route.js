import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { requireAdmin } from "../../../../../../lib/auth/adminCheck";
import { getTemplate, isBuiltInSlug } from "../../../../../../components/admin/editor/templates";

// Next 15: params ใน route handler เป็น Promise แล้ว ต้อง await ก่อนใช้
// (ของเดิม `{ params }` แล้วอ่าน params.id ตรง ๆ ได้ เพราะ 14 ส่งเป็น object)

// POST /api/admin/templates/:id/lock — toggle lock (D-101 preservation)
export async function POST(request, { params }) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (isBuiltInSlug(id)) {
    return NextResponse.json(
      { error: "Built-in templates don't need locking (immutable by design)" },
      { status: 400 }
    );
  }

  const template = await getTemplate(id, db);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { archivedYear, lock = true } = body;

  const updated = await db.template.update({
    where: { slug: id },
    data: {
      isLocked: lock === true,
      ...(archivedYear && { archivedYear })
    }
  });

  return NextResponse.json({ template: updated });
}
