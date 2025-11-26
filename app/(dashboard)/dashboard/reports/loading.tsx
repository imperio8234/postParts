import { CardLoadingSkeleton } from '@/components/ui/loading-skeleton'

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <CardLoadingSkeleton />
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg border p-6">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
