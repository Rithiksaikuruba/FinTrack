import dayjs from 'dayjs'
import type { PaymentWithCustomer } from '@/types'
import { formatCurrency } from '@/lib/utils'

export async function generateDailyPDFReport(
  date: string,
  payments: PaymentWithCustomer[],
  businessName: string = 'FinTrack Business'
) {
  // Dynamically import jspdf to avoid SSR issues
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // ── HEADER ─────────────────────────────────────────────────
  // Premium Indigo Background Header
  doc.setFillColor(79, 70, 229) // indigo-600
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Business name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(businessName, 14, 18)

  // Report title
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255) // indigo-100
  doc.text('Daily Collection Report', 14, 26)

  // Date on right
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255) // white
  doc.setFont('helvetica', 'bold')
  doc.text(dayjs(date).format('DD MMMM YYYY'), pageWidth - 14, 18, { align: 'right' })

  // Day on right
  doc.setTextColor(224, 231, 255) // indigo-100
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(dayjs(date).format('dddd'), pageWidth - 14, 26, { align: 'right' })

  // ── SUMMARY BOXES ──────────────────────────────────────────
  const cashTotal = payments
    .filter((p) => p.method === 'cash')
    .reduce((s, p) => s + p.amount, 0)
  const upiTotal = payments
    .filter((p) => p.method === 'upi')
    .reduce((s, p) => s + p.amount, 0)
  const grandTotal = cashTotal + upiTotal

  const boxY = 55
  const boxH = 24
  const boxW = (pageWidth - 28 - 10) / 3 // Slightly more gap between boxes

  // Cash box (Emerald)
  doc.setFillColor(236, 253, 245) // emerald-50
  doc.roundedRect(14, boxY, boxW, boxH, 3, 3, 'F') // 3mm border radius
  doc.setTextColor(4, 120, 87) // emerald-700
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('CASH COLLECTED', 14 + boxW / 2, boxY + 8, { align: 'center' })
  doc.setFontSize(14)
  doc.text(formatCurrency(cashTotal), 14 + boxW / 2, boxY + 18, { align: 'center' })

  // UPI box (Blue)
  const upiX = 14 + boxW + 5
  doc.setFillColor(239, 246, 255) // blue-50
  doc.roundedRect(upiX, boxY, boxW, boxH, 3, 3, 'F')
  doc.setTextColor(29, 78, 216) // blue-700
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('UPI COLLECTED', upiX + boxW / 2, boxY + 8, { align: 'center' })
  doc.setFontSize(14)
  doc.text(formatCurrency(upiTotal), upiX + boxW / 2, boxY + 18, { align: 'center' })

  // Total box (Indigo)
  const totalX = 14 + (boxW + 5) * 2
  doc.setFillColor(238, 242, 255) // indigo-50
  doc.roundedRect(totalX, boxY, boxW, boxH, 3, 3, 'F')
  doc.setTextColor(67, 56, 202) // indigo-700
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL COLLECTION', totalX + boxW / 2, boxY + 8, { align: 'center' })
  doc.setFontSize(14)
  doc.text(formatCurrency(grandTotal), totalX + boxW / 2, boxY + 18, { align: 'center' })

  // ── PAYMENTS TABLE ─────────────────────────────────────────
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42) // slate-900
  doc.text('Payment Details', 14, 92)

  const tableData = payments.map((p, i) => [
    (i + 1).toString(),
    p.customers?.name || 'Unknown',
    p.customers?.phone || '-',
    formatCurrency(p.amount),
    p.method.toUpperCase(),
    p.notes || '-',
  ])

  autoTable(doc, {
    startY: 96,
    head: [['#', 'Customer Name', 'Phone', 'Amount', 'Method', 'Notes']],
    body: tableData,
    theme: 'grid', // Switched to grid for a cleaner, modern spreadsheet look
    headStyles: {
      fillColor: [79, 70, 229], // indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: { 
      fontSize: 9, 
      textColor: [51, 65, 85], // slate-700
      lineColor: [241, 245, 249], // slate-100 borders
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }, // Darker slate for amounts
      4: { halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  })

  // ── FOOTER ─────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()

  // Soft Slate Footer
  doc.setFillColor(248, 250, 252) // slate-50
  doc.rect(0, pageH - 18, pageWidth, 18, 'F')
  
  // Footer Text
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139) // slate-500
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated on ${dayjs().format('DD/MM/YYYY HH:mm')} · ${payments.length} transactions recorded`,
    pageWidth / 2,
    pageH - 8,
    { align: 'center' }
  )

  // ── SAVE ───────────────────────────────────────────────────
  const filename = `collection-report-${date}.pdf`
  doc.save(filename)
  return filename
}