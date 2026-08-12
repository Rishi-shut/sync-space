import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import PageTransition from "@/components/layout/page-transition";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });

  // A valid Clerk session may exist before its local profile has been synced.
  if (!user || !user.isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar user={user} />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto relative z-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
