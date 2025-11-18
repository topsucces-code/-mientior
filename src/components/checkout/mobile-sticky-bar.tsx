"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileStickyBarProps {
  total: number;
  itemCount: number;
  onContinue: () => void;
  ctaLabel: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function MobileStickyBar({
  total,
  itemCount,
  onContinue,
  ctaLabel,
  disabled = false,
  children,
  className,
}: MobileStickyBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Sticky Bar (visible only on mobile) */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 border-t border-platinum-200 bg-white/95 p-4 backdrop-blur-md md:hidden",
          "safe-area-padding-bottom animate-slide-up",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-start"
          >
            <span className="text-xs text-nuanced-600">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </span>
            <span className="text-lg font-bold text-orange-500">
              {total.toFixed(2)} €
            </span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="text-nuanced-600"
            >
              Détail
              <ChevronUp className="ml-1 h-4 w-4" />
            </Button>

            <Button
              onClick={onContinue}
              disabled={disabled}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Détail de la commande</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto pb-24">{children}</div>

          {/* Sticky CTA in Sheet */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-platinum-200 bg-white p-4">
            <Button
              onClick={() => {
                setIsOpen(false);
                onContinue();
              }}
              disabled={disabled}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {ctaLabel}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
