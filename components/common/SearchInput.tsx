import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
}

export function SearchInput({
  placeholder = '검색...',
  value,
  onChange,
  onSearch,
}: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value)
    }
  }

  const handleClear = () => {
    onChange('')
    if (onSearch) {
      onSearch('')
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="text-secondary-400 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-secondary-400 hover:text-secondary-600 absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {onSearch && (
        <Button onClick={() => onSearch(value)} size="sm">
          검색
        </Button>
      )}
    </div>
  )
}
