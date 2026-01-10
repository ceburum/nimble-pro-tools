import { useUserLogo } from '@/hooks/useUserLogo';
import cebLogo from '@/assets/ceb-logo.png';
import { Skeleton } from '@/components/ui/skeleton';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const { logoUrl, loading } = useUserLogo();
  
  const displayLogo = logoUrl || cebLogo;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        {loading ? (
          <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-xl flex-shrink-0" />
        ) : (
          <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-xl overflow-hidden shadow-lg bg-card border border-border flex-shrink-0">
            <img
              src={displayLogo}
              alt="Business logo"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      {action && <div className="sm:ml-auto">{action}</div>}
    </div>
  );
}
