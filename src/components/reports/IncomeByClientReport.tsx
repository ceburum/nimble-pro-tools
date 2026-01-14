import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClientTransactionDialog } from './ClientTransactionDialog';
import { useClients } from '@/hooks/useClients';
import { ChevronRight } from 'lucide-react';

interface ClientIncome {
  name: string;
  totalPaid: number;
  totalInvoiced: number;
  outstanding: number;
  clientId?: string;
}

interface IncomeByClientReportProps {
  data: ClientIncome[];
}

export function IncomeByClientReport({ data }: IncomeByClientReportProps) {
  const { clients } = useClients();
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Enrich data with client IDs
  const enrichedData = data.map(item => {
    const client = clients.find(c => c.name === item.name);
    return { ...item, clientId: client?.id };
  });

  const chartData = enrichedData.slice(0, 10).map((client) => ({
    name: client.name.length > 15 ? client.name.substring(0, 15) + '...' : client.name,
    paid: client.totalPaid,
    outstanding: client.outstanding,
  }));

  const totals = enrichedData.reduce(
    (acc, client) => ({
      totalPaid: acc.totalPaid + client.totalPaid,
      totalInvoiced: acc.totalInvoiced + client.totalInvoiced,
      outstanding: acc.outstanding + client.outstanding,
    }),
    { totalPaid: 0, totalInvoiced: 0, outstanding: 0 }
  );

  const handleClientClick = (clientName: string, clientId?: string) => {
    if (clientId) {
      setSelectedClient({ id: clientId, name: clientName });
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-semibold text-success">${totals.totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Invoiced</p>
            <p className="text-2xl font-semibold">${totals.totalInvoiced.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-semibold text-warning">${totals.outstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue by Client (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                    className="fill-muted-foreground"
                  />
                  <YAxis fontSize={12} className="fill-muted-foreground" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="paid" fill="hsl(var(--success))" name="Paid" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" fill="hsl(var(--warning))" name="Outstanding" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table - Now with clickable rows */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Client Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">Click a client to view their transaction history</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Total Invoiced</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedData.map((client, index) => (
                <TableRow 
                  key={index}
                  className={client.clientId ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}
                  onClick={() => handleClientClick(client.name, client.clientId)}
                >
                  <TableCell className="font-medium text-primary">{client.name}</TableCell>
                  <TableCell className="text-right">${client.totalInvoiced.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-success">${client.totalPaid.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-warning">${client.outstanding.toLocaleString()}</TableCell>
                  <TableCell>
                    {client.clientId && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </TableCell>
                </TableRow>
              ))}
              {enrichedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No invoice data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Transaction Dialog */}
      {selectedClient && (
        <ClientTransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      )}
    </div>
  );
}
