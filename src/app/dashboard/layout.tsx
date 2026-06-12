import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import PageTransition from "@/components/layout/page-transition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user exists in local PostgreSQL db
  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  // Redirect to onboarding if not created in PostgreSQL db yet
  if (!user) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
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
