package com.finalspace.backend.incident.dto;

import com.finalspace.backend.incident.IncidentSeverity;
import com.finalspace.backend.incident.IncidentStatus;

import java.time.LocalDateTime;

public record IncidentResponse(
        Long id,
        Long missionId,
        String missionName,
        Long satelliteId,
        String satelliteName,
        Long alertId,
        String title,
        String description,
        String notes,
        IncidentSeverity severity,
        IncidentStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime closedAt,
        String createdBy
) {
}