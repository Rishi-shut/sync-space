"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowRight, AudioLines, User as UserIcon } from "lucide-react";
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
    if (isLoaded && !clerkUser) {
      router.replace("/sign-in?redirect_url=/onboarding");
      return;
    }

    if (clerkUser) {
      queueMicrotask(() => {
        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
        setDisplayName(name || clerkUser.username || "");
        fetch("/api/user/sync", { method: "POST" })
          .then((res) => {
            if (res.ok) setIsSynced(true);
          })
          .catch((err) => console.error("Initial sync error:", err));
      });
    }
  }, [clerkUser, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1e9]">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-r-2 border-accent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--accent) transparent transparent transparent" }} />
          <p className="text-[#676961]">Loading profile...</p>
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
      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f4f1e9] text-[#202421] lg:grid-cols-[0.75fr_1.25fr]">
      <aside className="hidden border-r border-[#d4cfc4] p-10 lg:flex lg:flex-col lg:justify-between">
        <span className="flex items-center gap-3 text-sm font-semibold"><span className="grid size-9 place-items-center rounded-md bg-[#202421] text-[#f4f1e9]"><AudioLines className="size-4" /></span>Sync Space</span>
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a4d3e]">One last step</p><h1 className="mt-4 text-5xl font-semibold leading-tight tracking-[-0.05em]">How should people see you?</h1><p className="mt-4 max-w-sm text-sm leading-6 text-[#676961]">This is the name and short introduction shown in messages, people, and calls.</p></div>
        <p className="text-xs text-[#89887f]">You can update both fields later.</p>
      </aside>

      <section className="flex items-center justify-center p-5 sm:p-10">
      <div className="w-full max-w-lg border border-[#cbc6bb] bg-[#f7f4ed] p-6 sm:p-8">
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a4d3e]">Profile</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Set up your profile</h2>
          <p className="mt-2 text-sm text-[#676961]">Use a recognizable name so people know who joined.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="border border-[#c68b80] bg-[#f2ddd7] p-3 text-sm text-[#7e392c]">
              {error}
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[#bdb7ab]">
              {clerkUser?.imageUrl ? (
                <Image
                  src={clerkUser.imageUrl}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#ebe7dd]">
                  <UserIcon className="h-8 w-8 text-[#8a4d3e]" />
                </div>
              )}
            </div>
            <span className="text-xs text-[#777870]">
              Synced from your login provider
            </span>
          </div>

          {/* Display Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Display name</label>
            <input
              type="text"
              className="w-full rounded-md border border-[#bdb7ab] bg-white px-3 py-3 text-sm outline-none focus:border-[#9b4f3e]"
              placeholder="e.g. Alex Chen"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          {/* Bio Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Bio</label>
            <textarea
              className="min-h-[100px] w-full resize-none rounded-md border border-[#bdb7ab] bg-white px-3 py-3 text-sm outline-none focus:border-[#9b4f3e]"
              placeholder="Tell us a bit about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9b4f3e] py-3 text-sm font-semibold text-white hover:bg-[#824132] disabled:opacity-60"
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
      </div>
      </section>
    </main>
  );
}
