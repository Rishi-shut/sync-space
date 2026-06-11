"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Check,
  Moon,
  Sun,
  ChevronRight,
  Lock,
  Clock,
  BarChart3,
  Layers,
  Workflow,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";

// ─── Ambient Glow Background ─────────────────
function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="landing-ambient-bg" />
      <div className="landing-glow-1" />
      <div className="landing-glow-2" />
      <div className="landing-glow-3" />
      <div className="landing-grid-overlay" />
    </div>
  );
}

// ─── Navbar ─────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "landing-nav-scrolled" : "landing-nav-top"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" id="nav-logo">
          <div className="landing-logo-icon">
            <Zap className="w-4 h-4" strokeWidth={2.5} style={{ color: "#fff" }} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Sync<span className="landing-logo-accent">Space</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {["Features", "AI", "Security", "About"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="landing-nav-link">
              {item}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="landing-icon-btn"
              id="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="landing-nav-link" id="sign-in-nav">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="landing-cta-btn" id="sign-up-nav">
                Get started
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/dashboard" className="landing-cta-btn" id="go-to-dashboard">
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Show>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Animated Counter ────────────────────────
function AnimatedStat({ value, label, suffix = "" }: { value: number | string; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          if (typeof value === "number") {
            let start = 0;
            const duration = 1800;
            const step = value / (duration / 16);
            const timer = setInterval(() => {
              start += step;
              if (start >= value) {
                setCount(value);
                clearInterval(timer);
              } else {
                setCount(Math.floor(start));
              }
            }, 16);
          }
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, started]);

  return (
    <div ref={ref} className="text-center">
      <div className="landing-stat-value">
        {typeof value === "number" ? count : value}
        {suffix}
      </div>
      <div className="landing-stat-label">{label}</div>
    </div>
  );
}

// ─── Feature Card ────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  accentColor,
  delay,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
  delay: number;
  badge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="landing-feature-card group"
    >
      {badge && <span className="landing-feature-badge">{badge}</span>}
      <div
        className="landing-feature-icon"
        style={{
          background: `${accentColor}18`,
          color: accentColor,
        }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{description}</p>
      <div className="landing-feature-arrow">
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.div>
  );
}

