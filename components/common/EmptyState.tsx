import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-secondary-100 mb-4 rounded-full p-4">
        <Icon className="text-secondary-400 h-8 w-8" />
      </div>
      <h3 className="text-secondary-900 mb-1 text-lg font-semibold">{title}</h3>
      {description && <p className="text-secondary-500 mb-6 max-w-sm text-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}
