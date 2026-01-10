import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  street: z.string().min(5, 'Street address is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(5, 'ZIP code must be at least 5 characters'),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (data: { name: string; email: string; phone: string; address: string }) => void;
}

// Helper to parse existing address into parts
const parseAddress = (address: string): { street: string; state: string; zip: string } => {
  if (!address) return { street: '', state: '', zip: '' };
  
  // Try to parse "Street, State ZIP" format
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const street = parts.slice(0, -1).join(', ');
    const lastPart = parts[parts.length - 1].trim();
    const stateZipMatch = lastPart.match(/^([A-Z]{2})\s*(\d{5}(-\d{4})?)$/);
    if (stateZipMatch) {
      return { street, state: stateZipMatch[1], zip: stateZipMatch[2] };
    }
    // Try to extract state and zip separately
    const words = lastPart.split(/\s+/);
    if (words.length >= 2) {
      const zip = words[words.length - 1];
      const state = words[words.length - 2];
      if (US_STATES.includes(state) && /^\d{5}(-\d{4})?$/.test(zip)) {
        return { street, state, zip };
      }
    }
  }
  
  return { street: address, state: '', zip: '' };
};

export function ClientDialog({ open, onOpenChange, client, onSave }: ClientDialogProps) {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      state: '',
      zip: '',
    },
  });

  useEffect(() => {
    if (client) {
      const addressParts = parseAddress(client.address);
      form.reset({
        name: client.name,
        email: client.email,
        phone: client.phone,
        street: addressParts.street,
        state: addressParts.state,
        zip: addressParts.zip,
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        street: '',
        state: '',
        zip: '',
      });
    }
  }, [client, form]);

  const onSubmit = (data: ClientFormData) => {
    // Combine address parts into single string
    const address = `${data.street}, ${data.state} ${data.zip}`;
    onSave({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {client ? 'Save Changes' : 'Add Client'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
