import { Mail, Phone, MapPin, FolderPlus, FileText, Edit, CalendarPlus } from 'lucide-react';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppointments } from '@/hooks/useAppointments';

interface ClientDetailDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (client: Client) => void;
  onCreateProject: (client: Client) => void;
  onCreateAppointment?: (client: Client) => void;
  onSendInvoice: (client: Client) => void;
}

export function ClientDetailDialog({
  client,
  open,
  onOpenChange,
  onEdit,
  onCreateProject,
  onCreateAppointment,
  onSendInvoice,
}: ClientDetailDialogProps) {
  const { isStationaryBusiness } = useAppointments();

  if (!client) return null;

  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handlePrimaryAction = () => {
    if (isStationaryBusiness && onCreateAppointment) {
      onCreateAppointment(client);
    } else {
      onCreateProject(client);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Client Details</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary">{initials}</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
          <p className="text-sm text-muted-foreground">
            Client since {client.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-3 py-4 border-t border-b border-border">
          <a 
            href={`mailto:${client.email}`} 
            className="flex items-center gap-3 text-sm hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{client.email}</span>
          </a>
          <a 
            href={`tel:${client.phone}`} 
            className="flex items-center gap-3 text-sm hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted/50"
          >
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{client.phone}</span>
          </a>
          <div className="flex items-start gap-3 text-sm p-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-foreground">{client.address}</span>
          </div>
        </div>

        <div className="grid gap-2 pt-2">
          <Button 
            onClick={handlePrimaryAction}
            className="w-full gap-2"
          >
            {isStationaryBusiness ? (
              <>
                <CalendarPlus className="h-4 w-4" />
                Create Appointment
              </>
            ) : (
              <>
                <FolderPlus className="h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              onSendInvoice(client);
              onOpenChange(false);
            }}
            className="w-full gap-2"
          >
            <FileText className="h-4 w-4" />
            Send Invoice
          </Button>
          <Button 
            variant="ghost"
            onClick={() => {
              onEdit(client);
              onOpenChange(false);
            }}
            className="w-full gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Client
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}