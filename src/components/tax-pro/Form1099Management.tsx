import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { use1099Tracking, THRESHOLD_1099 } from '@/hooks/use1099Tracking';
import { useSubcontractorPayments } from '@/hooks/useSubcontractorPayments';
import { ClientTaxDetailsDialog } from './ClientTaxDetailsDialog';
import { TaxDisclaimer } from './TaxDisclaimer';
import { AlertTriangle, CheckCircle2, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Form1099ManagementProps {
  selectedYear: number;
}

// Cache for masked TINs to avoid repeated API calls
const maskedTinCache = new Map<string, string>();

export function Form1099Management({ selectedYear }: Form1099ManagementProps) {
  const { 
    clients, 
    eligible1099Clients, 
    loading, 
    update1099Info, 
    refresh 
  } = use1099Tracking();
  const { getTotalByClient } = useSubcontractorPayments();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [maskedTins, setMaskedTins] = useState<Record<string, string>>({});

  // Fetch masked TINs for eligible clients
  useEffect(() => {
    const fetchMaskedTins = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const clientsToCheck = eligible1099Clients.filter(c => !maskedTinCache.has(c.id));
      
      for (const client of clientsToCheck) {
        try {
          const { data, error } = await supabase.functions.invoke('manage-tin', {
            body: { action: 'check', clientId: client.id },
          });
          
          if (!error && data?.hasTin) {
            maskedTinCache.set(client.id, data.masked);
          } else {
            maskedTinCache.set(client.id, '---');
          }
        } catch {
          maskedTinCache.set(client.id, '---');
        }
      }

      // Build new state from cache
      const newMaskedTins: Record<string, string> = {};
      eligible1099Clients.forEach(c => {
        newMaskedTins[c.id] = maskedTinCache.get(c.id) || '---';
      });
      setMaskedTins(newMaskedTins);
    };

    if (eligible1099Clients.length > 0) {
      fetchMaskedTins();
    }
  }, [eligible1099Clients]);

  const getMaskedTin = (clientId: string): string => {
    return maskedTins[clientId] || '---';
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleEditClient = (clientId: string) => {
    setSelectedClient(clientId);
    setDialogOpen(true);
  };

  const handleSave = async (updates: Parameters<typeof update1099Info>[1]) => {
    if (!selectedClient) return;
    
    const success = await update1099Info(selectedClient, updates);
    if (success) {
      toast.success('1099 information updated');
      setDialogOpen(false);
      refresh();
    } else {
      toast.error('Failed to update 1099 information');
    }
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Group clients by threshold status
  const clientsWithPayments = clients.map(client => {
    const total = getTotalByClient(client.id, selectedYear);
    return {
      client,
      totalPayments: total,
      meetsThreshold: total >= THRESHOLD_1099,
      approaching: total >= THRESHOLD_1099 * 0.8 && total < THRESHOLD_1099,
      progress: Math.min((total / THRESHOLD_1099) * 100, 100)
    };
  }).filter(c => c.client.is1099Eligible || c.client.isSubcontractor || c.totalPayments > 0);

  const meetingThreshold = clientsWithPayments.filter(c => c.meetsThreshold);
  const approachingThreshold = clientsWithPayments.filter(c => c.approaching);

  return (
    <div className="space-y-6">
      <TaxDisclaimer variant="card" />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Eligible Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eligible1099Clients.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Meets $600 Threshold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{meetingThreshold.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Approaching Threshold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{approachingThreshold.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">1099-Eligible Clients & Subcontractors</h3>
        
        {clientsWithPayments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No 1099-eligible clients or subcontractors found.</p>
              <p className="text-sm mt-2">Mark clients as 1099-eligible or subcontractors to track payments.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {clientsWithPayments.map(({ client, totalPayments, meetsThreshold, approaching, progress }) => (
              <Card key={client.id} className={meetsThreshold ? 'border-green-200 dark:border-green-800' : approaching ? 'border-amber-200 dark:border-amber-800' : ''}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{client.legalName || client.name}</h4>
                        {client.isSubcontractor && (
                          <Badge variant="secondary" className="text-xs">Subcontractor</Badge>
                        )}
                        {client.is1099Eligible && (
                          <Badge variant="outline" className="text-xs">1099 Eligible</Badge>
                        )}
                        {meetsThreshold && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                            1099 Required
                          </Badge>
                        )}
                        {approaching && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs">
                            Approaching
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        TIN: {getMaskedTin(client.id)} • {client.email}
                      </div>
                      
                      {/* Progress toward threshold */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>YTD Payments</span>
                          <span className="font-medium">{formatCurrency(totalPayments)} / {formatCurrency(THRESHOLD_1099)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={() => handleEditClient(client.id)}>
                      Edit Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All Clients Section - to mark new ones as eligible */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">All Clients</h3>
        <p className="text-sm text-muted-foreground">Click a client to mark as 1099-eligible or subcontractor.</p>
        
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {clients.filter(c => !c.is1099Eligible && !c.isSubcontractor).map(client => (
            <Card key={client.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleEditClient(client.id)}>
              <CardContent className="py-3">
                <div className="font-medium text-sm">{client.name}</div>
                <div className="text-xs text-muted-foreground">{client.email}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <ClientTaxDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClientData || null}
        onSave={handleSave}
      />
    </div>
  );
}
