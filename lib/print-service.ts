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

// TODO: IMPLEMENTAR PLUGIN DE IMPRESIÓN
// Cuando se implemente el plugin de impresión, descomentar el siguiente código:
// const PRINT_SERVICE_URL = 'http://localhost:3001/print'
//
// export async function printInvoice(data: PrintInvoiceData): Promise<{ success: boolean; error?: string }> {
//   try {
//     const response = await fetch(PRINT_SERVICE_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(data),
//     })
//
//     if (!response.ok) {
//       throw new Error('Error al enviar a imprimir')
//     }
//
//     return { success: true }
//   } catch (error) {
//     console.error('Print service error:', error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Error de conexión con el servicio de impresión'
//     }
//   }
// }

// IMPLEMENTACIÓN TEMPORAL: Genera un documento HTML para imprimir como PDF
// Esta función abre una ventana con la factura formateada para que el usuario
// pueda usar Ctrl+P o el botón de imprimir del navegador y guardar como PDF
export async function printInvoice(data: PrintInvoiceData): Promise<{ success: boolean; error?: string }> {
  try {
    // Generar el HTML de la factura
    const invoiceHTML = generateInvoiceHTML(data)

    // Abrir una nueva ventana con el contenido
    const printWindow = window.open('', '_blank', 'width=800,height=600')

    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.')
    }

    printWindow.document.write(invoiceHTML)
    printWindow.document.close()

    // Esperar a que se cargue el contenido y abrir el diálogo de impresión
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }

    return { success: true }
  } catch (error) {
    console.error('Print error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al generar la vista de impresión'
    }
  }
}

// Función auxiliar para generar el HTML de la factura
function generateInvoiceHTML(data: PrintInvoiceData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const currentDate = new Date().toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Factura ${data.invoiceNumber}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }

        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }

        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }

        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #2563eb;
        }

        .header p {
          margin: 5px 0;
          font-size: 12px;
        }

        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .info-section {
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 5px;
        }

        .info-section h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #2563eb;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }

        .info-label {
          font-weight: bold;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        .items-table th {
          background-color: #2563eb;
          color: white;
          font-weight: bold;
        }

        .items-table td.number {
          text-align: right;
        }

        .items-table tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .totals {
          margin-top: 20px;
          margin-left: auto;
          width: 300px;
        }

        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }

        .totals-row.total {
          background-color: #2563eb;
          color: white;
          font-weight: bold;
          font-size: 18px;
          border-bottom: none;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }

        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 10px 20px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        .print-button:hover {
          background-color: #1d4ed8;
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

      <div class="header">
        <h1>${data.businessInfo.name}</h1>
        <p>NIT: ${data.businessInfo.nit}</p>
        <p>${data.businessInfo.address}</p>
        <p>${data.businessInfo.city}, ${data.businessInfo.country}</p>
        <p>Tel: ${data.businessInfo.phone}</p>
        ${data.businessInfo.website ? `<p>${data.businessInfo.website}</p>` : ''}
      </div>

      <div class="invoice-info">
        <div class="info-section">
          <h3>Información de la Factura</h3>
          <div class="info-row">
            <span class="info-label">Número:</span>
            <span>${data.invoiceNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Fecha:</span>
            <span>${currentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Atendido por:</span>
            <span>${data.attendedBy}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Método de pago:</span>
            <span>${translatePaymentMethod(data.paymentMethod)}</span>
          </div>
        </div>

        <div class="info-section">
          <h3>Cliente</h3>
          <div class="info-row">
            <span class="info-label">Nombre:</span>
            <span>${data.customerInfo.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Documento:</span>
            <span>${data.customerInfo.documentType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">No.:</span>
            <span>${data.customerInfo.documentNumber}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50%">Producto</th>
            <th style="width: 15%">Cantidad</th>
            <th style="width: 20%">Precio Unit.</th>
            <th style="width: 15%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.name}${item.notes ? `<br><small style="color: #666;">${item.notes}</small>` : ''}</td>
              <td class="number">${item.quantity}</td>
              <td class="number">${formatCurrency(item.price)}</td>
              <td class="number">${formatCurrency(item.quantity * item.price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        ${data.discount > 0 ? `
          <div class="totals-row">
            <span>Descuento:</span>
            <span>-${formatCurrency(data.discount)}</span>
          </div>
        ` : ''}
        <div class="totals-row total">
          <span>TOTAL:</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
        ${data.cash && data.cash > 0 ? `
          <div class="totals-row">
            <span>Efectivo recibido:</span>
            <span>${formatCurrency(data.cash)}</span>
          </div>
          <div class="totals-row">
            <span>Cambio:</span>
            <span>${formatCurrency(data.change || 0)}</span>
          </div>
        ` : ''}
      </div>

      ${data.observations ? `
        <div style="margin-top: 30px; padding: 10px; background-color: #f3f4f6; border-left: 3px solid #2563eb;">
          <strong>Observaciones:</strong><br>
          ${data.observations}
        </div>
      ` : ''}

      <div class="footer">
        <p><strong>${data.observations || 'Gracias por su compra'}</strong></p>
        <p>Este documento es una representación impresa de la factura electrónica</p>
      </div>
    </body>
    </html>
  `
}

// Función auxiliar para traducir el método de pago
function translatePaymentMethod(method: string): string {
  const translations: Record<string, string> = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'transfer': 'Transferencia',
    'mixed': 'Mixto',
  }
  return translations[method] || method
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
  businessInfo: BusinessInfo,
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
    businessInfo,
    customerInfo: {
      name: customerName || 'Consumidor Final',
      documentType: 'Cédula de ciudadanía',
      documentNumber: '0000000000',
    },
    observations: observations || 'Gracias por su compra',
  }
}
