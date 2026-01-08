import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db";

// GET: เอาไว้ให้หน้าเว็บเช็คว่าตอนนี้เปิดหรือปิดอยู่
export async function GET() {
  try {
    // หาค่า Config (ถ้าไม่มีให้สร้างใหม่เลย)
    let config = await db.systemConfig.findFirst({ where: { id: 1 } });
    if (!config) {
      config = await db.systemConfig.create({ data: { id: 1, isVoteOpen: true } });
    }
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

// PUT: เอาไว้กดปุ่มเพื่อเปลี่ยนค่า (Update)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { isVoteOpen } = body;

    const config = await db.systemConfig.update({
      where: { id: 1 },
      data: { isVoteOpen: isVoteOpen }, // บันทึกค่าใหม่
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}