import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ConversationListClient from "./conversation-list-client";
import ChatViewportClient from "./chat-viewport-client";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="flex w-full h-[calc(100vh-80px)] overflow-hidden">
      {/* Conversations list sidebar */}
      <ConversationListClient userId={dbUser.id} />

      {/* Main chat viewport */}
      <ChatViewportClient>
        {children}
      </ChatViewportClient>
    </div>
  );
}
