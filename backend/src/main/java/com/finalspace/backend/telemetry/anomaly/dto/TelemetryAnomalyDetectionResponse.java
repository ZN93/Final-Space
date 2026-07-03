package com.finalspace.backend.telemetry.anomaly.dto;

import java.util.List;

public record TelemetryAnomalyDetectionResponse(
        Long satelliteId,
        int detectedCount,
        int savedCount,
        List<TelemetryAnomalyResponse> anomalies
) {
}