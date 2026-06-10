"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Check, User as UserIcon } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load user profile details
  useEffect(() => {
    if (clerkUser) {
      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      setDisplayName(name || clerkUser.username || "");

      // Retrieve current database record to load bio
      fetch("/api/user/sync", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.bio) setBio(data.bio);
          if (data.displayName) setDisplayName(data.displayName);
        })
        .catch((err) => console.error("Error loading user profile:", err));
    }
  }, [clerkUser]);

  if (!isLoaded) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-8 h-8 border-t-2 border-r-2 border-accent rounded-full animate-spin mx-auto" style={{ borderColor: "var(--accent) transparent transparent transparent" }} />
        <p className="text-xs text-[#a1a1aa]">Loading settings...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setMessage("Profile settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 select-none">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-sm text-[#a1a1aa]">
          Manage your profile settings, active presence and workspace theme.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 font-semibold">
            <Check className="w-4 h-4" />
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="p-6 rounded-2xl border border-[#27272a] bg-[#18181b]/80 backdrop-blur-sm space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Profile Details
          </h3>

          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#27272a]">
              {clerkUser?.imageUrl ? (
                <Image src={clerkUser.imageUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#27272a] flex items-center justify-center">
                  <UserIcon className="w-6 h-6" style={{ color: "var(--accent)" }} />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Profile Photo</p>
              <p className="text-[10px] text-[#52525b]">Synced from your login account</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input bg-[#0c0c0e] border-[#27272a] text-xs text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input bg-[#0c0c0e] border-[#27272a] text-xs text-white min-h-[100px] resize-none py-3"
              placeholder="Write a short bio..."
            />
          </div>
        </div>

        {/* Preferences Card */}
        <div className="p-6 rounded-2xl border border-[#27272a] bg-[#18181b]/80 backdrop-blur-sm space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Workspace Preferences
          </h3>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white">Interface Theme</p>
              <p className="text-[10px] text-[#a1a1aa]">Choose between light or dark mode theme</p>
            </div>

            <div className="flex bg-[#0c0c0e] border border-[#27272a] rounded-xl p-1">
              {["dark", "light"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    theme === t
                      ? "bg-accent text-white"
                      : "text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-3 justify-center text-xs font-bold"
        >
          {isSubmitting ? "Saving Changes..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
