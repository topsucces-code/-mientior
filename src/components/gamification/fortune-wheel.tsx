'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { RippleButton } from '@/components/ui/ripple-button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Gift } from 'lucide-react'

export interface WheelSegment {
  id: string
  label: string
  value: string
  color: string
  probability: number
}

export interface FortuneWheelProps {
  segments: WheelSegment[]
  onSpin?: (result: WheelSegment) => void
  onComplete?: (result: WheelSegment) => void
  disabled?: boolean
  spinsRemaining?: number
}

export function FortuneWheel({
  segments,
  onSpin,
  onComplete,
  disabled = false,
  spinsRemaining = 1,
}: FortuneWheelProps) {
  const [isSpinning, setIsSpinning] = React.useState(false)
  const [rotation, setRotation] = React.useState(0)
  const [result, setResult] = React.useState<WheelSegment | null>(null)
  const [showConfetti, setShowConfetti] = React.useState(false)

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const wheelRef = React.useRef<HTMLDivElement>(null)

  // Draw wheel on canvas
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw segments
    const anglePerSegment = (2 * Math.PI) / segments.length
    segments.forEach((segment, index) => {
      const startAngle = index * anglePerSegment - Math.PI / 2
      const endAngle = startAngle + anglePerSegment

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = segment.color
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw text
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + anglePerSegment / 2)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Inter'
      ctx.fillText(segment.label, radius * 0.7, 5)
      ctx.restore()
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#FF6B00'
    ctx.lineWidth = 4
    ctx.stroke()
  }, [segments])

  const selectWinner = (): WheelSegment => {
    // Weighted random selection based on probability
    const totalProbability = segments.reduce((sum, s) => sum + s.probability, 0)
    let random = Math.random() * totalProbability

    for (const segment of segments) {
      random -= segment.probability
      if (random <= 0) {
        return segment
      }
    }

    return segments[0]!
  }

  const handleSpin = () => {
    if (isSpinning || disabled || spinsRemaining <= 0) return

    setIsSpinning(true)
    setResult(null)
    setShowConfetti(false)

    const winner = selectWinner()
    const winnerIndex = segments.findIndex((s) => s.id === winner.id)
    const anglePerSegment = 360 / segments.length
    const targetAngle = 360 - (winnerIndex * anglePerSegment + anglePerSegment / 2)
    const spins = 5 // Number of full rotations
    const finalRotation = rotation + spins * 360 + targetAngle

    onSpin?.(winner)

    // Animate rotation
    setRotation(finalRotation)

    // Complete after animation
    setTimeout(() => {
      setIsSpinning(false)
      setResult(winner)
      setShowConfetti(true)
      onComplete?.(winner)

      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000)
    }, 4000)
  }

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* Spins Remaining Badge */}
      {spinsRemaining > 0 && (
        <Badge variant="new" size="lg" className="absolute -top-4 right-0 z-10">
          <Sparkles className="h-4 w-4" />
          {spinsRemaining} {spinsRemaining === 1 ? 'tour' : 'tours'} restant{spinsRemaining > 1 ? 's' : ''}
        </Badge>
      )}

      {/* Wheel Container */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="h-0 w-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-orange-500 drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className={cn(
            'relative transition-transform duration-[4000ms] ease-out',
            isSpinning && 'pointer-events-none'
          )}
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="drop-shadow-2xl"
          />
        </div>

        {/* Center Button */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-elevation-3">
            <Gift className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Confetti Effect */}
        {showConfetti && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-[confetti_3s_ease-out_forwards]"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  animationDelay: `${Math.random() * 0.5}s`,
                  '--confetti-x': `${(Math.random() - 0.5) * 200}px`,
                  '--confetti-y': `${Math.random() * 400 + 200}px`,
                  '--confetti-rotation': `${Math.random() * 720}deg`,
                } as React.CSSProperties}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: segments[Math.floor(Math.random() * segments.length)]?.color || '#FF6B00',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spin Button */}
      <RippleButton
        variant="gradient"
        size="lg"
        onClick={handleSpin}
        disabled={disabled || isSpinning || spinsRemaining <= 0}
        loading={isSpinning}
        className="min-w-[200px] text-lg font-bold shadow-elevation-3"
      >
        {isSpinning ? 'Tournage...' : spinsRemaining <= 0 ? 'Plus de tours' : 'Tourner la roue !'}
      </RippleButton>

      {/* Result Display */}
      {result && !isSpinning && (
        <div className="animate-scale-in rounded-lg bg-gradient-to-r from-aurore-500 to-aurore-600 p-6 text-center shadow-elevation-3">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-anthracite-500">
            Félicitations !
          </p>
          <p className="text-2xl font-bold text-white">{result.label}</p>
          <p className="mt-2 text-sm text-anthracite-500">{result.value}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes confetti {
          to {
            transform: translate(var(--confetti-x), var(--confetti-y)) rotate(var(--confetti-rotation));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

