import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 13, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using CEB App ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground mb-3">
              CEB App is a contractor business management application that provides:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Client and project management</li>
              <li>Quote and invoice generation</li>
              <li>Expense tracking and receipt scanning</li>
              <li>Mileage logging for business travel</li>
              <li>Tax preparation assistance and reporting tools</li>
              <li>Scheduling and calendar management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground mb-3">To use the Service, you must:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Create an account with accurate information</li>
              <li>Maintain the security of your login credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be at least 18 years of age</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              You are responsible for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Responsibilities</h2>
            <p className="text-muted-foreground mb-3">You agree to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Service only for lawful purposes</li>
              <li>Provide accurate business and financial information</li>
              <li>Maintain proper records for tax compliance</li>
              <li>Not attempt to access other users' data</li>
              <li>Not use the Service to send spam or unsolicited communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Pro Features and Payments</h2>
            <p className="text-muted-foreground mb-3">
              Certain features require a paid subscription ("Pro Features"). By subscribing:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You authorize us to charge your payment method on a recurring basis</li>
              <li>Subscription fees are billed in advance</li>
              <li>Refunds are handled on a case-by-case basis</li>
              <li>You may cancel at any time; access continues until the end of the billing period</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Tax Information Disclaimer</h2>
            <p className="text-muted-foreground font-medium mb-3">IMPORTANT:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>The tax calculations, estimates, and reports provided are for <strong>informational purposes only</strong></li>
              <li>We are not a licensed tax advisor, CPA, or financial professional</li>
              <li>All tax-related features are tools to assist with record-keeping, not professional tax advice</li>
              <li>You should consult a qualified tax professional for tax planning and filing</li>
              <li>We are not responsible for any errors in your tax filings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service and its original content, features, and functionality are owned by CEB App 
              and are protected by copyright, trademark, and other intellectual property laws. 
              Your data remains yours; we claim no ownership over content you create.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, CEB App shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, including but not limited to 
              loss of profits, data, or business opportunities, arising out of your use of the Service. 
              Our total liability shall not exceed the amount you paid for the Service in the 12 months 
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless CEB App from any claims, damages, or expenses 
              arising from your use of the Service, your violation of these Terms, or your violation 
              of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Service Availability</h2>
            <p className="text-muted-foreground">
              We strive to maintain high availability but do not guarantee uninterrupted access. 
              We may modify, suspend, or discontinue any part of the Service at any time. 
              We will provide reasonable notice of significant changes when possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account at any time for violation of these Terms. 
              You may delete your account at any time through the app settings. Upon termination, 
              your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. Material changes will be 
              communicated through the app or via email. Continued use of the Service after changes 
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the 
              United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact</h2>
            <p className="text-muted-foreground">
              Questions about these Terms should be directed to us through the app or at the 
              email address associated with your account.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
