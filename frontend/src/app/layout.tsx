import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'LexiGuard',
  description: 'AI-Powered Contract Analysis & Management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "font-body antialiased",
          "bg-background relative min-h-screen overflow-x-hidden"
        )}
      >
        {/* ===== ANIMATED BACKGROUND LAYER ===== */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Main shifting gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-purple-500/20 animate-gradient-shift" />

          {/* Floating colorful blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/30 blur-3xl animate-drift" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-accent/30 blur-3xl animate-drift animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-purple-500/20 blur-3xl animate-pulse-glow" />
          <div className="absolute top-[10%] right-[15%] w-[20rem] h-[20rem] rounded-full bg-pink-400/20 blur-3xl animate-float animation-delay-3000" />
          <div className="absolute bottom-[15%] left-[20%] w-[25rem] h-[25rem] rounded-full bg-cyan-400/20 blur-3xl animate-float animation-delay-4000" />

          {/* Subtle animated rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] border border-primary/10 rounded-full animate-spin-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] border border-accent/10 rounded-full animate-spin-slow animation-delay-1000" />

          {/* Shimmering horizontal lines for texture */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] animate-shimmer" />
        </div>

        {/* ===== MAIN CONTENT ===== */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}