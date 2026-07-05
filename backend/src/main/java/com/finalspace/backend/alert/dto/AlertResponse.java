package com.finalspace.backend.alert.dto;

import com.finalspace.backend.alert.AlertSeverity;
import com.finalspace.backend.alert.AlertStatus;

import java.time.LocalDateTime;
import java.time.Instant;

public record AlertResponse(
        Long id,
        Long missionId,
        String missionName,
        Long satelliteId,
        String satelliteName,
        String metric,
        String type,
        AlertSeverity severity,
        AlertStatus status,
        String message,
        String anomalyId,
        Double telemetryValue,
        Instant telemetryTimestamp,
        LocalDateTime createdAt,
        LocalDateTime ackAt,
        String ackBy
) {
}