// ─── Dashboard Mockup ────────────────────────
function DashboardMockup() {
  return (
    <div className="landing-mockup-wrapper">
      {/* Browser chrome */}
      <div className="landing-mockup-chrome">
        <div className="landing-mockup-dots">
          <span className="landing-dot dot-red" />
          <span className="landing-dot dot-yellow" />
          <span className="landing-dot dot-green" />
        </div>
        <div className="landing-mockup-url">app.syncspace.io/dashboard</div>
        <div />
      </div>

      {/* Content */}
      <div className="landing-mockup-body">
        {/* Sidebar */}
        <div className="landing-mock-sidebar">
          <div className="mock-sidebar-logo">
            <div className="mock-logo-icon">
              <Zap className="w-3.5 h-3.5" style={{ color: "#fff" }} />
            </div>
            <span className="mock-logo-text">SyncSpace</span>
          </div>
          <div className="mock-nav-items">
            {[
              { label: "Dashboard", active: true },
              { label: "Messages", badge: "3" },
              { label: "Meetings" },
              { label: "Files" },
              { label: "Settings" },
            ].map((item) => (
              <div key={item.label} className={`mock-nav-item ${item.active ? "active" : ""}`}>
                {item.label}
                {item.badge && <span className="mock-nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
          <div className="mock-sidebar-footer">
            <p className="mock-dm-label">DIRECT MESSAGES</p>
            {["Alex Chen", "Sarah Kim", "Team Design"].map((name) => (
              <div key={name} className="mock-dm-item">
                <div className="mock-avatar">{name[0]}</div>
                <span>{name}</span>
                <span className="mock-dm-online" />
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="landing-mock-main">
          <div className="mock-greeting">
            <h2 className="mock-greeting-title">Good morning, Alex 👋</h2>
            <p className="mock-greeting-sub">You have 2 meetings today and 5 unread messages</p>
          </div>

          <div className="mock-stats-grid">
            {[
              { label: "Active Chats", value: "12", color: "#6366f1" },
              { label: "Meetings Today", value: "2", color: "#14b8a6" },
              { label: "AI Summaries", value: "8", color: "#22c55e" },
              { label: "Files Shared", value: "34", color: "#f59e0b" },
            ].map((stat) => (
              <div key={stat.label} className="mock-stat-card">
                <div className="mock-stat-value" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="mock-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mock-meetings-card">
            <h3 className="mock-meetings-title">Upcoming Meetings</h3>
            {[
              { title: "Design Review", time: "10:00 AM", count: 4, color: "#6366f1" },
              { title: "Sprint Planning", time: "2:00 PM", count: 8, color: "#14b8a6" },
            ].map((m) => (
              <div key={m.title} className="mock-meeting-row">
                <div className="mock-meeting-bar" style={{ background: m.color }} />
                <div className="mock-meeting-info">
                  <div className="mock-meeting-name">{m.title}</div>
                  <div className="mock-meeting-meta">{m.time} · {m.count} participants</div>
                </div>
                <button className="mock-join-btn" style={{ color: m.color }}>Join</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Testimonial Card ────────────────────────
function TestimonialCard({
  quote,
  name,
  role,
  company,
  delay,
}: {
  quote: string;
  name: string;
  role: string;
  company: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="landing-testimonial-card"
    >
      <div className="landing-testimonial-stars">
        {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
      </div>
      <p className="landing-testimonial-quote">&ldquo;{quote}&rdquo;</p>
      <div className="landing-testimonial-author">
        <div className="landing-testimonial-avatar">{name[0]}</div>
        <div>
          <div className="landing-testimonial-name">{name}</div>
          <div className="landing-testimonial-role">{role} · {company}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Landing Page ───────────────────────
export default function LandingPage() {
  return (
    <div className="relative min-h-screen landing-page">
      <AmbientBackground />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="landing-eyebrow"
          >
            <span className="landing-eyebrow-dot" />
            <span>AI-powered communication for modern teams</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="landing-headline"
          >
            The workspace where
            <br />
            <span className="landing-headline-accent">teams actually thrive</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="landing-subtitle"
          >
            Real-time messaging, HD video calls, and intelligent AI summaries — elegantly unified into one platform built for the way your team works.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"
          >
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="landing-hero-btn-primary" id="hero-get-started">
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="landing-hero-btn-primary" id="hero-dashboard">
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="landing-hero-btn-secondary" id="hero-sign-in">
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="landing-trust-bar"
          >
            <div className="landing-trust-item">
              <Shield className="w-3.5 h-3.5" />
              End-to-end encrypted
            </div>
            <div className="landing-trust-sep" />
            <div className="landing-trust-item">
              <Zap className="w-3.5 h-3.5" />
              Sub-50ms latency
            </div>
            <div className="landing-trust-sep" />
            <div className="landing-trust-item">
              <Globe className="w-3.5 h-3.5" />
              99.99% uptime
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="relative z-10 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-6xl mx-auto"
        >
          <DashboardMockup />
        </motion.div>
      </section>

      {/* ── Social Proof Stats ── */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="landing-stats-grid">
            <AnimatedStat value={99.9} label="Uptime SLA" suffix="%" />
            <AnimatedStat value={50} label="ms message latency" suffix="ms" />
            <AnimatedStat value="256-bit" label="Encryption standard" />
            <AnimatedStat value="∞" label="Meeting minutes" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="landing-section-header"
          >
            <div className="landing-section-tag">Features</div>
            <h2 className="landing-section-title">
              Everything your team needs,<br />
              <span className="landing-headline-accent">in one place</span>
            </h2>
            <p className="landing-section-sub">
              No more switching between tools. SyncSpace brings messaging, video, and AI together — with zero friction.
            </p>
          </motion.div>

          <div className="landing-features-grid">
            <FeatureCard
              icon={MessageSquare}
              title="Real-Time Messaging"
              description="Threaded conversations, rich reactions, file previews, and instant search across your entire message history."
              accentColor="#6366f1"
              delay={0}
            />
            <FeatureCard
              icon={Video}
              title="HD Video & Audio"
              description="Crystal-clear video calls with screen sharing, virtual backgrounds, and intelligent noise cancellation."
              accentColor="#14b8a6"
              delay={0.08}
            />
            <FeatureCard
              icon={Bot}
              title="AI Meeting Assistant"
              description="Live transcription, smart summaries, auto-generated action items, and an AI copilot ready for your questions."
              accentColor="#22c55e"
              badge="AI"
              delay={0.16}
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="End-to-end encryption, role-based access, SSO support, audit logs, and meeting password protection."
              accentColor="#f59e0b"
              delay={0.24}
            />
            <FeatureCard
              icon={Users}
              title="Collaboration Spaces"
              description="Public and private spaces for communities, departments, or projects — all with rich activity feeds."
              accentColor="#8b5cf6"
              delay={0.32}
            />
            <FeatureCard
              icon={Sparkles}
              title="Intelligent Automation"
              description="Smart scheduling, meeting suggestions, mood-aware notifications, and relationship graphs — all AI-powered."
              accentColor="#ec4899"
              badge="New"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* ── AI Section ── */}
      <section id="ai" className="relative z-10 px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <div className="landing-ai-section">
            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="landing-ai-text"
            >
              <div className="landing-section-tag">AI-Powered</div>
              <h2 className="landing-section-title" style={{ textAlign: "left", maxWidth: "none" }}>
                Your meetings,<br />
                <span className="landing-headline-accent">finally worth attending</span>
              </h2>
              <p className="landing-ai-desc">
                SyncSpace's built-in AI doesn't just transcribe — it understands. Catch up on any meeting in 30 seconds with smart summaries, never lose an action item again, and get answers mid-call from your AI copilot.
              </p>
              <ul className="landing-ai-list">
                {[
                  "Live, accurate transcription in 30+ languages",
                  "Auto-generated summaries & action items",
                  "AI answers questions about meeting content",
                  "Smart meeting scheduling suggestions",
                ].map((item) => (
                  <li key={item} className="landing-ai-list-item">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Visual card */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="landing-ai-card"
            >
              <div className="landing-ai-card-header">
                <div className="flex items-center gap-2">
                  <div className="landing-ai-icon">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="landing-ai-card-title">AI Summary</span>
                </div>
                <span className="landing-ai-card-tag">Live</span>
              </div>
              <div className="landing-ai-transcript">
                <div className="landing-transcript-line">
                  <span className="transcript-speaker">Alex</span>
                  <span>We need to finalize the launch timeline by Friday.</span>
                </div>
                <div className="landing-transcript-line">
                  <span className="transcript-speaker">Sarah</span>
                  <span>Marketing assets are ready, waiting on dev sign-off.</span>
                </div>
                <div className="landing-transcript-line">
                  <span className="transcript-speaker">Jordan</span>
                  <span>I can have the final review done by Thursday EOD.</span>
                </div>
              </div>
              <div className="landing-ai-actions">
                <h4 className="landing-ai-actions-title">Action Items Detected</h4>
                {[
                  { text: "Jordan: Final dev review — Thu EOD", done: false },
                  { text: "Alex: Confirm launch date with leadership", done: false },
                  { text: "Sarah: Send assets to Jordan", done: true },
                ].map((action, i) => (
                  <div key={i} className={`landing-ai-action-item ${action.done ? "done" : ""}`}>
                    <div className={`action-checkbox ${action.done ? "checked" : ""}`}>
                      {action.done && <Check className="w-2.5 h-2.5" />}
                    </div>
                    {action.text}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Security Section ── */}
      <section id="security" className="relative z-10 px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="landing-section-header"
          >
            <div className="landing-section-tag">Security</div>
            <h2 className="landing-section-title">
              Built for teams that<br />
              <span className="landing-headline-accent">take trust seriously</span>
            </h2>
            <p className="landing-section-sub">
              Every message, call, and file is protected at every layer. No compromises.
            </p>
          </motion.div>

          <div className="landing-security-grid">
            {[
              {
                icon: Lock,
                title: "End-to-End Encryption",
                desc: "All messages and calls are encrypted in transit and at rest using AES-256.",
                delay: 0,
              },
              {
                icon: Shield,
                title: "Password-Protected Meetings",
                desc: "Control exactly who enters your meetings with passwords and approval workflows.",
                delay: 0.1,
              },
              {
                icon: Users,
                title: "Role-Based Access",
                desc: "Granular permissions let you control who can see, edit, or share every resource.",
                delay: 0.2,
              },
              {
                icon: Clock,
                title: "Full Audit Logs",
                desc: "Every action is logged and traceable. Know exactly what happened and when.",
                delay: 0.3,
              },
              {
                icon: Globe,
                title: "Global Infrastructure",
                desc: "99.99% uptime backed by redundant multi-region infrastructure.",
                delay: 0.4,
              },
              {
                icon: BarChart3,
                title: "Compliance Ready",
                desc: "GDPR, SOC2, and HIPAA compliance controls to keep your org audit-ready.",
                delay: 0.5,
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: item.delay }}
                className="landing-security-card"
              >
                <div className="landing-security-icon">
                  <item.icon className="w-4 h-4" />
                </div>
                <h3 className="landing-security-title">{item.title}</h3>
                <p className="landing-security-desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative z-10 px-6 py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="landing-section-header"
          >
            <div className="landing-section-tag">Testimonials</div>
            <h2 className="landing-section-title">
              Loved by teams<br />
              <span className="landing-headline-accent">around the world</span>
            </h2>
          </motion.div>

          <div className="landing-testimonials-grid">
            <TestimonialCard
              quote="SyncSpace replaced 4 different tools for our team. The AI summaries alone save us hours every week."
              name="Priya Sharma"
              role="Engineering Lead"
              company="Veritas Tech"
              delay={0}
            />
            <TestimonialCard
              quote="The meeting room experience is genuinely the best I've used. Clean, fast, and the security controls are exactly what we needed."
              name="Marcus Webb"
              role="Head of Product"
              company="Fount Studio"
              delay={0.1}
            />
            <TestimonialCard
              quote="Switching from Slack + Zoom was scary, but onboarding took minutes. The interface is intuitive and beautiful."
              name="Yuki Tanaka"
              role="Operations Manager"
              company="Kira Labs"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="landing-cta-title">
            Ready to transform how<br />
            <span className="landing-headline-accent">your team communicates?</span>
          </h2>
          <p className="landing-cta-sub">
            Join thousands of teams using SyncSpace. Start for free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="landing-hero-btn-primary" id="cta-get-started">
                  Get started for free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="landing-hero-btn-secondary" id="cta-sign-in">
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="landing-hero-btn-primary" id="cta-dashboard">
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Show>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
            {["No credit card required", "Free to start", "Cancel anytime", "Up to 50 users free"].map((item) => (
              <span key={item} className="landing-cta-check">
                <Check className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 py-10 landing-footer">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="landing-logo-icon" style={{ width: "28px", height: "28px" }}>
              <Zap className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color: "#fff" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Sync<span className="landing-logo-accent">Space</span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Status", "Blog"].map((link) => (
              <a key={link} href="#" className="landing-footer-link">{link}</a>
            ))}
          </div>
          <p className="landing-footer-copy">© 2026 SyncSpace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
