import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get("name");
    const number = parseInt(formData.get("number"));
    const file = formData.get("file");

    let logoUrl = undefined;

    if (file && typeof file !== "string") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeName = name.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "");
      const fileName = `${safeName}.jpg`;

      const uploadDir = path.join(process.cwd(), "public/images/candidates/logo");
      
      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      logoUrl = `/images/candidates/logo/${fileName}`;
    }

    const updatedCandidate = await db.candidate.update({
      where: { id: parseInt(id) },
      data: {
        name: name,
        number: number,
        ...(logoUrl && { logoUrl: logoUrl }),
      },
    });

    return NextResponse.json(updatedCandidate);

  } catch (error) {
    console.error("🔥 Error updating candidate:", error);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await db.candidate.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Deleted successfully" });

  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function POST(req) {
    try {
      const formData = await req.formData();
      const name = formData.get("name");
      const number = parseInt(formData.get("number"));
      const file = formData.get("file");
  
      let logoUrl = null;
  
      if (file && typeof file !== "string") {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = name.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, "");
        const fileName = `${safeName}.jpg`;
        const uploadDir = path.join(process.cwd(), "public/images/candidates/logo");
        
        if (!fs.existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }
        
        await writeFile(path.join(uploadDir, fileName), buffer);
        logoUrl = `/images/candidates/logo/${fileName}`;
      }
  
      const newCandidate = await db.candidate.create({
        data: {
          name,
          number,
          logoUrl,
          score: 0
        }
      });
  
      return NextResponse.json(newCandidate);
  
    } catch (error) {
      console.error("🔥 Error creating candidate:", error);
      return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
  }