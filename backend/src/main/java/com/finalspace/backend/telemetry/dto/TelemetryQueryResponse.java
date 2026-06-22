package com.finalspace.backend.telemetry.dto;

import java.util.List;

public record TelemetryQueryResponse(
        Long satelliteId,
        List<String> metrics,
        int count,
        List<TelemetryPointResponse> points
) {
}