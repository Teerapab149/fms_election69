import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();
    const { username, password } = body;

    // เช็ค User/Pass
    if (username === 'admin' && password === 'fmsadmin129') {
        const response = NextResponse.json(
            { success: true, message: 'Login Success' },
            { status: 200 }
        );

        // ฝัง Cookie
        response.cookies.set({
            name: 'admin_token',
            value: 'super_secret_token_123',
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24, // 1 วัน
        });

        return response;
    } else {
        return NextResponse.json(
            { success: false, 
              message: 'Invalid username or password' },
            { status: 401 }
        );
    }
}