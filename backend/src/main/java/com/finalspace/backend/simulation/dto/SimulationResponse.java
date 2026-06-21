package com.finalspace.backend.simulation.dto;

import com.finalspace.backend.simulation.SimulationStatus;
import com.finalspace.backend.simulation.SimulationType;

import java.time.LocalDateTime;

public record SimulationResponse(
        Long id,
        Long missionId,
        String missionName,
        Long satelliteId,
        String satelliteName,
        SimulationType type,
        SimulationStatus status,

        Double inputMassKg,
        Double inputAltitudeKm,
        Double inputInclinationDeg,
        Double inputEccentricity,

        Double orbitalPeriodMinutes,
        Double averageVelocityKmS,
        String orbitShape,

        Double targetAltitudeKm,
        Double deltaV1MS,
        Double deltaV2MS,
        Double deltaVTotalMS,
        Double transferTimeMinutes,

        String plotDataJson,
        LocalDateTime createdAt,
        String createdBy
) {
}