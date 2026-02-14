/**
 * Chart Export Utilities
 *
 * Helper functions for exporting charts as PNG, SVG, CSV, and PDF.
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// ============== Types ==============

export interface ExportOptions {
  filename?: string
  format?: 'png' | 'svg' | 'csv' | 'pdf'
  quality?: number // For PNG (0-1)
  width?: number // For PDF
  height?: number // For PDF
}

export interface CSVData {
  [key: string]: string | number
}

// ============== PNG Export ==============

/**
 * Export chart as PNG image
 */
export async function exportAsPNG(
  elementRef: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = `chart-${Date.now()}.png`, quality = 1.0 } = options

  try {
    const canvas = await html2canvas(elementRef, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
    })

    const url = canvas.toDataURL('image/png', quality)
    downloadFile(url, filename)
  } catch (error) {
    console.error('Failed to export PNG:', error)
    throw error
  }
}

/**
 * Export multiple charts as single PNG
 */
export async function exportMultipleAsPNG(
  elements: HTMLElement[],
  options: ExportOptions = {}
): Promise<void> {
  const { filename = `charts-${Date.now()}.png`, quality = 1.0 } = options

  try {
    const canvases = await Promise.all(
      elements.map((el) =>
        html2canvas(el, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        })
      )
    )

    // Calculate total height
    const totalHeight = canvases.reduce((sum, canvas) => sum + canvas.height, 0)
    const maxWidth = Math.max(...canvases.map((c) => c.width))

    // Create combined canvas
    const combinedCanvas = document.createElement('canvas')
    combinedCanvas.width = maxWidth
    combinedCanvas.height = totalHeight

    const ctx = combinedCanvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    // Draw all canvases
    let currentY = 0
    canvases.forEach((canvas) => {
      ctx.drawImage(canvas, 0, currentY)
      currentY += canvas.height
    })

    const url = combinedCanvas.toDataURL('image/png', quality)
    downloadFile(url, filename)
  } catch (error) {
    console.error('Failed to export multiple PNGs:', error)
    throw error
  }
}

// ============== SVG Export ==============

/**
 * Export chart as SVG
 */
export function exportAsSVG(elementRef: HTMLElement, options: ExportOptions = {}): void {
  const { filename = `chart-${Date.now()}.svg` } = options

  try {
    const svg = elementRef.querySelector('svg')
    if (!svg) throw new Error('No SVG element found')

    const serializer = new XMLSerializer()
    let svgString = serializer.serializeToString(svg)

    // Add XML declaration
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString

    // Add viewBox if not present
    if (!svg.hasAttribute('viewBox')) {
      const bbox = svg.getBBox()
      svgString = svgString.replace(
        '<svg',
        `<svg viewBox="0 0 ${bbox.width} ${bbox.height}"`
      )
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    downloadFile(url, filename)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export SVG:', error)
    throw error
  }
}

// ============== CSV Export ==============

/**
 * Export data as CSV
 */
export function exportAsCSV(data: CSVData[], options: ExportOptions = {}): void {
  const { filename = `data-${Date.now()}.csv` } = options

  try {
    if (data.length === 0) throw new Error('No data to export')

    // Get headers from first object
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')

    // Convert data to CSV rows
    const csvRows = data.map((row) =>
      headers.map((header) => {
        const value = row[header]
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )

    const csv = [csvHeaders, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    downloadFile(url, filename)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export CSV:', error)
    throw error
  }
}

/**
 * Export chart data as CSV with metadata
 */
export function exportChartDataAsCSV(
  data: CSVData[],
  metadata?: { title?: string; description?: string; date?: string },
  options: ExportOptions = {}
): void {
  const { filename = `chart-data-${Date.now()}.csv` } = options

  try {
    if (data.length === 0) throw new Error('No data to export')

    let csv = ''

    // Add metadata
    if (metadata) {
      if (metadata.title) csv += `Title,${metadata.title}\n`
      if (metadata.description) csv += `Description,${metadata.description}\n`
      if (metadata.date) csv += `Date,${metadata.date}\n`
      csv += '\n' // Empty line separator
    }

    // Add data
    const headers = Object.keys(data[0])
    csv += headers.join(',') + '\n'
    csv += data.map((row) => headers.map((h) => row[h]).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    downloadFile(url, filename)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export chart data as CSV:', error)
    throw error
  }
}

// ============== PDF Export ==============

/**
 * Export chart as PDF
 */
export async function exportAsPDF(
  elementRef: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = `chart-${Date.now()}.pdf`,
    width = 210, // A4 width in mm
    height = 297, // A4 height in mm
  } = options

  try {
    const canvas = await html2canvas(elementRef, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height],
    })

    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(filename)
  } catch (error) {
    console.error('Failed to export PDF:', error)
    throw error
  }
}

/**
 * Export multiple charts as multi-page PDF
 */
export async function exportMultipleAsPDF(
  elements: HTMLElement[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = `charts-${Date.now()}.pdf`,
    width = 210,
    height = 297,
  } = options

  try {
    const canvases = await Promise.all(
      elements.map((el) =>
        html2canvas(el, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        })
      )
    )

    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height],
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()

    canvases.forEach((canvas, index) => {
      if (index > 0) {
        pdf.addPage()
      }

      const imgData = canvas.toDataURL('image/png')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    })

    pdf.save(filename)
  } catch (error) {
    console.error('Failed to export multiple PDFs:', error)
    throw error
  }
}

