import Link from "next/link";
import {
  ArrowUpRight,
  AudioLines,
  CalendarDays,
  Check,
  MessageSquareText,
  MonitorUp,
  Phone,
  Shield,
  UserRoundPlus,
  Video,
} from "lucide-react";

const capabilities = [
  {
    number: "01",
    icon: MessageSquareText,
    title: "Messages that arrive immediately",
    text: "Send direct messages and files without waiting for the next page refresh. Unread state follows the conversation.",
  },
  {
    number: "02",
    icon: Phone,
    title: "Calls inside the conversation",
    text: "Start voice or video with the person you are already talking to. No separate invite workflow is required.",
  },
  {
    number: "03",
    icon: CalendarDays,
    title: "Rooms for planned work",
    text: "Create a room now, schedule one for later, or join directly with a code. Hosts control entry and room access.",
  },
];

function BrandMark() {
  return (
    <span className="grid size-9 place-items-center rounded-md bg-[#202421] text-[#f4f1e9]">
      <AudioLines className="size-4" strokeWidth={2.2} />
    </span>
  );
}

function ProductFlow() {
  return (
    <div className="border border-[#cbc6bb] bg-[#ece8df] p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-[#cbc6bb] pb-4">
        <div>
          <p className="text-xs font-semibold text-[#252925]">A normal workday</p>
          <p className="mt-1 text-[11px] text-[#727169]">One thread, three ways to continue</p>
        </div>
        <span className="font-mono text-[10px] text-[#727169]">SYNC SPACE / 09:42</span>
      </div>

      <div className="grid gap-px bg-[#cbc6bb] sm:grid-cols-3">
        {[
          { icon: MessageSquareText, label: "Message", time: "09:42", title: "Clarify the idea while the context is fresh." },
          { icon: Video, label: "Call", time: "09:44", title: "Move to voice or video with one action." },
          { icon: MonitorUp, label: "Share", time: "09:46", title: "Show the screen and resolve it together." },
        ].map(({ icon: Icon, label, time, title }) => (
          <article key={label} className="bg-[#f7f4ed] p-5 sm:min-h-56">
            <div className="flex items-start justify-between">
              <span className="grid size-8 place-items-center rounded-full border border-[#cbc6bb] text-[#4b514b]"><Icon className="size-3.5" /></span>
              <span className="font-mono text-[9px] text-[#8b887f]">{time}</span>
            </div>
            <p className="mt-9 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a4d3e]">{label}</p>
            <h3 className="mt-2 text-lg font-semibold leading-snug text-[#202421]">{title}</h3>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f4f1e9] text-[#202421] selection:bg-[#c7b3a8]">
      <nav className="border-b border-[#d4cfc4]">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Sync Space home">
            <BrandMark />
            <span className="text-sm font-semibold tracking-[-0.02em]">Sync Space</span>
          </Link>
          <div className="hidden items-center gap-8 text-xs text-[#686961] md:flex">
            <a href="#product" className="hover:text-[#202421]">Product</a>
            <a href="#capabilities" className="hover:text-[#202421]">Capabilities</a>
            <a href="#access" className="hover:text-[#202421]">Access</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in?redirect_url=/dashboard" className="px-3 py-2 text-xs font-medium text-[#555851] hover:text-[#202421]">Sign in</Link>
            <Link href="/dashboard" className="flex items-center gap-2 rounded-md bg-[#202421] px-4 py-2.5 text-xs font-semibold text-[#f7f4ed] hover:bg-[#343934]">
              Open workspace <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[#8a4d3e]">Messages · calls · meetings</p>
            <h1 className="max-w-4xl text-[clamp(3.2rem,7vw,6.4rem)] font-semibold leading-[0.94] tracking-[-0.06em]">Keep the conversation in one place.</h1>
          </div>
          <div className="border-l border-[#c7c1b5] pl-6 lg:pb-1">
            <p className="max-w-md text-base leading-7 text-[#5d6059]">Sync Space brings direct messages, voice, video, screen sharing, and scheduled rooms into the same workspace.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/sign-up" className="flex items-center gap-2 rounded-md bg-[#a55240] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8e4637]">Create an account <ArrowUpRight className="size-4" /></Link>
              <a href="#product" className="rounded-md border border-[#bdb7ab] px-5 py-3 text-sm font-medium hover:bg-[#ebe6dc]">See how it works</a>
            </div>
          </div>
        </div>
        <div id="product" className="mt-16 sm:mt-24"><ProductFlow /></div>
      </section>

      <section id="capabilities" className="border-y border-[#d4cfc4] bg-[#ebe7dd]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a4d3e]">What is actually included</p>
              <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-[-0.04em]">Built around real communication, not another dashboard.</h2>
            </div>
            <div className="border-t border-[#c7c1b5]">
              {capabilities.map(({ number, icon: Icon, title, text }) => (
                <article key={number} className="grid gap-5 border-b border-[#c7c1b5] py-7 sm:grid-cols-[42px_42px_1fr] sm:items-start">
                  <span className="font-mono text-[10px] text-[#8b887f]">{number}</span>
                  <Icon className="size-5 text-[#555b54]" strokeWidth={1.7} />
                  <div><h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[#64665f]">{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-px bg-[#c7c1b5] px-5 py-20 sm:px-8 sm:py-24 md:grid-cols-3">
        {[
          { icon: UserRoundPlus, title: "People", text: "Add collaborators, see presence, start a direct thread, or call them from the same profile." },
          { icon: Shield, title: "Room controls", text: "Use a room password, require host approval, and end the room for everyone when the work is done." },
          { icon: Check, title: "Call controls", text: "Choose microphone and camera, mute, stop video, share a screen, leave, or end the call." },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="bg-[#f4f1e9] p-6 sm:p-8">
            <Icon className="size-5 text-[#8a4d3e]" strokeWidth={1.8} />
            <h3 className="mt-12 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#666861]">{text}</p>
          </article>
        ))}
      </section>

      <section id="access" className="bg-[#202421] text-[#f3efe6]">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 px-5 py-16 sm:px-8 md:flex-row md:items-end md:py-20">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#bda99d]">Your workspace</p><h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Start with a message. Call when words are not enough.</h2></div>
          <Link href="/sign-up" className="flex w-fit shrink-0 items-center gap-2 rounded-md bg-[#f3efe6] px-5 py-3 text-sm font-semibold text-[#202421] hover:bg-white">Get started <ArrowUpRight className="size-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-[#353a35] bg-[#202421] text-[#9d9e96]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="flex items-center gap-2 text-[#f3efe6]"><BrandMark /> Sync Space</span>
          <span>Direct messages, voice, video, and rooms.</span>
        </div>
      </footer>
    </main>
  );
}
