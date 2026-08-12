import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/db";
import ConversationListClient from "./conversation-list-client";
import ChatViewportClient from "./chat-viewport-client";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUser = await getSessionUser();

  if (!dbUser) {
    redirect("/sign-in");
  }

  if (!dbUser.isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-[calc(100dvh-72px)] w-full overflow-hidden">
      {/* Conversations list sidebar */}
      <ConversationListClient userId={dbUser.id} />

      {/* Main chat viewport */}
      <ChatViewportClient>
        {children}
      </ChatViewportClient>
    </div>
  );
}
