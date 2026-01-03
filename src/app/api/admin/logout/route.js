import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // สั่งลบ Cookie 'admin_token' ทิ้งทันที
    response.cookies.delete('admin_token');

    return response;
}