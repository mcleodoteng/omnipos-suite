/**
 * Excel Export Utility
 * Generates Excel-compatible CSV files with proper formatting
 */

type CellValue = string | number | boolean | null | undefined;

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Escape CSV cell value to handle commas, quotes, and newlines
 */
const escapeCSVCell = (value: CellValue): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Convert data to Excel-compatible CSV format
 */
export const generateExcelCSV = <T extends Record<string, CellValue>>(
  data: T[],
  columns: ExcelColumn[]
): string => {
  // Header row
  const headerRow = columns.map(col => escapeCSVCell(col.header)).join(',');
  
  // Data rows
  const dataRows = data.map(row => 
    columns.map(col => escapeCSVCell(row[col.key])).join(',')
  );
  
  // Add BOM for Excel to recognize UTF-8
  return '\uFEFF' + [headerRow, ...dataRows].join('\n');
};

/**
 * Download data as Excel file (.xlsx simulation via CSV)
 */
export const downloadExcel = <T extends Record<string, CellValue>>(
  data: T[],
  columns: ExcelColumn[],
  filename: string
): void => {
  const csv = generateExcelCSV(data, columns);
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename.replace('.xlsx', '.csv') : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Pre-defined export configurations for common reports
 */
export const ExcelExportConfigs = {
  transactions: [
    { header: 'Receipt Number', key: 'receiptNumber' },
    { header: 'Date', key: 'date' },
    { header: 'Time', key: 'time' },
    { header: 'Cashier', key: 'cashier' },
    { header: 'Items Count', key: 'itemCount' },
    { header: 'Subtotal', key: 'subtotal' },
    { header: 'Tax', key: 'tax' },
    { header: 'Discount', key: 'discount' },
    { header: 'Total', key: 'total' },
    { header: 'Payment Method', key: 'paymentMethod' },
  ],
  
  salesReport: [
    { header: 'Metric', key: 'metric' },
    { header: 'Value', key: 'value' },
  ],
  
  dailySales: [
    { header: 'Day', key: 'day' },
    { header: 'Sales', key: 'sales' },
  ],
  
  topProducts: [
    { header: 'Rank', key: 'rank' },
    { header: 'Product Name', key: 'name' },
    { header: 'Quantity Sold', key: 'quantity' },
    { header: 'Revenue', key: 'revenue' },
  ],
  
  categoryBreakdown: [
    { header: 'Category', key: 'name' },
    { header: 'Revenue', key: 'value' },
  ],
  
  stockAdjustments: [
    { header: 'Date', key: 'date' },
    { header: 'Time', key: 'time' },
    { header: 'Product', key: 'productName' },
    { header: 'Type', key: 'type' },
    { header: 'Previous Stock', key: 'previousStock' },
    { header: 'Adjustment', key: 'adjustment' },
    { header: 'New Stock', key: 'newStock' },
    { header: 'Reason', key: 'reason' },
    { header: 'Adjusted By', key: 'adjustedBy' },
  ],
};
