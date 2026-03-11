import dayjs from 'dayjs'
import type { PaymentWithCustomer } from '@/types'

// ─────────────────────────────────────────────────────────────
// IMPORTANT — update your Supabase fetch query to this so that
// pending_amount is available from the customer_summary view:
//
//   const { data } = await supabase
//     .from('payments')
//     .select('*, customers:customer_summary(*)')
//     .eq('date', date)
//
// ─────────────────────────────────────────────────────────────

// Format number with Indian comma style — NO currency symbol
// jsPDF's built-in fonts cannot render ₹, so we put "Rs." only in headers
function fmt(value: number): string {
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// For summary boxes we can afford the prefix
function fmtBox(value: number): string {
  return `Rs. ${fmt(value)}`
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

  // Extract pending_amount from each unique customer
  // Works with both customer_summary view (has pending_amount)
  // and raw customers table (has total_amount; we compute manually)
  const seenCustomers = new Set<string>()
  let totalPending = 0
  for (const p of payments) {
    if (!seenCustomers.has(p.customer_id)) {
      seenCustomers.add(p.customer_id)
      const c = p.customers as unknown as Record<string, unknown>
      let pending = Number(c?.['pending_amount'] ?? NaN)
      if (isNaN(pending) || pending === 0) {
        // fallback: total_amount - paid_amount (available in customer_summary view)
        const total = Number(c?.['total_amount'] ?? 0)
        const paid  = Number(c?.['paid_amount']  ?? 0)
        pending = Math.max(0, total - paid)
      }
      totalPending += pending
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
  // 190mm printable, 4 boxes, 3 gaps of 3mm = (190 - 9) / 4 = 45.25mm each
  const boxY = 53
  const boxH = 27
  const gap  = 3
  const boxW = (PRINT_W - gap * 3) / 4   // ≈ 45.25 mm — wide enough for "Rs. 1,00,000.00"

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

    // Value — auto-shrink font if it won't fit
    const maxBoxW = boxW - 4
    doc.setFont('helvetica', 'bold')
    let fs = 11
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
  // #(7) + Name(43) + Phone(27) + Paid(Rs.)(35) + Method(17) + Bal(Rs.)(35) + Notes(26) = 190 ✅
  //
  // Paid and Balance columns are 35mm each.
  // "39,000.00" at font 8.5 ≈ 22mm — 35mm is more than enough.
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

    const tc = opts.textColor ?? [51, 65, 85] as RGB
    doc.setTextColor(tc[0], tc[1], tc[2])
    doc.setFontSize(opts.fontSize ?? 8.5)
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')

    const align = COL_ALIGN[col]
    const tx =
      align === 'center' ? x + w / 2
      : align === 'right'  ? x + w - PAD
      : x + PAD

    // Clip text to cell width
    const maxW   = w - PAD * 2
    const clipped = doc.splitTextToSize(text, maxW)[0] as string
    doc.text(clipped, tx, y + h / 2 + 1.3, { align, baseline: 'middle' as const })
  }

  // ── HEADER ROW ────────────────────────────────────────────
  const drawHeader = (y: number) => {
    HEADERS.forEach((h, col) =>
      drawCell(col, y, HEAD_H, h, {
        bold: true,
        fontSize: 8.5,
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

    const c = p.customers as unknown as Record<string, unknown>
    let pending = Number(c?.['pending_amount'] ?? NaN)
    if (isNaN(pending) || pending === 0) {
      const total = Number(c?.['total_amount'] ?? 0)
      const paid  = Number(c?.['paid_amount']  ?? 0)
      pending = Math.max(0, total - paid)
    }

    const isEven  = i % 2 === 1
    const rowBg: RGB = isEven ? [248, 250, 252] : [255, 255, 255]

    const cells = [
      String(i + 1),
      String(p.customers?.name  || 'Unknown'),
      String(p.customers?.phone || '-'),
      fmt(Number(p.amount)),      // ← number only, no Rs. prefix
      p.method.toUpperCase(),
      fmt(pending),               // ← number only, no Rs. prefix
      String(p.notes || '-'),
    ]

    cells.forEach((text, col) => {
      drawCell(col, curY, ROW_H, text, {
        bgColor:   rowBg,
        bold:      col === 3 || col === 5,
        textColor:
          col === 3 ? [15, 23, 42]  as RGB
          : col === 5 ? [180, 83, 9] as RGB
          : [51, 65, 85]            as RGB,
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
      bold: true,
      fontSize: 9,
      bgColor:   [238, 242, 255],
      textColor: [67, 56, 202],
    })
  )

  // ── FOOTER (all pages) ────────────────────────────────────
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