"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Check, Laptop, Mic, Moon, RefreshCw, Sun, UserRound, Video } from "lucide-react";

interface Preferences {
  soundAlerts: boolean;
  desktopNotifications: boolean;
  doNotDisturb: boolean;
}

const defaultPreferences: Preferences = {
  soundAlerts: true,
  desktopNotifications: true,
  doNotDisturb: false,
};

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(async () => {
      const fallbackName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || "";
      setDisplayName(fallbackName);
      try {
        const response = await fetch("/api/user/sync", { method: "POST" });
        if (!response.ok) return;
        const profile = (await response.json()) as { displayName?: string | null; bio?: string | null };
        setDisplayName(profile.displayName || fallbackName);
        setBio(profile.bio || "");
      } catch (loadError) {
        console.error("Could not load profile:", loadError);
      }
    });
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = window.localStorage.getItem("workspace_prefs");
        if (stored) setPreferences({ ...defaultPreferences, ...JSON.parse(stored) as Partial<Preferences> });
        setSelectedMic(window.localStorage.getItem("preferred_mic_id") || "");
        setSelectedCamera(window.localStorage.getItem("preferred_cam_id") || "");
      } catch {
        // Invalid local preferences fall back to safe defaults.
      }
    });
  }, []);

  const loadDevices = async () => {
    setLoadingDevices(true);
    setError(null);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((device) => device.kind === "audioinput");
      const videoInputs = devices.filter((device) => device.kind === "videoinput");
      setMics(audioInputs);
      setCameras(videoInputs);
      setSelectedMic((current) => current || audioInputs[0]?.deviceId || "");
      setSelectedCamera((current) => current || videoInputs[0]?.deviceId || "");
      setDiagnostic(`${audioInputs.length} microphone${audioInputs.length === 1 ? "" : "s"} and ${videoInputs.length} camera${videoInputs.length === 1 ? "" : "s"} detected. WebRTC is ${window.RTCPeerConnection ? "available" : "not available"}.`);
    } catch (deviceError) {
      setError(deviceError instanceof Error ? deviceError.message : "Could not inspect media devices");
    } finally {
      setLoadingDevices(false);
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) return setError("Display name is required.");
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim(), bio: bio.trim() }),
      });
      if (!response.ok) throw new Error("Could not save your profile");
      setMessage("Profile saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof Preferences) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    window.localStorage.setItem("workspace_prefs", JSON.stringify(next));
  };

  const updateDevice = (kind: "mic" | "camera", value: string) => {
    if (kind === "mic") {
      setSelectedMic(value);
      window.localStorage.setItem("preferred_mic_id", value);
    } else {
      setSelectedCamera(value);
      window.localStorage.setItem("preferred_cam_id", value);
    }
  };

  if (!isLoaded) return <div className="mx-auto max-w-4xl p-8"><div className="h-72 animate-pulse rounded-2xl bg-card" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-5 md:p-8">
      <header><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Preferences</p><h1 className="mt-2 text-2xl font-semibold text-text-primary">Settings</h1><p className="mt-1 text-sm text-text-muted">Manage your identity, appearance, notifications, and call devices.</p></header>

      {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"}`}>{error || message}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-center gap-3 border-b border-border pb-5"><div className="relative size-12 overflow-hidden rounded-2xl border border-border bg-bg-secondary">{user?.imageUrl ? <Image src={user.imageUrl} alt="" fill className="object-cover" /> : <div className="grid size-full place-items-center text-accent"><UserRound className="size-5" /></div>}</div><div><h2 className="text-sm font-semibold text-text-primary">Profile</h2><p className="text-xs text-text-muted">Shown to people you message and call.</p></div></div>
          <div className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-xs font-medium text-text-secondary">Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} className="input text-sm" /></label><label className="block"><span className="mb-2 block text-xs font-medium text-text-secondary">Bio</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={4} placeholder="What are you working on?" className="input resize-none text-sm" /></label><button disabled={saving} className="btn-primary px-5 py-2.5 text-sm">{saving ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}Save profile</button></div>
        </form>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold text-text-primary">Appearance</h2><p className="mt-1 text-xs text-text-muted">Choose how Sync Space looks.</p><div className="mt-4 grid grid-cols-2 gap-2">{(["dark", "light"] as const).map((mode) => <button key={mode} type="button" onClick={() => setTheme(mode)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium capitalize transition ${resolvedTheme === mode ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-secondary hover:bg-card-hover"}`}>{mode === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}{mode}</button>)}</div></section>
          <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold text-text-primary">Notifications</h2><div className="mt-3 divide-y divide-border">{([{ key: "soundAlerts", label: "Sound alerts" }, { key: "desktopNotifications", label: "Desktop notifications" }, { key: "doNotDisturb", label: "Do not disturb" }] as const).map((item) => <div key={item.key} className="flex items-center justify-between py-3"><span className="text-xs text-text-secondary">{item.label}</span><button type="button" role="switch" aria-checked={preferences[item.key]} onClick={() => updatePreference(item.key)} className={`relative h-6 w-10 rounded-full transition ${preferences[item.key] ? "bg-accent" : "bg-card-hover"}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition ${preferences[item.key] ? "left-5" : "left-1"}`} /></button></div>)}</div></section>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Laptop className="size-4 text-accent" /><h2 className="text-sm font-semibold text-text-primary">Call devices</h2></div><p className="mt-1 text-xs text-text-muted">Device labels may stay generic until browser permission is granted in a call.</p></div><button type="button" onClick={loadDevices} disabled={loadingDevices} className="btn-secondary px-4 py-2 text-xs"><RefreshCw className={`size-3.5 ${loadingDevices ? "animate-spin" : ""}`} />Check devices</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label><span className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary"><Mic className="size-3.5" />Microphone</span><select value={selectedMic} onChange={(event) => updateDevice("mic", event.target.value)} className="input text-sm"><option value="">System default</option>{mics.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}</select></label><label><span className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary"><Video className="size-3.5" />Camera</span><select value={selectedCamera} onChange={(event) => updateDevice("camera", event.target.value)} className="input text-sm"><option value="">System default</option>{cameras.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></label></div>{diagnostic && <p className="mt-4 rounded-xl bg-bg-secondary px-3 py-2 text-xs text-text-muted">{diagnostic}</p>}</section>
    </div>
  );
}
