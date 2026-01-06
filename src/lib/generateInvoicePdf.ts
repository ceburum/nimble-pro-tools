import { Invoice, Client } from '@/types';

const PAYMENT_METHODS = {
  venmo: {
    name: 'Venmo',
    username: 'Chad-Burum-1',
    getLink: (amount: number) => `https://venmo.com/Chad-Burum-1?txn=pay&amount=${amount}`,
  },
  cashapp: {
    name: 'CashApp',
    id: '$ceburum',
    getLink: (amount: number) => `https://cash.app/$ceburum/${amount}`,
  },
};

export function generateInvoiceHtml(invoice: Invoice, client: Client | undefined): string {
  const total = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  
  const itemsHtml = invoice.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          a { text-decoration: none; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1f2937;
          line-height: 1.5;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f59e0b;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #f59e0b;
        }
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #374151;
        }
        .invoice-number {
          color: #6b7280;
          font-size: 14px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .info-block h3 {
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .info-block p {
          margin: 4px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          border-bottom: 2px solid #e5e7eb;
        }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) {
          text-align: right;
        }
        th:nth-child(2) { text-align: center; }
        .total-row {
          font-size: 18px;
          font-weight: bold;
        }
        .payment-section {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          padding: 24px;
          margin-top: 30px;
        }
        .payment-section h3 {
          margin: 0 0 16px 0;
          color: #92400e;
          font-size: 16px;
        }
        .payment-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .payment-btn {
          display: inline-block;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .payment-btn:hover {
          transform: scale(1.02);
        }
        .venmo-btn {
          background: #3D95CE;
          color: white;
        }
        .cashapp-btn {
          background: #00D632;
          color: white;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #f59e0b;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .print-btn:hover {
          background: #d97706;
        }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">Save as PDF / Print</button>
      
      <div class="header">
        <div>
          <div class="company-name">CEB Services</div>
        </div>
        <div style="text-align: right;">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">${invoice.invoiceNumber}</div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-block">
          <h3>Bill To</h3>
          <p><strong>${client?.name || 'Client'}</strong></p>
          <p>${client?.email || ''}</p>
          <p>${client?.phone || ''}</p>
          <p>${client?.address || ''}</p>
        </div>
        <div class="info-block" style="text-align: right;">
          <h3>Invoice Details</h3>
          <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="3" style="padding: 16px 12px; text-align: right;">Total Due:</td>
            <td style="padding: 16px 12px; text-align: right; color: #f59e0b;">$${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      ${invoice.notes ? `
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">Notes</h3>
          <p style="color: #374151;">${invoice.notes}</p>
        </div>
      ` : ''}

      <div class="payment-section">
        <h3>💳 Easy Payment Options</h3>
        <p style="margin-bottom: 16px; color: #78350f;">Click a button below to pay instantly:</p>
        <div class="payment-buttons">
          <a href="${PAYMENT_METHODS.venmo.getLink(total)}" class="payment-btn venmo-btn" target="_blank">
            Pay $${total.toFixed(2)} with Venmo
          </a>
          <a href="${PAYMENT_METHODS.cashapp.getLink(total)}" class="payment-btn cashapp-btn" target="_blank">
            Pay $${total.toFixed(2)} with CashApp
          </a>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Questions? Contact us anytime.</p>
      </div>
    </body>
    </html>
  `;
}

export function downloadInvoice(invoice: Invoice, client: Client | undefined): void {
  const html = generateInvoiceHtml(invoice, client);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Open in new window for print/save as PDF
  const printWindow = window.open(url, '_blank');
  
  // Clean up the URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
