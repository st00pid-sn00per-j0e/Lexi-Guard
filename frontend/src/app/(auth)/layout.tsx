import { Logo } from '@/components/logo';
import { SphereAnimation } from '@/components/sphere-animation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 relative bg-transparent">
      {/* Universal Theme Toggle at Top Corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-white/50 dark:bg-background/10 backdrop-blur-sm animate-in fade-in duration-700">
        <div className="mx-auto grid w-[350px] gap-6 bg-white/60 dark:bg-slate-950/40 p-8 rounded-xl backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:border-primary/30 transition-all duration-500">
          <div className="grid gap-2 text-center">
            <Logo className="mx-auto mb-4 hover:scale-105 transition-transform" />
            <h1 className="text-3xl font-bold font-headline text-foreground">Welcome to LexiGuard</h1>
            <p className="text-balance text-muted-foreground text-xs leading-relaxed">
              Your AI-powered partner in contract management
            </p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden bg-slate-500/5 dark:bg-slate-950/15 lg:flex items-center justify-center relative overflow-hidden animate-in fade-in duration-1000 border-l border-black/10 dark:border-white/10">
        <SphereAnimation />
      </div>
    </div>
  );
}
