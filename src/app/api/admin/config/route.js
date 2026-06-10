import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db";
import { adminGuard } from "../../../../lib/auth/adminCheck";

export async function GET(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;
  try {
    let config = await db.systemConfig.findFirst({ where: { id: 1 } });
    if (!config) {
      config = await db.systemConfig.create({ data: { id: 1, isVoteOpen: true } });
    }
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const authError = await adminGuard(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const { isVoteOpen } = body;

    const config = await db.systemConfig.update({
      where: { id: 1 },
      data: { isVoteOpen: isVoteOpen },
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}