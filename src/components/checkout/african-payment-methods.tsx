'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  africanPaymentMethods, 
  getPaymentMethodsForCountry,
  type AfricanCountryCode 
} from '@/i18n/config';
import { cn } from '@/lib/utils';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Banknote,
  Check,
  ChevronRight
} from 'lucide-react';

interface AfricanPaymentMethodsProps {
  countryCode: AfricanCountryCode;
  selectedMethod: string | null;
  onSelect: (methodId: string) => void;
  className?: string;
}

// Payment method IDs type
type PaymentMethodId = 'orange_money' | 'mtn_momo' | 'mpesa' | 'wave' | 'moov_money' | 'free_money' | 'visa' | 'mastercard' | 'bank_transfer' | 'cod';

// Payment method categories
const paymentCategories: Record<string, {
  title: string;
  icon: typeof Smartphone;
  description: string;
  methods: PaymentMethodId[];
}> = {
  mobileMoney: {
    title: 'Mobile Money',
    icon: Smartphone,
    description: 'Payez avec votre portefeuille mobile',
    methods: ['orange_money', 'mtn_momo', 'mpesa', 'wave', 'moov_money', 'free_money'],
  },
  card: {
    title: 'Carte Bancaire',
    icon: CreditCard,
    description: 'Visa, Mastercard',
    methods: ['visa', 'mastercard'],
  },
  bank: {
    title: 'Virement Bancaire',
    icon: Building2,
    description: 'Transfert direct depuis votre banque',
    methods: ['bank_transfer'],
  },
  cash: {
    title: 'Paiement à la Livraison',
    icon: Banknote,
    description: 'Payez en espèces à la réception',
    methods: ['cod'],
  },
};

export function AfricanPaymentMethods({
  countryCode,
  selectedMethod,
  onSelect,
  className,
}: AfricanPaymentMethodsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('mobileMoney');
  
  // Get available payment methods for this country
  const availableMethods = getPaymentMethodsForCountry(countryCode);
  const availableMethodIds = availableMethods.map(m => m.id);

  // Filter categories to only show those with available methods
  const availableCategories = Object.entries(paymentCategories).filter(([_, category]) =>
    category.methods.some(methodId => availableMethodIds.includes(methodId))
  );

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-anthracite-700">
        Mode de paiement
      </h3>

      <div className="space-y-3">
        {availableCategories.map(([categoryId, category]) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategory === categoryId;
          const categoryMethods = category.methods.filter(id => availableMethodIds.includes(id));
          const hasSelectedMethod = categoryMethods.includes(selectedMethod as PaymentMethodId);

          return (
            <div
              key={categoryId}
              className={cn(
                'border rounded-xl overflow-hidden transition-all',
                hasSelectedMethod
                  ? 'border-turquoise-500 bg-turquoise-50'
                  : 'border-taupe-200 hover:border-taupe-300'
              )}
            >
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : categoryId)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  hasSelectedMethod
                    ? 'bg-turquoise-100 text-turquoise-600'
                    : 'bg-taupe-100 text-taupe-600'
                )}>
                  <CategoryIcon className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-anthracite-700">
                    {category.title}
                  </div>
                  <div className="text-sm text-taupe-500">
                    {category.description}
                  </div>
                </div>

                {hasSelectedMethod && (
                  <div className="w-6 h-6 rounded-full bg-turquoise-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <ChevronRight className={cn(
                  'w-5 h-5 text-taupe-400 transition-transform',
                  isExpanded && 'rotate-90'
                )} />
              </button>

              {/* Expanded methods */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 space-y-2">
                  {categoryMethods.map(methodId => {
                    const method = Object.values(africanPaymentMethods).find(m => m.id === methodId) as { id: string; name: string; icon: string; countries: string[] | 'all' } | undefined;
                    if (!method) return null;

                    const isSelected = selectedMethod === methodId;

                    return (
                      <button
                        key={methodId}
                        onClick={() => onSelect(methodId)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                          isSelected
                            ? 'border-turquoise-500 bg-white shadow-sm'
                            : 'border-taupe-200 bg-white hover:border-turquoise-300'
                        )}
                      >
                        {/* Payment method icon/logo */}
                        <div className="w-12 h-8 relative flex items-center justify-center bg-white rounded">
                          {method.icon ? (
                            <Image
                              src={method.icon}
                              alt={method.name}
                              width={40}
                              height={24}
                              className="object-contain"
                              onError={(e) => {
                                // Fallback to text if image fails
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-taupe-600">
                              {method.name.substring(0, 3).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <span className="flex-1 text-left font-medium text-sm">
                          {method.name}
                        </span>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-turquoise-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Money instructions */}
      {selectedMethod && ['orange_money', 'mtn_momo', 'mpesa', 'wave', 'moov_money', 'free_money'].includes(selectedMethod) && (
        <div className="mt-4 p-4 bg-copper-50 border border-copper-200 rounded-xl">
          <h4 className="font-medium text-copper-800 mb-2">
            📱 Instructions Mobile Money
          </h4>
          <ol className="text-sm text-copper-700 space-y-1 list-decimal list-inside">
            <li>Vous recevrez un SMS avec les instructions de paiement</li>
            <li>Composez le code USSD indiqué</li>
            <li>Entrez votre code PIN pour confirmer</li>
            <li>Vous recevrez une confirmation par SMS</li>
          </ol>
        </div>
      )}

      {/* COD notice */}
      {selectedMethod === 'cod' && (
        <div className="mt-4 p-4 bg-taupe-50 border border-taupe-200 rounded-xl">
          <h4 className="font-medium text-taupe-800 mb-2">
            💵 Paiement à la livraison
          </h4>
          <p className="text-sm text-taupe-600">
            Préparez le montant exact en espèces. Notre livreur vous remettra 
            un reçu après paiement.
          </p>
        </div>
      )}
    </div>
  );
}
