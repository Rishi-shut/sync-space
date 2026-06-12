import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return new NextResponse("User not found in local DB", { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Limit size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return new NextResponse("File size exceeds 10MB limit", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename to prevent collisions
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${uniqueId}-${sanitizedFilename}`;

    // Upload directory path
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      name: file.name,
      url: fileUrl,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("[UPLOAD_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
