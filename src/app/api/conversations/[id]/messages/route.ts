import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MessageType } from "@/generated/client";

const MESSAGES_BATCH = 30;

export async function GET(
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

    // Parse pagination query
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");

    // Check if user is member of this conversation
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

    // Retrieve messages
    let messages;
    if (cursor) {
      messages = await db.message.findMany({
        take: MESSAGES_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              imageUrl: true,
            },
          },
          attachments: true,
          reactions: {
            include: {
              user: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      messages = await db.message.findMany({
        take: MESSAGES_BATCH,
        where: {
          conversationId,
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              imageUrl: true,
            },
          },
          attachments: true,
          reactions: {
            include: {
              user: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    let nextCursor = null;
    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return NextResponse.json({
      items: messages.reverse(),
      nextCursor,
    });
  } catch (error) {
    console.error("[MESSAGES_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(
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
    const body = await req.json();
    const { content, type = "TEXT", parentId, attachments = [] } = body;

    if (!content && attachments.length === 0) {
      return new NextResponse("Message content or attachments required", { status: 400 });
    }

    // Verify membership
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

    // Create message and its attachments in a transaction
    const message = await db.message.create({
      data: {
        content: content || "",
        type: type as MessageType,
        conversationId,
        senderId: dbUser.id,
        parentId: parentId || null,
        attachments: {
          create: attachments.map((att: any) => ({
            name: att.name,
            url: att.url,
            mimeType: att.mimeType,
            size: att.size,
            uploaderId: dbUser.id,
          })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            imageUrl: true,
          },
        },
        attachments: true,
        reactions: true,
      },
    });

    // Update the conversation's updatedAt timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("[MESSAGE_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
