import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { bustSiteData } from "../../../../../lib/cache/siteData";
import { requireAdmin } from "../../../../../lib/auth/adminCheck";
import { getTemplate, isTemplateEditable, isBuiltInSlug } from "../../../../../components/admin/editor/templates";
import { validateTemplateStyles } from "../../../../../lib/cssSafety.mjs";

// Next 15: params ใน route handler เป็น Promise แล้ว ต้อง await ก่อนใช้
// (ของเดิม `{ params }` แล้วอ่าน params.id ตรง ๆ ได้ เพราะ 14 ส่งเป็น object)

// GET /api/admin/templates/:id — fetch single template (full data)
export async function GET(request, { params }) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const template = await getTemplate(id, db);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template });
}

// PUT /api/admin/templates/:id — update editable template
export async function PUT(request, { params }) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (isBuiltInSlug(id)) {
    return NextResponse.json(
      { error: "Built-in templates cannot be edited (fork instead)" },
      { status: 403 }
    );
  }

  const template = await getTemplate(id, db);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (!isTemplateEditable(template)) {
    return NextResponse.json(
      { error: template.isLocked ? "Locked template cannot be edited" : "Not editable" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowedFields = ["name", "description", "pages", "elements", "theme", "visibility"];
  const updateData = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowedFields.includes(k))
  );

  // same gate as template create + page-layout (H1, cssSafety.mjs): an editable
  // template can be applied site-wide, and its tokens/vars render into <style>
  const styleErrors = validateTemplateStyles({ theme: updateData.theme, elements: updateData.elements });
  if (styleErrors.length > 0) {
    return NextResponse.json(
      { error: `ค่าธีมไม่ผ่านการตรวจ: ${styleErrors[0]}`, errors: styleErrors.slice(0, 20) },
      { status: 400 }
    );
  }

  try {
    const updated = await db.template.update({
      where: { slug: id },
      data: updateData
    });
    bustSiteData(); // admin change must show on the next request, not after the TTL
    return NextResponse.json({ template: updated });
  } catch (err) {
    console.error("[PUT /api/admin/templates/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/admin/templates/:id
export async function DELETE(request, { params }) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (isBuiltInSlug(id)) {
    return NextResponse.json(
      { error: "Built-in templates cannot be deleted" },
      { status: 403 }
    );
  }

  const template = await getTemplate(id, db);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template.isLocked) {
    return NextResponse.json(
      { error: "Locked templates cannot be deleted" },
      { status: 403 }
    );
  }

  const systemConfig = await db.systemConfig.findFirst();
  if (systemConfig?.activeTemplateId === id) {
    return NextResponse.json(
      { error: "Cannot delete active template. Switch active first." },
      { status: 409 }
    );
  }

  try {
    await db.template.delete({ where: { slug: id } });
    bustSiteData(); // admin change must show on the next request, not after the TTL
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/templates/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
