import dayjs from 'dayjs'
import type { PaymentWithCustomer } from '@/types'
import { formatCurrency } from '@/lib/utils'

export async function generateDailyPDFReport(
  date: string,
  payments: PaymentWithCustomer[],
  businessName: string = 'Finance Business'
) {
  // Dynamically import jspdf to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── HEADER ─────────────────────────────────────────────────
  // Background header
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F')

  // Business name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(businessName, 14, 15)

  // Report title
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text('Daily Collection Report', 14, 23)

  // Date on right
  doc.setFontSize(12)
  doc.setTextColor(251, 191, 36) // amber-400
  doc.setFont('helvetica', 'bold')
  doc.text(dayjs(date).format('DD MMMM YYYY'), pageWidth - 14, 15, { align: 'right' })

  doc.setTextColor(148, 163, 184)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(dayjs(date).format('dddd'), pageWidth - 14, 23, { align: 'right' })

  // ── SUMMARY BOXES ──────────────────────────────────────────
  const cashTotal = payments
    .filter((p) => p.method === 'cash')
    .reduce((s, p) => s + p.amount, 0)
  const upiTotal = payments
    .filter((p) => p.method === 'upi')
    .reduce((s, p) => s + p.amount, 0)
  const grandTotal = cashTotal + upiTotal

  const boxY = 48
  const boxH = 22
  const boxW = (pageWidth - 28 - 8) / 3

  // Cash box
  doc.setFillColor(236, 253, 245)
  doc.roundedRect(14, boxY, boxW, boxH, 2, 2, 'F')
  doc.setTextColor(5, 150, 105)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('CASH COLLECTED', 14 + boxW / 2, boxY + 7, { align: 'center' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(cashTotal), 14 + boxW / 2, boxY + 17, { align: 'center' })

  // UPI box
  const upiX = 14 + boxW + 4
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(upiX, boxY, boxW, boxH, 2, 2, 'F')
  doc.setTextColor(37, 99, 235)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('UPI COLLECTED', upiX + boxW / 2, boxY + 7, { align: 'center' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(upiTotal), upiX + boxW / 2, boxY + 17, { align: 'center' })

  // Total box
  const totalX = 14 + (boxW + 4) * 2
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(totalX, boxY, boxW, boxH, 2, 2, 'F')
  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('TOTAL COLLECTION', totalX + boxW / 2, boxY + 7, { align: 'center' })
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(251, 191, 36)
  doc.text(formatCurrency(grandTotal), totalX + boxW / 2, boxY + 17, {
    align: 'center',
  })

  // ── PAYMENTS TABLE ─────────────────────────────────────────
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Payment Details', 14, 82)

  const tableData = payments.map((p, i) => [
    (i + 1).toString(),
    p.customers?.name || 'Unknown',
    p.customers?.phone || '-',
    formatCurrency(p.amount),
    p.method.toUpperCase(),
    p.notes || '-',
  ])

  autoTable(doc, {
    startY: 86,
    head: [['#', 'Customer Name', 'Phone', 'Amount', 'Method', 'Notes']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  })

  // ── FOOTER ─────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const pageH = doc.internal.pageSize.getHeight()

  doc.setFillColor(248, 250, 252)
  doc.rect(0, pageH - 18, pageWidth, 18, 'F')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated on ${dayjs().format('DD/MM/YYYY HH:mm')} · ${payments.length} transactions`,
    pageWidth / 2,
    pageH - 7,
    { align: 'center' }
  )

  // ── SAVE ───────────────────────────────────────────────────
  const filename = `collection-report-${date}.pdf`
  doc.save(filename)
  return filename
}
