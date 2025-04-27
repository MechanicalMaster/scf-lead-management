import * as XLSX from 'xlsx';

/**
 * Downloads an Excel file with only header columns.
 * @param headers Array of header strings
 * @param filename Name of the file to download (e.g., 'template.xlsx')
 */
export function downloadTemplate(headers: string[], filename: string) {
  // Create a worksheet with headers only (first row)
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  // Create a new workbook and append the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  // Write the workbook and trigger download
  XLSX.writeFile(wb, filename);
}
