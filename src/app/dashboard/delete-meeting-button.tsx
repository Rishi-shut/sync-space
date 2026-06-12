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

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the scheduled meeting "${meetingTitle}"?`
    );
    if (!confirmDelete) return;

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
    <button
      onClick={handleDelete}
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
  );
}
