import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportRow {
  userName: string
  [dateISO: string]: string
}

export function exportShiftsPdf(params: {
  weekLabel: string
  days: string[]
  dayLabels: string[]
  rows: ExportRow[]
}): void {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text(`Turni — ${params.weekLabel}`, 14, 15)
  autoTable(doc, {
    startY: 22,
    head: [['Dipendente', ...params.dayLabels]],
    body: params.rows.map((r) => [r.userName, ...params.days.map((d) => r[d] ?? '')]),
  })
  doc.save(`turni-${params.weekLabel}.pdf`)
}
