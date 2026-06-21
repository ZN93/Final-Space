package com.finalspace.backend.simulation.dto;

import com.finalspace.backend.simulation.SimulationStatus;
import com.finalspace.backend.simulation.SimulationType;

import java.time.LocalDateTime;

public record SimulationListItemResponse(
        Long id,
        Long missionId,
        String missionName,
        Long satelliteId,
        String satelliteName,
        SimulationType type,
        SimulationStatus status,
        LocalDateTime createdAt,
        String createdBy,

        Double inputAltitudeKm,
        Double targetAltitudeKm,

        Double orbitalPeriodMinutes,
        Double averageVelocityKmS,
        String orbitShape,

        Double deltaVTotalMS,
        Double transferTimeMinutes
) {
}