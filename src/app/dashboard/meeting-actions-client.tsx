"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Plus, ArrowRight, Calendar } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export default function MeetingActionsClient() {
  const router = useRouter();
  const { addToast } = useUIStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ended") === "true") {
      addToast("The meeting has been ended by the host.", "info", 5000);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [addToast]);
  
  // Instant Meeting States
  const [showSettings, setShowSettings] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [requireApproval, setRequireApproval] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  // Schedule Meeting States
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("Team Meeting");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduleRequirePassword, setScheduleRequirePassword] = useState(false);
  const [schedulePassword, setSchedulePassword] = useState("");
  const [scheduleRequireApproval, setScheduleRequireApproval] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState("");
  const [scheduleError, setScheduleError] = useState("");

  const handleCreateMeeting = async () => {
    setIsCreating(true);
    setError("");
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Quick Meeting",
          password: requirePassword ? password : null,
          requireApproval,
        }),
      });

      if (!res.ok) throw new Error("Failed to create meeting");

      const meeting = await res.json();
      router.push(`/dashboard/meetings/${meeting.code}`);
    } catch (err: any) {
      setError(err.message || "Failed to start meeting");
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    // Clean up code formatting
    const code = roomCode.trim().toLowerCase();
    router.push(`/dashboard/meetings/${code}`);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledTime) {
      setScheduleError("Please select a date and time");
      return;
    }
    setIsScheduling(true);
    setScheduleError("");
    setScheduleSuccess("");
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleTitle || "Scheduled Meeting",
          password: scheduleRequirePassword ? schedulePassword : null,
          requireApproval: scheduleRequireApproval,
          scheduledAt: new Date(scheduledTime).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to schedule meeting");

      const meeting = await res.json();
      setScheduleSuccess(`Meeting scheduled! Code: ${meeting.code}`);
      setScheduleTitle("Team Meeting");
      setScheduledTime("");
      router.refresh();
    } catch (err: any) {
      setScheduleError(err.message || "Failed to schedule meeting");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Start Instant Meeting */}
      <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-md flex flex-col justify-between min-h-[260px] group hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Instant Meeting</h3>
            <p className="text-xs text-text-secondary">
              Start an HD video conference with screensharing and direct link invitations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-[10px] font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showSettings ? "Hide Security Options" : "Show Security Options"}</span>
          </button>

          {showSettings && (
            <div className="p-3.5 rounded-xl border border-border bg-background/50 space-y-3 animate-fadeInUp">
              {/* Host Admission Approval Option */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">Require Host Approval</span>
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="rounded border-border bg-card text-accent focus:ring-accent w-3.5 h-3.5 cursor-pointer"
                />
              </div>

              {/* Password Option */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">Password Protected</span>
                  <input
                    type="checkbox"
                    checked={requirePassword}
                    onChange={(e) => setRequirePassword(e.target.checked)}
                    className="rounded border-border bg-card text-accent focus:ring-accent w-3.5 h-3.5 cursor-pointer"
                  />
                </div>
                {requirePassword && (
                  <input
                    type="text"
                    placeholder="Enter meeting password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input text-xs py-2 px-3 bg-background border-border text-text-primary focus:border-accent/50 outline-none rounded-xl"
                    required={requirePassword}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 space-y-2">
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button
            onClick={handleCreateMeeting}
            disabled={isCreating}
            className="w-full btn-primary py-2.5 justify-center text-xs font-semibold gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.15)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.25)] transition-all"
          >
            {isCreating ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Start Meeting
          </button>
        </div>
      </div>

      {/* Schedule a Meeting */}
      <form
        onSubmit={handleScheduleMeeting}
        className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-md flex flex-col justify-between min-h-[260px] group hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Schedule Meeting</h3>
            <p className="text-xs text-text-secondary">
              Plan a future video session and save it directly to your agenda.
            </p>
          </div>

          <div className="space-y-2.5">
            <input
              type="text"
              placeholder="Meeting Title"
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              className="w-full input text-xs py-2 px-3 bg-background border-border text-text-primary rounded-xl focus:border-accent/50 outline-none"
              required
            />
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full input text-xs py-2 px-3 bg-background border-border text-text-primary rounded-xl focus:border-accent/50 outline-none"
              required
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowScheduleSettings(!showScheduleSettings)}
              className="text-[10px] font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showScheduleSettings ? "Hide Security Options" : "Show Security Options"}</span>
            </button>

            {showScheduleSettings && (
              <div className="p-3.5 rounded-xl border border-border bg-background/50 space-y-3 animate-fadeInUp">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">Require Host Approval</span>
                  <input
                    type="checkbox"
                    checked={scheduleRequireApproval}
                    onChange={(e) => setScheduleRequireApproval(e.target.checked)}
                    className="rounded border-border bg-card text-accent focus:ring-accent w-3.5 h-3.5 cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-secondary">Password Protected</span>
                    <input
                      type="checkbox"
                      checked={scheduleRequirePassword}
                      onChange={(e) => setScheduleRequirePassword(e.target.checked)}
                      className="rounded border-border bg-card text-accent focus:ring-accent w-3.5 h-3.5 cursor-pointer"
                    />
                  </div>
                  {scheduleRequirePassword && (
                    <input
                      type="text"
                      placeholder="Enter meeting password"
                      value={schedulePassword}
                      onChange={(e) => setSchedulePassword(e.target.value)}
                      className="w-full input text-xs py-2 px-3 bg-background border-border text-text-primary rounded-xl focus:border-accent/50 outline-none"
                      required={scheduleRequirePassword}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 space-y-2">
          {scheduleError && <p className="text-xs text-rose-500">{scheduleError}</p>}
          {scheduleSuccess && <p className="text-xs text-emerald-500">{scheduleSuccess}</p>}

          <button
            type="submit"
            disabled={isScheduling}
            className="w-full btn-primary py-2.5 justify-center text-xs font-semibold gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.15)] hover:shadow-[0_4px_25px_rgba(124,58,237,0.25)] transition-all"
          >
            {isScheduling ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            Schedule Meeting
          </button>
        </div>
      </form>

      {/* Join with Code */}
      <form
        onSubmit={handleJoinMeeting}
        className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-md flex flex-col justify-between min-h-[260px] group hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300"
      >
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Join with Code</h3>
          <p className="text-xs text-text-secondary">
            Enter a room invite code (e.g. abc-defg-hij) to jump right in.
          </p>
        </div>

        <div className="pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="flex-1 input text-xs py-2.5 px-3 bg-background border-border text-text-primary rounded-xl focus:border-accent/50 outline-none"
              required
            />
            <button
              type="submit"
              className="btn-primary px-4 py-2.5 text-xs font-semibold shadow-[0_4px_20px_rgba(124,58,237,0.15)]"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
