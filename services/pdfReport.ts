/**
 * generateDailyPDFReport.ts
 *
 * ⚠️  REQUIRED — update your Supabase fetch query to join customer_summary
 *     (the VIEW, not the raw customers table) so pending_amount is available.
 *
 *     Change your fetch from:
 *       .from('payments').select('*, customers(*)')
 *     To:
 *       .from('payments').select('*, customers:customer_summary(*)')
 *
 *     customer_summary view exposes: paid_amount, pending_amount, total_amount
 *     The raw customers table does NOT have paid_amount or pending_amount.
 */

import dayjs from 'dayjs'
import type { PaymentWithCustomer } from '@/types'

// ─────────────────────────────────────────────────────────────
// jsPDF's built-in Helvetica cannot render ₹.
// Amounts go in cells as plain numbers ("39,000.00").
// Column headers say "Paid (Rs.)" / "Balance (Rs.)" to give context.
// ─────────────────────────────────────────────────────────────
function fmt(value: number): string {
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtBox(value: number): string {
  return `Rs. ${fmt(value)}`
}

// Pull pending_amount out of a customer record safely.
// Works whether the query joins customer_summary (has pending_amount)
// or the raw customers table (has total_amount; we compute manually).
function getPending(customers: unknown): number {
  if (!customers || typeof customers !== 'object') return 0
  const c = customers as Record<string, unknown>

  // ✅ Best path: customer_summary view provides pending_amount directly
  const directPending = Number(c['pending_amount'])
  if (!isNaN(directPending) && directPending > 0) return directPending

  // ✅ Fallback: compute from total_amount - paid_amount (also in the view)
  const total  = Number(c['total_amount']  ?? 0)
  const paid   = Number(c['paid_amount']   ?? 0)
  if (total > 0) return Math.max(0, total - paid)

  // ⚠️  Last resort: loan_amount + interest - today's payment
  // (only available from raw customers table, very inaccurate — fix your query!)
  const loan     = Number(c['loan_amount'] ?? 0)
  const interest = Number(c['interest']    ?? 0)
  return Math.max(0, loan + interest)
}

export async function generateDailyPDFReport(
  date: string,
  payments: PaymentWithCustomer[],
  businessName: string = 'FinTrack Business'
) {
  const { jsPDF } = await import('jspdf')

  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()   // 210 mm
  const pageH     = doc.internal.pageSize.getHeight()  // 297 mm
  const ML        = 10
  const MR        = 10
  const PRINT_W   = pageWidth - ML - MR               // 190 mm

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

  // Total balance = sum of pending across all unique customers who paid today
  const seenIds = new Set<string>()
  let totalPending = 0
  for (const p of payments) {
    if (!seenIds.has(p.customer_id)) {
      seenIds.add(p.customer_id)
      totalPending += getPending(p.customers)
    }
  }

  // ── HEADER ─────────────────────────────────────────────────
  fillRect(0, 0, pageWidth, 46, [79, 70, 229])

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(doc.splitTextToSize(businessName, 95)[0] as string, ML, 19)

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
  const boxY = 53
  const boxH = 27
  const gap  = 3
  const boxW = (PRINT_W - gap * 3) / 4   // ≈ 45.25 mm

  const boxes = [
    { label: 'CASH COLLECTED',  value: fmtBox(cashTotal),    bg: [236, 253, 245] as RGB, fg: [4,   120, 87 ] as RGB },
    { label: 'UPI COLLECTED',   value: fmtBox(upiTotal),     bg: [239, 246, 255] as RGB, fg: [29,  78,  216] as RGB },
    { label: 'TOTAL COLLECTED', value: fmtBox(grandTotal),   bg: [238, 242, 255] as RGB, fg: [67,  56,  202] as RGB },
    { label: 'TOTAL BALANCE',   value: fmtBox(totalPending), bg: [255, 251, 235] as RGB, fg: [180, 83,  9  ] as RGB },
  ]

  boxes.forEach((box, i) => {
    const x = ML + i * (boxW + gap)
    roundRect(x, boxY, boxW, boxH, 3, box.bg)
    doc.setTextColor(box.fg[0], box.fg[1], box.fg[2])

    // Label
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(box.label, x + boxW / 2, boxY + 8, { align: 'center' })

    // Value — auto-shrink font if value is too wide for the box
    const maxBoxW = boxW - 4
    let fs = 11
    doc.setFont('helvetica', 'bold')
    while (fs > 7) {
      doc.setFontSize(fs)
      if (doc.getTextWidth(box.value) <= maxBoxW) break
      fs -= 0.5
    }
    doc.text(box.value, x + boxW / 2, boxY + 20, { align: 'center' })
  })

  // ── TABLE LABEL ───────────────────────────────────────────
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Payment Details', ML, 91)

  // ── COLUMN CONFIG ─────────────────────────────────────────
  // Widths must sum to PRINT_W = 190 mm
  // #(7) + Name(43) + Phone(27) + Paid(35) + Method(17) + Balance(35) + Notes(26) = 190 ✅
  const COL_W   = [7, 43, 27, 35, 17, 35, 26]
  const HEADERS = ['#', 'Customer Name', 'Phone', 'Paid (Rs.)', 'Method', 'Balance (Rs.)', 'Notes']
  const COL_ALIGN: Array<'left' | 'center' | 'right'> = [
    'center', 'left', 'left', 'right', 'center', 'right', 'left',
  ]

  const colX: number[] = []
  let cx = ML
  COL_W.forEach((w) => { colX.push(cx); cx += w })

  const ROW_H  = 8.5
  const HEAD_H = 10
  const PAD    = 2.5

  let curY = 94

  // ── DRAW CELL ─────────────────────────────────────────────
  const drawCell = (
    col: number,
    y: number,
    h: number,
    text: string,
    opts: { bold?: boolean; fontSize?: number; textColor?: RGB; bgColor?: RGB } = {}
  ) => {
    const x = colX[col]
    const w = COL_W[col]

    if (opts.bgColor) {
      doc.setFillColor(opts.bgColor[0], opts.bgColor[1], opts.bgColor[2])
      doc.rect(x, y, w, h, 'F')
    }

    doc.setDrawColor(210, 215, 230)
    doc.setLineWidth(0.12)
    doc.rect(x, y, w, h, 'S')

    const tc = opts.textColor ?? ([51, 65, 85] as RGB)
    doc.setTextColor(tc[0], tc[1], tc[2])
    doc.setFontSize(opts.fontSize ?? 8.5)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')

    const align = COL_ALIGN[col]
    const tx =
      align === 'center' ? x + w / 2
      : align === 'right' ? x + w - PAD
      : x + PAD

    const clipped = doc.splitTextToSize(text, w - PAD * 2)[0] as string
    doc.text(clipped, tx, y + h / 2 + 1.3, { align, baseline: 'middle' as const })
  }

  // ── HEADER ROW ────────────────────────────────────────────
  const drawHeader = (y: number) => {
    HEADERS.forEach((h, col) =>
      drawCell(col, y, HEAD_H, h, {
        bold:      true,
        fontSize:  8.5,
        bgColor:   [79, 70, 229],
        textColor: [255, 255, 255],
      })
    )
  }

  drawHeader(curY)
  curY += HEAD_H

  // ── BODY ROWS ─────────────────────────────────────────────
  payments.forEach((p, i) => {
    if (curY + ROW_H > pageH - 26) {
      doc.addPage()
      curY = 14
      drawHeader(curY)
      curY += HEAD_H
    }

    const pending = getPending(p.customers)
    const isEven  = i % 2 === 1
    const rowBg: RGB = isEven ? [248, 250, 252] : [255, 255, 255]

    const cells = [
      String(i + 1),
      String(p.customers?.name  || 'Unknown'),
      String(p.customers?.phone || '-'),
      fmt(Number(p.amount)),   // plain number — no Rs. prefix needed (header has it)
      p.method.toUpperCase(),
      fmt(pending),            // plain number — no Rs. prefix
      String(p.notes || '-'),
    ]

    cells.forEach((text, col) => {
      drawCell(col, curY, ROW_H, text, {
        bgColor:   rowBg,
        bold:      col === 3 || col === 5,
        textColor:
          col === 3 ? ([15, 23, 42]  as RGB)
          : col === 5 ? ([180, 83, 9] as RGB)
          : ([51, 65, 85]            as RGB),
      })
    })

    curY += ROW_H
  })

  // ── GRAND TOTAL ROW ───────────────────────────────────────
  if (curY + ROW_H + 2 > pageH - 26) {
    doc.addPage()
    curY = 14
  }

  ;['', '', 'GRAND TOTAL', fmt(grandTotal), '', '', ''].forEach((text, col) =>
    drawCell(col, curY, ROW_H + 2, text, {
      bold:      true,
      fontSize:  9,
      bgColor:   [238, 242, 255],
      textColor: [67, 56, 202],
    })
  )

  // ── FOOTER (every page) ───────────────────────────────────
  const totalPages =
    (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()

  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg)
    fillRect(0, pageH - 15, pageWidth, 15, [248, 250, 252])
    doc.setDrawColor(210, 215, 230)
    doc.setLineWidth(0.3)
    doc.line(0, pageH - 15, pageWidth, pageH - 15)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Generated: ${dayjs().format('DD/MM/YYYY HH:mm')}  |  ${payments.length} transaction${payments.length !== 1 ? 's' : ''}`,
      pageWidth / 2, pageH - 6, { align: 'center' }
    )
    if (totalPages > 1) {
      doc.text(`Page ${pg}/${totalPages}`, pageWidth - MR, pageH - 6, { align: 'right' })
    }
  }

  // ── SAVE ───────────────────────────────────────────────────
  const filename = `collection-report-${date}.pdf`
  doc.save(filename)
  return filename
}