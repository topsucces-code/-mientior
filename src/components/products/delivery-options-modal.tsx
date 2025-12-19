 'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { DeliveryOptions, type DeliveryOption } from '@/components/delivery/delivery-options';

interface DeliveryOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOption?: string;
  cartTotal?: number;
  onSelect?: (option: DeliveryOption) => void;
}

export function DeliveryOptionsModal({ isOpen, onClose, selectedOption, cartTotal = 0, onSelect }: DeliveryOptionsModalProps) {
  const initialTab = selectedOption === 'pickup' ? 'relais' : selectedOption === 'express' ? 'express' : 'standard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const t = useTranslations('products.pdp.delivery');

  const isSelectable = !!onSelect;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white gap-0 rounded-[3px]">
        <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-center relative">
               <DialogTitle className="text-xl font-bold text-center">{t('title')}</DialogTitle>
            </div>
        </DialogHeader>

        <Tabs defaultValue="standard" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b border-gray-100">
                <TabsList className="w-full justify-between bg-transparent h-auto p-0 border-b-2 border-transparent">
                    <TabsTrigger 
                        value="standard" 
                        className="flex-1 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:shadow-none px-0 text-gray-500 data-[state=active]:text-gray-900 font-semibold text-base"
                    >
                        {t('tabs.standard')}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="relais" 
                        className="flex-1 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:shadow-none px-0 text-gray-500 data-[state=active]:text-gray-900 font-semibold text-base"
                    >
                         {t('tabs.relay')}
                    </TabsTrigger>
                    <TabsTrigger 
                        value="express" 
                        className="flex-1 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:shadow-none px-0 text-gray-500 data-[state=active]:text-gray-900 font-semibold text-base"
                    >
                         {t('tabs.express')}
                    </TabsTrigger>
                </TabsList>
            </div>

            {isSelectable ? (
              <>
                <TabsContent value="standard" className="p-4 sm:p-5 space-y-4 mt-0">
                  <div className="bg-orange-500 rounded-[3px] p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <span className="bg-white text-orange-600 px-1.5 py-0.5 text-xs rounded-[3px] font-black tracking-tighter">MIENTIOR</span>
                      <span className="text-white/80">×</span>
                      <span>Yango Delivery</span>
                    </div>
                    <div className="flex items-center gap-1 text-white text-sm font-medium">
                      <span>{t('banner.slogan')}</span>
                      <span className="text-lg">›</span>
                    </div>
                  </div>
                  <DeliveryOptions
                    selectedOption={selectedOption}
                    onSelect={(opt) => onSelect?.(opt)}
                    cartTotal={cartTotal}
                    showFullCards={false}
                    visibleOptionIds={['standard']}
                    showHeader={false}
                  />
                </TabsContent>

                <TabsContent value="relais" className="p-4 sm:p-5 space-y-4 mt-0">
                  <div className="bg-orange-500 rounded-[3px] p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <span className="bg-white text-orange-600 px-1.5 py-0.5 text-xs rounded-[3px] font-black tracking-tighter">MIENTIOR</span>
                      <span className="text-white/80">×</span>
                      <span>Adapleson</span>
                    </div>
                    <div className="flex items-center gap-1 text-white text-sm font-medium">
                      <span>{t('banner.slogan')}</span>
                      <span className="text-lg">›</span>
                    </div>
                  </div>
                  <DeliveryOptions
                    selectedOption={selectedOption}
                    onSelect={(opt) => onSelect?.(opt)}
                    cartTotal={cartTotal}
                    showFullCards={false}
                    visibleOptionIds={['pickup']}
                    showHeader={false}
                  />
                </TabsContent>

                <TabsContent value="express" className="p-4 sm:p-5 space-y-4 mt-0">
                  <div className="bg-orange-500 rounded-[3px] p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <span className="bg-white text-orange-600 px-1.5 py-0.5 text-xs rounded-[3px] font-black tracking-tighter">MIENTIOR</span>
                      <span className="text-white/80">×</span>
                      <span>Yango Express</span>
                    </div>
                    <div className="flex items-center gap-1 text-white text-sm font-medium">
                      <span>{t('banner.slogan')}</span>
                      <span className="text-lg">›</span>
                    </div>
                  </div>
                  <DeliveryOptions
                    selectedOption={selectedOption}
                    onSelect={(opt) => onSelect?.(opt)}
                    cartTotal={cartTotal}
                    showFullCards={false}
                    visibleOptionIds={['express', 'same-day']}
                    showHeader={false}
                  />
                </TabsContent>
              </>
            ) : (
              <>
                <TabsContent value="standard" className="p-6 space-y-6 mt-0">
                    {/* Banner */}
                    <div className="bg-orange-500 rounded-[3px] p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2 text-white font-bold">
                            <span className="bg-white text-orange-600 px-1.5 py-0.5 text-xs rounded-[3px] font-black tracking-tighter">MIENTIOR</span>
                            <span className="text-white/80">×</span>
                            <span>Yango Delivery</span>
                        </div>
                        <div className="flex items-center gap-1 text-white text-sm font-medium">
                            <span>{t('banner.slogan')}</span>
                            <span className="text-lg">›</span>
                        </div>
                    </div>

                    {/* Info Table */}
                    <div className="bg-gray-50 rounded-[3px] overflow-hidden border border-gray-100">
                        {/* Delai */}
                        <div className="flex border-b border-gray-200/60">
                             <div className="w-1/3 p-4 bg-gray-100/50 text-gray-600 font-medium text-sm flex items-center">
                                {t('table.delay')}
                             </div>
                             <div className="w-2/3 p-4 bg-white text-gray-900 font-semibold flex items-center">
                                2-4 jours
                             </div>
                        </div>
                        {/* Tarifs */}
                        <div className="flex border-b border-gray-200/60">
                             <div className="w-1/3 p-4 bg-gray-100/50 text-gray-600 font-medium text-sm flex items-center">
                                {t('table.rate')}
                             </div>
                             <div className="w-2/3 p-4 bg-white text-gray-900 font-bold flex items-center uppercase text-sm">
                                {t('table.free')}
                             </div>
                        </div>
                        {/* Garantie */}
                        <div className="flex">
                             <div className="w-1/3 p-4 bg-gray-100/50 text-gray-600 font-medium text-sm">
                                {t('table.guarantee')}
                             </div>
                             <div className="w-2/3 p-4 bg-white">
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" strokeWidth={3} />
                                        <span className="text-sm text-green-700 font-medium">
                                            <span className="font-bold">{formatPrice(5)}</span> {t('table.creditDelay', { amount: '' }).trim()}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" strokeWidth={3} />
                                        <span className="text-sm text-green-700 font-medium">{t('table.refundNoUpdate')}</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" strokeWidth={3} />
                                        <span className="text-sm text-green-700 font-medium">{t('table.refundNoDelivery')}</span>
                                    </li>
                                </ul>
                             </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs text-gray-400 leading-relaxed px-1">
                        <Info className="w-3 h-3 inline mr-1 -mt-0.5" />
                        {t('disclaimer', { date: '29 déc.', credit: `${formatPrice(1500)} FCFA` })}
                    </p>

                    {/* Fastest Delivery Charts */}
                    <div className="pt-2">
                        <h4 className="text-orange-500 font-bold mb-4 flex items-center gap-2">
                            {t('fastestDelivery', { days: 5 })}
                        </h4>

                        <div className="space-y-3">
                            {[
                                { days: '≤5 jours ouvrés', pct: 6.4 },
                                { days: '6 jours ouvrés', pct: 14.6 },
                                { days: '7 jours ouvrés', pct: 22.2 },
                                { days: '8 jours ouvrés', pct: 22.5 },
                                { days: '9 jours ouvrés', pct: 17.0 },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 text-sm">
                                    <span className="w-28 text-gray-600 font-medium shrink-0">{item.days}</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-[3px] overflow-hidden">
                                        <div 
                                            className="h-full bg-black rounded-[3px]" 
                                            style={{ width: `${item.pct}%` }}
                                        />
                                    </div>
                                    <span className="w-12 text-right text-gray-500 text-xs font-mono">{item.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="relais" className="p-6 text-center">
                    <p className="text-gray-500">{t('comingSoon', { type: t('tabs.relay') })}</p>
                </TabsContent>

                <TabsContent value="express" className="p-6 text-center">
                    <p className="text-gray-500">{t('comingSoon', { type: t('tabs.express') })}</p>
                </TabsContent>
              </>
            )}
        </Tabs>

        {/* Footer Action */}
        {!isSelectable && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-center">
               <button onClick={onClose} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-[3px] transition-all active:scale-[0.98]">
                  {t('understood')}
               </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
