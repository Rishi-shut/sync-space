import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Clock, VideoOff, ExternalLink } from "lucide-react";
import Link from "next/link";
import MeetingActionsClient from "../meeting-actions-client";
import MeetingCardActions from "./meeting-card-actions";

interface MeetingsPageProps {
  searchParams: Promise<{ ended?: string }>;
}

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const { ended } = await searchParams;
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

  // Fetch all meetings created by this user
  const meetings = await db.meeting.findMany({
    where: {
      createdById: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 select-none animate-fadeInUp">
      {ended === "true" && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-semibold text-center">
          The meeting has been ended by the host.
        </div>
      )}

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-text-primary tracking-tight">Meetings</h2>
        <p className="text-sm text-text-secondary">
          Start a call immediately, or view your past meeting rooms.
        </p>
      </div>

      {/* Start / Join widget */}
      <div className="w-full">
        <MeetingActionsClient />
      </div>

      {/* Meeting Rooms List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
          Your Meeting Rooms
        </h3>
        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm flex flex-col justify-between min-h-[140px] hover:border-accent/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-secondary truncate max-w-[150px]">
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
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Created {new Date(meeting.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-accent select-all bg-bg-secondary px-2.5 py-1 rounded-lg border border-border">
                    {meeting.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <MeetingCardActions code={meeting.code} status={meeting.status} />
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
