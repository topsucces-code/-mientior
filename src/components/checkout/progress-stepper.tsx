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
    label: 'Livraison',
    description: 'Adresse & mode de livraison',
  },
  {
    id: 'payment',
    label: 'Paiement',
    description: 'Informations bancaires',
  },
  {
    id: 'review',
    label: 'Confirmation',
    description: 'Vérification finale',
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
  const progressPercentage = (currentStepIndex / (steps.length - 1)) * 100

  const getStepStatus = (stepId: CheckoutStep) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Indicator */}
      <div className="mb-4 flex items-center justify-between text-sm text-nuanced-600">
        <span className="font-medium">
          Étape {currentStepIndex + 1} sur {steps.length}
        </span>
      </div>

      <nav aria-label="Progression du paiement">
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
                      'absolute left-[calc(50%+1rem)] top-5 hidden h-0.5 w-full transition-colors duration-300 sm:block',
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
                    'group relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-12 sm:w-12',
                    isCompleted && 'border-orange-500 bg-orange-500 hover:bg-orange-600',
                    isCurrent && 'animate-pulse-ring border-orange-500 bg-white',
                    !isCompleted && !isCurrent && 'border-platinum-300 bg-white',
                    isClickable && 'cursor-pointer hover:scale-110',
                    !isClickable && 'cursor-default'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white sm:h-6 sm:w-6" aria-hidden="true" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold sm:text-base',
                        isCurrent ? 'text-orange-500' : 'text-nuanced-500'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-3 flex flex-col items-center text-center">
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

      {/* Linear Progress Bar */}
      <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-platinum-200">
        <div
          className="h-full bg-orange-600 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
