'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface SizeMeasurement {
  size: string
  chest?: number
  waist?: number
  hips?: number
  length?: number
  inseam?: number
  sleeve?: number
  unit: 'cm' | 'in'
}

export interface SizeGuideData {
  id: string
  categoryId: string
  measurements: SizeMeasurement[]
  instructions?: string
  fitRecommendations?: {
    size: string
    recommendation: string
  }[]
}

interface SizeGuideModalProps {
  isOpen: boolean
  onClose: () => void
  sizeGuide: SizeGuideData | null
  onSizeSelect?: (size: string) => void
}

export function SizeGuideModal({
  isOpen,
  onClose,
  sizeGuide,
  onSizeSelect,
}: SizeGuideModalProps) {
  const [unit, setUnit] = useState<'cm' | 'in'>('cm')

  // Keyboard navigation support (Requirements 15.1)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'u':
        case 'U':
          // Toggle unit with 'u' key
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setUnit((prev) => (prev === 'cm' ? 'in' : 'cm'))
          }
          break
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!sizeGuide) {
    return null
  }

  const convertMeasurement = (value: number | undefined, fromUnit: 'cm' | 'in'): number => {
    if (value === undefined) return 0
    
    if (fromUnit === unit) {
      return value
    }
    
    // Convert between cm and inches
    if (fromUnit === 'cm' && unit === 'in') {
      return Math.round((value / 2.54) * 10) / 10
    } else {
      return Math.round((value * 2.54) * 10) / 10
    }
  }

  const handleSizeClick = (size: string) => {
    if (onSizeSelect) {
      onSizeSelect(size)
    }
    onClose()
  }

  const measurementFields = [
    { key: 'chest', label: 'Chest' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'length', label: 'Length' },
    { key: 'inseam', label: 'Inseam' },
    { key: 'sleeve', label: 'Sleeve' },
  ] as const

  // Get available measurement fields
  const availableFields = measurementFields.filter(field =>
    sizeGuide.measurements.some(m => m[field.key] !== undefined)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Size Guide</DialogTitle>
          <DialogDescription>
            Find your perfect fit with our detailed size measurements
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="measurements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="measurements">Measurements</TabsTrigger>
            <TabsTrigger value="fit">Fit Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="measurements" className="space-y-4">
            {/* Unit Toggle */}
            <div className="flex justify-end gap-2" role="group" aria-label="Unit selection">
              <Button
                variant={unit === 'cm' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUnit('cm')}
                aria-label="Switch to centimeters"
                aria-pressed={unit === 'cm'}
              >
                CM
              </Button>
              <Button
                variant={unit === 'in' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUnit('in')}
                aria-label="Switch to inches"
                aria-pressed={unit === 'in'}
              >
                IN
              </Button>
            </div>

            {/* Measurements Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" role="table" aria-label="Size measurements table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold" scope="col">Size</th>
                    {availableFields.map(field => (
                      <th key={field.key} className="text-center p-3 font-semibold" scope="col">
                        {field.label} ({unit})
                      </th>
                    ))}
                    <th className="text-center p-3 font-semibold" scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.measurements.map((measurement, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <th scope="row" className="p-3 font-medium text-left">{measurement.size}</th>
                      {availableFields.map(field => (
                        <td key={field.key} className="text-center p-3">
                          {measurement[field.key] !== undefined
                            ? convertMeasurement(measurement[field.key], measurement.unit)
                            : '-'}
                        </td>
                      ))}
                      <td className="text-center p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSizeClick(measurement.size)}
                          aria-label={`Select size ${measurement.size}`}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Instructions */}
            {sizeGuide.instructions && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">How to Measure</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {sizeGuide.instructions}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fit" className="space-y-4">
            {sizeGuide.fitRecommendations && sizeGuide.fitRecommendations.length > 0 ? (
              <div className="space-y-3">
                {sizeGuide.fitRecommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Size {rec.size}</h4>
                        <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSizeClick(rec.size)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fit recommendations available for this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
