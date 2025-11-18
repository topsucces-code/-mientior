"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustBadges } from "./trust-badges";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Gift, AlertCircle, Loader2, X, ShieldCheck, RotateCcw, Award } from "lucide-react";
import type { CartItem } from "@/types";

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
}: OrderSummarySidebarProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const displayItems = showAllItems ? items : items.slice(0, 2);
  const remainingCount = items.length - 2;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !onApplyCoupon) return;

    setIsApplying(true);
    setCouponError(null);

    try {
      await onApplyCoupon(couponCode.trim());
      setCouponCode("");
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
                  <p className="text-sm font-semibold text-orange-500">
                    {(item.price * item.quantity).toFixed(2)} €
                  </p>
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
                <label className="flex items-center text-sm font-medium text-anthracite-700">
                  <Gift className="mr-2 h-4 w-4 text-orange-500" />
                  Code promo
                </label>
                <div className="flex gap-2">
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
                    disabled={isApplying}
                    className="flex-1 coupon-input"
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isApplying}
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
              <div className="flex items-center justify-between rounded-md bg-success-light border border-success p-3 applied-coupon">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-sm font-medium text-success-dark">Code appliqué: {appliedCoupon}</p>
                    <p className="text-xs text-success-dark">Réduction de {discount.toFixed(2)} €</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="h-auto p-1 text-success-dark hover:text-success"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 border-t border-platinum-200 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-nuanced-600">Sous-total</span>
              <span className="font-medium text-anthracite-700">
                {subtotal.toFixed(2)} €
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-nuanced-600">Livraison</span>
              {shippingCost === 0 ? (
                <span className="font-semibold text-success">Gratuit</span>
              ) : (
                <span className="font-medium text-anthracite-700">
                  {shippingCost.toFixed(2)} €
                </span>
              )}
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-nuanced-600">Réduction</span>
                <span className="font-semibold text-success">
                  -{discount.toFixed(2)} €
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-nuanced-600">TVA (20%)</span>
              <span className="font-medium text-anthracite-700">
                {tax.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="space-y-1 border-t-2 border-platinum-300 pt-4">
            <div className="flex justify-between">
              <span className="text-base font-bold text-anthracite-700">
                Total
              </span>
              <span className="text-2xl font-bold text-orange-500">
                {total.toFixed(2)} €
              </span>
            </div>
            <p className="text-xs text-right text-nuanced-600">
              TVA incluse: {tax.toFixed(2)} €
            </p>
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
  );
}
