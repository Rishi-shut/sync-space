import { currentUser, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return new NextResponse("User not found in Clerk", { status: 404 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      return new NextResponse("User email not found", { status: 400 });
    }

    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

    // Create or update user in PostgreSQL
    const user = await db.user.upsert({
      where: { clerkId: userId },
      update: {
        email,
        name: name || null,
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        clerkId: userId,
        email,
        name: name || null,
        displayName: name || clerkUser.username || "User",
        imageUrl: clerkUser.imageUrl,
      },
    });

    // Ensure Sync Assistant bot user is seeded in local DB
    const botId = "sync-assistant-bot";
    const botUser = await db.user.upsert({
      where: { clerkId: botId },
      update: {},
      create: {
        clerkId: botId,
        email: "assistant@syncspace.io",
        name: "Sync Assistant",
        displayName: "Sync Assistant",
        imageUrl: null,
        status: "ONLINE",
        bio: "Your AI companion. Ask me anything!",
      },
    });

    // Automatically establish a default DM with the assistant bot if it does not exist
    const existingConvo = await db.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: botUser.id } } },
        ],
      },
    });

    if (!existingConvo) {
      await db.conversation.create({
        data: {
          type: "DIRECT",
          members: {
            create: [
              { userId: user.id, role: "OWNER" },
              { userId: botUser.id, role: "MEMBER" },
            ],
          },
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_SYNC_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
