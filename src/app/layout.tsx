import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ToastContainer from "@/components/ui/toast-container";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sync Space — Next-Gen Communication Platform",
  description:
    "AI-powered communication platform that combines messaging, video calls, and intelligent meeting tools. The future of team collaboration.",
  keywords: [
    "communication",
    "video calls",
    "messaging",
    "AI meetings",
    "collaboration",
    "team chat",
  ],
  authors: [{ name: "Sync Space" }],
  openGraph: {
    title: "Sync Space — Next-Gen Communication Platform",
    description:
      "AI-powered communication platform that combines messaging, video calls, and intelligent meeting tools.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#7c5cfc",
          colorBackground: "#0f1118",
          colorInputBackground: "#161925",
          colorInputText: "#f0f2f5",
          colorText: "#f0f2f5",
          colorTextSecondary: "#8b8fa3",
          borderRadius: "12px",
          fontSize: "14px",
        },
        elements: {
          formButtonPrimary:
            "bg-[#7c5cfc] hover:bg-[#9178ff] shadow-[0_0_30px_rgba(124,92,252,0.25)] transition-all duration-200",
          card: "bg-[#0f1118] border border-[#1e2235] shadow-2xl",
          headerTitle: "text-[#f0f2f5]",
          headerSubtitle: "text-[#8b8fa3]",
          socialButtonsBlockButton:
            "bg-[#161925] border-[#1e2235] text-[#f0f2f5] hover:bg-[#1e2235]",
          formFieldInput:
            "bg-[#161925] border-[#1e2235] text-[#f0f2f5] focus:border-[#7c5cfc] focus:ring-[#7c5cfc]/20",
          footerActionLink: "text-[#7c5cfc] hover:text-[#9178ff]",
          identityPreviewEditButton:
            "text-[#7c5cfc] hover:text-[#9178ff]",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen antialiased">
          <ThemeProvider>
            {children}
            <ToastContainer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
