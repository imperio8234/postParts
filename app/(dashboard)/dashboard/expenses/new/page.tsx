import { getExpenseCategories } from '@/app/actions/expenses'
import { NewExpenseForm } from '@/components/expenses/new-expense-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewExpensePage() {
  const categories = await getExpenseCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/expenses">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Registrar Gasto</h1>
      </div>

      <NewExpenseForm categories={categories} />
    </div>
  )
}
