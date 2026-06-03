package com.finalspace.backend.mission.dto;

import com.finalspace.backend.mission.MissionStatus;

import java.time.LocalDateTime;

public record MissionResponse(
        Long id,
        String name,
        String description,
        MissionStatus status,
        LocalDateTime createdAt,
        LocalDateTime closedAt
) {
}