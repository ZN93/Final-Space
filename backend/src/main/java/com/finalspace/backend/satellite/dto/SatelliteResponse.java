package com.finalspace.backend.satellite.dto;

import com.finalspace.backend.satellite.SatelliteStatus;

import java.time.LocalDateTime;

public record SatelliteResponse(
        Long id,
        String name,
        SatelliteStatus status,
        Double massKg,
        Double altitudeKm,
        Double inclinationDeg,
        Double eccentricity,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long missionId,
        String missionName
) {
}