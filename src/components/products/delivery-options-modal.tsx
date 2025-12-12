import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';

interface DeliveryOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeliveryOptionsModal({ isOpen, onClose }: DeliveryOptionsModalProps) {
  const [activeTab, setActiveTab] = useState('standard');
  const t = useTranslations('products.pdp.delivery');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white gap-0 rounded-2xl">
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

            <TabsContent value="standard" className="p-6 space-y-6 mt-0">
                {/* Banner */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 text-white font-bold">
                        <span className="bg-white text-orange-600 px-1.5 py-0.5 text-xs rounded font-black tracking-tighter">TEMU</span>
                        <span className="text-white/80">×</span>
                        <span>colissimo</span>
                    </div>
                    <div className="flex items-center gap-1 text-white text-sm font-medium">
                        <span>{t('banner.slogan')}</span>
                        <span className="text-lg">›</span>
                    </div>
                </div>

                {/* Info Table */}
                <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    {/* Delai */}
                    <div className="flex border-b border-gray-200/60">
                         <div className="w-1/3 p-4 bg-gray-100/50 text-gray-600 font-medium text-sm flex items-center">
                            {t('table.delay')}
                         </div>
                         <div className="w-2/3 p-4 bg-white text-gray-900 font-semibold flex items-center">
                            5-10 jours ouvrés
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
                    {t.rich('disclaimer', {
                        date: <span className="text-gray-600 font-medium">29 déc.</span>,
                        credit: <span className="text-orange-600 bg-orange-50 px-1 rounded font-bold">{formatPrice(5)} de crédit</span>
                    })}
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
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-black rounded-full" 
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
        </Tabs>

        {/* Footer Action */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-center">
             <button onClick={onClose} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-full transition-all active:scale-[0.98]">
                {t('understood')}
             </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
