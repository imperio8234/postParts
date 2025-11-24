'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { openCashRegister, closeCashRegister, getCashRegisterSummary } from '@/app/actions/cash-register'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, CreditCard, ArrowRightLeft, AlertTriangle } from 'lucide-react'

export function OpenCashRegisterButton() {
  const router = useRouter()
  const [initialAmount, setInitialAmount] = useState('100000')
  const [loading, setLoading] = useState(false)

  const handleOpen = async () => {
    setLoading(true)
    try {
      await openCashRegister(parseFloat(initialAmount))
      router.refresh()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="initialAmount">Monto Inicial</Label>
        <Input
          id="initialAmount"
          type="number"
          step="1000"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
          placeholder="100000"
        />
      </div>
      <Button onClick={handleOpen} disabled={loading} className="w-full">
        {loading ? 'Abriendo...' : 'Abrir Caja'}
      </Button>
    </div>
  )
}

type SummaryData = {
  totals: {
    cash: number
    card: number
    transfer: number
    mixed: number
  }
  totalSales: number
  expectedCash: number
  salesCount: number
  totalExpenses: number
  netCash: number
} | null

export function CloseCashRegisterButton({ cashRegisterId }: { cashRegisterId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [summary, setSummary] = useState<SummaryData>(null)

  const [cashAmount, setCashAmount] = useState('')
  const [cardAmount, setCardAmount] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (showForm) {
      loadSummary()
    }
  }, [showForm])

  const loadSummary = async () => {
    const data = await getCashRegisterSummary(cashRegisterId)
    if (data) {
      setSummary(data)
      // Pre-llenar con los valores esperados
      setCardAmount(data.totals.card.toString())
      setTransferAmount(data.totals.transfer.toString())
    }
  }

  const handleClose = async () => {
    if (!cashAmount) {
      alert('Ingresa el efectivo contado')
      return
    }

    setLoading(true)
    try {
      const result = await closeCashRegister({
        cashRegisterId,
        cashAmount: parseFloat(cashAmount) || 0,
        cardAmount: parseFloat(cardAmount) || 0,
        transferAmount: parseFloat(transferAmount) || 0,
        notes: notes || undefined,
      })

      const diff = Number(result.difference)
      const cashDiff = result.cashDifference

      let message = 'Caja cerrada correctamente\n\n'
      if (cashDiff !== 0) {
        message += cashDiff > 0
          ? `Sobrante en efectivo: ${formatCurrency(Math.abs(cashDiff))}\n`
          : `Faltante en efectivo: ${formatCurrency(Math.abs(cashDiff))}\n`
      }
      if (diff !== 0) {
        message += diff > 0
          ? `Total sobrante: ${formatCurrency(Math.abs(diff))}`
          : `Total faltante: ${formatCurrency(Math.abs(diff))}`
      }

      alert(message)
      router.refresh()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        variant="destructive"
        className="w-full"
      >
        Cerrar Caja
      </Button>
    )
  }

  const totalReported =
    (parseFloat(cashAmount) || 0) +
    (parseFloat(cardAmount) || 0) +
    (parseFloat(transferAmount) || 0)

  const cashDifference = summary
    ? (parseFloat(cashAmount) || 0) - summary.expectedCash
    : 0

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Cierre de Caja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen de ventas */}
        {summary && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">Resumen del Día</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span>Efectivo:</span>
              </div>
              <span className="text-right font-semibold">
                {formatCurrency(summary.totals.cash + summary.totals.mixed)}
              </span>

              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Tarjeta:</span>
              </div>
              <span className="text-right font-semibold">
                {formatCurrency(summary.totals.card)}
              </span>

              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                <span>Transferencia:</span>
              </div>
              <span className="text-right font-semibold">
                {formatCurrency(summary.totals.transfer)}
              </span>

              <div className="border-t pt-2 col-span-2"></div>

              <span>Total Ventas ({summary.salesCount}):</span>
              <span className="text-right font-bold text-green-600">
                {formatCurrency(summary.totalSales)}
              </span>

              <span>Gastos del día:</span>
              <span className="text-right font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </span>

              <div className="border-t pt-2 col-span-2"></div>

              <span className="font-semibold">Efectivo esperado:</span>
              <span className="text-right font-bold">
                {formatCurrency(summary.expectedCash)}
              </span>
            </div>
          </div>
        )}

        {/* Formulario de cierre */}
        <div className="space-y-3">
          <div>
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Efectivo Contado *
            </Label>
            <Input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
            {cashAmount && summary && (
              <p className={`text-xs mt-1 ${cashDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {cashDifference >= 0 ? 'Sobrante' : 'Faltante'}: {formatCurrency(Math.abs(cashDifference))}
              </p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Total Tarjetas
            </Label>
            <Input
              type="number"
              value={cardAmount}
              onChange={(e) => setCardAmount(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Total Transferencias
            </Label>
            <Input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <div className="flex justify-between font-semibold">
              <span>Total Reportado:</span>
              <span>{formatCurrency(totalReported)}</span>
            </div>
            {summary && (
              <div className={`flex justify-between text-sm mt-1 ${
                totalReported - summary.totalSales >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>Diferencia:</span>
                <span>
                  {totalReported - summary.totalSales >= 0 ? '+' : ''}
                  {formatCurrency(totalReported - summary.totalSales)}
                </span>
              </div>
            )}
          </div>

          <div>
            <Label>Notas</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del cierre..."
              className="mt-1"
            />
          </div>

          {cashDifference < 0 && (
            <div className="flex items-center gap-2 text-yellow-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Hay un faltante en efectivo</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleClose}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              {loading ? 'Cerrando...' : 'Confirmar Cierre'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
