import type { Metadata, Viewport } from "next";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { RestTimerProvider } from "@/lib/timer/rest-timer-context";
import { RestTimerBar } from "@/components/timer/rest-timer-bar";
import { DbInit } from "@/components/db-init";
import { PwaRegister } from "@/components/pwa-register";
import { CapacitorInit } from "@/components/capacitor-init";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { AuthGate } from "@/components/auth-gate";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fontDisplay = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fits — Strength Training Tracker",
  description:
    "An offline-first training log: log workouts, track lift progress, follow proven programs, and see how your strength compares.",
  applicationName: "Fits",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { url: "/icons/icon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: "/icons/icon-256.webp",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fits",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} h-full overflow-hidden antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-y-auto bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AuthProvider>
              <RestTimerProvider>
                <DbInit />
                <PwaRegister />
                <CapacitorInit />
                <AuthGate>{children}</AuthGate>
                <RestTimerBar />
                <Toaster position="top-center" richColors closeButton />
              </RestTimerProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
