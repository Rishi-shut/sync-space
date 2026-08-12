import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MessageCircle,
  Paperclip,
  Phone,
  Users,
  Video,
} from "lucide-react";
import { db, getSessionUser } from "@/lib/db";
import MeetingActionsClient from "./meeting-actions-client";

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const user = await getSessionUser();
  if (!user) redirect("/onboarding");
  if (!user.isOnboarded) redirect("/onboarding");

  const [
    conversationCount,
    friendCount,
    activeCallCount,
    sharedFileCount,
    recentConversations,
    upcomingMeetings,
  ] = await Promise.all([
    db.conversationMember.count({
      where: {
        userId: user.id,
        conversation: { members: { none: { user: { clerkId: "sync-assistant-bot" } } } },
      },
    }),
    db.friendship.count({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
    }),
    db.meeting.count({
      where: {
        status: "ACTIVE",
        OR: [
          { createdById: user.id },
          { recipientId: user.id },
          { participants: { some: { userId: user.id, leftAt: null } } },
        ],
      },
    }),
    db.attachment.count({ where: { uploaderId: user.id } }),
    db.conversation.findMany({
      where: {
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { none: { user: { clerkId: "sync-assistant-bot" } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        members: {
          include: {
            user: {
              select: { id: true, displayName: true, imageUrl: true, status: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { displayName: true } } },
        },
      },
    }),
    db.meeting.findMany({
      where: {
        status: "SCHEDULED",
        OR: [
          { createdById: user.id },
          { recipientId: user.id },
          { participants: { some: { userId: user.id } } },
        ],
      },
      orderBy: { scheduledAt: "asc" },
      take: 4,
      include: { createdBy: { select: { displayName: true } } },
    }),
  ]);

  const stats = [
    { label: "Conversations", value: conversationCount, icon: MessageCircle, color: "text-accent", surface: "bg-accent/10" },
    { label: "People", value: friendCount, icon: Users, color: "text-text-secondary", surface: "bg-bg-secondary" },
    { label: "Live now", value: activeCallCount, icon: Phone, color: "text-success", surface: "bg-bg-secondary" },
    { label: "Files shared", value: sharedFileCount, icon: Paperclip, color: "text-text-secondary", surface: "bg-bg-secondary" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-7 sm:px-7 sm:py-9 xl:px-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-9 sm:py-10">
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Workspace online
            </div>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-text-primary sm:text-4xl">
              Welcome back, {user.displayName || "there"}.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
              Pick up a conversation, start a room, or bring someone into a quick call.
            </p>
          </div>
          <Link href="/dashboard/messages" className="group flex w-fit items-center gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary transition-colors hover:border-accent/40 hover:bg-sidebar-hover">
            Open messages <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, surface }) => (
          <article key={label} className="rounded-2xl border border-border-subtle bg-card/70 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium text-text-muted">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text-primary">{value}</p>
              </div>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${surface} ${color}`}><Icon className="h-4 w-4" /></span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold text-text-primary">Start something</p>
            <p className="mt-1 text-[10px] text-text-muted">A call, a scheduled room, or an invite code.</p>
          </div>
        </div>
        <MeetingActionsClient />
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card/65">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h3 className="text-xs font-semibold text-text-primary">Recent conversations</h3>
              <p className="mt-1 text-[9px] text-text-muted">Continue where you left off</p>
            </div>
            <Link href="/dashboard/messages" className="text-[10px] font-medium text-accent hover:text-accent-hover">View all</Link>
          </div>
          {recentConversations.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <MessageCircle className="mx-auto h-7 w-7 text-text-muted" />
              <p className="mt-3 text-xs font-semibold text-text-primary">No conversations yet</p>
              <p className="mt-1 text-[10px] text-text-muted">Connect with someone to start talking.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {recentConversations.map((conversation) => {
                const partner = conversation.members.find((member) => member.userId !== user.id)?.user;
                const name = conversation.type === "DIRECT" ? partner?.displayName || "Unknown person" : conversation.name || "Group conversation";
                const message = conversation.messages[0];
                return (
                  <Link key={conversation.id} href={`/dashboard/messages/${conversation.id}`} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-sidebar-hover">
                    <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-bg-secondary text-[11px] font-semibold text-accent">
                      {partner?.imageUrl ? <span className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${partner.imageUrl})` }} /> : initials(name)}
                      {partner && <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${partner.status === "ONLINE" ? "bg-success" : "bg-text-muted"}`} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12px] font-semibold text-text-primary">{name}</p>
                        {message && <span className="shrink-0 text-[8px] text-text-muted">{message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                      </div>
                      <p className="mt-1 truncate text-[10px] text-text-muted">{message ? `${message.sender.displayName || "Someone"}: ${message.content || "Shared a file"}` : "No messages yet"}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card/65">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h3 className="text-xs font-semibold text-text-primary">Coming up</h3>
              <p className="mt-1 text-[9px] text-text-muted">Your next scheduled rooms</p>
            </div>
            <CalendarDays className="h-4 w-4 text-text-muted" />
          </div>
          {upcomingMeetings.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Clock3 className="mx-auto h-7 w-7 text-text-muted" />
              <p className="mt-3 text-xs font-semibold text-text-primary">Your schedule is clear</p>
              <p className="mt-1 text-[10px] text-text-muted">Schedule a room above when you need one.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center gap-3 px-5 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-accent/10 text-accent"><Video className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-text-primary">{meeting.title}</p>
                    <p className="mt-1 text-[9px] text-text-muted">{meeting.scheduledAt ? meeting.scheduledAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Time not set"}</p>
                  </div>
                  <Link href={`/dashboard/meetings/${meeting.code}`} className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-[9px] font-semibold text-text-secondary hover:border-accent/40 hover:text-text-primary">Join</Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
