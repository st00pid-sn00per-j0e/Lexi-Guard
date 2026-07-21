import { Logo } from '@/components/logo';
import { SphereAnimation } from '@/components/sphere-animation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 relative">
      {/* Universal Theme Toggle at Top Corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-background/50 backdrop-blur-sm animate-in fade-in slide-in-from-left-8 duration-700">
        <div className="mx-auto grid w-[350px] gap-6 bg-card/80 p-8 rounded-lg backdrop-blur-sm border border-border/40 shadow-xl shadow-black/10 hover:shadow-black/20 hover:border-primary/30 transition-all duration-300">
          <div className="grid gap-2 text-center">
            <Logo className="mx-auto mb-4 hover:scale-105 transition-transform" />
            <h1 className="text-3xl font-bold font-headline text-foreground">Welcome to LexiGuard</h1>
            <p className="text-balance text-muted-foreground text-sm">
              Your AI-powered partner in contract management
            </p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center relative overflow-hidden animate-in fade-in duration-1000">
        <SphereAnimation />
      </div>
    </div>
  );
}
