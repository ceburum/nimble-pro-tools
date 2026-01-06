import { DollarSign } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    name: 'Venmo',
    link: 'https://venmo.com/code?user_id=2841609905373184175&created=1767587302',
    color: 'bg-[#008CFF]',
  },
  {
    name: 'CashApp',
    link: 'https://cash.app/$ceburum',
    color: 'bg-[#00D632]',
  },
];

export function PaymentInfo() {
  return (
    <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-success" />
        <span className="text-sm font-medium text-foreground">Payment Options</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PAYMENT_METHODS.map((method) => (
          <a
            key={method.name}
            href={method.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white ${method.color} hover:opacity-90 transition-opacity`}
          >
            Pay with {method.name}
          </a>
        ))}
      </div>
    </div>
  );
}
