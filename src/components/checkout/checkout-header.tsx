"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckoutHeaderProps {
  onBack?: () => void;
}

export function CheckoutHeader({ onBack }: CheckoutHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Retour</span>
        </Button>

        {/* Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <span className="text-xl font-bold text-gray-900">Mientior</span>
        </Link>

        {/* Security Badge */}
        <div className="hidden items-center gap-2 rounded-full bg-success/10 px-4 py-2 sm:flex">
          <Lock className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-success">
            Paiement sécurisé
          </span>
        </div>
      </div>
    </header>
  );
}
