import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useProfessions } from '@/hooks/useProfessions';
import type { Profession } from '@/types/profession';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { cn } from '@/lib/utils';

interface ProfessionSelectorProps {
  businessType: 'mobile_job' | 'stationary_appointment';
  selectedProfession: string | null;
  onSelect: (profession: Profession) => void;
}

export function ProfessionSelector({ 
  businessType, 
  selectedProfession, 
  onSelect 
}: ProfessionSelectorProps) {
  const { data: professions = [], isLoading } = useProfessions({ businessType });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {professions.map(profession => (
          <Card
            key={profession.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              selectedProfession === profession.id && "border-primary bg-primary/5"
            )}
            onClick={() => onSelect(profession)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DynamicIcon 
                    name={profession.icon} 
                    className="h-5 w-5 text-primary" 
                  />
                </div>
                <CardTitle className="text-base">{profession.display_name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {profession.description}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Other / Custom option */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            selectedProfession === 'other' && "border-primary bg-primary/5"
          )}
          onClick={() => onSelect({ 
            id: 'other', 
            slug: 'other', 
            display_name: 'Other / Custom',
            icon: 'FileText',
            description: 'Start with a blank slate and customize everything',
            business_type: businessType,
            is_active: true,
            setup_order: 999,
            created_at: '',
            updated_at: '',
          })}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <DynamicIcon name="FileText" className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-base">Other / Custom</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start with a blank slate and customize everything
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
