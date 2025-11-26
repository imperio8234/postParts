import { TableLoadingSkeleton } from '@/components/ui/loading-skeleton'

export default function ExpensesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="animate-pulse h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded w-32"></div>
      </div>
      <TableLoadingSkeleton />
    </div>
  )
}
