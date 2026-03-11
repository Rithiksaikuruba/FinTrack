import dayjs from 'dayjs'
import type { PaymentWithCustomer } from '@/types'
import { formatCurrency } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// jsPDF cannot render the ₹ symbol with built-in fonts.
// This helper replaces ₹ with "Rs." so it always prints correctly.
// ─────────────────────────────────────────────────────────────
function pdfCurrency(value: number): string {
  return `Rs. ${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export async function generateDailyPDFReport(
  date: string,
  payments: PaymentWithCustomer[],
  businessName: string = 'FinTrack Business'
) {
  // ── IMPORT (jsPDF only — no autoTable) ────────────────────
  const { jsPDF } = await import('jspdf')

  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()   // 210 mm
  const pageH     = doc.internal.pageSize.getHeight()  // 297 mm
  const ML        = 12  // left margin
  const MR        = 12  // right margin
  const PRINT_W   = pageWidth - ML - MR  // 186 mm

  type RGB = [number, number, number]

  // ── HELPERS ────────────────────────────────────────────────
  const fillRect = (x: number, y: number, w: number, h: number, rgb: RGB) => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(x, y, w, h, 'F')
  }

  const roundRect = (x: number, y: number, w: number, h: number, r: number, rgb: RGB) => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.roundedRect(x, y, w, h, r, r, 'F')
  }

  // ── CALCULATIONS ───────────────────────────────────────────
  const cashTotal  = payments.filter((p) => p.method === 'cash').reduce((s, p) => s + Number(p.amount), 0)
  const upiTotal   = payments.filter((p) => p.method === 'upi') .reduce((s, p) => s + Number(p.amount), 0)
  const grandTotal = cashTotal + upiTotal

  // pending_amount comes from customer_summary view.
  // If your query joins the raw `customers` table instead of `customer_summary`,
  // update your Supabase query to: .from('payments').select('*, customers:customer_summary(*)')
  const seenCustomers = new Set<string>()
  let totalPending = 0
  for (const p of payments) {
    if (!seenCustomers.has(p.customer_id)) {
      seenCustomers.add(p.customer_id)
      const c = p.customers as unknown as Record<string, unknown>
      // Try pending_amount from view; fall back to total_amount - paid_amount if available
      const pending =
        Number(c?.['pending_amount']) ||
        (Number(c?.['total_amount'] ?? 0) - Number(c?.['paid_amount'] ?? 0))
      totalPending += Math.max(0, pending)
    }
  }

  // ── HEADER ─────────────────────────────────────────────────
  fillRect(0, 0, pageWidth, 48, [79, 70, 229])

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  // Truncate business name if too long so it doesn't overlap date
  const maxNameWidth = 90
  const nameText = doc.splitTextToSize(businessName, maxNameWidth)[0] as string
  doc.text(nameText, ML, 19)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text('Daily Collection Report', ML, 28)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(dayjs(date).format('DD MMMM YYYY'), pageWidth - MR, 19, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text(dayjs(date).format('dddd'), pageWidth - MR, 28, { align: 'right' })

  // ── 4 SUMMARY BOXES ────────────────────────────────────────
  // Total printable = 186 mm, 4 boxes with 4 mm gaps = (186 - 12) / 4 = 43.5 mm each
  const boxY = 55
  const boxH = 26
  const gap  = 4
  const boxW = (PRINT_W - gap * 3) / 4

  interface BoxCfg { label: string; value: string; bg: RGB; fg: RGB }
  const boxes: BoxCfg[] = [
    { label: 'CASH COLLECTED',  value: pdfCurrency(cashTotal),    bg: [236, 253, 245], fg: [4,   120, 87 ] },
    { label: 'UPI COLLECTED',   value: pdfCurrency(upiTotal),     bg: [239, 246, 255], fg: [29,  78,  216] },
    { label: 'TOTAL COLLECTED', value: pdfCurrency(grandTotal),   bg: [238, 242, 255], fg: [67,  56,  202] },
    { label: 'TOTAL BALANCE',   value: pdfCurrency(totalPending), bg: [255, 251, 235], fg: [180, 83,  9  ] },
  ]

  boxes.forEach((box, i) => {
    const x = ML + i * (boxW + gap)
    roundRect(x, boxY, boxW, boxH, 3, box.bg)
    doc.setTextColor(box.fg[0], box.fg[1], box.fg[2])
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(box.label, x + boxW / 2, boxY + 8, { align: 'center' })
    // Fit value inside box — reduce font if too wide
    doc.setFontSize(10)
    const fitted = doc.splitTextToSize(box.value, boxW - 4)[0] as string
    doc.text(fitted, x + boxW / 2, boxY + 19, { align: 'center' })
  })

  // ── TABLE LABEL ───────────────────────────────────────────
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Payment Details', ML, 92)

  // ── COLUMN CONFIG ─────────────────────────────────────────
  // Widths must sum to PRINT_W = 186 mm
  // #(7) + Name(40) + Phone(26) + Paid(32) + Method(16) + Balance(32) + Notes(33) = 186 ✅
  const COL_W   = [7, 40, 26, 32, 16, 32, 33]
  const HEADERS = ['#', 'Customer Name', 'Phone', 'Amount Paid', 'Method', 'Balance Due', 'Notes']
  const COL_ALIGN: Array<'left' | 'center' | 'right'> = [
    'center', 'left', 'left', 'right', 'center', 'right', 'left',
  ]

  // Pre-compute X positions
  const colX: number[] = []
  let cx = ML
  COL_W.forEach((w) => { colX.push(cx); cx += w })

  const ROW_H  = 8.5
  const HEAD_H = 9.5
  const PAD    = 2.5

  let curY = 95

  // ── DRAW CELL ─────────────────────────────────────────────
  const drawCell = (
    col: number,
    y: number,
    h: number,
    text: string,
    opts: {
      bold?: boolean
      fontSize?: number
      textColor?: RGB
      bgColor?: RGB
    } = {}
  ) => {
    const x = colX[col]
    const w = COL_W[col]

    // Background
    if (opts.bgColor) {
      doc.setFillColor(opts.bgColor[0], opts.bgColor[1], opts.bgColor[2])
      doc.rect(x, y, w, h, 'F')
    }

    // Border
    doc.setDrawColor(220, 220, 235)
    doc.setLineWidth(0.15)
    doc.rect(x, y, w, h, 'S')

    // Text
    const tc = opts.textColor ?? [51, 65, 85]
    doc.setTextColor(tc[0], tc[1], tc[2])
    doc.setFontSize(opts.fontSize ?? 8.5)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')

    const align = COL_ALIGN[col]
    const tx =
      align === 'center' ? x + w / 2
      : align === 'right'  ? x + w - PAD
      : x + PAD

    const maxW   = w - PAD * 2
    const clipped = doc.splitTextToSize(text, maxW)[0] as string
    doc.text(clipped, tx, y + h / 2 + 1.3, { align, baseline: 'middle' as const })
  }

  // ── DRAW HEADER ROW ───────────────────────────────────────
  const drawHeader = (y: number) => {
    HEADERS.forEach((h, col) => {
      drawCell(col, y, HEAD_H, h, {
        bold: true,
        fontSize: 8.5,
        bgColor: [79, 70, 229],
        textColor: [255, 255, 255],
      })
    })
  }

  drawHeader(curY)
  curY += HEAD_H

  // ── BODY ROWS ─────────────────────────────────────────────
  payments.forEach((p, i) => {
    // Page break — leave 28 mm for footer
    if (curY + ROW_H > pageH - 28) {
      doc.addPage()
      curY = 14
      drawHeader(curY)
      curY += HEAD_H
    }

    const c = p.customers as unknown as Record<string, unknown>
    const pending =
      Number(c?.['pending_amount']) ||
      Math.max(0, Number(c?.['total_amount'] ?? 0) - Number(c?.['paid_amount'] ?? 0))

    const isEven   = i % 2 === 1
    const rowBg: RGB = isEven ? [248, 250, 252] : [255, 255, 255]

    const cells = [
      String(i + 1),
      String(p.customers?.name  || 'Unknown'),
      String(p.customers?.phone || '-'),
      pdfCurrency(Number(p.amount)),
      p.method.toUpperCase(),
      pdfCurrency(pending),
      String(p.notes || '-'),
    ]

    cells.forEach((text, col) => {
      drawCell(col, curY, ROW_H, text, {
        bgColor:   rowBg,
        bold:      col === 3 || col === 5,
        textColor:
          col === 3 ? [15, 23, 42]
          : col === 5 ? [180, 83, 9]
          : [51, 65, 85],
      })
    })

    curY += ROW_H
  })

  // ── GRAND TOTAL ROW ───────────────────────────────────────
  if (curY + ROW_H + 2 > pageH - 28) {
    doc.addPage()
    curY = 14
  }

  const totalCells = ['', '', 'GRAND TOTAL', pdfCurrency(grandTotal), '', '', '']
  totalCells.forEach((text, col) => {
    drawCell(col, curY, ROW_H + 2, text, {
      bold: true,
      fontSize: 9,
      bgColor:   [238, 242, 255],
      textColor: [67, 56, 202],
    })
  })

  // ── FOOTER (all pages) ────────────────────────────────────
  const totalPages =
    (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()

  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg)
    fillRect(0, pageH - 16, pageWidth, 16, [248, 250, 252])

    doc.setDrawColor(220, 225, 235)
    doc.setLineWidth(0.3)
    doc.line(0, pageH - 16, pageWidth, pageH - 16)

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Generated on ${dayjs().format('DD/MM/YYYY HH:mm')}  |  ${payments.length} transaction${payments.length !== 1 ? 's' : ''} recorded`,
      pageWidth / 2,
      pageH - 7,
      { align: 'center' }
    )
    if (totalPages > 1) {
      doc.text(`Page ${pg} of ${totalPages}`, pageWidth - MR, pageH - 7, { align: 'right' })
    }
  }

  // ── SAVE ───────────────────────────────────────────────────
  const filename = `collection-report-${date}.pdf`
  doc.save(filename)
  return filename
}