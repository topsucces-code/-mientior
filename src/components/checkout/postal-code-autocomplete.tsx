"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Loader2, MapPin } from 'lucide-react'
import { fetchCitiesByPostalCode, type City } from '@/lib/checkout-validation'

interface PostalCodeAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onCitySelect?: (city: City) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function PostalCodeAutocomplete({
  value,
  onChange,
  onCitySelect,
  className,
  placeholder = 'Code postal',
  disabled = false,
}: PostalCodeAutocompleteProps) {
  const [suggestions, setSuggestions] = React.useState<City[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Fetch cities when postal code changes
  React.useEffect(() => {
    const loadCities = async () => {
      // Only fetch if we have at least 2 digits
      if (value.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const cities = await fetchCitiesByPostalCode(value)
        setSuggestions(cities)
        if (cities.length > 0) {
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error loading cities:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCities()
  }, [value])

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleCitySelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleCitySelect = (city: City) => {
    onChange(city.postalCode)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onCitySelect?.(city)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={5}
          pattern="[0-9]*"
          inputMode="numeric"
          className="h-12"
          aria-label="Code postal"
          aria-autocomplete="list"
          aria-controls={showSuggestions ? 'postal-suggestions' : undefined}
          aria-expanded={showSuggestions}
          aria-activedescendant={
            selectedIndex >= 0
              ? `postal-suggestion-${selectedIndex}`
              : undefined
          }
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-nuanced-500" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="postal-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-platinum-300 bg-white py-1 shadow-lg"
        >
          {suggestions.map((city, index) => (
            <button
              key={`${city.postalCode}-${city.name}`}
              id={`postal-suggestion-${index}`}
              role="option"
              type="button"
              aria-selected={index === selectedIndex}
              onClick={() => handleCitySelect(city)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
                index === selectedIndex
                  ? 'bg-orange-50 text-anthracite-700'
                  : 'text-nuanced-700 hover:bg-platinum-50'
              )}
            >
              <MapPin className="h-4 w-4 flex-shrink-0 text-nuanced-500" />
              <div className="flex-1">
                <div className="font-medium">{city.name}</div>
                <div className="text-xs text-nuanced-500">
                  {city.postalCode}
                  {city.department && ` • Dép. ${city.department}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
