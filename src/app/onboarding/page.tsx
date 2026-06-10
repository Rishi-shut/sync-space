"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, User as UserIcon } from "lucide-react";
import Image from "next/image";

export default function OnboardingPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState("");

  // Sync user details to local state when Clerk user loads
  useEffect(() => {
    if (clerkUser) {
      const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      setDisplayName(name || clerkUser.username || "");

      // Auto trigger initial DB sync in background
      fetch("/api/user/sync", { method: "POST" })
        .then((res) => {
          if (res.ok) setIsSynced(true);
        })
        .catch((err) => console.error("Initial sync error:", err));
    }
  }, [clerkUser]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080d]">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-r-2 border-accent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--accent) transparent transparent transparent" }} />
          <p className="text-[#8b8fa3]">Loading profile...</p>
        </div>
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

    try {
      // If the user hasn't successfully synced in background yet, sync them now
      if (!isSynced) {
        const syncRes = await fetch("/api/user/sync", { method: "POST" });
        if (!syncRes.ok) throw new Error("Sync failed");
      }

      // Update name/bio in our PostgreSQL DB
      const updateRes = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to save profile settings");
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#07080d] p-6">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="orb orb-accent"
          style={{ width: "600px", height: "600px", top: "-10%", left: "-10%" }}
        />
        <div
          className="orb orb-cyan"
          style={{ width: "500px", height: "500px", bottom: "-10%", right: "-5%", animationDelay: "-5s" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg glass p-8 rounded-2xl relative z-10 shadow-[0_0_60px_rgba(124,92,252,0.15)] border border-[#1e2235]"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 bg-[rgba(124,92,252,0.08)] border border-[rgba(124,92,252,0.25)]">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Welcome to Sync Space</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Set up your profile</h1>
          <p className="text-sm text-[#8b8fa3]">
            Let&apos;s personalize your space. You can change these details anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2" style={{ borderColor: "var(--accent)" }}>
              {clerkUser?.imageUrl ? (
                <Image
                  src={clerkUser.imageUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#161925] flex items-center justify-center">
                  <UserIcon className="w-8 h-8" style={{ color: "var(--accent)" }} />
                </div>
              )}
            </div>
            <span className="text-xs text-[#8b8fa3]">
              Synced from your login provider
            </span>
          </div>

          {/* Display Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Display Name</label>
            <input
              type="text"
              className="input text-white bg-[#0d0f17] border-[#1e2235]"
              placeholder="e.g. Alex Chen"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          {/* Bio Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Bio</label>
            <textarea
              className="input text-white bg-[#0d0f17] border-[#1e2235] min-h-[100px] py-3 resize-none"
              placeholder="Tell us a bit about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-3 justify-center gap-2 text-base font-semibold"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Complete Profile
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
