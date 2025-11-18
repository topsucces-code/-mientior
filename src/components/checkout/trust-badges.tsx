"use client";

import { Lock, Truck, RefreshCw, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadge {
  icon: React.ElementType;
  title: string;
  description: string;
}

const defaultBadges: TrustBadge[] = [
  {
    icon: Lock,
    title: "Paiement sécurisé",
    description: "Cryptage SSL 256-bit",
  },
  {
    icon: Truck,
    title: "Livraison gratuite",
    description: "Dès 50€ d'achat",
  },
  {
    icon: RefreshCw,
    title: "Retours 30 jours",
    description: "Satisfait ou remboursé",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    description: "Aide en ligne",
  },
];

interface TrustBadgesProps {
  variant?: "horizontal" | "vertical";
  badges?: TrustBadge[];
  className?: string;
}

export function TrustBadges({
  variant = "horizontal",
  badges = defaultBadges,
  className,
}: TrustBadgesProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        variant === "horizontal"
          ? "grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1",
        className
      )}
    >
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className="flex items-center gap-3 rounded-lg bg-success/5 p-3"
          >
            <div className="flex-shrink-0">
              <Icon className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-anthracite-700">
                {badge.title}
              </p>
              <p className="text-xs text-nuanced-600">{badge.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
