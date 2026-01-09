import { FileText, Receipt, DollarSign, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
interface Activity {
  id: string;
  type: 'quote' | 'invoice' | 'payment' | 'client';
  title: string;
  description: string;
  time: string;
}
const activities: Activity[] = [{
  id: '1',
  type: 'payment',
  title: 'Payment received',
  description: 'Sarah Johnson paid INV-2024-001',
  time: '2 hours ago'
}, {
  id: '2',
  type: 'invoice',
  title: 'Invoice sent',
  description: 'INV-2024-002 sent to Mike Williams',
  time: '5 hours ago'
}, {
  id: '3',
  type: 'quote',
  title: 'Quote accepted',
  description: 'Bathroom Remodel quote accepted',
  time: 'Yesterday'
}, {
  id: '4',
  type: 'client',
  title: 'New client added',
  description: 'Mike Williams added to contacts',
  time: '2 days ago'
}];
const iconMap = {
  quote: FileText,
  invoice: Receipt,
  payment: DollarSign,
  client: UserPlus
};
const colorMap = {
  quote: 'bg-primary/10 text-primary',
  invoice: 'bg-accent/10 text-accent',
  payment: 'bg-success/10 text-success',
  client: 'bg-secondary text-secondary-foreground'
};
export function RecentActivity() {
  return <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map(activity => {
        const Icon = iconMap[activity.type];
        return <div key={activity.id} className="flex items-start gap-4">
              <div className={cn("p-2 rounded-lg shrink-0", colorMap[activity.type])}>
                <Icon className="w-[35px] h-[35px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>;
      })}
      </div>
    </div>;
}