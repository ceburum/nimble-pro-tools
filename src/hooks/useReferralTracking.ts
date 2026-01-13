import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const REFERRAL_CODE_KEY = 'sidecar_referral_code';
const REFERRAL_CODE_EXPIRES = 30 * 24 * 60 * 60 * 1000; // 30 days

interface StoredReferral {
  code: string;
  timestamp: number;
}

export function useReferralTracking() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Store referral code with timestamp
      const referralData: StoredReferral = {
        code: refCode,
        timestamp: Date.now(),
      };
      localStorage.setItem(REFERRAL_CODE_KEY, JSON.stringify(referralData));
      console.log('[Referral] Stored referral code:', refCode);
    }
  }, [searchParams]);

  const getReferralCode = (): string | null => {
    try {
      const stored = localStorage.getItem(REFERRAL_CODE_KEY);
      if (!stored) return null;

      const referralData: StoredReferral = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() - referralData.timestamp > REFERRAL_CODE_EXPIRES) {
        localStorage.removeItem(REFERRAL_CODE_KEY);
        return null;
      }

      return referralData.code;
    } catch {
      return null;
    }
  };

  const clearReferralCode = () => {
    localStorage.removeItem(REFERRAL_CODE_KEY);
  };

  return {
    getReferralCode,
    clearReferralCode,
  };
}
