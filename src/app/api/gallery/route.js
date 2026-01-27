export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); 

    if (!id) return NextResponse.json({ images: [] });

    const folderName = `party${id}`;
    
    const directoryPath = path.join(
      process.cwd(), 
      'public', 'images', 'candidates', 'groupimage', folderName
    );

    // 2. เช็คว่ามีโฟลเดอร์นี้ไหม
    if (!fs.existsSync(directoryPath)) {
      return NextResponse.json({ images: [] });
    }

    // 3. อ่านไฟล์และสร้าง URL กลับไป
    const files = fs.readdirSync(directoryPath);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => `/images/candidates/groupimage/${folderName}/${file}`); // ⚠️ URL สำหรับหน้าเว็บต้องไม่มีคำว่า public

    return NextResponse.json({ images });
    
  } catch (error) {
    console.error("Gallery Error:", error);
    return NextResponse.json({ images: [] });
  }
}