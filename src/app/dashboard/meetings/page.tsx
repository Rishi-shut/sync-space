import { redirect } from "next/navigation";
import { db, getSessionUser } from "@/lib/db";
import { CalendarDays, CheckCircle2, Clock, ExternalLink, VideoOff } from "lucide-react";
import Link from "next/link";
import MeetingActionsClient from "../meeting-actions-client";
import MeetingCardActions from "./meeting-card-actions";

interface MeetingsPageProps {
  searchParams: Promise<{ ended?: string }>;
}

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const { ended } = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.isOnboarded) {
    redirect("/onboarding");
  }

  // Include rooms the user hosts, was invited to, or already joined.
  const meetings = await db.meeting.findMany({
    where: {
      OR: [
        { createdById: user.id },
        { recipientId: user.id },
        { participants: { some: { userId: user.id } } },
      ],
    },
    include: { createdBy: { select: { displayName: true } } },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 md:p-8">

      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Calls & rooms</p>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Meetings</h2>
        <p className="text-sm text-text-secondary">
          Start now, schedule time, or return to a room you joined.
        </p>
      </div>

      {ended && <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"><CheckCircle2 className="size-4" />The meeting ended and your media devices were disconnected.</div>}

      {/* Start / Join widget */}
      <div className="w-full">
        <MeetingActionsClient />
      </div>

      {/* Meeting Rooms List */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
          Recent rooms
        </h3>
        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex min-h-[154px] flex-col justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-accent/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="max-w-[220px] truncate text-sm font-semibold text-text-primary">
                      {meeting.title}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      meeting.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-bg-secondary text-text-secondary"
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleString() : `Created ${new Date(meeting.createdAt).toLocaleDateString()}`}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{meeting.createdById === user.id ? "Hosted by you" : `Hosted by ${meeting.createdBy.displayName || "a teammate"}`}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-accent select-all bg-bg-secondary px-2.5 py-1 rounded-lg border border-border">
                    {meeting.code}
                  </span>
                  <div className="flex items-center gap-2">
                    {meeting.createdById === user.id && <MeetingCardActions code={meeting.code} status={meeting.status} />}
                    <Link
                      href={`/dashboard/meetings/${meeting.code}`}
                      className="btn-primary px-4 py-2 text-xs font-semibold gap-1.5"
                    >
                      Enter Room
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-border bg-card/80 text-center text-text-muted">
            <VideoOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-text-primary">No meetings yet</p>
            <p className="text-xs max-w-xs mx-auto mt-1">
              Start an Instant Meeting above to create your first conference room.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
