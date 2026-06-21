export interface TelemetryImportError {
  line: number;
  message: string;
}

export interface TelemetryImportResponse {
  importId: string | null;
  importedCount: number;
  errorCount: number;
  errors: TelemetryImportError[];
}
