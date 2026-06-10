import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import ChatWindowClient from "./chat-window-client";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  const { id: conversationId } = await params;

  // Retrieve conversation details
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
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
    },
  });

  if (!conversation) {
    notFound();
  }

  // Confirm membership
  const member = conversation.members.find((m) => m.userId === dbUser.id);
  if (!member) {
    notFound();
  }

  // Retrieve initial messages (first batch of 30)
  const initialMessages = await db.message.findMany({
    take: 30,
    where: { conversationId },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <ChatWindowClient
      userId={dbUser.id}
      conversation={conversation}
      initialMessages={JSON.parse(JSON.stringify(initialMessages.reverse()))}
    />
  );
}
