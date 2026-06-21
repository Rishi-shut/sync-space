import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: conversationId } = await params;

    // Check if conversation exists and the user is a member of this conversation
    const isMember = await db.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: dbUser.id,
        },
      },
    });

    if (!isMember) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch all attachments associated with this conversation to delete their physical files
    const attachments = await db.attachment.findMany({
      where: {
        message: {
          conversationId,
        },
      },
      select: {
        url: true,
      },
    });

    // Delete the conversation
    // onDelete: Cascade on conversation relation in schema will delete messages, members, etc.
    await db.conversation.delete({
      where: {
        id: conversationId,
      },
    });

    // Physically delete the attachment files from the public/uploads folder in the background
    // (fire-and-forget to eliminate API response latency)
    (async () => {
      for (const att of attachments) {
        if (att.url) {
          try {
            // att.url is like "/uploads/filename.ext"
            const filePath = path.join(process.cwd(), "public", att.url);
            await unlink(filePath);
            console.log(`[CONVERSATION_DELETE] Physically deleted upload file: ${filePath}`);
          } catch (err: any) {
            console.warn(`[CONVERSATION_DELETE] Failed to delete file on disk for ${att.url}:`, err.message);
          }
        }
      }
    })().catch((err) => {
      console.error("[CONVERSATION_DELETE_BACKGROUND_ERROR]", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONVERSATION_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: conversationId } = await params;

    // Update the lastReadAt timestamp for this conversation member
    await db.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: dbUser.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONVERSATION_PATCH_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
