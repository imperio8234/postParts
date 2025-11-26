import { TableLoadingSkeleton } from '@/components/ui/loading-skeleton'

export default function ReplenishmentLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="animate-pulse h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded w-40"></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg border p-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
