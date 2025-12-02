/**
 * Custom error classes for export operations
 */

export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer with ID ${customerId} not found`);
    this.name = 'CustomerNotFoundError';
  }
}

export class ExportSizeExceededError extends Error {
  constructor(size: number, maxSize: number) {
    super(`Export size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`);
    this.name = 'ExportSizeExceededError';
  }
}

export class ExportGenerationError extends Error {
  constructor(format: string, originalError?: Error) {
    super(`Failed to generate ${format} export: ${originalError?.message || 'Unknown error'}`);
    this.name = 'ExportGenerationError';
    this.cause = originalError;
  }
}

export class UnsupportedExportFormatError extends Error {
  constructor(format: string, supportedFormats: string[]) {
    super(`Unsupported export format: ${format}. Supported formats: ${supportedFormats.join(', ')}`);
    this.name = 'UnsupportedExportFormatError';
  }
}

export class ExportRateLimitError extends Error {
  constructor(retryAfter: number) {
    super(`Export rate limit exceeded. Retry after ${retryAfter} seconds`);
    this.name = 'ExportRateLimitError';
  }
}