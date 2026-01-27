import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db";

const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY
  ? process.env.ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;

function verifyAdminToken(request) {
  const encryptedToken = request.headers.get('x-admin-token');
  const now = Date.now(); 
  
  if (!encryptedToken || !PRIVATE_KEY) {
    return NextResponse.json({ error: "Unauthorized / Config Error" }, { status: 401 });
  }

  try {
    const buffer = Buffer.from(encryptedToken, "base64");
    const decryptedData = crypto.privateDecrypt(
      {
        key: PRIVATE_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );

    const decryptedString = decryptedData.toString("utf8");
    const [secret, timestamp] = decryptedString.split('|');
    
    const EXPECTED_SECRET = process.env.ADMIN_AUTH_SECRET || "fallback_secret";

    if (secret !== EXPECTED_SECRET) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
    }

    if (now - parseInt(timestamp) > 3600000) {
      return NextResponse.json({ error: "Token Expired" }, { status: 403 });
    }

    return null;

  } catch (decryptionError) {
    console.error("Decryption failed:", decryptionError);
    return NextResponse.json({ error: "Invalid Token Format" }, { status: 403 });
  }
}

export async function GET(request) {
  const authError = verifyAdminToken(request);
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
  const authError = verifyAdminToken(request);
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