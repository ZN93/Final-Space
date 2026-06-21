package com.finalspace.backend.telemetry.dto;

import java.util.List;

public record TelemetryImportResponse(
        String importId,
        int importedCount,
        int errorCount,
        List<TelemetryImportError> errors
) {
}