'use client';

import { useState, useMemo } from 'react';
import { Plus, Check, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Product, BundleProduct, BundleProductInfo } from '@/types';

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product;
  bundleProducts: BundleProduct[];
  discount?: number;
}

export function FrequentlyBoughtTogether({
  mainProduct,
  bundleProducts,
  discount = 5,
}: FrequentlyBoughtTogetherProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set([mainProduct.id, ...bundleProducts.map((bp) => bp.product.id)])
  );

  const { addItem } = useCartStore();
  const { toast } = useToast();
  const t = useTranslations('products.pdp.fbt');

  const toggleProduct = (productId: string) => {
    if (productId === mainProduct.id) return;

    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const { total, savings, finalTotal } = useMemo(() => {
    let total = 0;
    let totalDiscount = 0;

    // Main product
    if (selectedProducts.has(mainProduct.id)) {
        total += mainProduct.price;
        // Discount applies if at least one other item is selected
        if (selectedProducts.size > 1) {
             totalDiscount += (mainProduct.price * discount) / 100;
        }
    }

    // Bundle products
    bundleProducts.forEach((bp) => {
      if (selectedProducts.has(bp.product.id)) {
        total += bp.product.price;
        // Discount applies if main product is selected (logic can vary, assuming bundle logic)
        if (selectedProducts.has(mainProduct.id)) {
            const productDiscount = bp.discount !== undefined ? bp.discount : discount;
            totalDiscount += (bp.product.price * productDiscount) / 100;
        }
      }
    });

    return { 
        total, 
        savings: totalDiscount, 
        finalTotal: total - totalDiscount 
    };
  }, [selectedProducts, mainProduct, bundleProducts, discount]);

  const handleAddAllToCart = () => {
    const productsToAdd = [
      mainProduct,
      ...bundleProducts.map((bp) => bp.product),
    ].filter((product) => selectedProducts.has(product.id));

    productsToAdd.forEach((product) => {
      const productStock = 'stock' in product ? (product as { stock: number }).stock : 0
      addItem({
        id: product.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images[0]?.url || '',
        price: product.price,
        quantity: 1,
        stock: productStock,
      });
    });

    toast({
      title: t('packAdded'),
      description: t('packAddedDesc', { amount: savings.toFixed(2) }),
      variant: "default",
    });
  };

  if (bundleProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
      <div className="bg-white rounded-[2rem] border border-cyan-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* Header Section */}
        <div className="px-6 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-50 bg-gradient-to-b from-cyan-50/30 to-white">
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 shadow-sm border border-cyan-100">
               <Sparkles className="h-6 w-6" />
             </div>
             <div>
               <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
                 {t('title')}
               </h2>
               <p className="text-gray-500 mt-1">
                 {t('subtitle')}
               </p>
             </div>
          </div>
          
          {selectedProducts.size > 1 && savings > 0 && (
             <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold border border-orange-100 shadow-sm animate-pulse">
                    <Tag className="h-4 w-4" />
                    <span>{t('bundleOffer', { discount })}</span>
                </div>
             </div>
          )}
        </div>

        <div className="p-4 md:p-5">
            <div className="flex flex-col xl:flex-row items-center gap-6">
                
                {/* Products Chain */}
                <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-3 md:gap-4">
                        
                        {/* Main Product */}
                        <div className="w-full sm:w-56 lg:w-64 shrink-0 relative z-20">
                            <BundleProductCard
                                product={mainProduct}
                                isSelected={selectedProducts.has(mainProduct.id)}
                                onToggle={() => {}}
                                isMainProduct
                            />
                        </div>

                        {/* Bundle Items with Plus Signs */}
                        {bundleProducts.slice(0, 2).map((bundleProduct) => (
                            <div key={bundleProduct.product.id} className="contents sm:flex items-center gap-3 md:gap-4">
                                {/* Connector */}
                                <div className="flex flex-col items-center justify-center h-8 sm:h-auto z-10 my-2 sm:my-0">
                                    <div className="w-6 h-6 rounded-full bg-cyan-50 border border-cyan-100 shadow-sm flex items-center justify-center text-cyan-600">
                                        <Plus className="h-3 w-3" />
                                    </div>
                                </div>

                                <div className="w-full sm:w-56 lg:w-64 shrink-0 relative transition-transform duration-300 hover:-translate-y-1">
                                    <BundleProductCard
                                        product={bundleProduct.product}
                                        isSelected={selectedProducts.has(bundleProduct.product.id)}
                                        onToggle={() => toggleProduct(bundleProduct.product.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Equals Sign (Desktop) */}
                <div className="hidden xl:flex items-center justify-center text-cyan-300/50">
                    <div className="w-8 h-8 rounded-full border-2 border-cyan-50 flex items-center justify-center">
                        <span className="text-xl font-light">=</span>
                    </div>
                </div>

                {/* Total Summary Card */}
                <div className="w-full xl:w-72 shrink-0">
                    <div className="bg-cyan-50/50 rounded-2xl p-5 border border-cyan-100 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-3">{t('summaryTitle')}</h3>
                            
                            <div className="space-y-2 mb-5">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>{t('itemsCount', { count: selectedProducts.size })}</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                                
                                {savings > 0 && (
                                    <div className="flex justify-between text-sm font-medium text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100">
                                        <span>{t('savings')}</span>
                                        <span>-{formatPrice(savings)}</span>
                                    </div>
                                )}
                                
                                <div className="h-px bg-cyan-200/50 my-2" />
                                
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-700">{t('total')}</span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {formatPrice(finalTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddAllToCart}
                            disabled={selectedProducts.size === 0}
                            className={cn(
                                'w-full group relative overflow-hidden rounded-xl bg-orange-500 px-4 py-3.5 text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 hover:shadow-orange-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                            )}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 font-bold text-sm">
                                <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span>{t('addToCart')}</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}

interface BundleProductCardProps {
  product: Product | BundleProductInfo;
  isSelected: boolean;
  onToggle: () => void;
  isMainProduct?: boolean;
}

function BundleProductCard({
  product,
  isSelected,
  onToggle,
  isMainProduct = false,
}: BundleProductCardProps) {
  return (
    <div 
        onClick={!isMainProduct ? onToggle : undefined}
        className={cn(
            "group relative flex flex-row sm:flex-col bg-white rounded-2xl border transition-all duration-300 h-full overflow-hidden",
            isSelected 
                ? "border-cyan-200 shadow-md shadow-cyan-100/50 ring-1 ring-cyan-100" 
                : "border-gray-100 opacity-70 hover:opacity-100 hover:border-cyan-200 border-dashed"
        )}
    >
        {/* Status Badge */}
        {isMainProduct ? (
            <div className="absolute top-3 left-3 z-20">
                <span className="bg-cyan-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    Ce produit
                </span>
            </div>
        ) : (
             <div className="absolute top-3 right-3 z-20">
                <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isSelected 
                        ? "bg-orange-500 border-orange-500 scale-100 shadow-sm" 
                        : "bg-white/80 backdrop-blur-sm border-gray-300 group-hover:border-orange-400 scale-90 opacity-0 group-hover:opacity-100"
                )}>
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
            </div>
        )}

        {/* Image */}
        <div className="relative w-32 h-32 sm:w-full sm:aspect-square shrink-0 bg-gray-50">
             <Image
                src={product.images && product.images.length > 0 && product.images[0]?.url 
                  ? product.images[0].url 
                  : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80'}
                alt={product.images?.[0]?.alt || product.name}
                fill
                className={cn(
                    "object-cover transition-all duration-500",
                    isSelected ? "group-hover:scale-105" : "grayscale"
                )}
                sizes="(max-width: 640px) 128px, 256px"
              />
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center sm:text-center w-full min-w-0 p-3 sm:pt-4">
             <Link 
                href={`/products/${product.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline block group-hover:text-cyan-600 transition-colors"
             >
                <h3 className={cn(
                    "text-sm font-medium leading-tight mb-1 truncate w-full",
                    isSelected ? "text-gray-800" : "text-gray-400 line-through decoration-gray-300",
                    "sm:whitespace-normal sm:line-clamp-2 sm:h-10"
                )}>
                    {product.name}
                </h3>
             </Link>
             
             <div className="mt-auto pt-1">
                <span className={cn(
                    "font-bold transition-colors",
                    isSelected ? "text-gray-900" : "text-gray-400"
                )}>
                    {product.price.toFixed(2)} €
                </span>
             </div>
        </div>
    </div>
  );
}
