"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare,
  Video,
  Shield,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Users,
  Bot,
  ChevronDown,
  Play,
  Star,
  Check,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";

// ─── Animated Background ────────────────────
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#09090b]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--text-muted) 1px, transparent 1px),
            linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}

// ─── Floating Particles ─────────────────────
function Particles() {
  return null;
}

// ─── Navbar ─────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--gradient-accent)" }}
            >
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-accent" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Sync<span className="text-gradient">Space</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {["Features", "Meetings", "AI", "Security"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="btn-ghost text-sm"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="btn-ghost p-2"
              id="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          )}

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="btn-ghost text-sm" id="sign-in-nav">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-primary text-sm" id="sign-up-nav">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/dashboard" className="btn-primary text-sm" id="go-to-dashboard">
              Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Show>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Feature Card ───────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className="glass-card p-6 group cursor-default"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: gradient }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </motion.div>
  );
}

// ─── Stat Card ──────────────────────────────
function StatCard({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{value}</div>
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
    </motion.div>
  );
}

// ─── Main Landing Page ──────────────────────
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Particles />
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: "var(--accent-subtle)",
              border: "1px solid var(--accent-glow)",
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>
              AI-Powered Communication Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6"
          >
            Where Teams
            <br />
            <span className="text-gradient">Sync & Thrive</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Messaging, video calls, and AI meeting intelligence — all in one
            beautifully designed platform. Built for teams that move fast.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="btn-primary text-base px-8 py-3" id="hero-get-started">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="btn-primary text-base px-8 py-3"
                id="hero-dashboard"
              >
                Open Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Show>
            <button className="btn-secondary text-base px-8 py-3 group" id="hero-demo">
              <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Watch Demo
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-12"
            style={{ color: "var(--text-muted)" }}
          >
            <div className="flex items-center gap-1.5 text-sm">
              <Shield className="w-4 h-4" />
              End-to-end encrypted
            </div>
            <div className="w-1 h-1 rounded-full" style={{ background: "var(--border-color)" }} />
            <div className="flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4" />
              Sub-100ms latency
            </div>
            <div className="w-1 h-1 rounded-full hidden sm:block" style={{ background: "var(--border-color)" }} />
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <Globe className="w-4 h-4" />
              99.99% uptime
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="relative z-10 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--gradient-surface)",
              border: "1px solid var(--border-color)",
              boxShadow:
                "0 0 80px var(--accent-glow), 0 25px 50px rgba(0,0,0,0.4)",
            }}
          >
            {/* Fake browser chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28ca42]" />
              </div>
              <div
                className="flex-1 mx-12 py-1.5 rounded-lg text-xs text-center"
                style={{
                  background: "var(--background-secondary)",
                  color: "var(--text-muted)",
                }}
              >
                app.syncspace.io/dashboard
              </div>
            </div>

            {/* Mock Dashboard */}
            <div className="flex min-h-[500px]">
              {/* Sidebar Mock */}
              <div
                className="w-64 p-4 hidden md:flex flex-col gap-1"
                style={{ borderRight: "1px solid var(--border-color)" }}
              >
                <div className="flex items-center gap-3 px-3 py-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--gradient-accent)" }}
                  >
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold">Sync Space</span>
                </div>
                {[
                  { label: "Dashboard", active: true },
                  { label: "Messages", badge: "3" },
                  { label: "Meetings" },
                  { label: "Files" },
                  { label: "Settings" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: item.active ? "var(--sidebar-active)" : "transparent",
                      color: item.active ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    {item.label}
                    {item.badge && <span className="badge">{item.badge}</span>}
                  </div>
                ))}

                <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <p className="px-3 text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                    DIRECT MESSAGES
                  </p>
                  {["Alex Chen", "Sarah Kim", "Team Design"].map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{
                          background: "var(--accent-subtle)",
                          color: "var(--accent)",
                        }}
                      >
                        {name[0]}
                      </div>
                      {name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Mock */}
              <div className="flex-1 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-1">Good morning, Mrigank 👋</h2>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    You have 2 meetings today and 5 unread messages
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Active Chats", value: "12", color: "var(--accent)" },
                    { label: "Meetings Today", value: "2", color: "var(--cyan)" },
                    { label: "AI Summaries", value: "8", color: "var(--success)" },
                    { label: "Files Shared", value: "34", color: "var(--warning)" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl"
                      style={{
                        background: "var(--background-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        className="text-2xl font-bold mb-1"
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity Mock */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--background-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <h3 className="text-sm font-semibold mb-3">Upcoming Meetings</h3>
                  {[
                    {
                      title: "Design Review",
                      time: "10:00 AM",
                      participants: 4,
                      color: "var(--accent)",
                    },
                    {
                      title: "Sprint Planning",
                      time: "2:00 PM",
                      participants: 8,
                      color: "var(--cyan)",
                    },
                  ].map((meeting) => (
                    <div
                      key={meeting.title}
                      className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{ background: meeting.color }}
                        />
                        <div>
                          <div className="text-sm font-medium">{meeting.title}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {meeting.time} · {meeting.participants} participants
                          </div>
                        </div>
                      </div>
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: "var(--accent-subtle)",
                          color: "var(--accent)",
                        }}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="relative z-10 px-6 py-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need,
              <br />
              <span className="text-gradient">nothing you don&apos;t</span>
            </h2>
            <p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              One platform for messaging, meetings, and AI-powered collaboration.
              No more switching between apps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={MessageSquare}
              title="Real-Time Messaging"
              description="Direct messages, group chats, reactions, file sharing, and rich previews. Communication that flows naturally."
              gradient="linear-gradient(135deg, #7c5cfc, #9178ff)"
              delay={0}
            />
            <FeatureCard
              icon={Video}
              title="HD Video & Voice"
              description="Crystal-clear video calls with screen sharing, virtual backgrounds, and smart noise cancellation."
              gradient="linear-gradient(135deg, #38bdf8, #06b6d4)"
              delay={0.1}
            />
            <FeatureCard
              icon={Bot}
              title="AI Meeting Assistant"
              description="Live transcription, smart summaries, action items, and an AI copilot that answers questions during meetings."
              gradient="linear-gradient(135deg, #34d399, #10b981)"
              delay={0.2}
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="End-to-end encryption, SSO, role-based access, and audit logs. Your data stays yours."
              gradient="linear-gradient(135deg, #f97316, #ef4444)"
              delay={0.3}
            />
            <FeatureCard
              icon={Users}
              title="Community Spaces"
              description="Create public or private spaces, build communities, and foster engagement with activity feeds."
              gradient="linear-gradient(135deg, #ec4899, #a855f7)"
              delay={0.4}
            />
            <FeatureCard
              icon={Sparkles}
              title="AI-First Design"
              description="Smart meeting suggestions, mood-aware rooms, relationship graphs, and debate moderation — all powered by AI."
              gradient="linear-gradient(135deg, #fbbf24, #f97316)"
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="relative z-10 px-6 py-24">
        <div
          className="max-w-5xl mx-auto rounded-2xl p-12 md:p-16"
          style={{
            background: "var(--gradient-surface)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="99.9%" label="Uptime SLA" delay={0} />
            <StatCard value="<50ms" label="Message Latency" delay={0.1} />
            <StatCard value="256-bit" label="Encryption" delay={0.2} />
            <StatCard value="∞" label="Meeting Minutes" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── Pricing / CTA Section ── */}
      <section className="relative z-10 px-6 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to{" "}
              <span className="text-gradient">transform</span>
              <br />
              how your team communicates?
            </h2>
            <p
              className="text-lg max-w-xl mx-auto mb-10"
              style={{ color: "var(--text-secondary)" }}
            >
              Join thousands of teams already using Sync Space. Free to start,
              powerful enough to scale.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <button
                    className="btn-primary text-base px-8 py-3"
                    id="cta-get-started"
                  >
                    Start for Free
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="btn-primary text-base px-8 py-3"
                  id="cta-dashboard"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Show>
            </div>

            {/* Features checklist */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {[
                "Unlimited messages",
                "Video calls up to 50 people",
                "AI meeting summaries",
                "10GB file storage",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Check
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "var(--success)" }}
                  />
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 px-6 py-12"
        style={{ borderTop: "1px solid var(--border-color)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gradient-accent)" }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">Sync Space</span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Status", "Blog"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm transition-colors hover:text-[var(--text-primary)]"
                style={{ color: "var(--text-muted)" }}
              >
                {link}
              </a>
            ))}
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            © 2026 Sync Space. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
