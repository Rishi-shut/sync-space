import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Video, Clock, MessageSquare, Files, Bot, Sparkles, Calendar } from "lucide-react";
import MeetingActionsClient from "./meeting-actions-client";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect("/onboarding");
  }

  // Real database counts
  const conversationCount = await db.conversationMember.count({
    where: { userId: user.id },
  });

  const activeMeetingCount = await db.meeting.count({
    where: {
      createdById: user.id,
      status: "ACTIVE",
    },
  });

  // Upcoming scheduled meetings
  const upcomingMeetings = await db.meeting.findMany({
    where: {
      createdById: user.id,
      status: "SCHEDULED",
    },
    orderBy: {
      scheduledAt: "asc",
    },
    take: 3,
  });

  // Greet user based on local time
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 select-none">
      {/* Welcome Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-2xl border border-[#1e2235] bg-[#0d0f17]/40 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-accent opacity-5 blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Sync Active</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {greeting}, {user.displayName || "User"} 👋
          </h2>
          <p className="text-sm text-[#8b8fa3]">
            Welcome to your communications hub. Set up calls, chat with your team, or prompt the AI.
          </p>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Chats", value: conversationCount, icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
          { label: "Meetings Today", value: activeMeetingCount, icon: Video, color: "text-sky-400", bg: "bg-sky-400/10" },
          { label: "AI Summaries", value: 0, icon: Bot, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Files Shared", value: 0, icon: Files, color: "text-amber-400", bg: "bg-amber-400/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-2xl border border-[#1e2235] bg-[#0f1118]/80 backdrop-blur-sm relative overflow-hidden group hover:border-[#1e2235]/80 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#8b8fa3]">{stat.label}</span>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="text-3xl font-black text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Middle Grid: Quick Actions + Upcoming Meetings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Quick Actions
          </h3>
          <MeetingActionsClient />
        </div>

        {/* Upcoming Meetings List */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Upcoming Meetings
          </h3>
          <div className="p-6 rounded-2xl border border-[#1e2235] bg-[#0f1118]/80 backdrop-blur-sm min-h-[160px] flex flex-col justify-between">
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-start gap-3 justify-between">
                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4 text-accent mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-white">{meeting.title}</p>
                        <p className="text-[10px] text-[#8b8fa3]">
                          {meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleString() : "Scheduled"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/meetings/${meeting.code}`}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                    >
                      Join
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-[#565b73]">
                <Clock className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No upcoming meetings</p>
                <p className="text-[10px] max-w-[180px] mt-1">
                  Schedule one or use an Instant Meeting to start.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
