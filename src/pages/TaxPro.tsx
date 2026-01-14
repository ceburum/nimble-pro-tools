import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// TaxPro page now redirects to the unified Financial Tool page
export default function TaxPro() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Financial Tool with tax section selected
    navigate('/reports?section=tax', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
