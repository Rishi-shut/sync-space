"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Video,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface SecurityFieldsProps {
  approval: boolean;
  setApproval: (value: boolean) => void;
  passwordEnabled: boolean;
  setPasswordEnabled: (value: boolean) => void;
  password: string;
  setPassword: (value: string) => void;
}

function SecurityFields({
  approval,
  setApproval,
  passwordEnabled,
  setPasswordEnabled,
  password,
  setPassword,
}: SecurityFieldsProps) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-border-subtle bg-background/55 p-3">
      <label className="flex cursor-pointer items-center gap-2.5 text-[10px] text-text-secondary">
        <input type="checkbox" checked={approval} onChange={(event) => setApproval(event.target.checked)} className="h-3.5 w-3.5 rounded border-border accent-[var(--accent)]" />
        <ShieldCheck className="h-3.5 w-3.5 text-text-muted" />
        Host approval
      </label>
      <label className="flex cursor-pointer items-center gap-2.5 text-[10px] text-text-secondary">
        <input type="checkbox" checked={passwordEnabled} onChange={(event) => setPasswordEnabled(event.target.checked)} className="h-3.5 w-3.5 rounded border-border accent-[var(--accent)]" />
        <LockKeyhole className="h-3.5 w-3.5 text-text-muted" />
        Room password
      </label>
      {passwordEnabled && (
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Set a password" required className="input mt-1 h-9 rounded-lg px-3 py-0 text-[10px]" />
      )}
    </div>
  );
}

export default function MeetingActionsClient() {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [instantOptionsOpen, setInstantOptionsOpen] = useState(false);
  const [instantApproval, setInstantApproval] = useState(false);
  const [instantPasswordEnabled, setInstantPasswordEnabled] = useState(false);
  const [instantPassword, setInstantPassword] = useState("");

  const [scheduleOptionsOpen, setScheduleOptionsOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("Team sync");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduleApproval, setScheduleApproval] = useState(false);
  const [schedulePasswordEnabled, setSchedulePasswordEnabled] = useState(false);
  const [schedulePassword, setSchedulePassword] = useState("");
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ended") !== "true") return;
    addToast("The host ended the meeting", "info", 4500);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [addToast]);

  const startMeeting = async () => {
    if (instantPasswordEnabled && !instantPassword.trim()) {
      addToast("Enter a meeting password first", "error");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Quick meeting",
          password: instantPasswordEnabled ? instantPassword.trim() : null,
          requireApproval: instantApproval,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const meeting = await response.json();
      router.push(`/dashboard/meetings/${meeting.code}`);
    } catch (error) {
      addToast(error instanceof Error && error.message ? error.message : "Meeting could not be created", "error");
      setCreating(false);
    }
  };

  const scheduleMeeting = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!scheduledTime) return;
    if (schedulePasswordEnabled && !schedulePassword.trim()) {
      addToast("Enter a meeting password first", "error");
      return;
    }

    setScheduling(true);
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleTitle.trim() || "Team sync",
          scheduledAt: new Date(scheduledTime).toISOString(),
          password: schedulePasswordEnabled ? schedulePassword.trim() : null,
          requireApproval: scheduleApproval,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      setScheduleTitle("Team sync");
      setScheduledTime("");
      addToast("Meeting scheduled", "success");
      router.refresh();
    } catch (error) {
      addToast(error instanceof Error && error.message ? error.message : "Meeting could not be scheduled", "error");
    } finally {
      setScheduling(false);
    }
  };

  const joinMeeting = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = roomCode.trim().toLowerCase();
    if (!normalizedCode) return;
    router.push(`/dashboard/meetings/${encodeURIComponent(normalizedCode)}`);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <article className="flex min-h-[230px] flex-col rounded-2xl border border-border bg-card/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-accent text-white shadow-[0_10px_24px_var(--accent-glow)]"><Video className="h-4 w-4" /></span>
          <span className="rounded-full bg-bg-secondary px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-text-muted">Instant</span>
        </div>
        <h3 className="mt-5 text-sm font-semibold tracking-[-0.02em] text-text-primary">Start a meeting</h3>
        <p className="mt-2 text-[10px] leading-5 text-text-muted">Open a video room now and invite people with a link or room code.</p>
        <button onClick={() => setInstantOptionsOpen((open) => !open)} className="mt-3 flex w-fit items-center gap-1 text-[9px] font-medium text-text-secondary hover:text-text-primary">
          Room controls <ChevronDown className={`h-3 w-3 transition-transform ${instantOptionsOpen ? "rotate-180" : ""}`} />
        </button>
        {instantOptionsOpen && (
          <SecurityFields approval={instantApproval} setApproval={setInstantApproval} passwordEnabled={instantPasswordEnabled} setPasswordEnabled={setInstantPasswordEnabled} password={instantPassword} setPassword={setInstantPassword} />
        )}
        <button onClick={startMeeting} disabled={creating} className="mt-auto flex h-10 items-center justify-center gap-2 rounded-xl bg-accent text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
          {creating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Video className="h-4 w-4" />}
          Start now
        </button>
      </article>

      <form onSubmit={scheduleMeeting} className="flex min-h-[230px] flex-col rounded-2xl border border-border bg-card/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-bg-secondary text-text-secondary"><CalendarDays className="h-4 w-4" /></span>
          <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-text-muted">Schedule</span>
        </div>
        <div className="mt-4 grid gap-2">
          <input value={scheduleTitle} onChange={(event) => setScheduleTitle(event.target.value)} placeholder="Meeting title" required className="input h-9 rounded-lg px-3 py-0 text-[10px]" />
          <input type="datetime-local" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} required className="input h-9 rounded-lg px-3 py-0 text-[10px]" />
        </div>
        <button type="button" onClick={() => setScheduleOptionsOpen((open) => !open)} className="mt-3 flex w-fit items-center gap-1 text-[9px] font-medium text-text-secondary hover:text-text-primary">
          Room controls <ChevronDown className={`h-3 w-3 transition-transform ${scheduleOptionsOpen ? "rotate-180" : ""}`} />
        </button>
        {scheduleOptionsOpen && (
          <SecurityFields approval={scheduleApproval} setApproval={setScheduleApproval} passwordEnabled={schedulePasswordEnabled} setPasswordEnabled={setSchedulePasswordEnabled} password={schedulePassword} setPassword={setSchedulePassword} />
        )}
        <button type="submit" disabled={scheduling} className="mt-auto flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-bg-secondary text-xs font-semibold text-text-primary transition-colors hover:border-accent/35 hover:bg-sidebar-hover disabled:opacity-50">
          {scheduling ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-muted border-t-text-primary" /> : <CalendarDays className="h-4 w-4" />}
          Add to schedule
        </button>
      </form>

      <form onSubmit={joinMeeting} className="flex min-h-[230px] flex-col rounded-2xl border border-border bg-card/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-bg-secondary text-text-secondary"><Link2 className="h-4 w-4" /></span>
          <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-text-muted">Invite code</span>
        </div>
        <h3 className="mt-5 text-sm font-semibold tracking-[-0.02em] text-text-primary">Join a room</h3>
        <p className="mt-2 text-[10px] leading-5 text-text-muted">Paste the code from an invitation to go directly to that room.</p>
        <div className="mt-auto flex gap-2 pt-5">
          <input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} placeholder="Room code" required spellCheck={false} className="input h-10 min-w-0 flex-1 rounded-xl px-3 py-0 font-mono text-[10px]" />
          <button type="submit" aria-label="Join room" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-text-primary text-background transition-transform hover:-translate-y-0.5"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </form>
    </div>
  );
}
