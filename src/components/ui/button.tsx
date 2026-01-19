import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-turquoise-600 text-white hover:bg-turquoise-700',
        gradient:
          'bg-turquoise-700 text-white hover:bg-turquoise-800 shadow-elevation-2 hover:shadow-elevation-3',
        copper:
          'bg-copper-600 text-white hover:bg-copper-700 shadow-elevation-2 hover:shadow-elevation-3',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-taupe-300 bg-background hover:bg-taupe-50 hover:text-taupe-700 hover:border-taupe-400',
        secondary: 'bg-taupe-100 text-taupe-700 hover:bg-taupe-200',
        ghost: 'hover:bg-taupe-100 hover:text-taupe-700',
        link: 'text-turquoise-600 underline-offset-4 hover:underline hover:text-turquoise-700',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'
    // When asChild is true, Slot expects a single child.
    // If isLoading is true and !asChild, we render Loader2 and children.
    // If asChild is true, we just render children, but with disabled prop.

    // IMPORTANT: Slot expects a SINGLE element as child.
    // If we pass `children` which might be text or multiple elements, Slot might complain if it's not a single element.
    // However, standard Button usage often passes text strings.
    // If asChild is false, Comp is "button", so multiple children are fine.
    // If asChild is true, the user is responsible for passing a single child to Button.

    // The error "React.Children.only expected to receive a single React element child" comes from Slot
    // when it receives more than one child.
    // In the failing test case:
    // <Button asChild isLoading> <a href="#">Link Button</a> </Button>
    // Here `children` is `<a href="#">Link Button</a>`.
    // isLoading is true. asChild is true.
    // {isLoading && !asChild && ...} is false.
    // So we render just {children}.
    // So Slot receives {children}, which is a single <a> element.
    // Why did it fail?

    // Ah, `Loader2` rendering condition: `isLoading && !asChild`.
    // If asChild is true, `Loader2` is NOT rendered.
    // So `Comp` receives only `children`.

    // Let's re-read the error.
    // "React.Children.only expected to receive a single React element child."
    // This is thrown by `Slot`.

    // Wait, maybe my previous `write_file` didn't apply correctly?
    // Or maybe `children` is somehow being treated as multiple children?
    // No, in the test it is a single element.

    // Wait, look at the code:
    /*
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                disabled={isLoading || disabled}
                ref={ref}
                {...props}
            >
                {isLoading && !asChild && <Loader2 className="h-4 w-4 animate-spin" />}
                {children}
            </Comp>
        )
        */
    // If `isLoading && !asChild` evaluates to `false` (boolean), React doesn't render it.
    // But if it evaluates to `undefined` or something else?
    // `isLoading` is boolean. `!asChild` is boolean. Result is boolean.
    // So `false` is returned.
    // React children: `[false, children]`.
    // Slot sees an array of children: `[false, <a>...</a>]`.
    // Even though `false` is not rendered, `Slot` might strictly check `props.children`.

    // Radix UI Slot implementation iterates over children.
    // If it sees more than one child (even if one is null/false), it might throw if it uses React.Children.only.
    // React.Children.only throws if there is not exactly one child.
    // `[false, element]` is NOT a single child. It's an array.

    // FIX: Ensure we pass exactly what Slot needs.

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          disabled={isLoading || disabled}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
