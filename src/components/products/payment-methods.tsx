'use client';

import { CreditCard, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodsProps {
  methods?: string[];
  showSecurity?: boolean;
}

export function PaymentMethods({
  methods = ['visa', 'mastercard', 'paypal', 'apple-pay'],
  showSecurity = true,
}: PaymentMethodsProps) {
  const methodLabels: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    paypal: 'PayPal',
    'apple-pay': 'Apple Pay',
  };

  return (
    <div className="bg-platinum-50 rounded-lg p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="text-xs font-bold uppercase tracking-wider text-nuanced-500 mb-3">
            Méthodes de paiement
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {methods.map((method) => (
              <div
                key={method}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 bg-white rounded border border-platinum-300',
                  'transition-all duration-200 hover:scale-105 hover:shadow-sm'
                )}
                style={{
                  filter: 'grayscale(100%) opacity(0.6)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'grayscale(0%) opacity(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'grayscale(100%) opacity(0.6)';
                }}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-xs font-medium text-anthracite-500">
                  {methodLabels[method] || method}
                </span>
              </div>
            ))}
          </div>
        </div>
        {showSecurity && (
          <div className="flex items-center gap-2 text-success">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-semibold">
              Paiement 100% sécurisé
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
