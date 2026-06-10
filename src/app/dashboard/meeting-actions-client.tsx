"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Plus, ArrowRight } from "lucide-react";

export default function MeetingActionsClient() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateMeeting = async () => {
    setIsCreating(true);
    setError("");
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Quick Meeting" }),
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Start Instant Meeting */}
      <div className="p-6 rounded-2xl border border-[#1e2235] bg-[#0f1118]/80 backdrop-blur-sm flex flex-col justify-between min-h-[160px] group hover:border-[var(--accent)]/40 transition-all duration-300">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">Instant Meeting</h3>
          <p className="text-xs text-[#8b8fa3]">
            Start an HD video conference with screensharing and direct link invitations.
          </p>
        </div>

        {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}

        <button
          onClick={handleCreateMeeting}
          disabled={isCreating}
          className="mt-4 w-full btn-primary py-2.5 justify-center text-xs font-semibold gap-2"
        >
          {isCreating ? (
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Start Meeting
        </button>
      </div>

      {/* Join with Code */}
      <form
        onSubmit={handleJoinMeeting}
        className="p-6 rounded-2xl border border-[#1e2235] bg-[#0f1118]/80 backdrop-blur-sm flex flex-col justify-between min-h-[160px] group hover:border-[var(--accent)]/40 transition-all duration-300"
      >
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">Join with Code</h3>
          <p className="text-xs text-[#8b8fa3]">
            Enter a room invite code (e.g. abc-defg-hij) to jump right in.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="flex-1 input text-xs py-2 bg-[#07080d] border-[#1e2235] text-white"
            required
          />
          <button
            type="submit"
            className="btn-primary px-4 py-2 text-xs font-semibold"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
