package com.finalspace.backend.telemetry.anomaly.dto;

import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalySeverity;
import com.finalspace.backend.telemetry.anomaly.TelemetryAnomalyType;

import java.time.Instant;

public record TelemetryAnomalyResponse(
        String id,
        Long missionId,
        Long satelliteId,
        String metric,
        TelemetryAnomalyType type,
        TelemetryAnomalySeverity severity,
        Instant timestamp,
        Double value,
        Double previousValue,
        Instant previousTimestamp,
        String ruleName,
        Double thresholdUsed,
        String message
) {
}