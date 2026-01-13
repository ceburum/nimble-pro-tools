import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 13, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Email address and password when you create an account.</li>
              <li><strong>Business Data:</strong> Client information, project details, quotes, and invoices you create.</li>
              <li><strong>Financial Records:</strong> Payment records, expense receipts, and mileage logs for tax preparation.</li>
              <li><strong>Tax Information:</strong> Tax Identification Numbers (TINs) for 1099 reporting, stored with encryption.</li>
              <li><strong>Location Data:</strong> If you use mileage tracking, we may collect GPS coordinates to calculate distances.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain our contractor business management services</li>
              <li>Generate invoices, quotes, and financial reports</li>
              <li>Send transactional emails (invoice notifications, payment reminders)</li>
              <li>Prepare tax-related summaries and 1099 information</li>
              <li>Improve and personalize your experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
            <p className="text-muted-foreground mb-3">
              Your data is stored securely using industry-standard encryption and security practices:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>All data is transmitted over HTTPS</li>
              <li>Sensitive information like Tax ID Numbers is encrypted at rest</li>
              <li>We use secure cloud infrastructure with regular backups</li>
              <li>Access to your data is protected by authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
            <p className="text-muted-foreground mb-3">We use the following third-party services:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Payment Processing:</strong> Stripe for secure payment handling</li>
              <li><strong>Email Delivery:</strong> For sending invoices and notifications</li>
              <li><strong>AI Services:</strong> For receipt scanning and document analysis</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              These services have their own privacy policies governing how they handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
            <p className="text-muted-foreground mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active. Financial records may be retained 
              for up to 7 years to comply with tax regulations. You may request deletion of your account 
              at any time, and we will remove your data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not intended for users under 18 years of age. We do not knowingly collect 
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or your data, please contact us through 
              the app or at the email address associated with your account.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
