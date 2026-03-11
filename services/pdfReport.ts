/**
 * generateDailyPDFReport.ts
 *
 * USAGE:
 *   import { generateDailyPDFReport } from './generateDailyPDFReport'
 *   await generateDailyPDFReport(supabase, date, payments, 'My Business')
 *
 * NOTE: payments must be fetched via fetchPayments() from payments.ts
 * which now includes pending_amount, total_amount, paid_amount in the join.
 */

import dayjs from 'dayjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentWithCustomer } from '@/types'

// ─────────────────────────────────────────────────────────────
// Helpers
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

// ─────────────────────────────────────────────────────────────
// Get pending balance for a payment's customer.
// Reads directly from the already-joined customers data.
// ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPending(p: PaymentWithCustomer): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = p.customers as any
  if (c == null) return 0

  // Priority 1: pending_amount stored on customer row
  if (c.pending_amount != null) return Math.max(0, Number(c.pending_amount))

  // Priority 2: compute from total_amount - paid_amount
  if (c.total_amount != null) {
    return Math.max(0, Number(c.total_amount) - Number(c.paid_amount ?? 0))
  }

  return 0
}

// ─────────────────────────────────────────────────────────────
// Generate the PDF
// ─────────────────────────────────────────────────────────────
export async function generateDailyPDFReport(
  _supabase: SupabaseClient,   // kept for API compatibility, no longer needed
  date: string,
  payments: PaymentWithCustomer[],
  businessName: string = 'FinTrack Business'
) {
  // Build balance map directly from joined data — no extra DB call needed
  const balances: Record<string, number> = {}
  for (const p of payments) {
    if (!(p.customer_id in balances)) {
      balances[p.customer_id] = getPending(p)
    }
  }

  console.log('[PDF] balances from join:', JSON.stringify(balances))

  const { jsPDF } = await import('jspdf')

  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageH     = doc.internal.pageSize.getHeight()
  const ML        = 10
  const MR        = 10
  const PRINT_W   = pageWidth - ML - MR

  type RGB = [number, number, number]

  const fillRect = (x: number, y: number, w: number, h: number, rgb: RGB) => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(x, y, w, h, 'F')
  }

  const roundRect = (x: number, y: number, w: number, h: number, r: number, rgb: RGB) => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.roundedRect(x, y, w, h, r, r, 'F')
  }

  // ── TOTALS ────────────────────────────────────────────────
  const cashTotal    = payments.filter((p) => p.method === 'cash').reduce((s, p) => s + Number(p.amount), 0)
  const upiTotal     = payments.filter((p) => p.method === 'upi') .reduce((s, p) => s + Number(p.amount), 0)
  const grandTotal   = cashTotal + upiTotal
  const uniqueIds    = [...new Set(payments.map((p) => p.customer_id))]
  const totalPending = uniqueIds.reduce((s, id) => s + (balances[id] ?? 0), 0)

  // ── HEADER ────────────────────────────────────────────────
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

  // ── 4 SUMMARY BOXES ───────────────────────────────────────
  const boxY = 53
  const boxH = 27
  const gap  = 3
  const boxW = (PRINT_W - gap * 3) / 4

  const boxes: { label: string; value: string; bg: RGB; fg: RGB }[] = [
    { label: 'CASH COLLECTED',  value: fmtBox(cashTotal),    bg: [236, 253, 245], fg: [4,   120, 87 ] },
    { label: 'UPI COLLECTED',   value: fmtBox(upiTotal),     bg: [239, 246, 255], fg: [29,  78,  216] },
    { label: 'TOTAL COLLECTED', value: fmtBox(grandTotal),   bg: [238, 242, 255], fg: [67,  56,  202] },
    { label: 'TOTAL BALANCE',   value: fmtBox(totalPending), bg: [255, 251, 235], fg: [180, 83,  9  ] },
  ]

  boxes.forEach((box, i) => {
    const x = ML + i * (boxW + gap)
    roundRect(x, boxY, boxW, boxH, 3, box.bg)
    doc.setTextColor(box.fg[0], box.fg[1], box.fg[2])
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(box.label, x + boxW / 2, boxY + 8, { align: 'center' })
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
  let curY     = 94

  const drawCell = (
    col: number, y: number, h: number, text: string,
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
    const tc: RGB = opts.textColor ?? [51, 65, 85]
    doc.setTextColor(tc[0], tc[1], tc[2])
    doc.setFontSize(opts.fontSize ?? 8.5)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    const align = COL_ALIGN[col]
    const tx = align === 'center' ? x + w / 2 : align === 'right' ? x + w - PAD : x + PAD
    const clipped = doc.splitTextToSize(text, w - PAD * 2)[0] as string
    doc.text(clipped, tx, y + h / 2 + 1.3, { align, baseline: 'middle' as const })
  }

  const drawHeader = (y: number) => {
    HEADERS.forEach((h, col) =>
      drawCell(col, y, HEAD_H, h, {
        bold: true, fontSize: 8.5,
        bgColor: [79, 70, 229], textColor: [255, 255, 255],
      })
    )
  }

  drawHeader(curY)
  curY += HEAD_H

  // ── BODY ROWS ─────────────────────────────────────────────
  payments.forEach((p, i) => {
    if (curY + ROW_H > pageH - 26) {
      doc.addPage(); curY = 14; drawHeader(curY); curY += HEAD_H
    }

    const pending = balances[p.customer_id] ?? 0
    const rowBg: RGB = i % 2 === 1 ? [248, 250, 252] : [255, 255, 255]

    const cells: string[] = [
      String(i + 1),
      String(p.customers?.name  || 'Unknown'),
      String(p.customers?.phone || '-'),
      fmt(Number(p.amount)),
      p.method.toUpperCase(),
      fmt(pending),
      String(p.notes || '-'),
    ]

    cells.forEach((text, col) => {
      let textColor: RGB = [51, 65, 85]
      if (col === 3) textColor = [15, 23, 42]
      else if (col === 5) textColor = pending > 0 ? [180, 83, 9] : [4, 120, 87]

      drawCell(col, curY, ROW_H, text, {
        bgColor: rowBg,
        bold: col === 3 || col === 5,
        textColor,
      })
    })

    curY += ROW_H
  })

  // ── GRAND TOTAL ROW ───────────────────────────────────────
  if (curY + ROW_H + 2 > pageH - 26) { doc.addPage(); curY = 14 }

  ;['', '', 'GRAND TOTAL', fmt(grandTotal), '', '', ''].forEach((text, col) =>
    drawCell(col, curY, ROW_H + 2, text, {
      bold: true, fontSize: 9,
      bgColor: [238, 242, 255], textColor: [67, 56, 202],
    })
  )

  // ── FOOTER ────────────────────────────────────────────────
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

  const filename = `collection-report-${date}.pdf`
  doc.save(filename)
  return filename
}