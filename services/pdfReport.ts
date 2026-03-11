/**
 * generateDailyPDFReport.ts
 */

import dayjs from "dayjs"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { PaymentWithCustomer } from "@/types"

type RGB = [number, number, number]

/* ----------------------------------------------------------- */
/* Compute Balances                                            */
/* ----------------------------------------------------------- */
export async function computeBalances(
  supabase: SupabaseClient,
  payments: PaymentWithCustomer[]
): Promise<Record<string, number>> {

  const balanceMap: Record<string, number> = {}

  const customerIds = [
    ...new Set(payments.map((p) => String(p.customer_id)))
  ]

  if (!customerIds.length) return balanceMap

  const { data, error } = await supabase
    .from("customers")
    .select("id,pending_amount,total_amount,paid_amount")
    .in("id", customerIds)

  if (error) {
    console.error("Balance fetch error:", error.message)
    return balanceMap
  }

  for (const c of data ?? []) {

    const id = String(c.id)

    if (c.pending_amount !== null && c.pending_amount !== undefined) {

      balanceMap[id] = Math.max(0, Number(c.pending_amount))

    } else if (c.total_amount !== null && c.total_amount !== undefined) {

      const total = Number(c.total_amount || 0)
      const paid = Number(c.paid_amount || 0)

      balanceMap[id] = Math.max(0, total - paid)

    } else {

      balanceMap[id] = 0

    }
  }

  return balanceMap
}

/* ----------------------------------------------------------- */
/* Helpers                                                     */
/* ----------------------------------------------------------- */

function fmt(value: number) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function rs(v: number) {
  return `Rs. ${fmt(v)}`
}

/* ----------------------------------------------------------- */
/* Main PDF Generator                                          */
/* ----------------------------------------------------------- */

export async function generateDailyPDFReport(
  supabase: SupabaseClient,
  date: string,
  payments: PaymentWithCustomer[],
  businessName: string = "FinTrack Business"
) {

  const { jsPDF } = await import("jspdf")

  const balances = await computeBalances(supabase, payments)

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const ML = 10
  const MR = 10
  const PRINT_W = pageW - ML - MR

  const fillRect = (x: number, y: number, w: number, h: number, rgb: RGB) => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.rect(x, y, w, h, "F")
  }

  const roundRect = (x: number, y: number, w: number, h: number, r: number, rgb: RGB) => {
    doc.setFillColor(rgb[0], rgb[1], rgb[2])
    doc.roundedRect(x, y, w, h, r, r, "F")
  }

  /* ------------------------ totals ------------------------ */

  const cashTotal = payments
    .filter(p => p.method === "cash")
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  const upiTotal = payments
    .filter(p => p.method === "upi")
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  const grandTotal = cashTotal + upiTotal

  const uniqueIds = [...new Set(payments.map(p => String(p.customer_id)))]

  const totalPending = uniqueIds.reduce(
    (s, id) => s + (balances[id] || 0),
    0
  )

  /* ------------------------ header ------------------------ */

  fillRect(0, 0, pageW, 46, [79, 70, 229])

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)

  doc.text(businessName, ML, 18)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Daily Collection Report", ML, 28)

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")

  doc.text(dayjs(date).format("DD MMMM YYYY"), pageW - MR, 18, {
    align: "right"
  })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  doc.text(dayjs(date).format("dddd"), pageW - MR, 28, {
    align: "right"
  })

  /* ------------------------ summary boxes ------------------------ */

  const boxY = 53
  const boxH = 27
  const gap = 3
  const boxW = (PRINT_W - gap * 3) / 4

  const boxes = [
    { label: "CASH COLLECTED", value: rs(cashTotal), bg: [236,253,245], fg: [4,120,87] },
    { label: "UPI COLLECTED", value: rs(upiTotal), bg: [239,246,255], fg: [29,78,216] },
    { label: "TOTAL COLLECTED", value: rs(grandTotal), bg: [238,242,255], fg: [67,56,202] },
    { label: "TOTAL BALANCE", value: rs(totalPending), bg: [255,251,235], fg: [180,83,9] }
  ]

  boxes.forEach((box, i) => {

    const x = ML + i * (boxW + gap)

    roundRect(x, boxY, boxW, boxH, 3, box.bg as RGB)

    doc.setTextColor(...box.fg as RGB)

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text(box.label, x + boxW/2, boxY + 8, { align:"center" })

    doc.setFontSize(11)
    doc.text(box.value, x + boxW/2, boxY + 20, { align:"center" })

  })

  /* ------------------------ table ------------------------ */

  doc.setFontSize(11)
  doc.setTextColor(0,0,0)
  doc.setFont("helvetica","bold")

  doc.text("Payment Details", ML, 91)

  const COL_W = [7,43,27,35,17,35,26]

  const headers = [
    "#",
    "Customer Name",
    "Phone",
    "Paid (Rs.)",
    "Method",
    "Balance (Rs.)",
    "Notes"
  ]

  const colX:number[] = []

  let cx = ML

  COL_W.forEach(w=>{
    colX.push(cx)
    cx += w
  })

  const HEAD_H = 10
  const ROW_H = 8.5

  let y = 94

  headers.forEach((h,i)=>{

    doc.setFillColor(79,70,229)
    doc.rect(colX[i],y,COL_W[i],HEAD_H,"F")

    doc.setTextColor(255,255,255)
    doc.setFontSize(8.5)

    doc.text(h,colX[i]+COL_W[i]/2,y+6,{
      align:"center"
    })

  })

  y += HEAD_H

  payments.forEach((p,i)=>{

    if(y + ROW_H > pageH - 25){
      doc.addPage()
      y = 20
    }

    const pending = balances[String(p.customer_id)] || 0

    const cells = [

      String(i+1),

      p.customers?.name || "Unknown",

      p.customers?.phone || "-",

      fmt(Number(p.amount || 0)),

      p.method?.toUpperCase() || "-",

      fmt(pending),

      p.notes || "-"

    ]

    cells.forEach((c,col)=>{

      doc.setDrawColor(210,215,230)
      doc.rect(colX[col],y,COL_W[col],ROW_H)

      doc.setTextColor(0,0,0)
      doc.setFontSize(8.5)

      doc.text(
        String(c),
        colX[col] + 2,
        y + 5
      )

    })

    y += ROW_H

  })

  /* ------------------------ grand total ------------------------ */

  doc.setFillColor(238,242,255)

  doc.rect(ML,y,PRINT_W,ROW_H+2,"F")

  doc.setFont("helvetica","bold")
  doc.setTextColor(67,56,202)

  doc.text("GRAND TOTAL", ML+70, y+6)

  doc.text(fmt(grandTotal), ML+120, y+6)

  /* ------------------------ footer ------------------------ */

  fillRect(0,pageH-15,pageW,15,[248,250,252])

  doc.setFontSize(8)
  doc.setTextColor(100,116,139)

  doc.text(
    `Generated: ${dayjs().format("DD/MM/YYYY HH:mm")} | ${payments.length} transactions`,
    pageW/2,
    pageH-6,
    { align:"center" }
  )

  const filename = `collection-report-${date}.pdf`

  doc.save(filename)

  return filename
}