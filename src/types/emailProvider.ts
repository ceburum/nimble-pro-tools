export type EmailProviderType = 
  | 'postmark' 
  | 'sendgrid' 
  | 'mailgun' 
  | 'amazon_ses' 
  | 'zoho_zeptomail' 
  | 'custom_smtp';

export interface EmailProviderSettings {
  id: string;
  userId: string;
  providerType: EmailProviderType;
  isActive: boolean;
  
  // API key based
  apiKey?: string;
  
  // SMTP based
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpUseTls?: boolean;
  
  // Common
  fromEmail?: string;
  fromName?: string;
  
  // Status
  lastTestAt?: string;
  lastTestSuccess?: boolean;
  lastTestError?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface EmailProviderInfo {
  id: EmailProviderType;
  name: string;
  description: string;
  signupUrl: string;
  recommended?: boolean;
  usesApiKey: boolean;
  usesSmtp: boolean;
}

export const EMAIL_PROVIDERS: EmailProviderInfo[] = [
  {
    id: 'postmark',
    name: 'Postmark',
    description: 'Fast, reliable transactional email. Great for invoices and receipts.',
    signupUrl: 'https://postmarkapp.com/sign_up',
    recommended: true,
    usesApiKey: true,
    usesSmtp: false,
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Scalable email delivery by Twilio. Free tier available.',
    signupUrl: 'https://signup.sendgrid.com/',
    recommended: false,
    usesApiKey: true,
    usesSmtp: false,
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    description: 'Developer-friendly email API with strong deliverability.',
    signupUrl: 'https://signup.mailgun.com/new/signup',
    recommended: false,
    usesApiKey: true,
    usesSmtp: false,
  },
  {
    id: 'amazon_ses',
    name: 'Amazon SES',
    description: 'Cost-effective email at AWS scale. Requires AWS account.',
    signupUrl: 'https://aws.amazon.com/ses/',
    recommended: false,
    usesApiKey: true,
    usesSmtp: false,
  },
  {
    id: 'zoho_zeptomail',
    name: 'Zoho ZeptoMail',
    description: 'Dedicated transactional email service with high deliverability.',
    signupUrl: 'https://www.zoho.com/zeptomail/signup.html',
    recommended: false,
    usesApiKey: true,
    usesSmtp: true,
  },
  {
    id: 'custom_smtp',
    name: 'Other SMTP',
    description: 'Connect any SMTP server. For advanced users only.',
    signupUrl: '',
    recommended: false,
    usesApiKey: false,
    usesSmtp: true,
  },
];

export const UNSUPPORTED_PROVIDERS = [
  'yahoo.com',
  'aol.com',
  'hotmail.com',
  'outlook.com',
  'gmail.com',
  'icloud.com',
  'live.com',
  'msn.com',
];
