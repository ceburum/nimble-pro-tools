import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  href?: string;
}
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  href
}: StatCardProps) {
  const iconVariants = {
    default: 'bg-secondary text-secondary-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-accent/10 text-accent',
    danger: 'bg-destructive/10 text-destructive'
  };
  const content = <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-muted-foreground text-center text-xl font-bold">{title}</p>
        <p className="text-3xl text-card-foreground font-extrabold font-sans">{value}</p>
        {trend && <p className={cn("text-sm font-medium", trend.isPositive ? "text-success" : "text-destructive")}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
          </p>}
      </div>
      <div className={cn("p-3 rounded-lg", iconVariants[variant])}>
        <Icon className="h-6 w-6" />
      </div>
    </div>;
  if (href) {
    return <Link to={href} className="block bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer">
        {content}
      </Link>;
  }
  return <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      {content}
    </div>;
}