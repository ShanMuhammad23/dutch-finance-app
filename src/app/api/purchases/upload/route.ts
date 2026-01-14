"use server";

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { auth } from '../../auth/[...nextauth]/route';
import { logActivityFromRequest } from '@/lib/activity-log';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (20 MB max)
    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 20 MB limit" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Ensure attachments directory exists
    const attachmentsDir = join(process.cwd(), "public", "attachments");
    if (!existsSync(attachmentsDir)) {
      await mkdir(attachmentsDir, { recursive: true });
    }

    // Save file to public/attachments
    const filePath = join(attachmentsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicPath = `/attachments/${fileName}`;

    // Log activity
    const session = await auth();
    if (session?.user) {
      await logActivityFromRequest(
        'CREATE',
        'purchase',
        {
          description: `Uploaded file: ${file.name}`,
          details: {
            originalFileName: file.name,
            storedFileName: fileName,
            filePath: publicPath,
            fileSize: file.size,
            fileType: file.type,
          },
          request,
          session,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        filePath: publicPath,
        // The actual stored file name on disk
        storedFileName: fileName,
        // The original file name from the user (for UI only)
        originalFileName: file.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

