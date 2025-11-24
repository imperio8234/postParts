'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { CashRegisterDetailModal } from './cash-register-detail-modal'
import { Eye, TrendingUp, TrendingDown, Minus } from 'lucide-react'

type CashRegister = {
  id: string
  openingDate: Date
  closingDate: Date | null
  initialAmount: number
  finalAmount: number
  expectedAmount: number
  difference: number
  notes: string | null
  user: {
    name: string | null
  }
}

type Props = {
  history: CashRegister[]
}

export function CashHistoryList({ history }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleViewDetails = (id: string) => {
    setSelectedId(id)
    setShowModal(true)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return 'text-green-600'
    if (diff < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cajas Cerradas</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay cajas cerradas en el historial
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cajero</TableHead>
                    <TableHead className="text-right">Apertura</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Reportado</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((register) => {
                    const sales = register.expectedAmount - register.initialAmount
                    return (
                      <TableRow key={register.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatDate(register.openingDate)}</p>
                            <p className="text-xs text-gray-500">
                              {formatTime(register.openingDate)} - {register.closingDate ? formatTime(register.closingDate) : '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{register.user.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(register.initialAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(sales)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(register.expectedAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(register.finalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {getDifferenceIcon(register.difference)}
                            <span className={`font-medium ${getDifferenceColor(register.difference)}`}>
                              {register.difference > 0 ? '+' : ''}
                              {formatCurrency(register.difference)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(register.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      <CashRegisterDetailModal
        cashRegisterId={selectedId}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedId(null)
        }}
      />
    </>
  )
}
