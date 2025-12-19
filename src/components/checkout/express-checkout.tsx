"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CartItem } from "@/types";

interface ExpressCheckoutProps {
  total: number;
  items: CartItem[];
  onSuccess?: (paymentData: unknown) => void;
  className?: string;
}

export function ExpressCheckout({
  total,
  items,
  onSuccess,
  className,
}: ExpressCheckoutProps) {
  const [availableMethods, setAvailableMethods] = useState({
    applePay: false,
    googlePay: false,
    paypal: true, // PayPal is generally always available
  });
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    // Check for Apple Pay availability
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      setAvailableMethods((prev) => ({ ...prev, applePay: true }));
    }

    // Check for Google Pay availability
    // This would require Google Pay API integration
    if (typeof window !== "undefined" && window.google?.payments) {
      setAvailableMethods((prev) => ({ ...prev, googlePay: true }));
    }
  }, []);

  const handleApplePayClick = async () => {
    if (!window.ApplePaySession) {
      toast.error("Apple Pay non disponible sur cet appareil");
      return;
    }

    setLoading("apple");
    try {
      // Create Apple Pay payment request
      const paymentRequest: ApplePayJS.ApplePayPaymentRequest = {
        countryCode: "CI",
        currencyCode: "XOF",
        supportedNetworks: ["visa", "masterCard", "amex"],
        merchantCapabilities: ["supports3DS"],
        total: {
          label: "Total",
          amount: total.toFixed(2),
        },
      };

      const session = new ApplePaySession(3, paymentRequest);

      // Handle merchant validation
      session.onvalidatemerchant = async (event) => {
        try {
          const response = await fetch("/api/checkout/apple-pay/validate-merchant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ validationURL: event.validationURL }),
          });

          const merchantSession = await response.json();
          session.completeMerchantValidation(merchantSession);
        } catch (error) {
          console.error("Merchant validation error:", error);
          session.abort();
          toast.error("Erreur de validation Apple Pay");
        }
      };

      // Handle payment authorization
      session.onpaymentauthorized = async (event) => {
        try {
          const response = await fetch("/api/checkout/apple-pay/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment: event.payment,
              items,
              total,
            }),
          });

          const result = await response.json();

          if (result.success) {
            session.completePayment(ApplePaySession.STATUS_SUCCESS);
            if (onSuccess) {
              onSuccess(result);
            }
            toast.success("Paiement Apple Pay réussi");
          } else {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            toast.error("Échec du paiement Apple Pay");
          }
        } catch (error) {
          console.error("Payment authorization error:", error);
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          toast.error("Erreur lors du paiement Apple Pay");
        }
      };

      session.begin();
    } catch (error) {
      console.error("Apple Pay error:", error);
      toast.error("Erreur Apple Pay");
    } finally {
      setLoading(null);
    }
  };

  const handleGooglePayClick = async () => {
    if (!window.google?.payments) {
      toast.error("Google Pay non disponible");
      return;
    }

    setLoading("google");
    try {
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: "PRODUCTION",
      });

      const paymentDataRequest: google.payments.api.PaymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "VISA", "AMEX"],
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "paystack",
                gatewayMerchantId: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || "",
          merchantName: "Mientior",
        },
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPrice: total.toFixed(2),
          currencyCode: "XOF",
          countryCode: "CI",
        },
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      // Process the payment
      const response = await fetch("/api/checkout/google-pay/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentData,
          items,
          total,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess(result);
        }
        toast.success("Paiement Google Pay réussi");
      } else {
        toast.error("Échec du paiement Google Pay");
      }
    } catch (error: unknown) {
      console.error("Google Pay error:", error);
      // Don't show error if user cancelled
      const errorObj = error as { statusCode?: string };
      if (errorObj.statusCode !== "CANCELED") {
        toast.error("Erreur Google Pay");
      }
    } finally {
      setLoading(null);
    }
  };

  const handlePayPalClick = async () => {
    setLoading("paypal");
    try {
      // Generate PayPal Express URL
      const response = await fetch("/api/checkout/paypal/generate-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total,
        }),
      });

      const result = await response.json();

      if (result.success && result.url) {
        // Redirect to PayPal
        window.location.href = result.url;
      } else {
        toast.error("Erreur lors de la génération du lien PayPal");
      }
    } catch (error) {
      console.error("PayPal error:", error);
      toast.error("Erreur PayPal");
      setLoading(null);
    }
    // Don't reset loading for PayPal as we're redirecting
  };

  // Only show if at least one method is available
  const hasAvailableMethods = Object.values(availableMethods).some(Boolean);

  if (!hasAvailableMethods) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-base font-semibold text-anthracite-700 mb-4">Paiement express</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {availableMethods.applePay && (
            <Button
              type="button"
              variant="outline"
              onClick={handleApplePayClick}
              disabled={loading !== null}
              className="express-btn h-14 bg-black text-white hover:bg-gray-900 hover:text-white border-black hover:-translate-y-0.5 transition-all shadow-elevation-1 hover:shadow-elevation-2"
            >
              {loading === "apple" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="font-semibold">Pay</span>
                </div>
              )}
            </Button>
          )}

          {availableMethods.googlePay && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGooglePayClick}
              disabled={loading !== null}
              className="express-btn h-14 bg-white hover:bg-gray-50 hover:-translate-y-0.5 transition-all shadow-elevation-1 hover:shadow-elevation-2"
            >
              {loading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 512 512" fill="none">
                    <path d="M113.47 309.408L95.648 375.94l-65.139 1.378C11.042 341.211 0 299.9 0 256c0-42.451 10.324-82.483 28.624-117.732h.014L86.63 148.9l25.404 57.644c-5.317 15.501-8.215 32.141-8.215 49.456.002 18.792 3.406 36.797 9.651 53.408z" fill="#FBBB00"/>
                    <path d="M507.527 208.176C510.467 223.662 512 239.655 512 256c0 18.328-1.927 36.206-5.598 53.451-12.462 58.683-45.025 109.925-90.134 146.187l-.014-.014-73.044-3.727-10.338-64.535c29.932-17.554 53.324-45.025 65.646-77.911h-136.89V208.176h245.899z" fill="#518EF8"/>
                    <path d="M416.253 455.624l.014.014C372.396 490.901 316.666 512 256 512c-97.491 0-182.252-54.491-225.491-134.681l82.961-67.91c21.619 57.698 77.278 98.771 142.53 98.771 28.047 0 54.323-7.582 76.87-20.818l83.383 68.262z" fill="#28B446"/>
                    <path d="M419.404 58.936l-82.933 67.896C313.136 112.246 285.552 103.82 256 103.82c-66.729 0-123.429 42.957-143.965 102.724l-83.397-68.276h-.014C71.23 56.123 157.06 0 256 0c62.115 0 119.068 22.126 163.404 58.936z" fill="#F14336"/>
                  </svg>
                  <span className="font-semibold">Pay</span>
                </div>
              )}
            </Button>
          )}

          {availableMethods.paypal && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePayPalClick}
              disabled={loading !== null}
              className="express-btn h-14 bg-[#0070BA] text-white hover:bg-[#005ea6] hover:text-white border-[#0070BA] hover:-translate-y-0.5 transition-all shadow-elevation-1 hover:shadow-elevation-2"
            >
              {loading === "paypal" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="font-bold text-lg">PayPal</span>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px flex-1 bg-platinum-200" />
          <span className="text-sm font-medium text-nuanced-600">OU</span>
          <div className="h-px flex-1 bg-platinum-200" />
        </div>

        <p className="text-center text-sm text-nuanced-600">
          Continuer avec les coordonnées classiques
        </p>
      </div>
    </div>
  );
}

