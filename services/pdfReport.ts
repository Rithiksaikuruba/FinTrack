import dayjs from 'dayjs'
import type { PaymentWithCustomer } from '@/types'
import { formatCurrency } from '@/lib/utils'

export async function generateDailyPDFReport(
  date: string,
  payments: PaymentWithCustomer[],
  businessName: string = 'FinTrack Business'
) {
  // ── IMPORTS ────────────────────────────────────────────────
  const { jsPDF } = await import('jspdf')
  // jspdf-autotable patches the jsPDF prototype at import time
  await import('jspdf-autotable')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autoTable = (d: any, opts: any) => (d as any).autoTable(opts)

  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()   // 210 mm
  const pageH     = doc.internal.pageSize.getHeight()  // 297 mm

  type RGB = [number, number, number]

  // ── CALCULATIONS ───────────────────────────────────────────
  const cashTotal  = payments.filter((p) => p.method === 'cash').reduce((s, p) => s + p.amount, 0)
  const upiTotal   = payments.filter((p) => p.method === 'upi') .reduce((s, p) => s + p.amount, 0)
  const grandTotal = cashTotal + upiTotal

  // pending_amount comes from the customer_summary view joined in your Supabase query
  const seenCustomers = new Set<string>()
  let totalPending = 0
  for (const p of payments) {
    if (!seenCustomers.has(p.customer_id)) {
      seenCustomers.add(p.customer_id)
      const pending =
        (p.customers as unknown as { pending_amount?: number })?.pending_amount ?? 0
      totalPending += pending
    }
  }

  // ── HEADER ─────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(businessName, 14, 18)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text('Daily Collection Report', 14, 26)

  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(dayjs(date).format('DD MMMM YYYY'), pageWidth - 14, 18, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text(dayjs(date).format('dddd'), pageWidth - 14, 26, { align: 'right' })

  // ── 4 SUMMARY BOXES ────────────────────────────────────────
  // Total printable width = 210 - 14(left margin) - 14(right margin) = 182 mm
  const boxY = 55
  const boxH = 24
  const gap  = 4
  const boxW = (pageWidth - 28 - gap * 3) / 4  // ≈ 42.5 mm each

  const drawBox = (
    x: number,
    label: string,
    value: string,
    bg: RGB,
    fg: RGB
  ) => {
    doc.setFillColor(...bg)
    doc.roundedRect(x, boxY, boxW, boxH, 3, 3, 'F')
    doc.setTextColor(...fg)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(label, x + boxW / 2, boxY + 8,  { align: 'center' })
    doc.setFontSize(12)
    doc.text(value, x + boxW / 2, boxY + 18, { align: 'center' })
  }

  drawBox(14,                     'CASH COLLECTED',  formatCurrency(cashTotal),   [236, 253, 245], [4,   120, 87 ])
  drawBox(14 + (boxW + gap),      'UPI COLLECTED',   formatCurrency(upiTotal),    [239, 246, 255], [29,  78,  216])
  drawBox(14 + (boxW + gap) * 2,  'TOTAL COLLECTED', formatCurrency(grandTotal),  [238, 242, 255], [67,  56,  202])
  drawBox(14 + (boxW + gap) * 3,  'TOTAL BALANCE',   formatCurrency(totalPending),[255, 251, 235], [180, 83,  9  ])

  // ── TABLE SECTION LABEL ────────────────────────────────────
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Payment Details', 14, 92)

  // ── TABLE DATA ─────────────────────────────────────────────
  const bodyRows: string[][] = payments.map((p, i) => {
    const pending =
      (p.customers as unknown as { pending_amount?: number })?.pending_amount ?? 0
    return [
      String(i + 1),
      p.customers?.name  || 'Unknown',
      p.customers?.phone || '-',
      formatCurrency(p.amount),
      p.method.toUpperCase(),
      formatCurrency(pending),
      p.notes || '-',
    ]
  })

  // Grand-total summary row appended to body
  const grandTotalRowIndex = bodyRows.length  // 0-based index within body section
  const grandTotalRow: string[] = [
    '', '', 'GRAND TOTAL', formatCurrency(grandTotal), '', '', '',
  ]

  // ── AUTO TABLE ─────────────────────────────────────────────
  // Column widths must sum to 182 mm (= pageWidth - left margin - right margin)
  // #(8) + Name(40) + Phone(26) + AmtPaid(28) + Method(18) + BalDue(28) + Notes(34) = 182 ✅
  autoTable(doc, {
    startY: 96,
    head: [['#', 'Customer Name', 'Phone', 'Amount Paid', 'Method', 'Balance Due', 'Notes']],
    body: [...bodyRows, grandTotalRow],
    theme: 'grid',

    headStyles: {
      fillColor: [79, 70, 229] as RGB,
      textColor: [255, 255, 255] as RGB,
      fontStyle: 'bold',
      fontSize:  8.5,
      halign:    'left',
    },

    bodyStyles: {
      fontSize:  8.5,
      textColor: [51, 65, 85]   as RGB,
      lineColor: [226, 232, 240] as RGB,
      lineWidth: 0.1,
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252] as RGB,
    },

    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 26 },
      3: { cellWidth: 28, halign: 'right',  fontStyle: 'bold', textColor: [15, 23, 42]  as RGB },
      4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 28, halign: 'right',  fontStyle: 'bold', textColor: [180, 83, 9]  as RGB },
      6: { cellWidth: 34 },
    },

    // Highlight the grand-total row (body section only — avoids touching the header)
    didParseCell(data: {
      section: string
      row:     { index: number }
      cell:    { styles: Record<string, unknown> }
    }) {
      if (data.section === 'body' && data.row.index === grandTotalRowIndex) {
        data.cell.styles['fillColor'] = [238, 242, 255] as RGB  // indigo-50
        data.cell.styles['fontStyle'] = 'bold'
        data.cell.styles['textColor'] = [67, 56, 202]  as RGB  // indigo-700
        data.cell.styles['fontSize']  = 9
      }
    },

    margin: { left: 14, right: 14 },
  })

  // ── FOOTER ─────────────────────────────────────────────────
  doc.setFillColor(248, 250, 252)
  doc.rect(0, pageH - 18, pageWidth, 18, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(
    `Generated on ${dayjs().format('DD/MM/YYYY HH:mm')} · ` +
    `${payments.length} transaction${payments.length !== 1 ? 's' : ''} recorded`,
    pageWidth / 2,
    pageH - 8,
    { align: 'center' }
  )

  // ── SAVE ───────────────────────────────────────────────────
  const filename = `collection-report-${date}.pdf`
  doc.save(filename)
  return filename
}