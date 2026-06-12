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
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEnd = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, status: "ENDED" }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to end meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings?code=${code}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to delete meeting:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {status === "ACTIVE" && (
          <button
            onClick={() => setShowEndConfirm(true)}
            disabled={loading}
            className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="End Meeting for Everyone"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneOff className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="p-2 rounded-xl border border-border bg-background hover:bg-card-hover text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
          title="Delete Meeting Room"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* End Meeting Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div className="bg-[#14141b] border border-[#24242e] rounded-2xl p-6 max-w-sm w-full relative z-10 space-y-4 animate-scaleIn shadow-2xl">
            <h3 className="text-sm font-bold text-white">End Meeting?</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Are you sure you want to end this meeting for everyone? This will disconnect all active participants and close the room.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  handleEnd();
                }}
                className="flex-1 btn-primary bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold rounded-xl text-white cursor-pointer justify-center animate-none"
              >
                Yes, End Meeting
              </button>
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 btn-secondary bg-[#0f0f13] hover:bg-[#1b1b24] py-2.5 text-xs font-semibold rounded-xl border border-[#24242e] text-[#fafafa] cursor-pointer justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Meeting Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="bg-[#14141b] border border-[#24242e] rounded-2xl p-6 max-w-sm w-full relative z-10 space-y-4 animate-scaleIn shadow-2xl">
            <h3 className="text-sm font-bold text-white">Delete Meeting Room?</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Are you sure you want to permanently delete this meeting room code "{code}"? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                className="flex-1 btn-primary bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold rounded-xl text-white cursor-pointer justify-center animate-none"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary bg-[#0f0f13] hover:bg-[#1b1b24] py-2.5 text-xs font-semibold rounded-xl border border-[#24242e] text-[#fafafa] cursor-pointer justify-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
