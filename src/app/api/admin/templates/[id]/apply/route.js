import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { requireAdmin } from "../../../../../../lib/auth/adminCheck";
import { getTemplate } from "../../../../../../components/admin/editor/templates";

// POST /api/admin/templates/:id/apply — set active template
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const template = await getTemplate(params.id, db);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const systemConfig = await db.systemConfig.findFirst();
  if (!systemConfig) {
    return NextResponse.json({ error: "SystemConfig not initialized" }, { status: 500 });
  }

  const updated = await db.systemConfig.update({
    where: { id: systemConfig.id },
    data: { activeTemplateId: params.id }
  });

  return NextResponse.json({
    ok: true,
    activeTemplateId: updated.activeTemplateId,
    templateName: template.name
  });
}
