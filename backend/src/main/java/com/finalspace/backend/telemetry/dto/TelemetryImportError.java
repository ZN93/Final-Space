package com.finalspace.backend.telemetry.dto;

public record TelemetryImportError(
        int line,
        String message
) {
}