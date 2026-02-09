# Export Features - CSV, Excel, PDF

Implementación completa de exportación de datos desde el DataTable.

## 1. Export Service

```typescript
// src/app/shared/services/table-export.service.ts
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ColumnConfig } from '../components/data-table/data-table.types';

@Injectable({ providedIn: 'root' })
export class TableExportService {
  /**
   * Exporta datos a CSV.
   */
  exportToCSV<T>(
    data: T[],
    columns: ColumnConfig<T>[],
    filename = 'export.csv'
  ): void {
    const rows: string[][] = [];

    // Headers
    const headers = columns.map(col => col.label);
    rows.push(headers);

    // Data rows
    data.forEach(row => {
      const rowData = columns.map(col => {
        const value = (row as any)[col.key];
        return col.format ? col.format(value, row) : value?.toString() || '';
      });
      rows.push(rowData);
    });

    // Convert to CSV string
    const csvContent = rows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  }

  /**
   * Exporta datos a Excel.
   */
  exportToExcel<T>(
    data: T[],
    columns: ColumnConfig<T>[],
    filename = 'export.xlsx'
  ): void {
    // Preparar datos para Excel
    const excelData = data.map(row =>
      columns.reduce((obj, col) => {
        const value = (row as any)[col.key];
        obj[col.label] = col.format ? col.format(value, row) : value;
        return obj;
      }, {} as any)
    );

    // Crear workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Auto-width columns
    const maxWidth = 50;
    const wscols = columns.map(col => ({
      wch: Math.min(col.label.length + 5, maxWidth)
    }));
    worksheet['!cols'] = wscols;

    // Download
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Exporta datos a PDF (usando jsPDF).
   * Requiere: npm install jspdf jspdf-autotable
   */
  async exportToPDF<T>(
    data: T[],
    columns: ColumnConfig<T>[],
    filename = 'export.pdf',
    options?: {
      title?: string;
      orientation?: 'portrait' | 'landscape';
    }
  ): Promise<void> {
    // Importación dinámica para reducir bundle size
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF({
      orientation: options?.orientation || 'landscape'
    });

    // Título
    if (options?.title) {
      doc.setFontSize(16);
      doc.text(options.title, 14, 15);
    }

    // Preparar datos para tabla
    const headers = columns.map(col => col.label);
    const rows = data.map(row =>
      columns.map(col => {
        const value = (row as any)[col.key];
        return col.format ? col.format(value, row) : value?.toString() || '';
      })
    );

    // Crear tabla
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: options?.title ? 25 : 15,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Download
    doc.save(filename);
  }

  /**
   * Exporta solo las filas seleccionadas.
   */
  exportSelected<T>(
    selectedRows: T[],
    columns: ColumnConfig<T>[],
    format: 'csv' | 'excel' | 'pdf',
    filename?: string
  ): void {
    switch (format) {
      case 'csv':
        this.exportToCSV(selectedRows, columns, filename || 'selected.csv');
        break;
      case 'excel':
        this.exportToExcel(selectedRows, columns, filename || 'selected.xlsx');
        break;
      case 'pdf':
        this.exportToPDF(selectedRows, columns, filename || 'selected.pdf');
        break;
    }
  }
}
```

## 2. Integración en DataTable Component

```typescript
// Agregar al DataTable component
import { TableExportService } from '@/shared/services/table-export.service';

@Component({...})
export class DataTableComponent<T> {
  private exportService = inject(TableExportService);

  /**
   * Exporta todos los datos filtrados.
   */
  export(format: 'csv' | 'excel' | 'pdf'): void {
    const data = this.filteredData(); // Usar datos filtrados
    const filename = `export_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        this.exportService.exportToCSV(data, this.config.columns, `${filename}.csv`);
        break;
      case 'excel':
        this.exportService.exportToExcel(data, this.config.columns, `${filename}.xlsx`);
        break;
      case 'pdf':
        this.exportService.exportToPDF(data, this.config.columns, `${filename}.pdf`, {
          title: 'Data Export',
          orientation: 'landscape'
        });
        break;
    }
  }

  /**
   * Exporta solo las filas seleccionadas.
   */
  exportSelected(format: 'csv' | 'excel' | 'pdf'): void {
    const selected = Array.from(this.selectedRows());

    if (selected.length === 0) {
      alert('No rows selected');
      return;
    }

    this.exportService.exportSelected(
      selected,
      this.config.columns,
      format,
      `selected_${new Date().toISOString().split('T')[0]}`
    );
  }
}
```

## 3. UI para Export Buttons

```html
<!-- Agregar al template del DataTable -->
<div class="flex gap-2">
  <!-- Export Menu -->
  <div class="relative" #exportMenu>
    <button
      (click)="showExportMenu = !showExportMenu"
      class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      Export
    </button>

    @if (showExportMenu) {
      <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
        <button
          (click)="export('csv'); showExportMenu = false"
          class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Export as CSV
        </button>

        <button
          (click)="export('excel'); showExportMenu = false"
          class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Export as Excel
        </button>

        <button
          (click)="export('pdf'); showExportMenu = false"
          class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          Export as PDF
        </button>

        @if (selectedRows().size > 0) {
          <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>

          <button
            (click)="exportSelected('csv'); showExportMenu = false"
            class="w-full px-4 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Export Selected ({{ selectedRows().size }})
          </button>
        }
      </div>
    }
  </div>
</div>
```

## 4. Ejemplo Avanzado con Estilos

```typescript
/**
 * Exporta a Excel con estilos personalizados.
 */
exportToExcelWithStyles<T>(
  data: T[],
  columns: ColumnConfig<T>[],
  filename = 'export.xlsx'
): void {
  const excelData = data.map(row =>
    columns.reduce((obj, col) => {
      const value = (row as any)[col.key];
      obj[col.label] = col.format ? col.format(value, row) : value;
      return obj;
    }, {} as any)
  );

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  // Aplicar estilos a headers
  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;

    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "3B82F6" } },
      alignment: { horizontal: "center" }
    };
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, filename);
}
```

## 5. Export con Progress

```typescript
@Component({...})
export class DataTableComponent {
  exportProgress = signal(0);
  isExporting = signal(false);

  async exportWithProgress(format: 'csv' | 'excel' | 'pdf'): Promise<void> {
    this.isExporting.set(true);
    this.exportProgress.set(0);

    try {
      const data = this.filteredData();
      const chunkSize = 100;
      const chunks = [];

      // Dividir en chunks
      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
        this.exportProgress.set((i / data.length) * 100);
        await this.delay(10); // Dar tiempo para actualizar UI
      }

      // Exportar
      await this.exportService.exportToPDF(data, this.config.columns);

      this.exportProgress.set(100);
    } finally {
      this.isExporting.set(false);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Resumen

Features de exportación incluyen:
- **CSV Export**: Simple y compatible
- **Excel Export**: Con estilos y auto-width
- **PDF Export**: Con jsPDF y autotable
- **Export Selected**: Solo filas seleccionadas
- **Progress Indicator**: Para grandes datasets
- **Formatted Data**: Respeta formatters de columnas

Requiere dependencias:
```bash
npm install xlsx file-saver jspdf jspdf-autotable
npm install --save-dev @types/file-saver
```
