import { CardLoadingSkeleton } from '@/components/ui/loading-skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      </div>
      <CardLoadingSkeleton />
      <div className="animate-pulse mt-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
