"use client";

import { useEffect, useState } from "react";
import { Check, Download, Package, Truck, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Order } from "@/types";
import { trackPurchase } from "@/lib/analytics";

interface OrderConfirmationProps {
  order: Order;
}

export function OrderConfirmation({ order }: OrderConfirmationProps) {
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  useEffect(() => {
    // Track purchase conversion
    trackPurchase(order);

    // Trigger confetti animation
    if (!confettiTriggered && typeof window !== "undefined") {
      setConfettiTriggered(true);
      // Dynamically import canvas-confetti
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FF6B00", "#FFC107", "#10B981"],
        });
      });
    }
  }, [order, confettiTriggered]);

  const customerName = order.customer
    ? `${order.customer.firstName} ${order.customer.lastName}`
    : order.shippingAddress.firstName + " " + order.shippingAddress.lastName;

  return (
    <div className="min-h-screen bg-platinum-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Success Animation */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            {/* Animated Rings */}
            <div className="absolute inset-0 animate-ring-expand rounded-full bg-success" />
            <div
              className="absolute inset-0 animate-ring-expand rounded-full bg-success"
              style={{ animationDelay: "0.3s" }}
            />

            {/* Success Checkmark */}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-success animate-scale-in">
              <Check className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-anthracite-700 animate-fade-in-up">
            Merci pour votre commande, {customerName.split(" ")[0]} !
          </h1>
          <p className="text-lg text-nuanced-600 animate-fade-in-up animation-delay-100">
            Votre commande a été confirmée et sera bientôt expédiée
          </p>
        </div>

        {/* Order Info */}
        <Card className="mb-6 animate-fade-in-up animation-delay-200">
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-nuanced-600">Numéro de commande</p>
                <p className="text-lg font-semibold text-anthracite-700">
                  {order.orderNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-nuanced-600">Date de commande</p>
                <p className="text-lg font-semibold text-anthracite-700">
                  {format(new Date(order.createdAt), "d MMMM yyyy", {
                    locale: fr,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-3 animate-fade-in-up animation-delay-300">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/account/orders/${order.id}`}>
              <Package className="mr-2 h-4 w-4" />
              Suivre ma commande
            </Link>
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Télécharger la facture
          </Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Continuer mes achats
            </Link>
          </Button>
        </div>

        {/* Order Summary */}
        <Card className="mb-6 animate-fade-in-up animation-delay-400">
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-anthracite-700">
              Récapitulatif de la commande
            </h2>

            {/* Items */}
            <div className="mb-6 space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-platinum-200 bg-platinum-100" />
                  <div className="flex-1">
                    <p className="font-medium text-anthracite-700">
                      {item.name || item.productName}
                    </p>
                    {item.variant && (
                      <p className="text-sm text-nuanced-600">
                        {item.variant.size && `Taille: ${item.variant.size}`}
                        {item.variant.color &&
                          ` • Couleur: ${item.variant.color}`}
                      </p>
                    )}
                    <p className="text-sm text-nuanced-600">
                      Quantité: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-anthracite-700">
                      {((item.subtotal || item.price * item.quantity)).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 border-t border-platinum-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-nuanced-600">Sous-total</span>
                <span className="font-medium text-anthracite-700">
                  {order.subtotal.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-nuanced-600">Livraison</span>
                <span className="font-medium text-anthracite-700">
                  {(order.shippingCost || order.shippingTotal || 0).toFixed(2)} €
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-nuanced-600">Réduction</span>
                  <span className="font-semibold text-success">
                    -{order.discount.toFixed(2)} €
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-nuanced-600">TVA</span>
                <span className="font-medium text-anthracite-700">
                  {(order.tax || order.taxTotal || 0).toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between border-t border-platinum-200 pt-2">
                <span className="font-semibold text-anthracite-700">Total</span>
                <span className="text-xl font-bold text-orange-500">
                  {order.total.toFixed(2)} €
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 animate-fade-in-up animation-delay-500">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-anthracite-700">
                <Truck className="h-5 w-5 text-orange-500" />
                Adresse de livraison
              </h3>
              <p className="text-sm text-nuanced-700">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                <br />
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 && (
                  <>
                    <br />
                    {order.shippingAddress.line2}
                  </>
                )}
                <br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
                <br />
                {order.shippingAddress.country}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-anthracite-700">
                <Package className="h-5 w-5 text-orange-500" />
                Mode de livraison
              </h3>
              <p className="text-sm font-medium text-nuanced-700">
                {order.shipping?.method || order.shippingMethod || "Standard"}
              </p>
              {order.estimatedDelivery && (
                <p className="mt-2 text-sm text-nuanced-600">
                  Livraison estimée:{" "}
                  {typeof order.estimatedDelivery === "object" &&
                  "min" in order.estimatedDelivery
                    ? format(
                        new Date(order.estimatedDelivery.min),
                        "d MMM yyyy",
                        { locale: fr }
                      )
                    : format(new Date(order.estimatedDelivery), "d MMM yyyy", {
                        locale: fr,
                      })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="mb-6 animate-fade-in-up animation-delay-600">
          <CardContent className="p-6">
            <h2 className="mb-6 text-xl font-semibold text-anthracite-700">
              Que se passe-t-il maintenant ?
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <Package className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-anthracite-700">
                    Préparation de votre commande
                  </h4>
                  <p className="text-sm text-nuanced-600">
                    Nous préparons vos articles avec soin (24-48h)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-platinum-200">
                  <Truck className="h-5 w-5 text-nuanced-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-anthracite-700">
                    Expédition
                  </h4>
                  <p className="text-sm text-nuanced-600">
                    Vous recevrez un email avec le numéro de suivi
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-platinum-200">
                  <Home className="h-5 w-5 text-nuanced-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-anthracite-700">
                    Livraison
                  </h4>
                  <p className="text-sm text-nuanced-600">
                    Réception de votre colis sous 3-5 jours ouvrés
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="animate-fade-in-up animation-delay-700">
          <CardContent className="p-6 text-center">
            <HelpCircle className="mx-auto mb-3 h-10 w-10 text-orange-500" />
            <h3 className="mb-2 font-semibold text-anthracite-700">
              Besoin d'aide ?
            </h3>
            <p className="mb-4 text-sm text-nuanced-600">
              Notre équipe est là pour vous assister
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/help">Centre d'aide</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/contact">Nous contacter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
