import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportsClient } from '@/components/reports/reports-client'
import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BarChart3 className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Reportes</h1>
      </div>

      <ReportsClient />
    </div>
  )
}
