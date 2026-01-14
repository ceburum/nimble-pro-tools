import { useState } from 'react';
import { Copy, Check, X, Mail, Printer, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PaylinkQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentToken: string | null;
  invoiceNumber: string;
  total: number;
  clientName?: string;
  clientEmail?: string;
  onSendReceipt?: () => void;
}

export function PaylinkQRDialog({
  open,
  onOpenChange,
  paymentToken,
  invoiceNumber,
  total,
  clientName,
  clientEmail,
  onSendReceipt,
}: PaylinkQRDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!paymentToken) return null;

  const paymentUrl = `${window.location.origin}/pay/${paymentToken}`;
  
  // Generate larger QR code for full-screen display
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(paymentUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      toast.success('Payment link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = paymentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Payment link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: `Payment for Invoice ${invoiceNumber} - $${total.toFixed(2)}`,
          url: paymentUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoiceNumber} - Payment QR Code</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                font-family: system-ui, sans-serif;
              }
              .container {
                text-align: center;
                max-width: 400px;
              }
              .qr-code {
                width: 300px;
                height: 300px;
                margin: 20px auto;
              }
              .amount {
                font-size: 2rem;
                font-weight: bold;
                color: #16a34a;
                margin: 10px 0;
              }
              .invoice-number {
                font-size: 1.25rem;
                color: #666;
                margin-bottom: 10px;
              }
              .instructions {
                font-size: 0.9rem;
                color: #888;
                margin-top: 20px;
              }
              .url {
                font-size: 0.75rem;
                color: #aaa;
                word-break: break-all;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Scan to Pay</h1>
              <p class="invoice-number">Invoice ${invoiceNumber}</p>
              <p class="amount">$${total.toFixed(2)}</p>
              ${clientName ? `<p>For: ${clientName}</p>` : ''}
              <img src="${qrCodeUrl}" alt="Payment QR Code" class="qr-code" />
              <p class="instructions">Scan this QR code with your phone camera to make a payment</p>
              <p class="url">${paymentUrl}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Scan to Pay
          </DialogTitle>
          <DialogDescription className="text-center">
            Invoice {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Amount Display */}
          <div className="text-center">
            <span className="text-4xl font-bold text-success">
              ${total.toFixed(2)}
            </span>
            {clientName && (
              <p className="text-sm text-muted-foreground mt-1">
                For {clientName}
              </p>
            )}
          </div>

          {/* Large QR Code */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <img
              src={qrCodeUrl}
              alt={`QR Code for Invoice ${invoiceNumber}`}
              className="w-72 h-72 sm:w-80 sm:h-80"
            />
          </div>

          {/* Instructions */}
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Point your phone camera at this QR code to open the payment page
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-2 w-full">
            <Button onClick={handleCopyLink} variant="outline" className="gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            
            <Button onClick={handleShare} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>

            {clientEmail && onSendReceipt && (
              <Button onClick={onSendReceipt} variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            )}
          </div>

          {/* Payment URL */}
          <p className="text-xs text-muted-foreground text-center max-w-full break-all px-4">
            {paymentUrl}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}