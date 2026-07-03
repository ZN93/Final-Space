package com.finalspace.backend.telemetry.anomaly.dto;

import java.util.List;

public record TelemetryAnomalyQueryResponse(
        Long satelliteId,
        int count,
        List<TelemetryAnomalyResponse> anomalies
) {
}