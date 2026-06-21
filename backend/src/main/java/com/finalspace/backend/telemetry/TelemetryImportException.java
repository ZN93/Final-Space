package com.finalspace.backend.telemetry;

import com.finalspace.backend.telemetry.dto.TelemetryImportError;
import lombok.Getter;

import java.util.List;

@Getter
public class TelemetryImportException extends RuntimeException {

    private final List<TelemetryImportError> errors;

    public TelemetryImportException(List<TelemetryImportError> errors) {
        super("Import CSV invalide");
        this.errors = errors;
    }
}