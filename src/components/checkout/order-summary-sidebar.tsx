"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Gift, AlertCircle, Loader2, X, ShieldCheck, RotateCcw, Award, Sparkles, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CartItem } from "@/types";
import { SavingsSummary } from "@/components/cart/savings-summary";
import { PromotionBadge } from "@/components/cart/promotion-badge";
import { calculateDiscountPercentage } from "@/lib/promotion-utils";

interface OrderSummarySidebarProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discount?: number;
  tax: number;
  total: number;
  className?: string;
  appliedCoupon?: string;
  onApplyCoupon?: (code: string) => Promise<void>;
  onRemoveCoupon?: () => void;
  isCalculating?: boolean;
  calculationError?: string;
}

export function OrderSummarySidebar({
  items,
  subtotal,
  shippingCost,
  discount = 0,
  tax,
  total,
  className,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  isCalculating = false,
  calculationError,
}: OrderSummarySidebarProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const displayItems = showAllItems ? items : items.slice(0, 2);
  const remainingCount = items.length - 2;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !onApplyCoupon) return;

    setIsApplying(true);
    setCouponError(null);

    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode("");
      
      // Trigger confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : "Code promo invalide");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (onRemoveCoupon) {
      onRemoveCoupon();
      setCouponError(null);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("checkout-sidebar lg:sticky lg:top-[100px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Résumé de la commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Items Preview */}
            <div className="space-y-3">
              {displayItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-platinum-200">
                    <Image
                      src={item.image || item.productImage || "/placeholder-product.jpg"}
                      alt={item.name || item.productName || "Product"}
                      fill
                      className="object-cover"
                    />
                    {item.quantity > 1 && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                        {item.quantity}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-medium text-anthracite-700 line-clamp-1">
                      {item.name || item.productName}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-nuanced-600">
                        {item.variant.size && `Taille: ${item.variant.size}`}
                        {item.variant.size && item.variant.color && " • "}
                        {item.variant.color && `Couleur: ${item.variant.color}`}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-orange-500">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <PromotionBadge 
                          type="sale" 
                          label={`-${calculateDiscountPercentage(item.compareAtPrice, item.price)}%`} 
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {!showAllItems && remainingCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllItems(true)}
                  className="w-full text-sm text-nuanced-600 hover:text-orange-500"
                >
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Voir tous les articles ({remainingCount} de plus)
                </Button>
              )}

              {showAllItems && items.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllItems(false)}
                  className="w-full text-sm text-nuanced-600 hover:text-orange-500"
                >
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Masquer les articles
                </Button>
              )}
            </div>

            {/* Coupon Code Section */}
            <div className="border-t border-platinum-200 pt-4">
              {!appliedCoupon ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center text-sm font-medium text-anthracite-700">
                      <Gift className="mr-2 h-4 w-4 text-orange-500" />
                      Code promo
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Entrez votre code promo pour bénéficier d'une réduction.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="Entrez votre code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleApplyCoupon();
                          }
                        }}
                        disabled={isApplying || isCalculating}
                        className="flex-1 coupon-input pl-8"
                      />
                      <Gift className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-nuanced-400" />
                    </div>
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isApplying || isCalculating}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {isApplying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Appliquer"
                      )}
                    </Button>
                  </div>
                  {couponError && (
                    <div className="flex items-start gap-2 text-sm text-error coupon-error">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p>{couponError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-md bg-success-light border border-success p-3 applied-coupon group">
                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <PromotionBadge type="manual" label="Code promo" size="sm" />
                        <span className="font-mono font-bold text-success-dark">{appliedCoupon}</span>
                      </div>
                      <p className="text-xs text-success-dark">Réduction de {discount.toFixed(2)} € appliquée</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="h-6 w-6 p-0 text-success-dark hover:text-success hover:bg-success/10 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-success/10 rotate-12">
                    <Gift className="w-16 h-16" />
                  </div>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t border-platinum-200 pt-4">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-nuanced-600">Sous-total</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Prix total des articles avant réductions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {isCalculating ? (
                  <div className="h-4 w-20 bg-platinum-200 animate-pulse rounded" />
                ) : (
                  <span className="font-medium text-anthracite-700 transition-all duration-200">
                    {subtotal.toFixed(2)} €
                  </span>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-nuanced-600">Livraison</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Frais de port calculés selon votre adresse</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {isCalculating ? (
                  <div className="h-4 w-20 bg-platinum-200 animate-pulse rounded" />
                ) : shippingCost === 0 ? (
                  <span className="font-semibold text-success transition-all duration-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Gratuit
                  </span>
                ) : (
                  <span className="font-medium text-anthracite-700 transition-all duration-200">
                    {shippingCost.toFixed(2)} €
                  </span>
                )}
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-1.5">
                    <span className="text-nuanced-600">Réduction</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Total des réductions appliquées</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {isCalculating ? (
                    <div className="h-4 w-20 bg-platinum-200 animate-pulse rounded" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-success-light text-success-dark px-1 rounded">
                        -{calculateDiscountPercentage(subtotal, subtotal - discount)}%
                      </span>
                      <span className="font-semibold text-success transition-all duration-200">
                        -{discount.toFixed(2)} €
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-nuanced-600">TVA</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-nuanced-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Taux de TVA selon votre pays de livraison</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {isCalculating ? (
                  <div className="h-4 w-20 bg-platinum-200 animate-pulse rounded" />
                ) : (
                  <span className="font-medium text-anthracite-700 transition-all duration-200">
                    {tax.toFixed(2)} €
                  </span>
                )}
              </div>
            </div>

            {/* Savings Summary Component */}
            {discount > 0 && (
              <div className="pt-4 border-t border-platinum-200">
                <SavingsSummary 
                  subtotal={subtotal * 100} // Convert back to cents if needed by component, or adjust component
                  discount={discount * 100}
                  finalTotal={total * 100}
                  showConfetti={showConfetti}
                />
              </div>
            )}

            {/* Total */}
            <div className="space-y-1 border-t-2 border-platinum-300 pt-4">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-base font-bold text-anthracite-700">
                  Total
                  {isCalculating && (
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  )}
                </span>
                {isCalculating ? (
                  <div className="h-8 w-32 bg-platinum-200 animate-pulse rounded" />
                ) : (
                  <div className="text-right">
                    <span className="text-2xl font-bold text-orange-500 transition-all duration-300 block">
                      {total.toFixed(2)} €
                    </span>
                    {discount > 0 && (
                      <span className="text-xs text-success font-medium animate-pulse">
                        Économies: {discount.toFixed(2)} €
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isCalculating ? (
                <p className="text-xs text-right text-nuanced-500 italic">
                  Calcul en cours...
                </p>
              ) : (
                <div className="flex justify-end items-center gap-1.5">
                  <p className="text-xs text-right text-nuanced-600 transition-all duration-200">
                    TVA incluse: {tax.toFixed(2)} €
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-nuanced-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Montant total incluant toutes les taxes applicables</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              {calculationError && (
                <div className="flex items-start gap-2 mt-2 p-2 bg-error-light border border-error rounded text-sm text-error">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{calculationError}</p>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="border-t border-platinum-200 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-nuanced-600">
                  <ShieldCheck className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-nuanced-600">
                  <RotateCcw className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Retour gratuit sous 30 jours</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-nuanced-600">
                  <Award className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Garantie satisfait ou remboursé</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
