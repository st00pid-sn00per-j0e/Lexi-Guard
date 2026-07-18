import { Logo } from '@/components/logo';
import { SphereAnimation } from '@/components/sphere-animation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto grid w-[350px] gap-6 bg-card/80 p-8 rounded-lg backdrop-blur-sm">
          <div className="grid gap-2 text-center">
            <Logo className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold font-headline">Welcome to LexiGuard</h1>
            <p className="text-balance text-muted-foreground">
              Your AI-powered partner in contract management
            </p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center relative overflow-hidden">
        <SphereAnimation />
      </div>
    </div>
  );
}
