export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { normalizeImageUrls } from '../../../utils/imageUrls';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number.parseInt(searchParams.get('id'), 10);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ images: [] });
    }

    // DB is the source of truth for both visibility and order. Candidate IDs
    // (and therefore party{id} folders) can be reused after a reset, so scanning
    // the directory leaks orphaned files from an older candidate into Gallery.
    const candidate = await db.candidate.findUnique({
      where: { id },
      select: { groupImageUrls: true },
    });
    const images = normalizeImageUrls(candidate?.groupImageUrls);

    return NextResponse.json({ images });
    
  } catch (error) {
    console.error("Gallery Error:", error);
    return NextResponse.json({ images: [] });
  }
}
