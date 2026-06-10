"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, PhoneOff, Loader2 } from "lucide-react";

interface MeetingCardActionsProps {
  code: string;
  status: string;
}

export default function MeetingCardActions({ code, status }: MeetingCardActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnd = async () => {
    if (!confirm("Are you sure you want to end this meeting for everyone?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, status: "ENDED" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to end meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this meeting room permanently?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings?code=${code}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {status === "ACTIVE" && (
        <button
          onClick={handleEnd}
          disabled={loading}
          className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors"
          title="End Meeting for Everyone"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneOff className="w-3.5 h-3.5" />}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-2 rounded-xl border border-border bg-background hover:bg-card-hover text-text-secondary hover:text-red-400 transition-colors"
        title="Delete Meeting Room"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
