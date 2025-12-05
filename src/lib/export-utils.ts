/**
 * Utility functions for exporting data to CSV/Excel
 */

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

/**
 * Convert data array to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  // Header row
  const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');
  
  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = getNestedValue(row, col.key as string);
      const formatted = col.formatter ? col.formatter(value, row) : String(value ?? '');
      // Escape quotes and wrap in quotes
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const iso = d.toISOString();
  return iso.split('T')[0] || iso;
}

/**
 * Format datetime for export
 */
export function formatDateTimeForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const iso = d.toISOString();
  return iso.replace('T', ' ').split('.')[0] || iso;
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number | null | undefined, currency = '€'): string {
  if (amount === null || amount === undefined) return '';
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Format boolean for export
 */
export function formatBooleanForExport(value: boolean | null | undefined, trueText = 'Yes', falseText = 'No'): string {
  if (value === null || value === undefined) return '';
  return value ? trueText : falseText;
}

/**
 * Export customers to CSV
 */
export function exportCustomersToCSV(customers: Array<{
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  loyaltyLevel?: string;
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
  createdAt: string;
}>): string {
  const columns: ExportColumn<typeof customers[0]>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name', formatter: (_, row) => row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : row.name || '' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'loyaltyLevel', header: 'Loyalty Level' },
    { key: 'loyaltyPoints', header: 'Loyalty Points' },
    { key: 'totalOrders', header: 'Total Orders' },
    { key: 'totalSpent', header: 'Total Spent', formatter: (v) => formatCurrencyForExport(v as number) },
    { key: 'createdAt', header: 'Registered', formatter: (v) => formatDateForExport(v as string) },
  ];

  return toCSV(customers, columns);
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(orders: Array<{
  id: string;
  orderNumber?: string;
  status: string;
  total: number;
  subtotal?: number;
  shippingCost?: number;
  paymentStatus?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
}>): string {
  const columns: ExportColumn<typeof orders[0]>[] = [
    { key: 'orderNumber', header: 'Order Number', formatter: (v, row) => (v as string) || row.id },
    { key: 'status', header: 'Status' },
    { key: 'total', header: 'Total', formatter: (v) => formatCurrencyForExport(v as number) },
    { key: 'subtotal', header: 'Subtotal', formatter: (v) => formatCurrencyForExport(v as number) },
    { key: 'shippingCost', header: 'Shipping', formatter: (v) => formatCurrencyForExport(v as number) },
    { key: 'paymentStatus', header: 'Payment Status' },
    { key: 'customerName', header: 'Customer' },
    { key: 'customerEmail', header: 'Customer Email' },
    { key: 'createdAt', header: 'Date', formatter: (v) => formatDateTimeForExport(v as string) },
  ];

  return toCSV(orders, columns);
}

/**
 * Export products to CSV
 */
export function exportProductsToCSV(products: Array<{
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  status: string;
  categoryName?: string;
  vendorName?: string;
  createdAt: string;
}>): string {
  const columns: ExportColumn<typeof products[0]>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    { key: 'price', header: 'Price', formatter: (v) => formatCurrencyForExport(v as number) },
    { key: 'compareAtPrice', header: 'Compare Price', formatter: (v) => formatCurrencyForExport(v as number) },
    { key: 'stock', header: 'Stock' },
    { key: 'status', header: 'Status' },
    { key: 'categoryName', header: 'Category' },
    { key: 'vendorName', header: 'Vendor' },
    { key: 'createdAt', header: 'Created', formatter: (v) => formatDateForExport(v as string) },
  ];

  return toCSV(products, columns);
}
