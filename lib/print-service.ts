export type PrintItem = {
  name: string
  quantity: number
  price: number
  notes?: string
}

export type BusinessInfo = {
  name: string
  nit: string
  address: string
  city: string
  country: string
  phone: string
  logoPath?: string
  website?: string
  taxRegime?: string
}

export type CustomerInfo = {
  name: string
  documentType: string
  documentNumber: string
}

export type PrintInvoiceData = {
  items: PrintItem[]
  invoiceNumber: string
  tableNumber?: string
  attendedBy: string
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed'
  paymentType: string
  cash?: number
  change?: number
  subtotal: number
  discount: number
  total: number
  businessInfo: BusinessInfo
  customerInfo: CustomerInfo
  observations?: string
}

const PRINT_SERVICE_URL = 'http://localhost:3001/print' // URL del plugin de impresión

export async function printInvoice(data: PrintInvoiceData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(PRINT_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Error al enviar a imprimir')
    }

    return { success: true }
  } catch (error) {
    console.error('Print service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con el servicio de impresión'
    }
  }
}

export function buildPrintData(
  items: { name: string; quantity: number; price: number; notes?: string }[],
  invoiceNumber: string,
  attendedBy: string,
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED',
  cash: number,
  subtotal: number,
  discount: number,
  total: number,
  customerName?: string,
  observations?: string
): PrintInvoiceData {
  return {
    items,
    invoiceNumber,
    attendedBy,
    paymentMethod: paymentMethod.toLowerCase() as 'cash' | 'card' | 'transfer' | 'mixed',
    paymentType: 'Contado',
    cash: paymentMethod === 'CASH' || paymentMethod === 'MIXED' ? cash : undefined,
    change: cash > total ? cash - total : 0,
    subtotal,
    discount,
    total,
    businessInfo: {
      name: 'Bike Parts Store',
      nit: '000.000.000',
      address: 'Dirección del negocio',
      city: 'Ciudad',
      country: 'Colombia',
      phone: '3000000000',
    },
    customerInfo: {
      name: customerName || 'Consumidor Final',
      documentType: 'Cédula de ciudadanía',
      documentNumber: '0000000000',
    },
    observations: observations || 'Gracias por su compra',
  }
}
