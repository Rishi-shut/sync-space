import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ConversationListClient from "./conversation-list-client";

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
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Conversations list sidebar */}
      <ConversationListClient userId={dbUser.id} />

      {/* Main chat viewport */}
      <div className="flex-1 h-full overflow-hidden bg-[#0c0c0e]">
        {children}
      </div>
    </div>
  );
}
