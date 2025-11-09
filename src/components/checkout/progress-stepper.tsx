'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CheckoutStep = 'shipping' | 'payment' | 'review'

interface Step {
  id: CheckoutStep
  label: string
  description: string
}

const steps: Step[] = [
  {
    id: 'shipping',
    label: 'Shipping',
    description: 'Address & delivery',
  },
  {
    id: 'payment',
    label: 'Payment',
    description: 'Payment method',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Confirm order',
  },
]

interface ProgressStepperProps {
  currentStep: CheckoutStep
  completedSteps: CheckoutStep[]
  onStepClick?: (step: CheckoutStep) => void
  className?: string
}

export function ProgressStepper({
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: ProgressStepperProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const getStepStatus = (stepId: CheckoutStep) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <div className={cn('w-full', className)}>
      <nav aria-label="Checkout progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id)
            const isCompleted = status === 'completed'
            const isCurrent = status === 'current'
            const isClickable = isCompleted && onStepClick

            return (
              <li
                key={step.id}
                className={cn(
                  'relative flex flex-1 flex-col items-center',
                  index !== steps.length - 1 && 'pr-4 sm:pr-8'
                )}
              >
                {/* Connector Line */}
                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[calc(50%+1rem)] top-4 hidden h-0.5 w-full sm:block',
                      isCompleted
                        ? 'bg-orange-500'
                        : 'bg-platinum-300'
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'group relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-orange-500 bg-orange-500 hover:bg-orange-600',
                    isCurrent && 'border-orange-500 bg-white',
                    !isCompleted && !isCurrent && 'border-platinum-300 bg-white',
                    isClickable && 'cursor-pointer hover:scale-110',
                    !isClickable && 'cursor-default'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        isCurrent ? 'text-orange-500' : 'text-nuanced-500'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-2 flex flex-col items-center text-center">
                  <span
                    className={cn(
                      'text-xs font-semibold sm:text-sm',
                      isCurrent || isCompleted
                        ? 'text-anthracite-700'
                        : 'text-nuanced-500'
                    )}
                  >
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 hidden text-xs sm:block',
                      isCurrent || isCompleted
                        ? 'text-nuanced-600'
                        : 'text-nuanced-400'
                    )}
                  >
                    {step.description}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
