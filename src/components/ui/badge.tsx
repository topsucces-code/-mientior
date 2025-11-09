import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
  {
    variants: {
      variant: {
        // Tier 1 - Urgence (Orange gradient + pulse)
        flash: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-elevation-2 animate-pulse-subtle",
        urgent: "bg-orange-500 text-white shadow-elevation-2",

        // Tier 2 - Performance (Bleu + icône)
        bestseller: "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-elevation-1",
        trending: "bg-blue-500 text-white shadow-elevation-1",

        // Tier 3 - Nouveauté (Gradient aurore)
        new: "bg-gradient-to-r from-aurore-500 to-aurore-600 text-anthracite-500 shadow-elevation-1 animate-shimmer bg-[length:200%_100%]",

        // Autres variantes
        success: "bg-success text-white",
        warning: "bg-warning text-anthracite-500",
        error: "bg-error text-white",
        default: "bg-platinum-200 text-anthracite-500",
        outline: "border border-platinum-400 text-nuanced-500 bg-transparent",

        // Compatibilité
        secondary: "bg-blue-500 text-white",
        destructive: "bg-error text-white",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-[11px] px-2 py-1",
        lg: "text-xs px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  pulse?: boolean
}

function Badge({ className, variant, size, icon, pulse, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, size }),
        pulse && "animate-pulse-subtle",
        className
      )}
      {...props}
    >
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
