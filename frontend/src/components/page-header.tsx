import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, className, children }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8",
        className
      )}
    >
      <h1 className="text-3xl font-bold tracking-tight font-headline">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
