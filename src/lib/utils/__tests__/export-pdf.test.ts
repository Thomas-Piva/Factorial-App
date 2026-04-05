/**
 * Phase 5: Tests for export-pdf utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock jsPDF and autoTable ──────────────────────────────────────────────────
// vi.mock is hoisted — factory must be self-contained (no top-level references)
vi.mock('jspdf', () => ({
  default: vi.fn().mockReturnValue({
    setFontSize: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
  }),
}))

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))

// ── Import after mocks ────────────────────────────────────────────────────────
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { exportShiftsPdf, type ExportRow } from '../export-pdf'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exportShiftsPdf', () => {
  const mockJsPDF = vi.mocked(jsPDF)
  const mockAutoTable = vi.mocked(autoTable)

  // Helper to get the doc instance created by the last jsPDF() call
  function getDocInstance() {
    // mockJsPDF.mock.results[0].value is the object returned by new jsPDF()
    return mockJsPDF.mock.results[0]?.value as {
      setFontSize: ReturnType<typeof vi.fn>
      text: ReturnType<typeof vi.fn>
      save: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-apply the mock return value after clearAllMocks
    mockJsPDF.mockReturnValue({
      setFontSize: vi.fn(),
      text: vi.fn(),
      save: vi.fn(),
    } as unknown as InstanceType<typeof jsPDF>)
  })

  const sampleParams = {
    weekLabel: '14 Apr – 20 Apr 2025',
    days: ['2025-04-14', '2025-04-15', '2025-04-16'],
    dayLabels: ['Lun 14', 'Mar 15', 'Mer 16'],
    rows: [
      {
        userName: 'Mario Rossi',
        '2025-04-14': 'Apertura',
        '2025-04-15': '',
        '2025-04-16': 'Chiusura',
      } satisfies ExportRow,
      {
        userName: 'Anna Bianchi',
        '2025-04-14': '',
        '2025-04-15': 'Apertura',
        '2025-04-16': '',
      } satisfies ExportRow,
    ],
  }

  it('calls doc.save with correct filename', () => {
    exportShiftsPdf(sampleParams)
    expect(getDocInstance().save).toHaveBeenCalledWith('turni-14 Apr – 20 Apr 2025.pdf')
  })

  it('calls doc.setFontSize with 14', () => {
    exportShiftsPdf(sampleParams)
    expect(getDocInstance().setFontSize).toHaveBeenCalledWith(14)
  })

  it('calls doc.text with week label', () => {
    exportShiftsPdf(sampleParams)
    expect(getDocInstance().text).toHaveBeenCalledWith(
      'Turni — 14 Apr – 20 Apr 2025',
      14,
      15,
    )
  })

  it('calls autoTable with correct head', () => {
    exportShiftsPdf(sampleParams)
    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        head: [['Dipendente', 'Lun 14', 'Mar 15', 'Mer 16']],
      }),
    )
  })

  it('calls autoTable with correct body rows', () => {
    exportShiftsPdf(sampleParams)
    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: [
          ['Mario Rossi', 'Apertura', '', 'Chiusura'],
          ['Anna Bianchi', '', 'Apertura', ''],
        ],
      }),
    )
  })

  it('fills missing date keys with empty string', () => {
    const rowWithMissingDate: ExportRow = {
      userName: 'Test User',
      '2025-04-14': 'Turno',
      // 2025-04-15 and 2025-04-16 not set
    }
    exportShiftsPdf({ ...sampleParams, rows: [rowWithMissingDate] })
    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: [['Test User', 'Turno', '', '']],
      }),
    )
  })

  it('calls jsPDF constructor with landscape orientation', () => {
    exportShiftsPdf(sampleParams)
    expect(mockJsPDF).toHaveBeenCalledWith({ orientation: 'landscape' })
  })
})
