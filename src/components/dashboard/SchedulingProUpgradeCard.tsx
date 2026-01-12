import { Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function SchedulingProUpgradeCard() {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Scheduling Pro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Unlock calendar management, arrival windows, and automatic client notifications.
        </p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Visual calendar with job scheduling</li>
          <li>• Arrival time windows for clients</li>
          <li>• Branded email notifications</li>
          <li>• Add to Calendar integration</li>
        </ul>
        <Button 
          onClick={() => navigate('/scheduling')} 
          className="w-full mt-2"
          size="sm"
        >
          Upgrade to Scheduling Pro
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
