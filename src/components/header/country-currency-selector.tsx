'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Check, Search } from 'lucide-react';
import { 
  africanCountries, 
  currencies, 
  localeNames,
  localeFlags,
  type AfricanCountryCode,
  type CurrencyCode,
  type Locale 
} from '@/i18n/config';
import { cn } from '@/lib/utils';

interface CountryCurrencySelectorProps {
  className?: string;
}

export function CountryCurrencySelector({ className }: CountryCurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'country' | 'language'>('country');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<AfricanCountryCode>('SN');
  const [selectedLocale, setSelectedLocale] = useState<Locale>('fr');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current country and currency info
  const currentCountry = africanCountries[selectedCountry];
  const currentCurrency = currencies[currentCountry.currency as CurrencyCode];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filter countries based on search
  const filteredCountries = Object.entries(africanCountries).filter(([_, country]) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle country selection
  const handleCountrySelect = (code: AfricanCountryCode) => {
    setSelectedCountry(code);
    // Set locale based on country's primary language
    const country = africanCountries[code];
    setSelectedLocale(country.locale as Locale);
    
    // Save to cookie
    document.cookie = `NEXT_COUNTRY=${code};path=/;max-age=31536000`;
    document.cookie = `NEXT_CURRENCY=${country.currency};path=/;max-age=31536000`;
    document.cookie = `NEXT_LOCALE=${country.locale};path=/;max-age=31536000`;
    
    setIsOpen(false);
    // Reload to apply changes
    window.location.reload();
  };

  // Handle language selection
  const handleLocaleSelect = (locale: Locale) => {
    setSelectedLocale(locale);
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-taupe-100 rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-4 h-4 text-taupe-600" />
        <span className="hidden sm:inline">
          {currentCountry.flag} {currentCountry.name}
        </span>
        <span className="sm:hidden">{currentCountry.flag}</span>
        <span className="text-taupe-500">|</span>
        <span>{currentCurrency.symbol}</span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-taupe-200 z-50 overflow-hidden animate-slide-down">
          {/* Tabs */}
          <div className="flex border-b border-taupe-200">
            <button
              onClick={() => setActiveTab('country')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'country'
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                  : 'text-taupe-600 hover:bg-taupe-50'
              )}
            >
              🌍 Pays & Devise
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'language'
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                  : 'text-taupe-600 hover:bg-taupe-50'
              )}
            >
              🗣️ Langue
            </button>
          </div>

          {activeTab === 'country' && (
            <>
              {/* Search */}
              <div className="p-3 border-b border-taupe-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un pays..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-taupe-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Countries list */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  <div className="p-2">
                    {filteredCountries.map(([code, country]) => {
                      const currency = currencies[country.currency as CurrencyCode];
                      const isSelected = code === selectedCountry;
                      
                      return (
                        <button
                          key={code}
                          onClick={() => handleCountrySelect(code as AfricanCountryCode)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                            isSelected
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'hover:bg-taupe-50'
                          )}
                        >
                          <span className="text-xl">{country.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{country.name}</div>
                            <div className="text-xs text-taupe-500">
                              {currency?.name} ({currency?.symbol})
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-taupe-500">
                    <p>Aucun pays trouvé</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'language' && (
            <div className="p-2">
              {(['fr', 'en', 'ar'] as Locale[]).map((locale) => {
                const isSelected = locale === selectedLocale;
                
                return (
                  <button
                    key={locale}
                    onClick={() => handleLocaleSelect(locale)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left',
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'hover:bg-taupe-50'
                    )}
                  >
                    <span className="text-xl">{localeFlags[locale]}</span>
                    <div className="flex-1">
                      <div className="font-medium">{localeNames[locale]}</div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Current selection info */}
          <div className="p-3 bg-taupe-50 border-t border-taupe-200">
            <div className="flex items-center justify-between text-xs text-taupe-600">
              <span>
                {currentCountry.flag} {currentCountry.name}
              </span>
              <span className="font-medium">
                {currentCurrency.symbol} {currentCurrency.code}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
