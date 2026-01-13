import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Affiliate } from '@/hooks/useAffiliateAdmin';
import { format } from 'date-fns';
import { CheckCircle, XCircle, FileText, UserCheck } from 'lucide-react';

interface PendingApplicationsTableProps {
  applications: Affiliate[];
  onApprove: (affiliateId: string) => Promise<void>;
  onReject: (affiliateId: string, reason: string) => Promise<void>;
}

export function PendingApplicationsTable({ applications, onApprove, onReject }: PendingApplicationsTableProps) {
  const [viewDialog, setViewDialog] = useState<{ open: boolean; application: Affiliate | null }>({
    open: false,
    application: null,
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; affiliateId: string }>({
    open: false,
    affiliateId: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async (affiliateId: string) => {
    setProcessing(true);
    await onApprove(affiliateId);
    setProcessing(false);
    setViewDialog({ open: false, application: null });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setProcessing(true);
    await onReject(rejectDialog.affiliateId, rejectReason);
    setProcessing(false);
    setRejectDialog({ open: false, affiliateId: '' });
    setRejectReason('');
    setViewDialog({ open: false, application: null });
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Applications
          </CardTitle>
          <CardDescription>Review and approve affiliate applications</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No pending applications.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Applications
            <Badge variant="secondary" className="ml-2">{applications.length}</Badge>
          </CardTitle>
          <CardDescription>Review and approve affiliate applications</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referral Code</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Recommended By</TableHead>
                <TableHead>Application Preview</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-mono">{app.referral_code}</TableCell>
                  <TableCell>
                    {app.application_submitted_at 
                      ? format(new Date(app.application_submitted_at), 'MMM d, yyyy')
                      : format(new Date(app.created_at), 'MMM d, yyyy')
                    }
                  </TableCell>
                  <TableCell>
                    {app.recommended_by_email ? (
                      <Badge variant="outline">{app.recommended_by_email}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {app.application_text?.slice(0, 60)}
                    {(app.application_text?.length || 0) > 60 ? '...' : ''}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewDialog({ open: true, application: app })}
                      >
                        View
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(app.id)}
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ ...viewDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Review Application
            </DialogTitle>
            <DialogDescription>
              Code: {viewDialog.application?.referral_code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Application Text</Label>
              <p className="mt-1 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {viewDialog.application?.application_text || 'No application text provided.'}
              </p>
            </div>
            {viewDialog.application?.recommended_by_email && (
              <div>
                <Label className="text-sm font-medium">Recommended By</Label>
                <p className="mt-1 text-sm">{viewDialog.application.recommended_by_email}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Submitted</Label>
              <p className="mt-1 text-sm">
                {viewDialog.application?.application_submitted_at 
                  ? format(new Date(viewDialog.application.application_submitted_at), 'MMMM d, yyyy h:mm a')
                  : 'Unknown'
                }
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: true, affiliateId: viewDialog.application?.id || '' });
              }}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={() => viewDialog.application && handleApprove(viewDialog.application.id)}
              disabled={processing}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {processing ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, affiliateId: '' })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
