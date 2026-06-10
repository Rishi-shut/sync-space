import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import CommandPalette from "@/components/layout/command-palette";

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
    <div className="flex h-screen overflow-hidden bg-[#07080d] text-[#f0f2f5]">
      {/* Sidebar navigation */}
      <Sidebar user={user} />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto relative z-10">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}
