import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: {
    barcode: string;
    name?: string;
    description?: string;
    category?: string;
    supplier?: string;
  }) => void;
}

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // Scanner might already be stopped
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setError(null);
    
    if (!containerRef.current) return;

    try {
      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        async (decodedText) => {
          // Barcode detected
          await stopScanner();
          handleBarcodeLookup(decodedText);
        },
        () => {
          // QR Code scan error (ignore - just means no code detected yet)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      if (err.toString().includes('Permission')) {
        setError('Camera permission denied. Please allow camera access to scan barcodes.');
      } else {
        setError('Unable to start camera. Please try again or enter details manually.');
      }
    }
  };

  const handleBarcodeLookup = async (barcode: string) => {
    setIsLookingUp(true);
    
    try {
      // Get the current user's session token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('You must be logged in to scan barcodes.');
        onOpenChange(false);
        return;
      }

      // Call our edge function to lookup the barcode with authenticated token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lookup-barcode`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ barcode }),
        }
      );

      if (!response.ok) {
        throw new Error('Lookup failed');
      }

      const data = await response.json();
      
      if (data.found) {
        toast.success('Product found! Fields auto-populated.');
        onScan({
          barcode,
          name: data.name,
          description: data.description,
          category: data.category,
          supplier: data.brand || data.supplier,
        });
      } else {
        toast.info('Product not found in database. Please enter details manually.');
        onScan({ barcode });
      }
      
      onOpenChange(false);
    } catch (err) {
      console.error('Barcode lookup error:', err);
      toast.info('Could not look up barcode. Please enter details manually.');
      onScan({ barcode });
      onOpenChange(false);
    } finally {
      setIsLookingUp(false);
    }
  };

  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        stopScanner();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLookingUp ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Looking up product...</p>
            </div>
          ) : (
            <>
              <div 
                ref={containerRef}
                id="barcode-reader" 
                className="w-full rounded-lg overflow-hidden bg-muted min-h-[200px]"
              />
              
              {error && (
                <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                  {error}
                </div>
              )}
              
              {!isScanning && !error && (
                <div className="flex justify-center">
                  <Button onClick={startScanner}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground text-center">
                Point your camera at a product barcode. The product info will be auto-filled when found.
              </p>
            </>
          )}
          
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
