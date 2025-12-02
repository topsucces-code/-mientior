'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'

interface QASearchProps {
  onSearchChange: (query: string) => void
  placeholder?: string
}

export function QASearch({
  onSearchChange,
  placeholder = 'Search questions and answers...',
}: QASearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    onSearchChange(debouncedQuery)
  }, [debouncedQuery, onSearchChange])

  const handleClear = () => {
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}

// Function to highlight search matches in text
export function highlightSearchMatch(text: string, query: string): string {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

// Function to filter Q&A items by search query
export function filterQABySearch<T extends { question: string; answers?: Array<{ answer: string }> }>(
  items: T[],
  query: string
): T[] {
  if (!query.trim()) return items

  const lowerQuery = query.toLowerCase()

  return items.filter((item) => {
    // Check if query matches question
    if (item.question.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Check if query matches any answer
    if (item.answers) {
      return item.answers.some((answer) =>
        answer.answer.toLowerCase().includes(lowerQuery)
      )
    }

    return false
  })
}
