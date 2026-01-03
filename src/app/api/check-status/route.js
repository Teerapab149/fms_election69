import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { studentId: String(studentId) }, // แปลงเป็น String กันเหนียว
      select: { isVoted: true } // ดึงมาแค่สถานะโหวตพอ ประหยัดแรง
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ isVoted: user.isVoted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}