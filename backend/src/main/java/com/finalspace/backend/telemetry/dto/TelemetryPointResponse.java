package com.finalspace.backend.telemetry.dto;

import java.time.Instant;

public record TelemetryPointResponse(
        Instant timestamp,
        String metric,
        Double value
) {
}