/**
 * Export dashboard with title and date
 */
export async function exportDashboardAsPDF(
  elements: HTMLElement[],
  title: string,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = `dashboard-${Date.now()}.pdf`, width = 297, height = 210 } = options

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [width, height],
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // Add title page
    pdf.setFontSize(24)
    pdf.text(title, pdfWidth / 2, 30, { align: 'center' })

    pdf.setFontSize(12)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, 40, {
      align: 'center',
    })

    // Add charts
    for (let i = 0; i < elements.length; i++) {
      pdf.addPage()

      const canvas = await html2canvas(elements[i], {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const imgProps = pdf.getImageProperties(imgData)

      // Calculate dimensions to fit page with margins
      const margin = 10
      const maxWidth = pdfWidth - 2 * margin
      const maxHeight = pdfHeight - 2 * margin

      let finalWidth = maxWidth
      let finalHeight = (imgProps.height * maxWidth) / imgProps.width

      if (finalHeight > maxHeight) {
        finalHeight = maxHeight
        finalWidth = (imgProps.width * maxHeight) / imgProps.height
      }

      const x = (pdfWidth - finalWidth) / 2
      const y = (pdfHeight - finalHeight) / 2

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
    }

    pdf.save(filename)
  } catch (error) {
    console.error('Failed to export dashboard PDF:', error)
    throw error
  }
}

// ============== Helper Functions ==============

/**
 * Download file helper
 */
function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
}

/**
 * Copy chart image to clipboard
 */
export async function copyChartToClipboard(elementRef: HTMLElement): Promise<void> {
  try {
    const canvas = await html2canvas(elementRef, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    })

    canvas.toBlob(async (blob) => {
      if (!blob) throw new Error('Failed to create blob')

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        console.log('Chart copied to clipboard')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        throw error
      }
    })
  } catch (error) {
    console.error('Failed to copy chart:', error)
    throw error
  }
}

/**
 * Print chart
 */
export async function printChart(elementRef: HTMLElement): Promise<void> {
  try {
    const canvas = await html2canvas(elementRef, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')

    const printWindow = window.open('', '_blank')
    if (!printWindow) throw new Error('Could not open print window')

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Chart</title>
          <style>
            body { margin: 0; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="window.print(); window.close();" />
        </body>
      </html>
    `)

    printWindow.document.close()
  } catch (error) {
    console.error('Failed to print chart:', error)
    throw error
  }
}

// ============== React Hook ==============

/**
 * Custom hook for chart exports
 */
export function useChartExport(elementRef: React.RefObject<HTMLDivElement>) {
  const exportPNG = async (options?: ExportOptions) => {
    if (!elementRef.current) throw new Error('Element ref is null')
    await exportAsPNG(elementRef.current, options)
  }

  const exportSVG = (options?: ExportOptions) => {
    if (!elementRef.current) throw new Error('Element ref is null')
    exportAsSVG(elementRef.current, options)
  }

  const exportPDF = async (options?: ExportOptions) => {
    if (!elementRef.current) throw new Error('Element ref is null')
    await exportAsPDF(elementRef.current, options)
  }

  const copyToClipboard = async () => {
    if (!elementRef.current) throw new Error('Element ref is null')
    await copyChartToClipboard(elementRef.current)
  }

  const print = async () => {
    if (!elementRef.current) throw new Error('Element ref is null')
    await printChart(elementRef.current)
  }

  return {
    exportPNG,
    exportSVG,
    exportPDF,
    copyToClipboard,
    print,
  }
}

// ============== Export ==============

export default {
  exportAsPNG,
  exportMultipleAsPNG,
  exportAsSVG,
  exportAsCSV,
  exportChartDataAsCSV,
  exportAsPDF,
  exportMultipleAsPDF,
  exportDashboardAsPDF,
  copyChartToClipboard,
  printChart,
  useChartExport,
}
