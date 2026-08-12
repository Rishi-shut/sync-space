import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ConversationType } from "@/generated/client";

export async function GET() {
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

    // Fetch all conversations where the user is a member
    const conversations = await db.conversation.findMany({
      where: {
        AND: [
          { members: { some: { userId: dbUser.id } } },
          { members: { none: { user: { clerkId: "sync-assistant-bot" } } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                imageUrl: true,
                status: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // One aggregate query replaces the previous per-conversation count queries.
    const unreadRows = await db.$queryRaw<Array<{
      conversationId: string;
      unreadCount: number;
    }>>`
      SELECT
        cm."conversationId" AS "conversationId",
        COUNT(m.id)::int AS "unreadCount"
      FROM conversation_members cm
      LEFT JOIN messages m
        ON m."conversationId" = cm."conversationId"
        AND m."senderId" <> ${dbUser.id}
        AND m."createdAt" > COALESCE(cm."lastReadAt", TIMESTAMP '1970-01-01')
      WHERE cm."userId" = ${dbUser.id}
      GROUP BY cm."conversationId"
    `;

    const unreadByConversation = new Map(
      unreadRows.map((row) => [row.conversationId, row.unreadCount])
    );

    const conversationsWithUnread = conversations.map((conversation) => ({
      ...conversation,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
    }));

    return NextResponse.json(conversationsWithUnread);
  } catch (error) {
    console.error("[CONVERSATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

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

    const body = await req.json();
    const { type, partnerId, name, memberIds = [] } = body;

    // Direct Message (DM)
    if (type === ConversationType.DIRECT) {
      if (!partnerId) {
        return new NextResponse("Partner ID is required for DMs", { status: 400 });
      }

      // Check if a DM conversation already exists between the two users
      const existingConversations = await db.conversation.findFirst({
        where: {
          type: ConversationType.DIRECT,
          AND: [
            { members: { some: { userId: dbUser.id } } },
            { members: { some: { userId: partnerId } } },
          ],
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (existingConversations) {
        return NextResponse.json(existingConversations);
      }

      // Create new DM conversation
      const newConversation = await db.conversation.create({
        data: {
          type: ConversationType.DIRECT,
          members: {
            create: [
              { userId: dbUser.id, role: "OWNER" },
              { userId: partnerId, role: "MEMBER" },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      return NextResponse.json(newConversation);
    }

    // Group Conversation
    if (type === ConversationType.GROUP) {
      if (!name) {
        return new NextResponse("Group name is required", { status: 400 });
      }

      const allMembers = [dbUser.id, ...memberIds];

      const newConversation = await db.conversation.create({
        data: {
          name,
          type: ConversationType.GROUP,
          members: {
            create: allMembers.map((mId) => ({
              userId: mId,
              role: mId === dbUser.id ? "OWNER" : "MEMBER",
            })),
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      return NextResponse.json(newConversation);
    }

    return new NextResponse("Invalid conversation type", { status: 400 });
  } catch (error) {
    console.error("[CONVERSATION_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
