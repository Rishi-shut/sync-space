import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // Delete the conversation
    // onDelete: Cascade on conversation relation in schema will delete messages, members, etc.
    await db.conversation.delete({
      where: {
        id: conversationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONVERSATION_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
