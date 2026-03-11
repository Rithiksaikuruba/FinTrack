import dayjs from 'dayjs'
import type { PaymentWithCustomer } from '@/types'
import { formatCurrency } from '@/lib/utils'

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
  const ML        = 14  // left margin
  const MR        = 14  // right margin
  const PRINT_W   = pageWidth - ML - MR  // 182 mm

  // ── HELPER: set fill + draw rect ──────────────────────────
  const fillRect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) => {
    doc.setFillColor(r, g, b)
    doc.rect(x, y, w, h, 'F')
  }

  const roundRect = (x: number, y: number, w: number, h: number, radius: number, r: number, g: number, b: number) => {
    doc.setFillColor(r, g, b)
    doc.roundedRect(x, y, w, h, radius, radius, 'F')
  }

  // ── CALCULATIONS ───────────────────────────────────────────
  const cashTotal  = payments.filter((p) => p.method === 'cash').reduce((s, p) => s + Number(p.amount), 0)
  const upiTotal   = payments.filter((p) => p.method === 'upi') .reduce((s, p) => s + Number(p.amount), 0)
  const grandTotal = cashTotal + upiTotal

  const seenCustomers = new Set<string>()
  let totalPending = 0
  for (const p of payments) {
    if (!seenCustomers.has(p.customer_id)) {
      seenCustomers.add(p.customer_id)
      const c = p.customers as unknown as Record<string, unknown>
      totalPending += Number(c?.['pending_amount'] ?? 0)
    }
  }

  // ── HEADER BACKGROUND ─────────────────────────────────────
  fillRect(0, 0, pageWidth, 45, 79, 70, 229)

  // Business name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(businessName, ML, 18)

  // Sub-title
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text('Daily Collection Report', ML, 27)

  // Date right-aligned
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(dayjs(date).format('DD MMMM YYYY'), pageWidth - MR, 18, { align: 'right' })

  // Day name right-aligned
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(224, 231, 255)
  doc.text(dayjs(date).format('dddd'), pageWidth - MR, 27, { align: 'right' })

  // ── 4 SUMMARY BOXES ────────────────────────────────────────
  const boxY = 52
  const boxH = 26
  const gap  = 4
  const boxW = (PRINT_W - gap * 3) / 4

  interface BoxConfig {
    label: string
    value: string
    bg: [number, number, number]
    fg: [number, number, number]
  }

  const boxes: BoxConfig[] = [
    { label: 'CASH COLLECTED',  value: formatCurrency(cashTotal),    bg: [236, 253, 245], fg: [4,   120, 87 ] },
    { label: 'UPI COLLECTED',   value: formatCurrency(upiTotal),     bg: [239, 246, 255], fg: [29,  78,  216] },
    { label: 'TOTAL COLLECTED', value: formatCurrency(grandTotal),   bg: [238, 242, 255], fg: [67,  56,  202] },
    { label: 'TOTAL BALANCE',   value: formatCurrency(totalPending), bg: [255, 251, 235], fg: [180, 83,  9  ] },
  ]

  boxes.forEach((box, i) => {
    const x = ML + i * (boxW + gap)
    roundRect(x, boxY, boxW, boxH, 3, ...box.bg)
    doc.setTextColor(box.fg[0], box.fg[1], box.fg[2])
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(box.label, x + boxW / 2, boxY + 8, { align: 'center' })
    doc.setFontSize(11)
    doc.text(box.value, x + boxW / 2, boxY + 19, { align: 'center' })
  })

  // ── TABLE SECTION TITLE ────────────────────────────────────
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Payment Details', ML, 90)

  // ── MANUAL TABLE ───────────────────────────────────────────
  // Col widths must sum to PRINT_W = 182 mm
  // #(8) + Name(42) + Phone(26) + Paid(28) + Method(16) + Balance(28) + Notes(34) = 182 ✅
  const COL_WIDTHS = [8, 42, 26, 28, 16, 28, 34]
  const HEADERS    = ['#', 'Customer Name', 'Phone', 'Amount Paid', 'Method', 'Balance Due', 'Notes']
  const ROW_H      = 8
  const HEAD_H     = 9
  const CELL_PAD   = 2

  // Column x positions
  const colX: number[] = []
  let cx = ML
  COL_WIDTHS.forEach((w) => { colX.push(cx); cx += w })

  // Horizontal alignment per column: 'left' | 'center' | 'right'
  const COL_ALIGN: Array<'left' | 'center' | 'right'> = [
    'center', 'left', 'left', 'right', 'center', 'right', 'left',
  ]

  let curY = 93

  // Draw a single cell
  const drawCell = (
    col: number,
    y: number,
    h: number,
    text: string,
    opts: {
      bold?: boolean
      fontSize?: number
      textColor?: [number, number, number]
      bgColor?: [number, number, number]
      borderColor?: [number, number, number]
    } = {}
  ) => {
    const x = colX[col]
    const w = COL_WIDTHS[col]

    // Background
    if (opts.bgColor) {
      doc.setFillColor(opts.bgColor[0], opts.bgColor[1], opts.bgColor[2])
      doc.rect(x, y, w, h, 'F')
    }

    // Border
    const bc = opts.borderColor ?? [226, 232, 240]
    doc.setDrawColor(bc[0], bc[1], bc[2])
    doc.setLineWidth(0.1)
    doc.rect(x, y, w, h, 'S')

    // Text
    const tc = opts.textColor ?? [51, 65, 85]
    doc.setTextColor(tc[0], tc[1], tc[2])
    doc.setFontSize(opts.fontSize ?? 8.5)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')

    const align = COL_ALIGN[col]
    let tx: number
    if (align === 'center') tx = x + w / 2
    else if (align === 'right') tx = x + w - CELL_PAD
    else tx = x + CELL_PAD

    // Clip long text
    const maxW  = w - CELL_PAD * 2
    const clipped = doc.splitTextToSize(text, maxW)[0] as string
    doc.text(clipped, tx, y + h / 2 + 1.2, { align, baseline: 'middle' })
  }

  // ── HEADER ROW ────────────────────────────────────────────
  // Check if we need a new page (shouldn't for header, but be safe)
  const drawHeaderRow = (y: number) => {
    HEADERS.forEach((h, col) => {
      drawCell(col, y, HEAD_H, h, {
        bold: true,
        fontSize: 8.5,
        bgColor: [79, 70, 229],
        textColor: [255, 255, 255],
        borderColor: [99, 90, 240],
      })
    })
  }

  drawHeaderRow(curY)
  curY += HEAD_H

  // ── BODY ROWS ─────────────────────────────────────────────
  payments.forEach((p, i) => {
    // Page break check (leave 25mm for footer)
    if (curY + ROW_H > pageH - 25) {
      doc.addPage()
      curY = 14
      drawHeaderRow(curY)
      curY += HEAD_H
    }

    const c       = p.customers as unknown as Record<string, unknown>
    const pending = Number(c?.['pending_amount'] ?? 0)
    const isEven  = i % 2 === 1
    const rowBg: [number, number, number] = isEven ? [248, 250, 252] : [255, 255, 255]

    const cells = [
      String(i + 1),
      (p.customers?.name  || 'Unknown').toString(),
      (p.customers?.phone || '-').toString(),
      formatCurrency(Number(p.amount)),
      p.method.toUpperCase(),
      formatCurrency(pending),
      (p.notes || '-').toString(),
    ]

    cells.forEach((text, col) => {
      const isAmount  = col === 3
      const isBalance = col === 5
      drawCell(col, curY, ROW_H, text, {
        bold:      isAmount || isBalance,
        bgColor:   rowBg,
        textColor: isAmount
          ? [15, 23, 42]
          : isBalance
          ? [180, 83, 9]
          : [51, 65, 85],
      })
    })

    curY += ROW_H
  })

  // ── GRAND TOTAL ROW ───────────────────────────────────────
  if (curY + ROW_H > pageH - 25) {
    doc.addPage()
    curY = 14
  }

  const totalCells = ['', '', 'GRAND TOTAL', formatCurrency(grandTotal), '', '', '']
  totalCells.forEach((text, col) => {
    drawCell(col, curY, ROW_H + 1, text, {
      bold: true,
      fontSize: 9,
      bgColor:   [238, 242, 255],
      textColor: [67, 56, 202],
    })
  })
  curY += ROW_H + 1

  // ── FOOTER (every page) ────────────────────────────────────
  const totalPages: number = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()

  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg)
    fillRect(0, pageH - 16, pageWidth, 16, 248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(0, pageH - 16, pageWidth, pageH - 16)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Generated on ${dayjs().format('DD/MM/YYYY HH:mm')} · ${payments.length} transaction${payments.length !== 1 ? 's' : ''} recorded`,
      pageWidth / 2,
      pageH - 6,
      { align: 'center' }
    )
    if (totalPages > 1) {
      doc.text(`Page ${pg} of ${totalPages}`, pageWidth - MR, pageH - 6, { align: 'right' })
    }
  }

  // ── SAVE ───────────────────────────────────────────────────
  const filename = `collection-report-${date}.pdf`
  doc.save(filename)
  return filename
}