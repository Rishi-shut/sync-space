"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface DeleteMeetingButtonProps {
  meetingCode: string;
  meetingTitle: string;
}

export default function DeleteMeetingButton({
  meetingCode,
  meetingTitle,
}: DeleteMeetingButtonProps) {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/meetings?code=${meetingCode}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete meeting");
      }

      addToast("Scheduled meeting deleted successfully.", "success", 3000);
      router.refresh();
    } catch (err: any) {
      addToast(err.message || "Failed to delete meeting", "error", 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="p-1 rounded-md text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-rose-500/20"
        title="Delete Scheduled Meeting"
      >
        {isDeleting ? (
          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-rose-500 rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="bg-[#14141b] border border-[#24242e] rounded-2xl p-6 max-w-sm w-full relative z-10 space-y-4 animate-scaleIn shadow-2xl">
            <h3 className="text-sm font-bold text-white">Delete Scheduled Meeting?</h3>
            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Are you sure you want to delete the scheduled meeting "{meetingTitle}"? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleDelete();
                }}
                className="flex-1 btn-primary bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-semibold rounded-xl text-white cursor-pointer justify-center"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
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
