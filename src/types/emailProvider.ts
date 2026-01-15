export type EmailProviderType = 
  | 'postmark' 
  | 'sendgrid' 
  | 'mailgun' 
  | 'amazon_ses' 
  | 'zoho_zeptomail'
  | 'resend'
  | 'zoho_mail'
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

export type ProviderCategory = 'transactional' | 'personal';

export interface EmailProviderInfo {
  id: EmailProviderType;
  name: string;
  description: string;
  signupUrl: string;
  recommended?: boolean;
  usesApiKey: boolean;
  usesSmtp: boolean;
  category: ProviderCategory;
  freeTier?: string;
  freeTierNote?: string;
}

// Transactional/Robot email services - optimized for automated sending
export const TRANSACTIONAL_PROVIDERS: EmailProviderInfo[] = [
  {
    id: 'resend',
    name: 'Resend',
    description: 'Modern email API built for developers. Fast setup, great deliverability.',
    signupUrl: 'https://resend.com/signup',
    recommended: true,
    usesApiKey: true,
    usesSmtp: false,
    category: 'transactional',
    freeTier: '3,000 emails/month',
    freeTierNote: 'Plus 100/day limit',
  },
  {
    id: 'postmark',
    name: 'Postmark',
    description: 'Lightning-fast delivery, perfect for invoices and receipts.',
    signupUrl: 'https://postmarkapp.com/sign_up',
    recommended: false,
    usesApiKey: true,
    usesSmtp: false,
    category: 'transactional',
    freeTier: '100 emails/month',
    freeTierNote: 'First month includes 100 free test emails',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Scalable email by Twilio. Great for growing businesses.',
    signupUrl: 'https://signup.sendgrid.com/',
    recommended: false,
    usesApiKey: true,
    usesSmtp: false,
    category: 'transactional',
    freeTier: '100 emails/day forever',
    freeTierNote: 'About 3,000/month',
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    description: 'Developer-friendly with strong analytics and deliverability.',
    signupUrl: 'https://signup.mailgun.com/new/signup',
    recommended: false,
    usesApiKey: true,
    usesSmtp: false,
    category: 'transactional',
    freeTier: '1,000 emails/month',
    freeTierNote: 'For first 3 months, then pay-as-you-go',
  },
  {
    id: 'zoho_zeptomail',
    name: 'Zoho ZeptoMail',
    description: 'Dedicated transactional email with excellent inbox placement.',
    signupUrl: 'https://www.zoho.com/zeptomail/signup.html',
    recommended: false,
    usesApiKey: true,
    usesSmtp: true,
    category: 'transactional',
    freeTier: '10,000 emails (one-time)',
    freeTierNote: 'Then ~$2.50 per 10k emails',
  },
  {
    id: 'amazon_ses',
    name: 'Amazon SES',
    description: 'AWS-scale email at the lowest cost per email.',
    signupUrl: 'https://aws.amazon.com/ses/',
    recommended: false,
    usesApiKey: true,
    usesSmtp: false,
    category: 'transactional',
    freeTier: '62,000 emails/month',
    freeTierNote: 'When sent from EC2 (otherwise $0.10 per 1k)',
  },
];

// Personal/Business email services - user's own email account
export const PERSONAL_PROVIDERS: EmailProviderInfo[] = [
  {
    id: 'zoho_mail',
    name: 'Zoho Mail',
    description: 'Professional business email with your own domain. Great for small business.',
    signupUrl: 'https://www.zoho.com/mail/zohomail-pricing.html',
    recommended: true,
    usesApiKey: false,
    usesSmtp: true,
    category: 'personal',
    freeTier: 'Up to 5 users',
    freeTierNote: 'With your domain (e.g., you@yourbusiness.com)',
  },
  {
    id: 'custom_smtp',
    name: 'Other SMTP',
    description: 'Connect any SMTP server with custom credentials.',
    signupUrl: '',
    recommended: false,
    usesApiKey: false,
    usesSmtp: true,
    category: 'personal',
  },
];

// Combined for backwards compatibility
export const EMAIL_PROVIDERS: EmailProviderInfo[] = [
  ...TRANSACTIONAL_PROVIDERS,
  ...PERSONAL_PROVIDERS,
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