// Type declarations
declare global {
  interface Window {
    ApplePaySession?: typeof ApplePaySession;
    google?: {
      payments?: {
        api: {
          PaymentsClient: new (options: google.payments.api.PaymentsClientOptions) => google.payments.api.PaymentsClient;
        };
      };
    };
  }
}

// ApplePaySession instance type
interface ApplePaySessionInstance {
  onvalidatemerchant: (event: ApplePayJS.ApplePayValidateMerchantEvent) => void;
  onpaymentauthorized: (event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => void;
  completeMerchantValidation(merchantSession: unknown): void;
  completePayment(status: number): void;
  begin(): void;
  abort(): void;
}

// ApplePaySession static interface
interface ApplePaySessionConstructor {
  canMakePayments(): boolean;
  new (version: number, paymentRequest: ApplePayJS.ApplePayPaymentRequest): ApplePaySessionInstance;
  STATUS_SUCCESS: number;
  STATUS_FAILURE: number;
}

declare const ApplePaySession: ApplePaySessionConstructor;

// ApplePayJS types - using global interface instead of namespace for ES2015 module compatibility
interface ApplePayPaymentRequest {
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  total: {
    label: string;
    amount: string;
  };
}

interface ApplePayValidateMerchantEvent {
  validationURL: string;
}

interface ApplePayPaymentAuthorizedEvent {
  payment: {
    token: {
      paymentData: Record<string, unknown>;
      paymentMethod: Record<string, unknown>;
      transactionIdentifier: string;
    };
    billingContact?: Record<string, unknown>;
    shippingContact?: Record<string, unknown>;
  };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace ApplePayJS {
  interface ApplePayPaymentRequest {
    countryCode: string;
    currencyCode: string;
    supportedNetworks: string[];
    merchantCapabilities: string[];
    total: {
      label: string;
      amount: string;
    };
  }

  interface ApplePayValidateMerchantEvent {
    validationURL: string;
  }

  interface ApplePayPaymentAuthorizedEvent {
    payment: {
      token: {
        paymentData: Record<string, unknown>;
        paymentMethod: Record<string, unknown>;
        transactionIdentifier: string;
      };
      billingContact?: Record<string, unknown>;
      shippingContact?: Record<string, unknown>;
    };
  }
}

// Google Pay types - using interfaces
interface GooglePaymentsClientOptions {
  environment: "TEST" | "PRODUCTION";
}

interface GooglePaymentDataRequest {
  apiVersion: number;
  apiVersionMinor: number;
  allowedPaymentMethods: GooglePaymentMethod[];
  merchantInfo: GoogleMerchantInfo;
  transactionInfo: GoogleTransactionInfo;
}

interface GooglePaymentMethod {
  type: string;
  parameters: {
    allowedAuthMethods: string[];
    allowedCardNetworks: string[];
  };
  tokenizationSpecification: {
    type: string;
    parameters: {
      gateway: string;
      gatewayMerchantId: string;
    };
  };
}

interface GoogleMerchantInfo {
  merchantId: string;
  merchantName: string;
}

interface GoogleTransactionInfo {
  totalPriceStatus: string;
  totalPrice: string;
  currencyCode: string;
  countryCode: string;
}

interface GooglePaymentData {
  paymentMethodData: Record<string, unknown>;
}

interface GooglePaymentsClient {
  loadPaymentData(request: GooglePaymentDataRequest): Promise<GooglePaymentData>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace google {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace payments {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace api {
      type PaymentsClientOptions = GooglePaymentsClientOptions;
      type PaymentsClient = GooglePaymentsClient;
      type PaymentDataRequest = GooglePaymentDataRequest;
      type PaymentMethod = GooglePaymentMethod;
      type MerchantInfo = GoogleMerchantInfo;
      type TransactionInfo = GoogleTransactionInfo;
      type PaymentData = GooglePaymentData;
    }
  }
}

